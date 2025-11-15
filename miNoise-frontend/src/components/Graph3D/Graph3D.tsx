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

    // --- CARGAR SÓLO LISTA DE ÁLBUMES ---
    useEffect(() => {
        fetch(DATA_URL)
            .then(res => res.json())
            .then(json => {
                const albums = json.nodes.filter((n: any) => n.type === "album");
                const tags = json.nodes.filter((n: any) => n.type === "tag");
                setAllAlbums(albums);
                setAllTags(tags);
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

            const IDLE_MS = 20000; // milisegundos sin mover mouse/scroll para “apretar Tags”

            const resetIdle = () => {
                if (!apiRef.current?.showBaseTagLayer) return;

                // limpiamos timer previo
                if (idleTimeoutRef.current !== null) {
                    window.clearTimeout(idleTimeoutRef.current);
                }

                // programamos que, si no hay actividad, se llame a showBaseTagLayer
                idleTimeoutRef.current = window.setTimeout(() => {
                    const api = apiRef.current;

                    // ⚠️ Solo si SIGUES en capa de TAGS
                    if (
                        api &&
                        api.showBaseTagLayer &&
                        api.getCurrentLayer &&
                        api.getCurrentLayer() === "tags"
                    ) {
                        api.showBaseTagLayer();
                    }
                }, IDLE_MS);
            };

            const handleActivity = () => {
                resetIdle();
            };

            // Escuchamos actividad del usuario sobre el canvas
            el.addEventListener("wheel", handleActivity);
            el.addEventListener("pointerdown", handleActivity);
            el.addEventListener("pointermove", handleActivity);
            el.addEventListener("touchstart", handleActivity);

            // Arrancamos el primer temporizador de inactividad
            resetIdle();

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



    return (
        <div style={{ position: "relative", width: "100%", height: "100vh" }}>

            <style>
                {`
/* ===========================
   TIPOGRAFÍA GLOBAL SEARCH
=========================== */
.search-box {
    font-family: "Inter", sans-serif;
    color: #f4f4f4;
    letter-spacing: 0.2px;
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
    font-size: 15px;
    opacity: 0.7;
    pointer-events: none;
}

.search-input-wrapper input {
    width: 100%;
    padding: 10px 14px 10px 34px; /* deja espacio para la lupa */
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(20,20,25,0.85);
    color: #f4f4f4;
    font-size: 14px;
    letter-spacing: 0.2px;
    outline: none;
    transition: 0.25s border, 0.25s background;
}

.search-input-wrapper input::placeholder {
    color: rgba(255,255,255,0.35);
}

.search-input-wrapper input:focus {
    background: rgba(35,35,45,0.9);
    border-color: rgba(160,200,255,0.4);
    box-shadow: 0 0 12px rgba(80,150,255,0.25);
}

/* ===== Resultados ===== */
.search-results {
    margin-top: 8px;
    background: rgba(10,10,14,0.9);
    border-radius: 10px;
    padding: 6px;
    box-shadow: 0 0 18px rgba(0,0,0,0.45);
    border: 1px solid rgba(255,255,255,0.06);
    max-height: 260px;
    overflow-y: auto;
    backdrop-filter: blur(6px);
    font-family: "Inter", sans-serif;
}

.search-item {
    padding: 10px;
    border-radius: 6px;
    margin: 2px 0;
    transition: background 0.2s;
}

.search-item:hover {
    background: rgba(255,255,255,0.08);
    cursor: pointer;
}

/* ===== TIPOGRAFÍA DE RESULTADOS ===== */
.search-item strong {
    display: block;
    font-size: 15px;
    font-weight: 600;
    color: #ffffff;
}

.search-item span {
    display: block;
    margin-top: 2px;
    font-size: 13px;
    color: #b9d5ff; /* azul suave */
    font-weight: 500;
}

.search-item div {
    font-size: 11px;
    margin-top: 4px;
    color: #c8c8c8;
    opacity: 0.75;
}

`}
            </style>

            {/* 🔎 SEARCH BAR + BOTÓN ATRÁS */}
            <div
                className="search-box"
                style={{
                    position: "absolute",
                    top: 20,
                    left: 20,
                    width: 360,   // un poquito más ancho para que quepan botón + input
                    zIndex: 20
                }}
            >
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <button
                        onClick={handleBackClick}
                        style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: "1px solid rgba(255,255,255,0.25)",
                            background: "rgba(10,10,20,0.9)",
                            color: "#f4f4f4",
                            fontSize: 12,
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                        }}
                    >
                        🔙 Tags
                    </button>

                    <input
                        type="text"
                        placeholder="🔍 Buscar tag, álbum, artista o año..."
                        value={query}
                        onChange={(e) => {
                            const q = e.target.value.toLowerCase();
                            setQuery(q);

                            if (q.length < 2) {
                                setResults([]);
                                return;
                            }

                            // 🔹 Coincidencias de TAGS
                            const tagMatches = allTags.filter((t: any) =>
                                t.label?.toLowerCase().includes(q)
                            );

                            // 🔹 Coincidencias de ALBUMS
                            const albumMatches = allAlbums.filter((a: any) =>
                                (a.title?.toLowerCase().includes(q)) ||
                                (a.artist?.toLowerCase().includes(q)) ||
                                (a.release_date?.toLowerCase().includes(q))
                            );

                            // Opcional: primero tags, luego álbums
                            const combined = [
                                ...tagMatches,
                                ...albumMatches
                            ].slice(0, 20);

                            setResults(combined);
                        }}
                        style={{
                            flex: 1,
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "none",
                            outline: "none",
                            background: "rgba(255,255,255,0.1)",
                            color: "white",
                        }}
                    />
                </div>

                {results.length > 0 && (
                    <div
                        className="search-results"
                        style={{
                            marginTop: 6,
                            background: "rgba(20,20,20,0.85)",
                            borderRadius: 8,
                            padding: 6,
                            maxHeight: 260,
                            overflowY: "auto",
                            boxShadow: "0 0 12px rgba(0,0,0,0.5)"
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
                                        <div style={{ fontSize: 11, opacity: 0.7 }}>
                                            {item.release_date}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
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
                    boxSizing: "border-box",   // 👈 clave
                    display: "none",
                    position: "absolute",
                    right: 0,
                    top: 0,
                    width: "320px",
                    height: "100%",
                    background: "rgba(25,25,35,0.65)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 0 22px rgba(0,0,0,0.4)",
                    borderLeft: "1px solid rgba(255,255,255,0.05)",
                    color: "#e6e6e6",
                    padding: "16px",
                    overflowY: "auto",
                    zIndex: 20,
                    fontFamily: "Inter, sans-serif",
                    lineHeight: "1.45",
                    letterSpacing: "0.2px"
                }}
            >
                <div ref={panelContentRef}></div>
            </div>
        </div>
    );
}
