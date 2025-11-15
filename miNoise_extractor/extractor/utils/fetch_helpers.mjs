import fetch from "node-fetch";

export async function fetchHTML(url) {
    try {
        const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        return await response.text();
    } catch (err) {
        console.error("❌ Error al obtener", url);
        return null;
    }
}
