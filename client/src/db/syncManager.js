import { db } from "./localDb";
import axios from "axios";

export const syncOfflineSales = async () => {
  const offlineSales = await db.offlineSales
    .where({ status: "pending" })
    .toArray();

  if (offlineSales.length === 0) return;

  console.log(`Iniciando sincronización de ${offlineSales.length} ventas...`);

  for (const sale of offlineSales) {
    try {
      const token = localStorage.getItem("token");
      await axios.post("/api/sales", sale, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await db.offlineSales.update(sale.id, { status: "synced" });
    } catch (err) {
      console.error("Error al sincronizar venta:", sale.id, err);
    }
  }
};
