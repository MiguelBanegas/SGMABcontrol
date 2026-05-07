# Análisis de Inconsistencias al Eliminar Cliente

## Estado Actual del Sistema

### Relaciones de Foreign Keys en la BD

| Tabla | Columna | Referencia | On Delete | Estado |
|-------|---------|-----------|-----------|--------|
| `sales` | `customer_id` | `customers.id` | **SET NULL** | ✅ Seguro |
| `container_balances` | `customer_id` | `customers.id` | **CASCADE** | ⚠️ Riesgo |
| `container_transactions` | `customer_id` | `customers.id` | **CASCADE** | ⚠️ Riesgo |
| `customer_account_transactions` | `customer_id` | `customers.id` | **CASCADE** | ✅ Seguro |
| `pending_sales` | `customer_id` | `customers.id` | **SET NULL** | ✅ Seguro |

---

## Problemas Identificados

### 🔴 PROBLEMA 1: Eliminación de Contenedores (Containers)
**Severidad:** ALTA

**Descripción:**
- Cuando se elimina un cliente, se eliminan en cascada todos sus `container_balances` y `container_transactions`
- Esto borra el historial de transacciones de contenedores, perdiendo datos auditables
- Los saldos de contenedores desaparecen sin dejar rastro

**Impacto:**
```
Tablas afectadas:
- container_balances (registros borrados)
- container_transactions (historial perdido)
```

**Ejemplo de Inconsistencia:**
1. Cliente "Juan" tiene 5 contenedores activos con saldo de $500
2. Se elimina a "Juan"
3. Los registros desaparecen completamente
4. No hay auditoría de qué pasó con esos contenedores
5. Los productos contenedores quedan en BD sin referencia de quién los tenía

---

### 🟡 PROBLEMA 2: Falta Validación de Contenedores Activos
**Severidad:** MEDIA

**Descripción:**
- El sistema verifica deuda en `customer_account_transactions` pero NO verifica:
  - Contenedores en préstamo activo (`container_balances` > 0)
  - Transacciones de contenedores pendientes de devolución

**Validación Actual:**
```javascript
// Solo valida esto:
const balance = await getCustomerAdjustedBalance(id, business_id);
if (balance > 0.01) {
  return error;
}

// NO valida contenedores activos
```

**Riesgo:**
- Un cliente puede ser eliminado con contenedores todavía en préstamo
- Genera inconsistencias en el inventario de contenedores

---

### 🟡 PROBLEMA 3: Ventas Anuladas en Cascada
**Severidad:** MEDIA-BAJA

**Descripción:**
- Ventas se reasignan a NULL (Consumidor Final)
- Pero si hay datos históricos que dependen de la asociación cliente-venta, pueden quedar inconsistentes
- Las transacciones de cuenta corriente que asocian el pago a una venta pueden quedar huérfanas

**Riesgo:**
- Reportes históricos pueden mostrar ventas sin cliente asignado
- Auditoría de pagos por cliente queda incompleta

---

### 🟡 PROBLEMA 4: Falta Validación de Transacciones de Venta Pendientes
**Severidad:** MEDIA

**Descripción:**
- No se valida si hay `pending_sales` activas para el cliente
- Una venta en carrito puede quedar con `customer_id = NULL` indeterminadamente

**Riesgo:**
- Un usuario podría estar en medio de una venta cuando se elimina el cliente
- Datos inconsistentes en el carrito

---

## Inconsistencias Potenciales

### Escenario 1: Eliminación de Cliente con Contenedores Activos
```
ANTES DE ELIMINAR:
- Cliente: ID=5, Name="María"
- container_balances: 3 registros (5 unidades de producto 12)
- container_transactions: 15 transacciones de movimiento

DESPUÉS DE ELIMINAR (Estado Actual):
- Cliente: ELIMINADO
- container_balances: BORRADOS (PERDIDA DE DATOS)
- container_transactions: BORRADOS (PERDIDA DE AUDITORIA)
- Producto 12: SIGUE EN BD SIN REFERENCIA

⚠️ INCONSISTENCIA: ¿Dónde están esos contenedores? ¿Quién debería tenerlos?
```

### Escenario 2: Deuda Cero pero Contenedores Activos
```
ANTES DE ELIMINAR:
- Cliente: ID=7, Name="Pedro"
- customer_account_transactions: balance = 0 (deuda pagada)
- container_balances: 2 botellas prestadas sin retornar
  balance > 0

DESPUÉS DE ELIMINAR (Estado Actual):
- Cliente: ELIMINADO
- container_balances: 2 registros BORRADOS
- container_transactions: BORRADOS

⚠️ INCONSISTENCIA: Se eliminó cliente con contenedores en préstamo activo
```

### Escenario 3: Venta Pendiente en Progreso
```
ANTES DE ELIMINAR:
- Cliente: ID=3, Name="Laura"
- pending_sales: carrito activo con 5 items
- Acción: Se elimina cliente mientras vendedor está en venta

DESPUÉS DE ELIMINAR (Estado Actual):
- Cliente: ELIMINADO
- pending_sales: customer_id = NULL
- Carrito huérfano en la BD

⚠️ INCONSISTENCIA: Venta en progreso sin cliente asociado
```

---

## Recomendaciones

### ✅ CRÍTICO - Implementar Validación Completa

**Código propuesto para deleteCustomer:**

```javascript
exports.deleteCustomer = async (req, res) => {
  const { id } = req.params;
  const business_id = req.user.business_id;

  try {
    // 1. Verificar DEUDA en cuenta corriente
    const balance = await getCustomerAdjustedBalance(id, business_id);
    if (balance > 0.01) {
      return res.status(400).json({
        message: `No se puede eliminar un cliente con deuda pendiente ($${balance.toFixed(2)})`,
      });
    }

    // 2. ✅ NUEVO: Verificar CONTENEDORES ACTIVOS
    const activeContainers = await db("container_balances")
      .where({ customer_id: id, business_id })
      .where("balance", ">", 0);
    
    if (activeContainers.length > 0) {
      return res.status(400).json({
        message: `No se puede eliminar cliente con ${activeContainers.length} contenedor(es) activo(s). Total: ${activeContainers.reduce((sum, c) => sum + c.balance, 0)} unidades`,
        containers: activeContainers,
      });
    }

    // 3. ✅ NUEVO: Verificar VENTAS PENDIENTES
    const pendingSale = await db("pending_sales")
      .where({ customer_id: id })
      .first();
    
    if (pendingSale) {
      return res.status(400).json({
        message: "No se puede eliminar cliente con venta pendiente. Completa o cancela la venta primero.",
      });
    }

    // 4. ✅ NUEVO: NO usar CASCADE para contenedores, usar SET NULL
    // Cambiar en migración: onDelete("CASCADE") -> onDelete("SET NULL")
    // O hacer limpieza manual controlada

    await db.transaction(async (trx) => {
      // Reasignar ventas a 'Consumidor Final'
      await trx("sales")
        .where({ customer_id: id, business_id })
        .update({ customer_id: null });

      // ✅ NUEVO: Limpiar contenedores de forma controlada
      // (NO deletear, marcar como disponibles o devueltos)
      await trx("container_balances")
        .where({ customer_id: id, business_id })
        .update({ customer_id: null, balance: 0 });

      // Eliminar cliente
      await trx("customers").where({ id, business_id }).del();
    });

    res.json({
      message: "Cliente eliminado con éxito",
      note: "Ventas reasignadas a Consumidor Final",
    });

  } catch (error) {
    console.error("Error en deleteCustomer:", error);
    res.status(500).json({ message: "Error al eliminar cliente" });
  }
};
```

### ✅ IMPORTANTE - Revisar Política de Cascada

**Migración a MODIFICAR:**

```javascript
// ACTUAL (Peligroso):
.onDelete("CASCADE")

// RECOMENDADO:
.onDelete("SET NULL")  // Para mantener historial
```

---

## Checklist de Seguridad

- [ ] Validar que NO hay deuda pendiente
- [ ] Validar que NO hay contenedores activos en préstamo
- [ ] Validar que NO hay ventas pendientes
- [ ] Validar que NO hay transacciones de cuenta corriente recientes
- [ ] Cambiar estrategia de CASCADE a SET NULL para contenedores
- [ ] Limpiar saldos de contenedores manualmente (no borrar registros)
- [ ] Mantener historial de transacciones para auditoría
- [ ] Agregar logs de eliminación de cliente
- [ ] Implementar soft delete (marcar como eliminado sin borrar)

---

## Conclusión

El sistema actual **TIENE RIESGOS IMPORTANTES** al eliminar clientes:

1. **Pérdida de datos de auditoría** (contenedores y transacciones)
2. **Falta de validaciones** (no verifica contenedores activos)
3. **Inconsistencias de inventario** (contenedores "fantasma" sin referencia)

**Recomendación: IMPLEMENTAR TODAS LAS VALIDACIONES PROPUESTAS antes de permitir eliminación en producción**
