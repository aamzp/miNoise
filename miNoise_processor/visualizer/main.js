// =========================
// miNoise — main.js
// Visualización 3D de tags ↔ álbumes
// =========================

// --- CONFIG ---
const DATA_URL = "/data/tag_album_embedded_graph_FINAL.json?ts=" + Date.now();

// Elementos del DOM
const panel = document.getElementById("info-panel");
const panelContent = document.getElementById("panel-content");
const closePanelBtn = document.getElementById("close-panel");

closePanelBtn.onclick = () => closePanel();

// =========================
// PANEL DE INFORMACIÓN
// =========================

function closePanel() {
    panel.style.display = "none";
    panelContent.innerHTML = "";
}

function showAlbumPanel(node) {
    panel.style.display = "block";

    // Construcción segura del panel
    panelContent.innerHTML = `
        <span id="close-panel">✖</span>

        <h2>${node.title}</h2>
        <h3>${node.artist || ""}</h3>

        <img src="${node.cover_url}" alt="Cover">

        <p><strong>Genre:</strong> ${node.genre || "n/a"}</p>
        <p><strong>Release:</strong> ${node.release_date || "n/a"}</p>
        <p><strong>Tracks:</strong> ${node.tracks_count || "n/a"}</p>
        <p><strong>Duration:</strong> ${Math.round(node.duration_total || 0)} sec</p>

        <p><strong>Artist location:</strong> ${node.artist_location || "n/a"}</p>

        <p><strong>Description:</strong><br>
            ${node.description || ""}
        </p>

        <h3>▶ Reproductor</h3>
        <iframe 
            style="width:100%; height:200px; border:none;" 
            src="${node.embed_url}" 
            seamless>
        </iframe>

        <h3>Links</h3>

        ${node.url
            ? `<p><a href="${node.url}" target="_blank" style="color:#6cf">Album page</a></p>`
            : ""}

        ${node.artist_url
            ? `<p><a href="${node.artist_url}" target="_blank" style="color:#6cf">Artist page</a></p>`
            : ""}
    `;

    // volver a activar botón cerrar dentro del contenido nuevo
    document.getElementById("close-panel").onclick = closePanel;
}

// =========================
// CONFIGURAR GRAFO
// =========================

const Graph = ForceGraph3D()
    (document.getElementById("graph-container"))
    .backgroundColor("#000000")
    .nodeLabel(node =>
        node.type === "tag"
            ? `🎧 ${node.label}`
            : `💿 ${node.title} — ${node.artist}`
    )
    .nodeVal(node =>
        node.type === "tag" ? (node.size / 800) : 1
    )
    .nodeColor(node => node.color || "#ffffff")
    .linkColor(() => "rgba(255,255,255,0.1)")
    .linkOpacity(0.25)
    .onNodeClick(node => {
        if (node.type === "album") {
            showAlbumPanel(node);
        } else {
            closePanel();
        }
    })
    .onNodeHover(node => {
        document.body.style.cursor = node ? "pointer" : "default";
    });

// =========================
// CARGAR DATOS
// =========================

fetch(DATA_URL)
    .then(res => res.json())
    .then(data => {
        console.log("🎵 Grafo cargado:", data);
        Graph.graphData(data);

        // Ajustar zoom inicial
        Graph.cameraPosition({ z: 2800 });
    })
    .catch(err => console.error("❌ Error cargando datos:", err));
