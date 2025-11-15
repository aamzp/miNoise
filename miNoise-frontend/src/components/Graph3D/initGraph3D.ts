import ForceGraph3DRaw from "3d-force-graph";
import * as THREE from "three";
const ForceGraph3D: any = ForceGraph3DRaw as any;

interface InitParams {
    container: HTMLDivElement;
    panel: HTMLDivElement;
    panelContent: HTMLDivElement;
    dataUrl: string;
}

// puedes ajustar estos dos números hasta que te guste
const TAG_BASE_SIZE = 32;    // tamaño visual de los TAGS
const ALBUM_BASE_SIZE = 34;  // tamaño visual de los ALBUMES

// === Parámetros de cámara / rotación ===
const CAMERA_BASE_RADIUS = 900;    // qué tan lejos está la cámara
const CAMERA_ANIM_MS = 1400;   // duración de la animación inicial
const ZOOM_FIT_MS = 1400;   // duración del zoomToFit
const ZOOM_FIT_PADDING = 550;    // padding en zoomToFit

// Velocidad de auto-rotación (ajusta esto a gusto):
// 0.3  → notorio
// 0.15 → suave
// 0.08 → bien chill
// 0.04 → ultra lento pero visible
const AUTO_ROTATE_SPEED = 0.04;

// ==========================================
// TEXTURE CACHE – evita recarga innecesaria
// ==========================================
const textureCache: Record<string, THREE.Texture> = {};

function getTexture(path: string) {
    if (!textureCache[path]) {
        textureCache[path] = new THREE.TextureLoader().load(path);
    }
    return textureCache[path];
}

// ==========================================
// SPRITE: TAG
// ==========================================
function createTagSprite(node: any) {
    const texPath = `/textures/tags/cluster_${node.cluster}.png`;
    const texture = getTexture(texPath);

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true
    });

    const sprite = new THREE.Sprite(material);

    const rawSize = node.size ?? 1;
    // Ajusta estos valores según cómo vengan tus "size"
    // Normalizamos y acotamos entre 0.7x y 1.6x del tamaño base
    const factor = Math.min(Math.max(rawSize / 40, 0.7), 1.6);
    const finalSize = TAG_BASE_SIZE * factor;

    sprite.scale.set(finalSize, finalSize, 1);
    return sprite;
}

// ==========================================
// SPRITE: ALBUM
// ==========================================
function createAlbumSprite(node: any) {
    const texIndex = Math.floor(Math.random() * 3); // 0,1,2
    // OJO: la carpeta es "album", no "albums"
    const texPath = `/textures/album/album_${texIndex}.png`;
    const texture = getTexture(texPath);

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(ALBUM_BASE_SIZE, ALBUM_BASE_SIZE, 1);

    return sprite;
}

//function getNodePosition(node: any): { x: number, y: number, z: number } | null {
//    const sprite = getSpriteForNode(node);
//    if (!sprite) return null;
//
//    const { x, y, z } = sprite.getWorldPosition(new THREE.Vector3());
//    return { x, y, z };
//}


export function initGraph3D({
    container,
    panel,
    panelContent,
    dataUrl
}: InitParams) {

    console.log("🎬 initGraph3D inicializado");

    function closePanel() {
        panel.style.display = "none";
        panelContent.innerHTML = "";
    }

    function showAlbumPanel(node: any) {
        panel.style.display = "block";

        panelContent.innerHTML = `
        <span id="inner-close-panel" style="cursor:pointer">✖</span>

        <h2 style="margin-bottom:4px; font-size:20px; font-weight:600;">${node.title}</h2>
        <h3 style="margin-top:0; color:#9ecbff; font-weight:400;">${node.artist}</h3>

        <div style="margin:12px 0; text-align:center;">
            <iframe
                style="border:0; width:264px; height:264px;"
                src="${node.embed_url}"
                seamless>
            </iframe>
        </div>

        <p><strong>Genre:</strong> ${node.genre || "n/a"}</p>
        <p><strong>Release:</strong> ${node.release_date || "n/a"}</p>
        <p><strong>Tracks:</strong> ${node.tracks_count || "n/a"}</p>
        <p><strong>Duration:</strong> ${Math.round(node.duration_total || 0)} sec</p>

        <p><strong>Artist location:</strong> ${node.artist_location || "n/a"}</p>

        <p><strong>Description:</strong><br>
            ${node.description || ""}
        </p>

        <h3>Links</h3>
        ${node.url ? `<p><a href="${node.url}" target="_blank" style="color:#6cf">Album page</a></p>` : ""}
        ${node.artist_url ? `<p><a href="${node.artist_url}" target="_blank" style="color:#6cf">Artist page</a></p>` : ""}
    `;

        document.getElementById("inner-close-panel")!.onclick = closePanel;
    }

    // ==========================================
    // GRAFO 3D
    // ==========================================
    const Graph = ForceGraph3D()(container)


    // 🔄 Activar auto-rotación global SUPER LENTA
    const controls = Graph.controls?.();
    if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = AUTO_ROTATE_SPEED;
    }

    function flyToNode(node: any, duration = 1300) {
        if (!node) return;

        const camDist = 100;

        const x = node.x ?? node.fx;
        const y = node.y ?? node.fy;
        const z = node.z ?? node.fz;

        Graph.cameraPosition(
            {
                x: x + camDist,
                y: y + camDist * 0.15,
                z: z + camDist
            },
            { x, y, z },
            duration
        );
    }

    Graph
        .backgroundColor("#000000")
        .d3VelocityDecay(0)

        .warmupTicks(30)
        .cooldownTicks(0)
        .linkVisibility(true)
        .linkThreeObjectExtend(true)

        .nodeLabel((node: any) =>
            node.type === "tag"
                ? `🎧 ${node.label}`
                : `💿 ${node.title} — ${node.artist}`
        )

        .nodeThreeObject((node: any) => {

            let sprite;

            if (node.type === "tag") {
                sprite = createTagSprite(node);
            } else if (node.type === "album") {
                sprite = createAlbumSprite(node);
            } else {
                return new THREE.Object3D();
            }

            // === FADE-IN UNIVERSAL ===
            if (sprite.material) {
                sprite.material.transparent = true;
                sprite.material.opacity = 0;

                let t = 0;

                function fade() {
                    t += 0.03; // velocidad
                    if (t > 1) t = 1;

                    const ease = t * t * (3 - 2 * t); // ease in-out
                    sprite.material.opacity = ease;

                    if (t < 1) requestAnimationFrame(fade);
                }

                requestAnimationFrame(fade);
            }

            return sprite;
        })

        .linkColor(() => "rgba(255,255,255,0.15)")
        .linkOpacity(0.25)

        .onNodeClick((node: any) => {
            // si es tag, expandimos
            if (node.type === "tag") {
                expandTag(node);
                closePanel(); // cierra panel si estaba abierto
                return;
            }

            // si es álbum, mostramos el panel
            if (node.type === "album") {
                showAlbumPanel(node);
            }
        })

        .onNodeHover((node: any) => {
            document.body.style.cursor = node ? "pointer" : "default";
            Graph.nodeColor((n: any) => {
                if (n === node) return "yellow";
                if (n.type === "tag") return "#63a6ff";
                return "#ffffff";
            });
        })

        .linkThreeObject(link => {
            console.log("CREANDO CURVA PARA:", link);

            const src = link.source;
            const dst = link.target;

            if (!src || !dst) return null;

            const p0 = new THREE.Vector3(src.x, src.y, src.z);
            const p2 = new THREE.Vector3(dst.x, dst.y, dst.z);

            const mid = new THREE.Vector3(
                (src.x + dst.x) / 2,
                (src.y + dst.y) / 2 + 30,
                (src.z + dst.z) / 2
            );

            // curva completa
            const curve = new THREE.QuadraticBezierCurve3(p0, mid, p2);
            const points = curve.getPoints(32);

            // línea nebulosa
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: 0x6cc9ff,
                transparent: true,
                opacity: 0.25
            });
            const line = new THREE.Line(geometry, material);

            // PUNTO DE ENERGÍA
            const dotGeometry = new THREE.SphereGeometry(2.5, 16, 16);
            const dotMaterial = new THREE.MeshBasicMaterial({
                color: 0xaeeaff
            });
            const dot = new THREE.Mesh(dotGeometry, dotMaterial);

            // Grupo: contiene la línea y el dot
            const group = new THREE.Group();
            group.add(line);
            group.add(dot);

            // Datos internos para animación
            group.userData = {
                curve,
                dot,
                t: Math.random() // fase inicial para que no todos empiecen igual
            };

            return group;
        })

    setTimeout(() => {
        console.log("🟣 Escena completa:", Graph.scene());
        console.log("🟡 Hijos:", Graph.scene().children);
    }, 1500);


    Graph.onEngineTick(() => {
        const scene = Graph.scene();

        // 1) Buscar el grupo principal del ForceGraph (donde están nodos + links)
        const fgGroup = scene.children.find(
            (obj: any) => obj.type === "Group"
        ) as THREE.Group | undefined;

        if (!fgGroup) return;

        // 2) Girar TODO el grafo lentamente alrededor del eje Y
        //gGroup.rotation.y += ROT_SPEED;

        // 3) Seguir animando los puntitos de energía en los enlaces
        fgGroup.children.forEach((obj: any) => {
            if (!obj.userData?.curve) return;

            const { curve, dot } = obj.userData;
            obj.userData.t += 0.02;
            if (obj.userData.t > 1) obj.userData.t = 0;

            const pos = curve.getPoint(obj.userData.t);
            dot.position.set(pos.x, pos.y, pos.z);
        });
    });

    setTimeout(() => {
        console.log("🛰 ESCENA COMPLETA:", Graph.scene());

        Graph.scene().children.forEach((child, idx) => {
            console.log(`🟦 [${idx}]`, child, "TYPE:", child.type, "NAME:", child.name);

            if (child.children?.length) {
                console.log("  └── Contiene hijos:", child.children);
            }
        });
    }, 2000);
    // ==========================================
    // CARGAR DATOS
    // ==========================================
    let fullData: any = null;
    let currentMode: "tags" | "expanded" = "tags";  // 👈 nuevo

    let currentLayer: "tags" | "expanded" = "tags";

    function showBaseTagLayer() {
        console.log("🔁 showBaseTagLayer() llamada");

        // 👇 estamos en capa base de tags
        currentLayer = "tags";

        // 1) Solo tags visibles
        Graph.nodeVisibility((n: any) => n.type === "tag");
        Graph.linkVisibility(false);

        // 2) Posición de cámara: misma idea que tenías, pero más controlada
        const baseRadius = CAMERA_BASE_RADIUS;
        const radius = baseRadius + (Math.random() * 250 - 125); // pequeño rango
        const angle = Math.random() * Math.PI * 2;
        const elevFactor = Math.random() * 0.4 - 0.2;

        const camX = radius * Math.cos(angle);
        const camZ = radius * Math.sin(angle);
        const camY = radius * elevFactor;

        Graph.cameraPosition(
            { x: camX, y: camY, z: camZ },
            { x: 0, y: 0, z: 0 },
            CAMERA_ANIM_MS
        );

        // 3) Auto-rotación constante, SIN random, ultra controlable
        const controls = Graph.controls?.();
        if (controls) {
            controls.autoRotate = true;
            controls.autoRotateSpeed = AUTO_ROTATE_SPEED;
            controls.update();
        }

        // 4) Encadre suave usando solo tags
        setTimeout(() => {
            Graph.zoomToFit(
                ZOOM_FIT_MS,
                ZOOM_FIT_PADDING,
                (n: any) => n.type === "tag"
            );
        }, CAMERA_ANIM_MS / 2);
    }

    fetch(dataUrl)
        .then(res => res.json())
        .then(json => {
            fullData = json;

            console.log("🎵 Grafo cargado:", json);

            // 1) fijar coordenadas UMAP de todos
            json.nodes.forEach(n => {
                if (n.umap_x !== undefined) {
                    n.fx = n.umap_x;
                    n.fy = n.umap_y;
                    n.fz = n.umap_z;
                }
            });

            // 2) cargar todo el grafo (tags + álbumes)
            Graph.graphData(json);

            // 3) ir a capa base de tags (cámara + orbit random viven ahí)
            showBaseTagLayer();
        })
        .catch(err => console.error("❌ Error cargando datos:", err));

    function normalizeTag(t: string) {
        return t.toLowerCase().replace(/-/g, " ").trim();
    }

    function handleResize() {
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        // actualizar tamaño del canvas
        Graph.width(width);
        Graph.height(height);

        // si estamos en modo "tags", re-encuadrar la nube
        if (currentMode === "tags") {
            Graph.zoomToFit(
                1000,                     // duración animación (ajústalo a gusto)
                350,                      // padding → MÁS chico = más cerca
                (n: any) => n.type === "tag"
            );
        }
    }
    window.addEventListener("resize", handleResize);



    function expandTag(tagNode: any) {
        if (!fullData) return;
        currentMode = "expanded"
        const visible = new Set<string>();

        const normLabel = normalizeTag(tagNode.label);
        visible.add(tagNode.id);

        // Encontrar álbumes
        const albums = fullData.nodes.filter(n =>
            n.type === "album" &&
            n.clean_tags?.map(normalizeTag).includes(normLabel)
        );

        albums.forEach(a => visible.add(a.id));

        // Mostrar solo tag + álbumes
        Graph.nodeVisibility((n: any) => visible.has(n.id));
        Graph.linkVisibility(false);

        // ==== FADE-IN SENCILLO Y SEGURO ====

        albums.forEach(album => {
            const sprite: any = Graph.nodeThreeObject()(album);

            if (!sprite || !sprite.material) return;

            // Comenzamos invisible
            sprite.material.transparent = true;
            sprite.material.opacity = 0;

            let t = 0;

            function fade() {
                t += 0.04; // velocidad
                if (t > 1) t = 1;

                const ease = t * t * (3 - 2 * t); // ease-in-out

                sprite.material.opacity = ease;

                if (t < 1) requestAnimationFrame(fade);
            }

            requestAnimationFrame(fade);
        });

        // Zoom suave
        setTimeout(() => Graph.zoomToFit(800), 300);
    }

    // 🔸 Búsqueda por ALBUM (ya funcionando, ahora resolviendo por id interno)
    (Graph as any).expandTagFromSearch = (albumFromSearch: any) => {
        if (!fullData) return;

        // IMPORTANTE: el álbum que viene de React es una copia distinta;
        // buscamos el nodo "real" que usa el grafo.
        const albumNode = fullData.nodes.find(
            (n: any) => n.id === albumFromSearch.id
        );

        if (!albumNode) {
            console.warn("No se encontró el álbum dentro del grafo:", albumFromSearch.id);
            return;
        }

        const tags = albumNode.clean_tags || [];
        if (tags.length === 0) return;

        const primary = normalizeTag(tags[0]);

        const tagObj = fullData.nodes.find(
            (n: any) => n.type === "tag" && normalizeTag(n.label) === primary
        );

        if (!tagObj) return;

        // 1. expandimos el tag
        expandTag(tagObj);

        // 2. esperamos que aparezcan los álbumes, hacemos zoom y abrimos panel
        setTimeout(() => {
            flyToNode(albumNode, 1300);
            showAlbumPanel(albumNode);
        }, 500);
    };

    // 🔸 Búsqueda por TAG: solo expandir el tag y mostrar sus álbumes
    (Graph as any).expandTagFromSearchTag = (tagFromSearch: any) => {
        if (!fullData) return;

        // Igual que antes: el tag de React es copia; buscamos el nodo real
        const tagNode = fullData.nodes.find(
            (n: any) => n.id === tagFromSearch.id
        );

        if (!tagNode || tagNode.type !== "tag") {
            console.warn("No se encontró el tag dentro del grafo:", tagFromSearch.id);
            return;
        }

        // Solo mostramos el tag + sus álbumes, sin zoom extra
        expandTag(tagNode);
    };

    return {
        cleanup: () => {
            console.log("🧹 Cleaning up ForceGraph3D");
            window.removeEventListener("resize", handleResize); // 👈 importante
            container.innerHTML = "";
        },
        expandTagFromSearch: (Graph as any).expandTagFromSearch,
        expandTagFromSearchTag: (Graph as any).expandTagFromSearchTag,
        showBaseTagLayer
    };
}
