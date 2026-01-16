import axios from "axios";
import { getApiUrl, getServerUrl } from "./config";
import { db } from "./db";

export const syncProducts = async () => {
  try {
    const res = await axios.get(`${getApiUrl()}/products`);
    const products = res.data;

    if (Array.isArray(products)) {
      // Intentar descargar imágenes en segundo plano/paralelo limitado para modo offline
      const productsWithImages = await Promise.all(
        products.map(async (p) => {
          if (p.image_url) {
            try {
              const imgRes = await axios.get(
                `${getServerUrl()}${p.image_url}`,
                {
                  responseType: "arraybuffer",
                },
              );
              const base64 = btoa(
                new Uint8Array(imgRes.data).reduce(
                  (data, byte) => data + String.fromCharCode(byte),
                  "",
                ),
              );
              const contentType = imgRes.headers["content-type"];
              return {
                ...p,
                local_image: `data:${contentType};base64,${base64}`,
              };
            } catch (e) {
              console.warn(`No se pudo descargar imagen para ${p.sku}`);
            }
          }
          return p;
        }),
      );

      await db.products.clear();
      await db.products.bulkAdd(productsWithImages);
      console.log(
        `Sincronización completa: ${productsWithImages.length} productos guardados localmente con imágenes.`,
      );
      return true;
    }
    return false;
  } catch (err) {
    console.error("Error durante la sincronización:", err);
    return false;
  }
};
