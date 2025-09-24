                 ┌─────────────────────────────┐
                 │ import_dataset_logic(token) │
                 └──────────────┬──────────────┘
                                │
                     ¿genre_seeds es None?
                                │
                 ┌──────────────▼───────────────┐
                 │ load_seeds_from_json         │
                 │ (shuffle, sample=30)        │
                 └──────────────┬───────────────┘
                                │
              ┌─────────────────▼─────────────────┐
              │  Inicializar:                     │
              │  dataset = {artists:[], tracks:[]}│
              │  all_artists = [] , seen = set()  │
              └─────────────────┬─────────────────┘
                                │
                ┌───────────────▼───────────────┐
                │   Loop por cada genre_seed    │
                └───────────────┬───────────────┘
                                │
            ┌───────────────────▼───────────────────┐
            │ 1. Spotify search                     │
            │   - GET /search?genre=seed (limit=N)  │
            │   - Devuelve artistas_spotify         │
            └───────────────────┬───────────────────┘
                                │
            ┌───────────────────▼───────────────────┐
            │ 2. Last.fm search                     │
            │   - GET tag.gettopartists (limit=N)   │
            │   - Devuelve artistas_lastfm          │
            └───────────────────┬───────────────────┘
                                │
        ┌───────────────────────▼───────────────────────┐
        │ 3. Normalizar y agregar a all_artists         │
        │   - Evitar duplicados (seen por id/nombre)    │
        │   - Guardar datos base: id, name, followers…  │
        └───────────────────────┬───────────────────────┘
                                │
          (se repite hasta terminar todas las seeds)
                                │
                 ┌──────────────▼───────────────┐
                 │   Loop por cada artista en   │
                 │   all_artists (enriquecer)   │
                 └──────────────┬───────────────┘
                                │
    ┌───────────────────────────▼───────────────────────────┐
    │ a) Limpiar tags Last.fm                               │
    │ b) Buscar artistas relacionados en YouTube Music      │
    │ c) Buscar top tracks en Spotify (fallback: YouTube)   │
    │ d) Calcular popularity_hybrid                         │
    └───────────────────────────┬───────────────────────────┘
                                │
                 ┌──────────────▼──────────────┐
                 │ Filtrar mainstream          │
                 │ (popularity_hybrid <= 100)  │
                 └──────────────┬──────────────┘
                                │
                 ┌──────────────▼──────────────┐
                 │  return dataset             │
                 │  {artists, tracks}          │
                 └─────────────────────────────┘

Seeds → Se cargan del JSON (aleatorios).

Por seed → se buscan artistas en Spotify + Last.fm.

Normalizar → evitar duplicados y guardar datos base.

Por artista → limpiar tags, buscar relacionados, obtener tracks, calcular popularidad híbrida.

Filtrar mainstream → se quedan artistas con score <= 100.

Retorno → dataset final con artists y tracks.