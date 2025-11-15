// bandcamp_auth_test.mjs
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve("../.env") });

console.log("[DEBUG] BANDCAMP_IDENTITY =", process.env.BANDCAMP_IDENTITY);

const OUT_DIR = path.resolve("./data");
const OUT_FILE = path.join(OUT_DIR, "bandcamp_discover_ambient.json");

async function tryImportBcfetch() {
    // intenta importar primero la copia local (si la tenés), si no, intenta paquete global
    try {
        // ajusta la ruta si tu carpeta bandcamp-fetch está en otro lugar
        return (await import("../../bandcamp-fetch/dist/mjs/index.js")).default;
    } catch (e) {
        try {
            return (await import("bandcamp-fetch")).default;
        } catch (e2) {
            console.error("[FATAL] No se encontró 'bandcamp-fetch'. Instala con: npm i bandcamp-fetch");
            throw e2;
        }
    }
}

(async () => {
    try {
        const bcfetch = await tryImportBcfetch();

        // Leer cookie desde variable de entorno 
        const identity = process.env.BANDCAMP_IDENTITY;
        if (!identity) {
            console.error("[ERROR] No encontré BANDCAMP_IDENTITY en env. Crea un .env con:");
            console.error("  BANDCAMP_IDENTITY=identity=TU_VALOR_DE_IDENTITY");
            process.exit(1);
        }

        // setCookie espera la cadena completa tal como aparece en el navegador:  "identity=...."
        bcfetch.setCookie(identity);

        console.log("[INFO] Cookie inyectada. Probando discover() para genre='ambient' ...");

        // Intento 1: discover con tamaño 60
        let results;
        try {
            results = await bcfetch.discovery.discover({
                genre: "ambient",
                sortBy: "top",
                size: 60
            });
        } catch (err) {
            console.error("[ERROR] discover() falló:", err && err.message ? err.message : err);
            console.error(" -> Verifica que la cookie sea válida y no haya expirado.");
            process.exit(1);
        }

        // Asegurar carpeta de salida
        fs.mkdirSync(OUT_DIR, { recursive: true });

        // Guardar JSON crudo para inspección
        fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2), "utf-8");
        console.log(`[OK] Resultado guardado en ${OUT_FILE}`);

        // Mostrar resumen: primeros 5 items con campos relevantes
        const items = results.items || results.albums || results.results || [];
        if (!Array.isArray(items) || items.length === 0) {
            console.warn("[WARN] La respuesta no contiene items. Posible cookie inválida / Cloudflare bloqueando.");
            process.exit(0);
        }

        console.log("\n=== Primeros 5 álbumes ===");
        items.slice(0, 5).forEach((it, i) => {
            // varios formatos posibles: item puede tener .title/.name, .artist, .genre, .tags, .tralbum_tags
            const title = it.title || it.name || (it.album && it.album.name) || "—";
            const artistName = (it.artist && it.artist.name) || it.band || (it.album && it.album.artist && it.album.artist.name) || "—";
            const genre = it.genre || (it.params && it.params.genre) || "—";
            const tags = it.tags || it.tralbum_tags || it.customTags || [];
            const url = it.url || (it.album && it.album.url) || "—";
            const featured = it.featuredTrack || it.featured_track || (it.album && it.album.featuredTrack) || null;
            const stream = featured ? (featured.streamUrl || featured.stream_url || "—") : "—";

            console.log(`\n[${i + 1}] ${title}`);
            console.log(`  Artist : ${artistName}`);
            console.log(`  Genre  : ${genre}`);
            console.log(`  Tags   : ${Array.isArray(tags) ? tags.join(", ") : JSON.stringify(tags)}`);
            console.log(`  URL    : ${url}`);
            console.log(`  Stream : ${stream}`);
        });

        console.log("\nListo. Si ves 403 o items vacíos: cookie inválida o Cloudflare está bloqueando la IP.");
    } catch (err) {
        console.error("[FATAL] Error inesperado:", err);
    }
})();
