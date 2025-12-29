import Dexie from "dexie";

export const db = new Dexie("SGM_LocalDB");

db.version(2).stores({
  products: "++id, name, sku",
  customers: "++id, name, email, phone",
  offlineSales: "++id, status", // status: 'pending' | 'synced'
});

export const syncCatalog = async (products) => {
  try {
    await db.transaction("rw", db.products, async () => {
      await db.products.clear();
      await db.products.bulkPut(products);
    });
  } catch (err) {
    console.error(
      "Error en la transacción de sincronización de catálogo:",
      err
    );
  }
};

export const syncCustomers = async (customers) => {
  try {
    await db.transaction("rw", db.customers, async () => {
      await db.customers.clear();
      await db.customers.bulkPut(customers);
    });
  } catch (err) {
    console.error(
      "Error en la transacción de sincronización de clientes:",
      err
    );
  }
};
