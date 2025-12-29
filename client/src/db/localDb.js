import Dexie from "dexie";

export const db = new Dexie("SGM_LocalDB");

db.version(1).stores({
  products: "++id, name, sku",
  offlineSales: "++id, status", // status: 'pending' | 'synced'
});

export const syncCatalog = async (products) => {
  try {
    await db.transaction("rw", db.products, async () => {
      await db.products.clear();
      await db.products.bulkPut(products);
    });
  } catch (err) {
    console.error("Error en la transacción de sincronización:", err);
  }
};
