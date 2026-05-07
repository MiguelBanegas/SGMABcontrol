# 🚨 REFERENCIA RÁPIDA - Eliminación Segura de Clientes

**⏱️ Tiempo de lectura:** 2 minutos

---

## 🔴 Razones por las que un cliente NO PUEDE ser eliminado

### 1. **DEUDA PENDIENTE** (80 clientes)
```
Bloquea: ✅ SÍ
Acción: Cobrar deuda antes de eliminar
Código: CUSTOMER_HAS_DEBT
```

### 2. **CONTENEDORES ACTIVOS** (1 cliente)
```
Bloquea: ✅ SÍ
Acción: Solicitar devolución de contenedores
Código: CUSTOMER_HAS_ACTIVE_CONTAINERS

Ejemplo: MIGEL PAPA DE LEO (ID: 3994)
         - 1 Envase Cerveza en préstamo
```

### 3. **VENTAS PENDIENTES** (0 clientes actualmente)
```
Bloquea: ✅ SÍ
Acción: Completar o cancelar venta
Código: CUSTOMER_HAS_PENDING_SALE
```

---

## ✅ Procedimiento para Eliminar Cliente

### Paso 1: Verificar Estado
```bash
cd server
node scripts/check_delete_customer_consistency.js
```
Busca el cliente en la salida. Si aparece en cualquier lista → NO PUEDE ELIMINARSE

### Paso 2: Resolver Problemas
- **Si tiene deuda:** Cobrar el monto
- **Si tiene contenedores:** Solicitar devolución
- **Si tiene ventas:** Completar transacción

### Paso 3: Eliminar
```bash
node scripts/delete_customer_checklist.js
```
Ingresa ID del cliente y sigue el asistente

---

## 📊 Vista Rápida del Sistema

```
PROTECCIONES IMPLEMENTADAS:

✅ Validación de Deuda
   └─ Si > $0.01 → Rechaza eliminación

✅ Validación de Contenedores
   └─ Si hay unidades en préstamo → Rechaza eliminación

✅ Validación de Ventas
   └─ Si hay carrito activo → Rechaza eliminación

✅ Auditoría Preservada
   └─ Historial se mantiene en BD (no se borra)

✅ Logs Detallados
   └─ Cada intento queda registrado
```

---

## 🎯 Clientes Seguros para Eliminar

**Cantidad actual:** ~1900 clientes

**Características:**
- Deuda: $0
- Contenedores: Ninguno activo
- Ventas: Ninguna pendiente

**Cómo listar:**
```bash
node scripts/check_delete_customer_consistency.js
# Ver sección 5 al final del reporte
```

---

## ❓ Preguntas Frecuentes

### P: ¿Qué pasa si intento eliminar cliente con deuda?
**R:** El sistema rechaza con código `CUSTOMER_HAS_DEBT`

### P: ¿Se pierden las transacciones antiguas?
**R:** No. Se preservan con `customer_id = NULL`. Auditoría completa.

### P: ¿Puedo borrar un cliente activo?
**R:** Solo si tiene $0 de deuda, sin contenedores y sin ventas pendientes

### P: ¿Dónde se ve el historial si el cliente se borra?
**R:** En `customer_account_transactions` y `container_transactions` quedarán registros

---

## 📞 Soporte

**Para debuggear un cliente específico:**
```bash
# Verificar deuda
SELECT SUM(amount) FROM customer_account_transactions WHERE customer_id = 123;

# Verificar contenedores
SELECT * FROM container_balances WHERE customer_id = 123 AND balance > 0;

# Verificar ventas pendientes
SELECT * FROM pending_sales WHERE customer_id = 123;
```

---

**Última actualización:** 7 de Mayo de 2026
**Status:** ✅ Producción
