# Migración de Productos desde CSV

Este script permite migrar productos desde un archivo CSV a la base de datos de SGMABControl.

## 📋 Características

- ✅ Inserta solo productos nuevos (basado en el SKU/código)
- ⏭️ Omite productos que ya existen en la base de datos
- 📊 Genera un reporte detallado de la migración
- 🔄 Funciona tanto en local como en VPS
- ⚡ Modo rápido para desarrollo local
- 🐢 Modo batch para VPS con servers activos (reduce impacto en BD)

## 🚀 Uso

### En Local (desarrollo)

Si el archivo CSV está en la raíz del proyecto con el nombre `miguel - Hoja1.csv`:

```bash
cd server
node migrate_products_csv.js
```

### Modo BATCH (recomendado para VPS con servers activos)

El modo batch procesa productos en lotes pequeños (100 por vez) con pausas de 1 segundo entre lotes. Esto reduce el impacto en la base de datos:

```bash
cd server
node migrate_products_csv.js --batch
```

### Con Ruta Personalizada

Si el archivo CSV está en otra ubicación:

```bash
cd server
node migrate_products_csv.js /ruta/completa/al/archivo.csv
```

### En VPS (producción)

1. **Subir el archivo CSV al VPS:**

   ```bash
   scp "miguel - Hoja1.csv" usuario@tu-vps:/home/usuario/productos.csv
   ```

2. **Conectarse al VPS:**

   ```bash
   ssh usuario@tu-vps
   ```

3. **Navegar al directorio del servidor:**

   ```bash
   cd /ruta/al/proyecto/server
   ```

4. **Ejecutar la migración:**

   **Modo rápido** (si no hay usuarios activos):

   ```bash
   node migrate_products_csv.js /home/usuario/productos.csv
   ```

   **Modo batch** (recomendado si los servers están activos):

   ```bash
   node migrate_products_csv.js /home/usuario/productos.csv --batch
   ```

## 📊 Formato del CSV

El script espera un CSV con al menos estas columnas:

- **code**: Código del producto (SKU)
- **descripcion**: Nombre/descripción del producto

Ejemplo:

```csv
code,descripcion,costo,precio1,precio2,precio3,precio4,precio5
10070086,CORNETA LARGA DE METAL X 6.U.D,8.5,0,0,0,0,0
10710757,COLITAS X12 X3U,70,0,0,0,0,0
```

**Nota:** El script solo usa las columnas `code` y `descripcion`. Los precios se establecen en 0.

## 📈 Reporte de Migración

Al finalizar, el script mostrará:

- ✅ **Productos insertados**: Nuevos productos agregados a la BD
- ⏭️ **Productos omitidos**: Productos que ya existían (no se modifican)
- ❌ **Errores encontrados**: Líneas con problemas
- 📝 **Total líneas procesadas**: Total de productos en el CSV

## ⚠️ Consideraciones Importantes

1. **Productos existentes**: Si un producto con el mismo SKU ya existe, se omite completamente (no se actualiza)
2. **Precios en 0**: Todos los productos se insertan con `price_buy = 0` y `price_sell = 0`
3. **Categorías**: Los productos se insertan sin categoría (`category_id = NULL`)
4. **Stock inicial**: El stock se establece en 0
5. **Modo batch vs rápido**:
   - **Modo rápido**: Procesa todos los productos de una vez. Ideal para local o VPS sin usuarios activos
   - **Modo batch**: Procesa 100 productos por vez con pausas de 1 segundo. Ideal para VPS con servers activos

## 🔧 Después de la Migración

Deberás:

1. Asignar precios a los productos
2. Asignar categorías
3. Actualizar el stock según corresponda

Esto se puede hacer desde la interfaz de administración de la aplicación.

## 🐛 Solución de Problemas

### Error: "No se encuentra el archivo CSV"

- Verifica que la ruta al archivo sea correcta
- Asegúrate de que el archivo existe en la ubicación especificada

### Error de conexión a la base de datos

- Verifica que el archivo `.env` esté configurado correctamente
- Asegúrate de que la base de datos esté corriendo

### Productos no se insertan

- Verifica que el CSV tenga el formato correcto
- Revisa el reporte de errores al final de la ejecución
