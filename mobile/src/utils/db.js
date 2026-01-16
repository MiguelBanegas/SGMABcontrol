import Dexie from "dexie";

export const db = new Dexie("SGM_Mobile_DB");

db.version(2).stores({
  products: "++id, name, sku, category_name", // id autoincremental, índices para búsquedas
  categories: "++id, name",
});

export default db;
