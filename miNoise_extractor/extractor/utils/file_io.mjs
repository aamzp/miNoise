import fs from "fs";

export function loadJSON(path) {
    return JSON.parse(fs.readFileSync(path, "utf8"));
}

export function saveJSON(path, data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
    console.log(`✅ Guardado en ${path}`);
}
