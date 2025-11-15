import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config({ path: "./.env" });

// 🔹 Carga el .env desde la carpeta donde está este archivo (utils)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

console.log("[DEBUG] .env path =", path.join(__dirname, ".env"));
console.log("[DEBUG] BANDCAMP_IDENTITY =", process.env.BANDCAMP_IDENTITY ? "OK" : "❌ undefined");


// Intentar importar el paquete bandcamp-fetch desde tu repo local
async function tryImportBcfetch() {
    try {
        return (await import("../../bandcamp-fetch/dist/mjs/index.js")).default;
    } catch (e) {
        try {
            return (await import("bandcamp-fetch")).default;
        } catch (e2) {
            console.error("[FATAL] No se encontró 'bandcamp-fetch'. Instala con:");
            console.error("  npm i bandcamp-fetch");
            throw e2;
        }
    }
}

// === FUNCIÓN DISCOVER ===
export async function discover(genre, size = 50, sortBy = "top") {
    const bcfetch = await tryImportBcfetch();
    const identity = process.env.BANDCAMP_IDENTITY;

    if (!identity) throw new Error("BANDCAMP_IDENTITY no está definido en .env");

    bcfetch.setCookie(identity);

    const results = await bcfetch.discovery.discover({
        genre,
        sortBy,
        size,
    });

    return results;
}
