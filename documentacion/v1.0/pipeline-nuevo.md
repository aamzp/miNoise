# Nuevo diseño de extracción de datos (miNoise Extractor v2)

## 1. Fuentes principales

| Fuente                             | Usos estratégicos                                                                                                                                     | Ventajas                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Last.fm API**                    | 🔹 Extracción masiva de artistas y tags<br>🔹 Similaridad entre artistas<br>🔹 Popularidad (listeners y playcount)<br>🔹 Clasificación por géneros (tags) | Gratuita, estable, sin token complejo                |
| **YouTube Music API (ytmusicapi)** | 🔹 Obtener canciones, álbumes, videos<br>🔹 Enlace directo a audio para extracción con librosa<br>🔹 “Songs” → metadatos + URL (para features acústicos) | Acceso simple sin OAuth                              |
| **Spotify (mínimo)**               | 🔹 Enriquecer nombre/artista<br>🔹 Objeto de referencia en dataset (opcional)                                                                           | Se usa solo como respaldo si falla Last.fm o YouTube |

## ⚙️ 2. Etapas del pipeline

🟩 Etapa A — Extracción (API Fetchers)

1. Semillas iniciales (tags o géneros):
Se cargan desde seeds.json o directamente de Last.fm (tag.getTopTags).

2. Por cada tag, obtener:

`tag.getTopArtists` (Last.fm): lista base de artistas.

`artist.getInfo` (Last.fm): listeners, tags, similares.

`ytmusic.search(artist_name, filter="songs")`: obtener canciones destacadas y URLs.

➡️ Salida: JSON con { artists[], tracks[] }.

## 🟨 Etapa B — Limpieza y enriquecimiento

Aplicar un conjunto de filtros y reglas:

| Tipo                    | Regla                                                                     |
| ----------------------- | ------------------------------------------------------------------------- |
| **Duplicados**          | Normalizar nombres (`lower()`, sin paréntesis o “feat.”)                  |
| **Tags**                | Filtrar meta-tags irrelevantes (ej: “seen live”, “favorites”)             |
| **Popularidad**         | Calcular score híbrido (log de listeners + cantidad de tags únicos)       |
| **Selección de tracks** | Quedarse con 1–3 canciones principales del artista                        |
| **Análisis opcional**   | Identificar idioma del título o país probable (a partir de tags o nombre) |

## 🟦 Etapa C — Extracción acústica (fase posterior con librosa)

- Descargar los audios con yt_dlp.

- Procesar con extract_librosa_features():

- Zero-crossing rate

- Spectral centroid

- Bandwidth, rolloff, chroma, RMS

- Guardar features en JSON/CSV.

# 🚀 3. Ventajas del nuevo flujo

- Sin dependencias OAuth complejas (Spotify solo opcional).

- 100% replicable y escalable en servidores o Colab.

- Ideal para análisis semántico y acústico.

- Interconectable con tus futuras capas PCA/UMAP y visualizaciones 3D.