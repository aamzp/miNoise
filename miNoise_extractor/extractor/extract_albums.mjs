// === EXTRACT_ALBUMS.MJS ===
// Exploración tipo Tag-Walk + descripción de artista + red de tags

import fs from "fs";
import path from "path";
import bcfetch from "bandcamp-fetch";
import * as cheerio from "cheerio";
import fetch from "node-fetch";

// === CONFIGURACIÓN ===
const OUTPUT_PATH_ALBUMS = "./extractor/data/albums_full.json";
const OUTPUT_PATH_TAGS = "./extractor/data/tag_links.json";
const START_TAG = "scorecore";   // tag inicial (puede ser null)
const STEPS = 100;              // cantidad de saltos entre tags
const SAVE_EVERY = 5;            // guarda cada X álbumes
const ARTIST_CACHE = {};         // cache de artistas

const SEED_PATH = "./extractor/utils/seeds.json";
let SEED_TAGS = [];

const INVALID_TAGS = [
    "none",
    "unknown",
    "rason",
    "ransom",
    "misc",
    "various",
    "undefined",
    "untitled",
    "demo",
    "sample",
    "test",
    "mix",
    "compilation",
    "album",
    "recordings",
    "track",
    "music",
    "expiremental",
    "diy record label",
    "tantron",
    "andinostep",
    "foknbois",
    "mariusz szypura",
    "portland",
    "other stuff",
    "philipp nespital",
    "cometogether",
    "dj tramlife",
    "mlvltd",
    "deffa heffa",
    "wizard sleaze",
    "goose bumps",
    "sabaton",
    "metallica",
    "iron maiden",
    "led zeppelin",
    "pink floyd",
    "the beatles",
    "queen",
    "ac/dc",
    "nirvana",
    "carcass",
    "oliver mtukudzi",
    "tolkien",
    "comets on fire",
    "romania",
    "black uhuru",
    "halloween ep",
    "concept album",
    "Reading",
    "cecil mcbee",
    "King Gizzard & The Lizard Wizard",
    "µ-Ziq",
    "la quiete",
    "good for nothing",
    "140",
    "compilation",
    "tolkien",
    "music",
    "160bpm",
    "dead-man's-flats",
    "c4cdiguk080",
    "carcass",
    "the-number-12-looks-like-you",
    "303",
    "2025",
    "2024",
    "dx7",
    "metallica",
    "dr.-dooom",
    "fm",
    "140-bpm",
    "exh012",
    "mlvltd",
    "ue2",
    "85bpm",
    "170bpm",
    "daniel[i]",
    "a.r.t.less",
    "4-track",
    "dr.-octagon",
    "em",
    "tantron",
    "j.-cash",
    "w",
    "t",
    "b",
    "tb303",
    "140bpm",
    "volume-2",
    "perc.-perc-trax",
    "cincinnati",
    "xerox-fax-machine's-superheroes",
    "dda\vaiii",
    "splinter-(ua)",
    "2017",
    "2018",
    "2019",
    "2020",
    "2021",
    "2022",
    "lgbtq+",
    "2005",
    "rason",
    "roland-r8",
    "splinter-(ua)",
    "dc",
    "cause4concern",
    "c4c-recordings",
    "c4c-limited",
    "c4c",
    "quadrant-&-iris",
    "cause4concern-recordings",
    "tv",
    "tennessee",
    "max4live",
    "uk.",
    "year0001",
    "@kendrick",
    "@drake",
    "f*clr-records",
    "boss-rc-500",
    "c64",
    "parker&thenumberman",
    "cyberpunk-2077",
    "arp-2600",
    "96khz",
    "sly-&-robbie",
    "nj",
    "prophet-12",
    "nonlinear-labs-c15",
    "2-piece-band",
    "cleveland",
    "singer-songwriter.",
    "kool-&-the-gang",
    "t++",
    "d",
    "manila",
    "cometogether",
    "tx",
    "milwaukee",
    "autobhans"
]

const GEO_TAGS = [
    "St. Louis",
    "denmark",
    "sweden",
    "norway",
    "finland",
    "iceland",
    "austria",
    "Ohio",
    "washington,-d.c.",
    "dc",
    "kyoto",
    "us",
    "ny",
    "beijing",
    "santiago",
    "baltimore",
    "wales",
    "hungary",
    "alabama",
    "moscow",
    "seoul",
    "wales",
    "finland",
    "st.-louis",
    "instanbul",
    "London",
    "london",
    "new york",
    "tokyo",
    "berlin",
    "chicago",
    "los angeles",
    "paris",
    "berlin",
    "rome",
    "madrid",
    "barcelona",
    "santiago",
    "buenos aires",
    "são paulo",
    "rio de janeiro",
    "melbourne",
    "sydney",
    "seoul",
    "beijing",
    "toronto",
    "montreal",
    "chicago",
    "vancouver",
    "mexico city",
    "bogotá",
    "lisbon",
    "amsterdam",
    "osaka",
    "kyoto",
    "warsaw",
    "moscow",
    "cape town",
    "boston",
    "manila",
    "jakarta",
    "istanbul",
    "athens",
    "Maryland",
    "california",
    "texas",
    "florida",
    "india",
    "brazil",
    "canada",
    "Peterborough",
    "hungary",
    "czech republic",
    "slovakia",
    "oakland",
    "Milan",
    "america",
    "europe",
    "asia",
    "africa",
    "australia",
    "usa",
    "uk",
    "philadelphia",
    "philadephia",
    "United States",
    "Deutschland",
    "España",
    "Italia",
    "Brasil",
    "Россия",
    "中国",
    "日本",
    "한국",
    "भारत",
    "ελλάδα",
    "turkiye",
    "colorado",
    "United Kingdom",
    "new zealand",
    "nz",
    "scotland",
    "wales",
    "northern ireland",
    "nyc",
    "Minneapolis",
    "houston",
    "atlanta",
    "detroit",
    "seattle",
    "denver",
    "Austin",
    "orlando",
    "cleveland",
    "pittsburgh",
    "cincinnati",
    "indianapolis",
    "milwaukee",
    "baltimore",
    "richmond",
    "virginia",
    "kentucky",
    "tennessee",
    "nashville",
    "memphis",
    "louisville",
    "alabama",
    "mississippi",
    "arkansas",
    "oklahoma",
    "new orleans",
    "louisiana",
    "Manchester",
    "United Kingdom",
    "london",
    "berlin",
    "melbourne",
    "paris",
    "chicago",
    "tokyo",
    "rome",
    "boston",
    "sydney",
    "amsterdam",
    "barcelona",
    "madrid",
    "vancouver",
    "chicago",
    "portland",
    "montreal",
    "toronto",
    "australia",
    "denver",
    "pittsburgh",
    "vancouver",
    "seattle",
    "boston",
    "uk",
    "california",
    "canada",
    "nashville",
    "atlanta",
    "sidney",
    "oakland",
    "brazil",
    "houston",
    "indianapolis",
    "texas",
    "colorado",
    "louisville",
    "richmond",
    "athens",
    "romania",
    "barcelona",
    "sabaton",
    "memphis",
    "rome",
    "usa",
    "madrid",
    "lisbon",
    "tokyo",
    "virginia",
    "philadelphia",
    "america",
    "africa",
    "scotland",
    "india",
    "warsaw",
    "florida",
    "istanbul",
    "nyc",
    "seoul",
    "moscow",
    "alabama",
    "hungary",
    "wales",
    "baltimore",
    "slovakia",
    "santiago",
    "beijing",
    "kyoto",
    "cincinnati",
    "us",
    "ny",
    "washington,-d.c.",
    "dc",
    "tennessee",
    "nj",
    "cleveland",
    "manila",
    "tx",
    "milwaukee",
    "washington,-d.c.",
    "dc",
    "los-angeles",
    "united-states",
    "united-kingdom",
    "los-angeles",
    "united-states",
    "germany"
]


function normalizeTag(tag) {
    return tag?.toLowerCase().trim().replace(/\s+/g, "-"); // reemplaza espacios por guiones
}


function saveJSON(data, outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`✅ Guardado en ${outputPath} (${data.length} registros)`);
}

// --- Parseo HTML solo para obtener tags faltantes ---
async function extractTagsFromHTML(albumUrl) {
    try {
        const res = await fetch(albumUrl);
        const html = await res.text();
        const $ = cheerio.load(html);
        const tags = [];
        $(".tralbum-tags a.tag").each((_, el) => {
            const tag = $(el).text().trim();
            if (tag) tags.push(tag);
        });
        return tags;
    } catch (err) {
        console.warn(`⚠️ No se pudieron extraer tags de ${albumUrl}: ${err.message}`);
        return [];
    }
}

// --- Enriquecimiento completo (álbum + artista) ---
async function getAlbumFull(albumUrl, genreHint = null, albumId = null) {
    try {
        const info = await bcfetch.album.getInfo({
            albumUrl,
            albumImageFormat: "art_app_large",
            artistImageFormat: "bio_featured",
            includeRawData: true,
        });

        // --- TAGS con fallback ---
        let tags =
            info.tags?.map((t) => t.name) ||
            info.rawData?.current?.tags?.map((t) => t.name) ||
            [];

        if (!tags || tags.length === 0) {
            tags = await extractTagsFromHTML(albumUrl);
        }

        const genre =
            info.genre || genreHint || (tags.length > 0 ? tags[0] : "unknown");

        // --- INFO DE ARTISTA ---
        let artistInfo = ARTIST_CACHE[info.artist?.url];
        if (!artistInfo && info.artist?.url) {
            try {
                artistInfo = await bcfetch.band.getInfo({
                    bandUrl: info.artist.url,
                    imageFormat: "bio_featured",
                });
                ARTIST_CACHE[info.artist.url] = artistInfo;
            } catch (err) {
                console.warn(`⚠️ No se pudo obtener info de artista ${info.artist.url}: ${err.message}`);
            }
        }

        const artist = {
            name:
                info.artist?.name ||
                info.rawData?.current?.artist ||
                artistInfo?.name ||
                "Unknown Artist",
            url: info.artist?.url,
            location: artistInfo?.location || info.artist?.location || null,
            description: artistInfo?.description || info.artist?.description || null,
            imageUrl: artistInfo?.imageUrl || info.artist?.imageUrl || null,
            label: artistInfo?.label
                ? {
                    name: artistInfo.label.name,
                    url: artistInfo.label.url,
                }
                : null,
        };

        // --- Fallbacks de título, descripción y fechas ---
        const title =
            info.title ||
            info.name ||
            info.rawData?.current?.title ||
            info.rawData?.title ||
            "Untitled";

        const description =
            info.description ||
            info.rawData?.current?.about ||
            info.rawData?.about ||
            null;

        const releaseDate =
            info.releaseDate ||
            info.rawData?.current?.release_date ||
            null;

        const embedId =
            albumId ||
            info.rawData?.current?.id ||
            info.rawData?.album_id ||
            null;

        const embedUrl = embedId
            ? `https://bandcamp.com/EmbeddedPlayer/album=${embedId}/size=large/bgcol=000000/linkcol=ffffff/transparent=true/`
            : null;

        return {
            type: "album",
            title,
            url: info.url || albumUrl,
            release_date: releaseDate,
            description,
            genre,
            tags,
            price: info.currentPrice,
            currency: info.currency,
            cover_url: info.imageUrl,
            stream_url: info.streamUrl,
            tracks_count: info.tracks?.length || 0,
            duration_total: info.tracks
                ? info.tracks.reduce((acc, t) => acc + (t.duration || 0), 0)
                : 0,
            artist,
            label: info.label
                ? {
                    name: info.label.name,
                    url: info.label.url,
                }
                : null,
            embed_id: embedId,
            embed_url: embedUrl,
        };
    } catch (error) {
        console.error(`⚠️ Error al obtener álbum ${albumUrl}:`, error.message);
        return null;
    }
}

// --- Exploración con registro de red de tags ---
async function discoverByTagWalk(startTag = null, steps = 10) {
    let currentTag = startTag;
    const visited = new Set();
    const albums = [];
    const tagLinks = []; // red de relaciones tag→tag
    let repeatTag = null;
    let repeatCount = 0;
    let failTag = null;
    let failCount = 0;

    for (let i = 0; i < steps; i++) {
        // 🧠 Si currentTag está vacío, "none" o inválido, elige uno al azar
        if (!currentTag || currentTag === "none" || currentTag === "unknown") {
            const randomSeed = SEED_TAGS[Math.floor(Math.random() * SEED_TAGS.length)];
            console.log(`🌱 Tag vacío o inválido detectado. Asignando random seed: ${randomSeed}`);
            currentTag = randomSeed;
        }

        console.log(`🎲 Paso ${i + 1}/${steps} → buscando por tag: ${currentTag}`);
        let forcedTag = false;

        const normalizedTag = normalizeTag(currentTag);

        const params = normalizedTag
            ? { customTags: [normalizedTag], albumImageFormat: "art_app_large", artistImageFormat: "bio_featured" }
            : { genre: null, albumImageFormat: "art_app_large", artistImageFormat: "bio_featured" };

        let result;
        // 🔀 Generar número de página aleatorio (5 a 15)
        //const randomPage = Math.floor(Math.random() * 15) + 1;
        const randomPage = Math.floor(Math.random() * 20) + 1;

        // 🎚️ Elegir aleatoriamente el modo de orden: "top", "new" o "rec"
        const sortMode = ["top", "new", "rec"][Math.floor(Math.random() * 3)];

        // 🔎 Ejecutar búsqueda con variación de página y orden
        try {
            result = await bcfetch.discovery.discover({
                ...params,
                page: randomPage,
                sort: sortMode,
            });

            console.log(`📄 Explorando página ${randomPage} (${sortMode}) del tag "${currentTag}"`);
        } catch (err) {
            console.warn(`⚠️  Error de conexión con "${currentTag}" (p${randomPage}/${sortMode}): ${err.message}`);
            const randomSeed = SEED_TAGS[Math.floor(Math.random() * SEED_TAGS.length)];
            currentTag = randomSeed;
            forcedTag = true;
            continue;
        }

        // Filtrar solo álbumes con URL válida
        let items = result.items.filter((x) => x.type === "album");

        // Reintento con tag sin guiones
        if (items.length === 0 && normalizedTag?.includes("-")) {
            const retryTag = normalizedTag.replace(/-/g, " ");
            console.warn(`⚠️  Sin resultados para "${normalizedTag}". Reintentando con tag alternativo: "${retryTag}"...`);
            try {
                const retryResult = await bcfetch.discovery.discover({
                    customTags: [retryTag],
                    albumImageFormat: "art_app_large",
                    artistImageFormat: "bio_featured",
                });
                const retryItems = retryResult.items?.filter((x) => x.type === "album" && x.url) || [];
                if (retryItems.length > 0) {
                    console.log(`✅ Reintento exitoso: ${retryItems.length} álbumes encontrados para "${retryTag}"`);
                    items = retryItems;
                }
            } catch (err) {
                console.warn(`⚠️  Error en reintento con "${retryTag}": ${err.message}`);
            }
        }

        // Si sigue sin resultados
        if (items.length === 0) {
            if (currentTag === failTag) {
                failCount++;
            } else {
                failTag = currentTag;
                failCount = 1;
            }

            const MAX_FAILS = 5; // 💡 ahora permitirá hasta 5 intentos

            if (failCount >= MAX_FAILS) {
                const randomSeed = SEED_TAGS[Math.floor(Math.random() * SEED_TAGS.length)];
                console.warn(`💀 Tag "${currentTag}" falló ${failCount} veces. Saltando definitivamente a: ${randomSeed}`);
                // ⚡️ Actualiza antes de salir
                currentTag = randomSeed;
                failTag = null;
                failCount = 0;

                // 🧠 IMPORTANTE: seguimos el bucle desde el nuevo tag
                i--; // ← retrocede un paso en el contador, así no lo “pierde”
                await new Promise((r) => setTimeout(r, 2000));
                continue;
            }

            console.warn(`⚠️ Sin resultados para "${currentTag}" (intento ${failCount}/2). Reintentando...`);
            await new Promise((r) => setTimeout(r, 2000));
            continue;
        }


        const randomAlbum = items[Math.floor(Math.random() * items.length)];
        if (visited.has(randomAlbum.url)) continue;
        visited.add(randomAlbum.url);

        // === 🧠 Bloque con reintento automático ===
        let enriched = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                enriched = await getAlbumFull(randomAlbum.url, currentTag, randomAlbum.id);
                break;
            } catch (err) {
                if (err.message.includes("429")) {
                    console.warn(`⚠️  Rate limit alcanzado. Esperando 30s (intento ${attempt})...`);
                    await new Promise((r) => setTimeout(r, 30000));
                } else {
                    console.error(`💥 Error inesperado en getAlbumFull: ${err.message}`);
                    break;
                }
            }
        }

        if (!enriched) {
            console.warn(`⏭️  Saltando álbum fallido: ${randomAlbum.url}`);
            continue;
        }

        albums.push(enriched);
        console.log(`🎧 Guardado: ${enriched.title} — ${enriched.artist.name}`);



        // Filtro de tags válidos
        const validTags = (enriched.tags || [])
            .map((t) => t.trim())
            .filter((t) => {
                const lower = t.toLowerCase();
                return (
                    t &&
                    t.length > 2 &&
                    !INVALID_TAGS.includes(lower) &&
                    !GEO_TAGS.includes(lower) &&
                    /^[a-zA-Z0-9\s\-]+$/.test(t) &&
                    !/city|town|province|records|studios?/i.test(t) // evita palabras geográficas o de sellos
                );
            });

        // alternar entre primer y tercer tag
        let nextTag =
            i % 2 === 0
                ? validTags[3] || validTags[0] || null
                : validTags[5] || validTags[0] || null;

        // fallback si no hay tags válidos o se repite
        if (!nextTag || nextTag === currentTag) {
            const randomSeed = SEED_TAGS[Math.floor(Math.random() * SEED_TAGS.length)];
            console.log(`🎵 Tag inválido o repetido (“${nextTag}”), usando seed: ${randomSeed}`);
            nextTag = randomSeed;
            forcedTag = true;
        }

        // Detección de loops repetidos
        if (nextTag === repeatTag) {
            repeatCount++;
        } else {
            repeatTag = nextTag;
            repeatCount = 0;
        }

        const MAX_REPEATS = 5; // permitirá repetir el mismo tag hasta 5 veces seguidas

        if (repeatCount >= MAX_REPEATS) {
            const randomSeed = SEED_TAGS[Math.floor(Math.random() * SEED_TAGS.length)];
            console.log(`🚨 Tag repetido "${nextTag}" (${repeatCount} veces seguidas). Saltando a: ${randomSeed}`);

            nextTag = randomSeed;
            repeatCount = 0;
            forcedTag = true;
        }

        // 🧠 Guardar relación sólo si el salto fue natural
        if (!forcedTag) {
            tagLinks.push({
                from: currentTag || "random",
                to: nextTag || "none",
                album: enriched.title,
                artist: enriched.artist.name,
                url: enriched.url,
            });
        }

        if (albums.length % SAVE_EVERY === 0) {
            saveJSON(albums, OUTPUT_PATH_ALBUMS);
            saveJSON(tagLinks, OUTPUT_PATH_TAGS);
        }

        console.log(`➡️  Siguiente tag: ${nextTag || "none"}`);
        currentTag = nextTag;

        // 🌀 Detección de loops de inercia (cuando el tag se repite sin cambiar)
        if (nextTag === currentTag) {
            repeatCount++;
        } else {
            repeatCount = 0;
        }

        if (repeatCount >= 3) {
            const randomSeed = SEED_TAGS[Math.floor(Math.random() * SEED_TAGS.length)];
            console.warn(`🌀 Tag "${currentTag}" se repitió ${repeatCount} veces sin variar. Saltando a: ${randomSeed}`);
            currentTag = randomSeed;
            repeatCount = 0;
            continue; // salta inmediatamente al siguiente ciclo con el nuevo tag
        }

        await new Promise((r) => setTimeout(r, 3000));


    }

    return { albums, tagLinks };
}

// --- Función de backup ---
function backupFile(filePath) {
    if (fs.existsSync(filePath)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupPath = filePath.replace(".json", `_${timestamp}.bak.json`);
        fs.copyFileSync(filePath, backupPath);
        console.log(`🗂️ Backup creado: ${path.basename(backupPath)}`);
    }
}

// --- Cargar JSON existente ---
function loadExistingJSON(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, "utf-8");
            const data = JSON.parse(raw);
            console.log(`📂 Cargados ${data.length} registros previos desde ${path.basename(filePath)}`);
            return data;
        }
    } catch (err) {
        console.warn(`⚠️ No se pudo leer ${filePath}: ${err.message}`);
    }
    return [];
}

// === EJECUCIÓN PRINCIPAL ===
async function main() {
    console.log(`🚀 Iniciando Tag-Walk desde tag: ${START_TAG || "random"} (${STEPS} pasos)`);
    // Cargar seeds
    try {
        const rawSeeds = fs.readFileSync(SEED_PATH, "utf-8");
        SEED_TAGS = JSON.parse(rawSeeds);
        console.log(`🌱 Cargadas ${SEED_TAGS.length} seeds desde ${SEED_PATH}`);
    } catch (err) {
        console.error(`💥 No se pudieron cargar las seeds desde ${SEED_PATH}: ${err.message}`);
        process.exit(1); // detenemos el script si no hay seeds
    }

    // Crear backups antes de combinar
    backupFile(OUTPUT_PATH_ALBUMS);
    backupFile(OUTPUT_PATH_TAGS);

    // Cargar datos previos
    const albumsExisting = loadExistingJSON(OUTPUT_PATH_ALBUMS);
    const tagLinksExisting = loadExistingJSON(OUTPUT_PATH_TAGS);

    // Ejecutar nueva exploración
    const { albums, tagLinks } = await discoverByTagWalk(START_TAG, STEPS);

    // Combinar sin duplicados
    const albumsMerged = [
        ...albumsExisting,
        ...albums.filter((a) => !albumsExisting.some((b) => b.url === a.url)),
    ];

    const tagLinksMerged = [
        ...tagLinksExisting,
        ...tagLinks.filter(
            (a) =>
                !tagLinksExisting.some(
                    (b) => b.url === a.url && b.from === a.from && b.to === a.to
                )
        ),
    ];

    // Guardar archivos actualizados
    saveJSON(albumsMerged, OUTPUT_PATH_ALBUMS);
    saveJSON(tagLinksMerged, OUTPUT_PATH_TAGS);

    console.log("✅ Exploración Tag-Walk incremental completada.");
}

await main();
