# 🧱 miNoise_extractor — Arquitectura del Sistema

**Autor:** Adolfo A. Maza Peña
**Versión:** 1.0
**Última actualización:** noviembre 2025

---

## 📘 Resumen General

`miNoise_extractor` es un sistema modular orientado a la **exploración, extracción y visualización de datos musicales** desde *Bandcamp*.
Su arquitectura combina un **pipeline ETL local en Node.js** (extracción y enriquecimiento de datos) con un **frontend 3D en Three.js** para visualización relacional de géneros, artistas y álbumes.

El proyecto persigue un objetivo doble:

1. Construir un **grafo de conocimiento musical** (género → artista → álbum → label).
2. Ofrecer una **interfaz visual simple y portable**, desplegable en GitHub Pages o servidores estáticos.

---

## ⚙️ Estructura del Proyecto

```
miNoise_extractor/
├── extractor/                     # Capa de datos (Node.js ETL)
│   ├── discover_all_genres.mjs    # Extracción masiva por género
│   ├── build_graph.mjs            # Construcción del grafo global
│   ├── enrich_graph.mjs           # Enriquecimiento de artistas
│   ├── enrich_albums.mjs          # Enriquecimiento de álbumes
│   ├── enrich_all.mjs             # Pipeline completo (automatizado)
│   └── utils/                     # Librerías de apoyo
│       ├── bandcamp_api.mjs
│       ├── fetch_helpers.mjs
│       ├── file_io.mjs
│       ├── parse_band.mjs
│       └── log_utils.mjs
│
├── frontend/                      # Visualización interactiva
│   ├── src/
│   │   ├── main.js                # Entrada principal Three.js
│   │   ├── scene.js               # Escena, cámara y luces
│   │   ├── graphLoader.js         # Carga y render del JSON
│   │   ├── uiControls.js          # Filtros y eventos de usuario
│   │   └── shaders/               # Sombras y efectos visuales
│   ├── public/
│   │   └── data/graph_bandcamp_full.json
│   ├── package.json
│   └── vite.config.js
│
├── scripts/                       # Automatización y despliegue
│   ├── generate_dataset.sh
│   └── deploy_frontend.sh
│
├── .env
└── ARCHITECTURE.md
```

---

## 🔄 Flujo de Datos (ETL → Visualización)

```
┌────────────────────────────────────────────────────────────────┐
│                       FASE 1 — EXTRACCIÓN                      │
│   discover_all_genres.mjs     → obtiene álbumes por género      │
│   build_graph.mjs             → genera grafo inicial            │
└────────────────────────────────────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────────────────────────────┐
│                     FASE 2 — ENRIQUECIMIENTO                   │
│   enrich_graph.mjs           → agrega info de artistas          │
│   enrich_albums.mjs          → agrega info de álbumes           │
│   enrich_all.mjs             → ejecuta ambos en secuencia       │
└────────────────────────────────────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────────────────────────────┐
│                    FASE 3 — VISUALIZACIÓN (3D)                 │
│   frontend/src/graphLoader.js → carga grafo JSON                │
│   frontend/src/main.js        → genera escena Three.js          │
│   frontend/public/data/       → contiene dataset final          │
└────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Arquitectura Lógica

| Capa                   | Rol                                                    | Entradas                   | Salidas                    | Tecnologías                     |
| ---------------------- | ------------------------------------------------------ | -------------------------- | -------------------------- | ------------------------------- |
| **1. Ingesta**         | Conecta con Bandcamp y extrae álbumes por género       | Cookie `BANDCAMP_IDENTITY` | `bandcamp_discover_*.json` | Node.js, dotenv, bandcamp-fetch |
| **2. Integración**     | Fusiona resultados en un solo grafo                    | JSONs de géneros           | `graph_bandcamp.json`      | Node.js (fs, path)              |
| **3. Enriquecimiento** | Agrega metadatos de artistas y álbumes (HTML scraping) | `graph_bandcamp.json`      | `graph_bandcamp_full.json` | Cheerio, fetch                  |
| **4. Visualización**   | Renderiza relaciones en 3D                             | `graph_bandcamp_full.json` | Escena interactiva         | Three.js, Vite                  |
| **5. Despliegue**      | Publica resultados de forma estática                   | `/public/`                 | GitHub Pages               | Git + Pages                     |

---

## 🕸️ Diagrama de Componentes

```
     ┌────────────────────────────┐
     │     Bandcamp API / HTML    │
     └──────────────┬─────────────┘
                    │
           (fetch/discovery)
                    │
     ┌──────────────▼─────────────┐
     │    Node Extractor (ETL)    │
     │  discover / enrich / build │
     └──────────────┬─────────────┘
                    │
             (export JSON)
                    │
     ┌──────────────▼─────────────┐
     │     Frontend Three.js      │
     │   Carga y renderiza grafo  │
     └──────────────┬─────────────┘
                    │
            (interacción usuario)
                    │
     ┌──────────────▼─────────────┐
     │     Navegador Web          │
     │   GitHub Pages / Localhost │
     └────────────────────────────┘
```

---

## 🌐 Entornos

| Entorno                  | Propósito                                  | Tecnología                    | Estado             |
| ------------------------ | ------------------------------------------ | ----------------------------- | ------------------ |
| **Local**                | Ejecución ETL (descarga y enriquecimiento) | Node.js v22+, dotenv, cheerio | ✅ activo           |
| **Desarrollo Frontend**  | Pruebas interactivas 3D                    | Vite, Three.js                | ✅ activo           |
| **Producción (Hosting)** | Publicación estática                       | GitHub Pages / Netlify        | 🔜 en planificación |

---

## 🚀 Scripts Globales

`package.json` raíz:

```json
{
  "scripts": {
    "extract:all": "node extractor/enrich_all.mjs",
    "build:graph": "node extractor/build_graph.mjs",
    "serve:frontend": "cd frontend && npm run dev",
    "deploy:frontend": "bash scripts/deploy_frontend.sh"
  }
}
```

---

## 💾 Estructura de Datos del Grafo Final

```json
{
  "nodes": [
    { "id": "ambient", "type": "genre" },
    {
      "id": "Carbon Based Lifeforms",
      "type": "artist",
      "url": "https://carbonbasedlifeforms.bandcamp.com/",
      "label": "Ultimae Records",
      "location": "Sweden",
      "tags": ["ambient", "downtempo"],
      "albums_data": [
        {
          "title": "Hydroponic Garden",
          "year": "2003",
          "tags": ["ambient", "chillout"]
        }
      ]
    }
  ],
  "links": [
    { "source": "ambient", "target": "Carbon Based Lifeforms", "type": "belongs_to" }
  ]
}
```

---

## 🔍 Objetivos de diseño

* **Desacoplar la extracción del renderizado.**
  Los scripts Node generan datos independientes del front.
* **Minimizar dependencias.**
  Sin backend permanente, todo se resuelve por archivos.
* **Maximizar portabilidad.**
  Funciona en cualquier entorno local o nube sin configuración extra.
* **Visualización modular.**
  El front puede evolucionar sin tocar la base de datos.

---

## 🧩 Próximos pasos

1. Agregar un módulo `analyze_graph.mjs` para calcular métricas de red (grado, centralidad, comunidades).
2. Generar vistas derivadas: por país, label, o subgénero.
3. Conectar el frontend a un panel de búsqueda y estadísticas.
4. Integrar metadatos de Spotify o Last.fm como fuentes secundarias.

---

## 📚 Dependencias clave

| Módulo           | Uso                      | Paquete          |
| ---------------- | ------------------------ | ---------------- |
| `dotenv`         | Manejo de variables .env | `dotenv`         |
| `cheerio`        | Parseo HTML Bandcamp     | `cheerio`        |
| `bandcamp-fetch` | API no oficial           | `bandcamp-fetch` |
| `fs`, `path`     | Lectura/escritura JSON   | nativo           |
| `Three.js`       | Visualización 3D         | `three`          |
| `Vite`           | Bundler liviano          | `vite`           |

---

## 🧬 Conclusión

La arquitectura de `miNoise_extractor` se basa en un principio simple pero poderoso:
**todo el conocimiento musical puede modelarse como un grafo**.
Cada fase (extracción, enriquecimiento, visualización) se mantiene modular, reproducible y portable.
El resultado final es un sistema de análisis cultural que puede crecer hacia nuevas fuentes, sin perder su capacidad de correr en un laptop o publicarse como sitio estático.

---
