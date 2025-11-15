import React, { useRef, useEffect, useState } from "react";
import { initGraph3D } from "./initGraph3D";

const DATA_URL = "/data/tag_album_embedded_graph_FINAL.json";

export default function Graph3D() {
    console.log(">>> Graph3D render");

    const containerRef = useRef<HTMLDivElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const panelContentRef = useRef<HTMLDivElement | null>(null);

    const apiRef = useRef<any>(null);
    const idleTimeoutRef = useRef<number | null>(null); // 👈 nuevo

    // --- ESTADOS DE BÚSQUEDA ---
    const [allTags, setAllTags] = useState<any[]>([]);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [allAlbums, setAllAlbums] = useState<any[]>([]);
    // sugerencia de tags
    const [suggestedTags, setSuggestedTags] = useState<any[]>([]);

    const MAX_TAG_LABEL_CHARS = 14; // ajusta a gusto

    function formatTagLabel(label: string = "") {
        if (!label) return "";
        if (label.length <= MAX_TAG_LABEL_CHARS) return label;
        return label.slice(0, MAX_TAG_LABEL_CHARS - 1) + "…";
    }



    // --- CARGAR LISTAS DE ÁLBUMES Y TAGS ---
    useEffect(() => {
        fetch(DATA_URL)
            .then(res => res.json())
            .then(json => {
                const albums = json.nodes
                    .filter((n: any) => n.type === "album")
                    .map((a: any) => ({
                        ...a,
                        _searchTitle: (a.title || "").toLowerCase(),
                        _searchArtist: (a.artist || "").toLowerCase(),
                        _searchRelease: (a.release_date || "").toLowerCase(),
                        _searchLocation: (a.artist_location || a.location || "").toLowerCase() // 👈 NUEVO
                    }));

                const tags = json.nodes
                    .filter((n: any) => n.type === "tag")
                    .map((t: any) => ({
                        ...t,
                        _searchLabel: (t.label || "").toLowerCase()
                    }));

                setAllAlbums(albums);
                setAllTags(tags);
                // 🔹 inicializar sugerencias:
                pickRandomTags(tags)
            });
    }, []);


    // --- INICIALIZAR GRAFO ---
    useEffect(() => {
        if (!containerRef.current || !panelRef.current || !panelContentRef.current) {
            console.warn("Refs no listos, saliendo...");
            return;
        }

        let cleanupListeners: (() => void) | null = null;

        try {
            console.log(">>> Antes de initGraph3D");

            const api = initGraph3D({
                container: containerRef.current,
                panel: panelRef.current,
                panelContent: panelContentRef.current,
                dataUrl: DATA_URL
            });

            apiRef.current = api;

            console.log(">>> Después de initGraph3D");


            // ================================
            //   LÓGICA DE INACTIVIDAD AQUÍ
            // ================================
            const el = containerRef.current;
            if (!el || !apiRef.current?.showBaseTagLayer) {
                return;
            }

            const IDLE_MS = 8000; // milisegundos sin mover mouse/scroll para “apretar Tags”

            const resetIdle = () => {
                if (!apiRef.current?.showBaseTagLayer) return;

                // limpiamos timer previo
                if (idleTimeoutRef.current !== null) {
                    window.clearTimeout(idleTimeoutRef.current);
                }

                // programamos que, si no hay actividad, se llame a showBaseTagLayer
                idleTimeoutRef.current = window.setTimeout(() => {
                    const api = apiRef.current;
                    if (!api) return;

                    // Solo si SIGUES en capa de TAGS, activamos el movimiento suave
                    if (api.getCurrentLayer && api.getCurrentLayer() === "tags") {
                        if (api.startIdleCameraMotion) {
                            api.startIdleCameraMotion();
                        }
                    }
                    // 👇 importante: ya NO llamamos a showBaseTagLayer aquí
                }, IDLE_MS);
            };

            const handleActivity = () => {
                resetIdle();
                if (apiRef.current?.stopIdleCameraMotion) {
                    apiRef.current.stopIdleCameraMotion();
                }
            };

            // Escuchamos actividad del usuario sobre el canvas
            el.addEventListener("wheel", handleActivity);
            el.addEventListener("pointerdown", handleActivity);
            el.addEventListener("pointermove", handleActivity);
            el.addEventListener("touchstart", handleActivity);

            // Arrancamos el primer temporizador de inactividad
            //resetIdle();

            // función de limpieza
            cleanupListeners = () => {
                el.removeEventListener("wheel", handleActivity);
                el.removeEventListener("pointerdown", handleActivity);
                el.removeEventListener("pointermove", handleActivity);
                el.removeEventListener("touchstart", handleActivity);

                if (idleTimeoutRef.current !== null) {
                    window.clearTimeout(idleTimeoutRef.current);
                    idleTimeoutRef.current = null;
                }
            };
        } catch (err) {
            console.error("🔥 ERROR EN initGraph3D:", err);
        }

        return () => {
            // limpiar listeners + timeout cuando el componente se desmonte
            if (cleanupListeners) cleanupListeners();
        };
    }, []);

    // --- MANEJAR CLICK EN RESULTADO ---
    function handleResultClick(item: any) {
        setQuery("");
        setResults([]);

        if (!apiRef.current) return;

        // Si es TAG → expandir tag (sin zoom)
        if (item.type === "tag") {
            if (apiRef.current.expandTagFromSearchTag) {
                apiRef.current.expandTagFromSearchTag(item);
            }
            return;
        }

        // Si es ALBUM → comportamiento anterior (zoom + panel)
        if (item.type === "album" && apiRef.current.expandTagFromSearch) {
            apiRef.current.expandTagFromSearch(item);
        }
    }

    function handleBackClick() {
        if (apiRef.current?.showBaseTagLayer) {
            apiRef.current.showBaseTagLayer();
        }
        // limpiar búsqueda/resultados por si acaso
        setQuery("");
        setResults([]);
    }

    function pickRandomTags(sourceTags: any[]) {
        if (!sourceTags || sourceTags.length === 0) return;

        // 👇 Preferimos tags SIN números en el label
        const noNumberTags = sourceTags.filter((t: any) =>
            t.label && !/\d/.test(t.label)   // true si NO hay dígitos
        );

        // Si hay suficientes, usamos los “bonitos”; si no, usamos todos
        const pool = noNumberTags.length >= 4 ? noNumberTags : sourceTags;

        const copy = [...pool];
        copy.sort(() => Math.random() - 0.5);   // shuffle sencillo

        setSuggestedTags(copy.slice(0, 4));
    }

    function handleSuggestedTagClick(tag: any) {
        if (!apiRef.current?.expandTagFromSearchTag) return;

        apiRef.current.expandTagFromSearchTag(tag);
        setQuery("");
        setResults([]);
    }

    function handleRefreshSuggestions() {
        pickRandomTags(allTags);
    }




    return (
        <div style={{ position: "relative", width: "100%", height: "100vh" }}>

            <style>
                {`
/* ===========================
   ESTILO GENERAL UI
=========================== */
.search-box {
    font-family: "Inter", sans-serif;
    color: #f4f4f4;
    letter-spacing: 0.2px;
    font-size: 11px;
}

/* ===== Input con icono ===== */
.search-input-wrapper {
    position: relative;
    width: 100%;
}

.search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 14px;
    opacity: 0.7;
    pointer-events: none;
}

.search-input-wrapper input {
    width: 100%;
    padding: 8px 12px 8px 32px; /* deja espacio para la lupa */
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.18);
    background: rgba(15,15,25,0.9);
    color: #f4f4f4;
    font-size: 11px;
    letter-spacing: 0.2px;
    outline: none;
    transition: 0.25s border, 0.25s background, 0.25s box-shadow;
}

.search-input-wrapper input::placeholder {
    color: rgba(255,255,255,0.4);
}

.search-input-wrapper input:focus {
    background: rgba(25,25,40,0.95);
    border-color: rgba(160,200,255,0.5);
    box-shadow: 0 0 12px rgba(80,150,255,0.35);
}

/* ===== Resultados ===== */
.search-results {
    margin-top: 6px;
    background: rgba(15,15,25,0.96);
    border-radius: 10px;
    padding: 6px;
    box-shadow: 0 0 18px rgba(0,0,0,0.6);
    border: 1px solid rgba(255,255,255,0.08);
    max-height: 260px;
    overflow-y: auto;
    backdrop-filter: blur(8px);
    font-family: "Inter", sans-serif;
}

/* Cada fila de resultado */
.search-item {
    padding: 8px 10px;
    border-radius: 8px;
    margin: 2px 0;
    transition: background 0.18s, transform 0.12s;
}

.search-item:hover {
    background: rgba(255,255,255,0.06);
    cursor: pointer;
    transform: translateX(1px);
}

/* ===== TIPOGRAFÍA DE RESULTADOS ===== */
.search-item strong {
    display: block;
    font-size: 10px;
    font-weight: 600;
    color: #ffffff;
}

.search-item span {
    display: block;
    margin-top: 1px;
    font-size: 10px;
    color: #b9d5ff; /* azul suave */
    font-weight: 500;
}

.search-item div {
    font-size: 10px;
    margin-top: 3px;
    color: #c8c8c8;
    opacity: 0.75;
}
`}
            </style>

            {/* 🔎 SEARCH BAR + TAGS SUGERIDOS */}
            <div
                className="search-box"
                style={{
                    position: "absolute",
                    top: 20,
                    left: 20,
                    width: 360,   // ancho total del header (columna tags + búsqueda)
                    zIndex: 20
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "flex-start"
                    }}
                >
                    {/* 📌 Columna izquierda: botón Tags + lista vertical de sugeridos */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            minWidth: 120
                        }}
                    >
                        <button
                            onClick={handleBackClick}
                            style={{
                                padding: "6px 10px",
                                borderRadius: 8,
                                border: "1px solid rgba(255,255,255,0.25)",
                                background: "rgba(10,10,20,0.9)",
                                color: "#f4f4f4",
                                fontSize: 12,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                textAlign: "left"
                            }}
                        >
                            ⬅️ Tags
                        </button>

                        {suggestedTags.slice(0, 4).map((tag: any) => (
                            <button
                                key={tag.id}
                                onClick={() => handleSuggestedTagClick(tag)}
                                style={{
                                    width: "100%",
                                    borderRadius: 999,
                                    border: "1px solid rgba(255,255,255,0.18)",
                                    background: "rgba(15,15,25,0.9)",
                                    padding: "3px 8px",
                                    color: "#f4f4f4",
                                    fontSize: 9,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    textAlign: "left"
                                }}
                            >
                                <span style={{ fontSize: 10 }}>🏷️</span>
                                <span>#{formatTagLabel(tag.label)}</span>
                            </button>
                        ))}

                        <button
                            onClick={handleRefreshSuggestions}
                            style={{
                                width: "100%",
                                borderRadius: 999,
                                border: "1px solid rgba(255,255,255,0.25)",
                                background: "rgba(10,10,20,0.95)",
                                padding: "4px 10px",
                                color: "#b9d5ff",
                                fontSize: 11,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                textAlign: "left",
                                whiteSpace: "nowrap"
                            }}
                        >
                            <span>🔄</span>
                            <span>Otros tags</span>
                        </button>
                    </div>

                    {/* 🔍 Columna derecha: input de búsqueda + resultados (MISMA COLUMNA) */}
                    <div
                        style={{
                            position: "relative",
                            width: 260,                 // 👈 ancho fijo para input + resultados
                            display: "flex",
                            flexDirection: "column",
                            gap: 6
                        }}
                    >
                        <div className="search-input-wrapper">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Buscar tag, álbum, artista o año..."
                                value={query}
                                onChange={(e) => {
                                    const q = e.target.value.toLowerCase();
                                    setQuery(q);

                                    if (q.length < 2) {
                                        setResults([]);
                                        return;
                                    }

                                    // 🔎 Tags que hacen match
                                    const tagMatches = allTags.filter((t: any) =>
                                        t._searchLabel?.includes(q)
                                    );

                                    // 🔎 Álbumes que hacen match (título, artista, fecha o locación)
                                    const albumMatches = allAlbums.filter((a: any) =>
                                        a._searchTitle?.includes(q) ||
                                        a._searchArtist?.includes(q) ||
                                        a._searchRelease?.includes(q) ||
                                        a._searchLocation?.includes(q)      // 👈 locación también busca
                                    );

                                    // 🎛 Límites
                                    const MAX_TOTAL = 20;
                                    const MAX_PER_GROUP = 10;

                                    const tagSlice = tagMatches.slice(0, MAX_PER_GROUP);
                                    const albumSlice = albumMatches.slice(0, MAX_PER_GROUP);

                                    // 🤝 Intercalar tags y álbumes para que se vea balanceado
                                    const mixed: any[] = [];
                                    const maxLen = Math.max(tagSlice.length, albumSlice.length);

                                    for (let i = 0; i < maxLen; i++) {
                                        if (i < tagSlice.length) mixed.push(tagSlice[i]);
                                        if (i < albumSlice.length) mixed.push(albumSlice[i]);
                                    }

                                    setResults(mixed.slice(0, MAX_TOTAL));
                                }}

                            />
                        </div>

                        {/* Resultados de búsqueda – mismo ancho que el input */}
                        {results.length > 0 && (
                            <div
                                className="search-results"
                                style={{
                                    position: "absolute",
                                    top: "115%",            // debajo del input
                                    left: 0,
                                    width: "100%",         // 👈 mismo ancho que el input
                                    boxSizing: "border-box",
                                    marginTop: 4
                                }}
                            >
                                {results.map((item) => (
                                    <div
                                        key={item.id}
                                        className="search-item"
                                        onClick={() => handleResultClick(item)}
                                    >
                                        {item.type === "tag" ? (
                                            <>
                                                <strong>#{item.label}</strong>
                                                <div style={{ fontSize: 11, opacity: 0.7 }}>
                                                    Tag · muestra álbumes relacionados
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <strong>{item.title}</strong>
                                                <span style={{ color: "#aaa" }}> — {item.artist}</span>
                                                <div style={{ fontSize: 8, opacity: 0.7 }}>
                                                    {item.release_date}
                                                    {item.artist_location && (
                                                        <>
                                                            {" · "}
                                                            <span style={{ color: "#b9d5ff" }}>{item.artist_location}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>




            {/* 🎵 CONTENEDOR DEL GRAFO */}
            <div
                ref={containerRef}
                id="graph-container"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100vh",
                    background:
                        "radial-gradient(circle at 50% 30%, #1a1a1a 0%, #050505 70%)",
                    backdropFilter: "blur(2px)"
                }}
            />
            <div
                ref={panelRef}
                id="info-panel"
                style={{
                    boxSizing: "border-box",
                    display: "none",
                    position: "absolute",
                    right: 0,
                    top: 0,
                    width: "210px",
                    height: "100%",
                    background: "rgba(15,15,25,0.96)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 0 22px rgba(0,0,0,0.5)",
                    borderLeft: "1px solid rgba(255,255,255,0.08)",
                    color: "#e6e6e6",
                    padding: "12px",
                    overflowY: "auto",
                    zIndex: 20,
                    fontFamily: "Inter, sans-serif",
                    fontSize: "11px",
                    lineHeight: "1.45",
                    letterSpacing: "0.2px"
                }}
            >
                <div ref={panelContentRef}></div>
            </div>

        </div>
    );
}
