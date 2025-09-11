# == importaciones y librerías ==
import os
import requests
from flask_sqlalchemy import SQLAlchemy
from flask import (
    Flask,
    redirect,
    url_for,
    jsonify,
    session,
    request,
)

from flask_session import Session

from flask_migrate import Migrate

from flask_cors import CORS

from models import db, User, Song

from ytmusicapi import YTMusic

ytmusic = YTMusic()

import pandas as pd
import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

from collections import Counter

from datetime import datetime

import json

import random

# == configuración de la aplicación ==
app = Flask(__name__)

CORS(
    app,
    supports_credentials=True,
    resources={r"/*": {"origins": ["http://127.0.0.1:5173"]}},
)

app.config["SECRET_KEY"] = "clave-super-secreta"
app.config["SQLALCHEMY_DATABASE_URI"] = (
    "postgresql+psycopg://postgres:Mimi5858@localhost:5432/minoise_utf8"
)
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_COOKIE_NAME"] = "session"
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False

Session(app)

db.init_app(app)
migrate = Migrate(app, db)

# == Spotify == MODIFICAR POR SEGURIDAD ID Y SECRET
CLIENT_ID = "81ae4d31cfa54a6ea348ecd2316a6f5a"
CLIENT_SECRET = "828cb207e82f43c3aee6acce820e160a"
REDIRECT_URI = "http://127.0.0.1:5000/callback"

SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_BASE = "https://api.spotify.com/v1"

# == Last.fm ==
LASTFM_API_KEY = "5fe475f783cf2d192f94834f1553ce4d"
LASTFM_SECRET = "372a7be25847f622904f839cb0503fb0"


# == Funciones ==


def clean_lastfm_tags(tags):
    filtered = []
    exclude_meta = {
        "seen live",
        "favorites",
        "favorite",
        "need to rate",
        "my top songs",
        "american",
        "british",
        "canadian",
        "spanish",
        "australian",
        "spain",
        "argentina",
        "overrated",
    }

    for t in tags:
        lower = t.lower()

        # excluir décadas tipo 80s, 90s, 2000s
        if lower.endswith("0s") and lower[:-2].isdigit():
            continue

        # excluir meta-tags
        if lower in exclude_meta:
            continue

        filtered.append(t)

    return filtered


def compute_popularity_hybrid(spotify_popularity, listeners_lastfm, first_year):
    # normalizar popularity de Spotify (0–100 → 0–1)
    sp_norm = spotify_popularity / 100 if spotify_popularity else 0

    # normalizar listeners con logaritmo
    try:
        lf_norm = np.log1p(int(listeners_lastfm.replace(",", ""))) / 15
    except:
        lf_norm = 0

    # penalización por antigüedad y novedad
    current_year = datetime.now().year
    debut_year = int(first_year) if first_year else current_year
    age = current_year - debut_year

    decade_penalty = 0
    if age > 40:  # clásicos
        decade_penalty = 0.2
    elif age > 10:  # establecidos
        decade_penalty = 0.05
    elif age <= 1:  # hype reciente
        decade_penalty = 0.1

    # fórmula híbrida: 50% Last.fm + 30% Spotify - penalización
    hybrid = (0.5 * lf_norm) + (0.3 * sp_norm) - decade_penalty
    hybrid = max(0, min(1, hybrid))  # limitar entre 0 y 1

    return round(hybrid * 100, 1)


def get_lastfm_data(artist_name):
    base_url = "http://ws.audioscrobbler.com/2.0/"
    params = {
        "method": "artist.getinfo",
        "artist": artist_name,
        "api_key": LASTFM_API_KEY,
        "format": "json",
    }
    try:
        res = requests.get(base_url, params=params)
        if res.status_code == 200:
            data = res.json().get("artist", {})
            similar = [s["name"] for s in data.get("similar", {}).get("artist", [])]
            tags = [t["name"] for t in data.get("tags", {}).get("tag", [])]
            listeners = data.get("stats", {}).get("listeners")
            return {
                "similar": similar,
                "tags": tags,
                "listeners": listeners,
            }
    except Exception as e:
        print(f"[WARN] Last.fm error con {artist_name}: {e}")
    return {"similar": [], "tags": [], "listeners": None}


def load_seeds_from_json(path="seeds.json", shuffle=True, sample_size=None):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    # Aplana todas las listas en un único array de seeds
    seeds = [genre for sublist in data.values() for genre in sublist]

    if shuffle:
        random.shuffle(seeds)  # aleatoriza

    if sample_size and sample_size < len(seeds):
        seeds = random.sample(seeds, sample_size)  # Modificado para obtener n seeds

    return seeds


### === API ALGORITMO DE IMPORTACIÓN Y FILTRADO DE ARTISTAS === ###

LIMIT_PER_SEED = 10  # cantidad de artistas a buscar por seed
SAMPLE_SIZE = 40  # cantidad total de seeds a usar


def import_dataset_logic(app_token, genre_seeds=None):
    if genre_seeds is None:
        genre_seeds = load_seeds_from_json(
            "seeds.json", shuffle=True, sample_size=SAMPLE_SIZE
        )
        print(">>> Seeds seleccionados:", genre_seeds)
        print(">>> Total seeds:", len(genre_seeds))

    headers = {"Authorization": f"Bearer {app_token}"}
    dataset = {"artists": [], "tracks": []}

    all_artists = []
    seen = set()

    # === 1. Recolectar artistas por seed ===
    for idx, genre_seed in enumerate(genre_seeds, 1):
        print(f"\n[{idx}/{len(genre_seeds)}] Procesando seed: {genre_seed}...")

        # Spotify
        try:
            res_spotify = requests.get(
                f"{SPOTIFY_API_BASE}/search",
                headers=headers,
                params={
                    "q": f"genre:{genre_seed}",
                    "type": "artist",
                    "limit": LIMIT_PER_SEED,
                },
                timeout=5,
            )
            if res_spotify.status_code == 200:
                artists_spotify = res_spotify.json().get("artists", {}).get("items", [])
            else:
                artists_spotify = []
                print(f"[WARN] Spotify genre search error: {res_spotify.text}")
        except Exception as e:
            artists_spotify = []
            print(f"[ERROR] Spotify request failed for {genre_seed}: {e}")

        print(f"   Spotify -> {len(artists_spotify)} artistas encontrados")

        # Last.fm
        try:
            res_lastfm = requests.get(
                "http://ws.audioscrobbler.com/2.0/",
                params={
                    "method": "tag.gettopartists",
                    "tag": genre_seed,
                    "api_key": LASTFM_API_KEY,
                    "format": "json",
                    "limit": LIMIT_PER_SEED,
                },
                timeout=5,
            )
            if res_lastfm.status_code == 200:
                artists_lastfm = (
                    res_lastfm.json().get("topartists", {}).get("artist", [])
                )
            else:
                artists_lastfm = []
                print(f"[WARN] Last.fm tag search error: {res_lastfm.text}")
        except Exception as e:
            artists_lastfm = []
            print(f"[ERROR] Last.fm request failed for {genre_seed}: {e}")

        print(f"   Last.fm -> {len(artists_lastfm)} artistas encontrados")

        # Normalizar y agregar
        before = len(all_artists)

        for a in artists_spotify:
            if a["id"] not in seen:
                seen.add(a["id"])
                all_artists.append(
                    {
                        "id": a["id"],
                        "name": a["name"],
                        "popularity": a.get("popularity", 0),
                        "followers": a.get("followers", {}).get("total", 0),
                        "genres_spotify": a.get("genres", []),
                        "tags_lastfm": [],
                        "listeners_lastfm": None,
                        "related_artists_lastfm": [],
                    }
                )

        for a in artists_lastfm:
            name = a["name"]
            if name.lower() not in (x["name"].lower() for x in all_artists):
                try:
                    sp_lookup = requests.get(
                        f"{SPOTIFY_API_BASE}/search",
                        headers=headers,
                        params={"q": f"artist:{name}", "type": "artist", "limit": 1},
                        timeout=5,
                    )
                    sp_artist = None
                    if sp_lookup.status_code == 200:
                        items = sp_lookup.json().get("artists", {}).get("items", [])
                        if items:
                            sp_artist = items[0]
                except Exception as e:
                    print(f"[WARN] Spotify lookup failed for {name}: {e}")
                    sp_artist = None

                lastfm_data = get_lastfm_data(name)
                all_artists.append(
                    {
                        "id": sp_artist["id"] if sp_artist else None,
                        "name": name,
                        "popularity": (
                            sp_artist.get("popularity", 0) if sp_artist else 0
                        ),
                        "followers": (
                            sp_artist.get("followers", {}).get("total", 0)
                            if sp_artist
                            else 0
                        ),
                        "genres_spotify": (
                            sp_artist.get("genres", []) if sp_artist else []
                        ),
                        "tags_lastfm": lastfm_data["tags"],
                        "listeners_lastfm": lastfm_data["listeners"],
                        "related_artists_lastfm": lastfm_data["similar"],
                    }
                )

        after = len(all_artists)
        print(f"   Artistas nuevos agregados: {after - before}")
        print(f"   Total acumulado: {after}")

    # === 2. Enriquecer artistas ===
    print("\n>>> Enriqueciendo artistas (YouTube, tracks, popularidad)...")
    for idx, art in enumerate(all_artists, 1):
        if idx % 50 == 0:
            print(f"   Procesando artista {idx}/{len(all_artists)}: {art['name']}")

        # Clean tags
        art["tags_lastfm"] = clean_lastfm_tags(art.get("tags_lastfm", []))

        # Relacionados YT
        related_yt = []
        try:
            yt_results = ytmusic.search(art["name"], filter="artists")
            if yt_results:
                artist_id = yt_results[0].get("browseId")
                if artist_id:
                    yt_artist = ytmusic.get_artist(artist_id)
                    related_yt = [
                        r["title"]
                        for r in yt_artist.get("related", {}).get("results", [])
                        if "title" in r
                    ]
        except Exception as e:
            print(f"[WARN] Error YT related for {art['name']}: {e}")
        art["related_artists_yt"] = related_yt

        # Tracks
        print(f"\nProcesando artista {idx}/{len(all_artists)}: {art['name']}")
        found_track = False
        tracks_agregados = 0
        if art["id"]:
            try:
                top_tracks = requests.get(
                    f"{SPOTIFY_API_BASE}/artists/{art['id']}/top-tracks",
                    headers=headers,
                    params={"market": "US"},
                    timeout=5,
                )
                if top_tracks.status_code == 200:
                    items = top_tracks.json().get("tracks", [])
                    for t in items:
                        dataset["tracks"].append(
                            {
                                "track_id": t["id"],
                                "track_name": t["name"],
                                "artist_id": art["id"],
                                "artist_name": art["name"],
                                "album": t.get("album", {}).get("name"),
                                "year": t.get("album", {}).get("release_date", "0000")[
                                    :4
                                ],
                                "source": "spotify",
                            }
                        )
                        tracks_agregados += 1
                        found_track = True
            except Exception as e:
                print(f"[WARN] Error Spotify tracks {art['name']}: {e}")

        if not found_track:
            try:
                yt_results = ytmusic.search(art["name"], filter="songs")
                if yt_results:
                    song = yt_results[0]
                    dataset["tracks"].append(
                        {
                            "track_id": song.get("videoId"),
                            "track_name": song.get("title"),
                            "artist_id": art["id"],
                            "artist_name": art["name"],
                            "album": song.get("album", {}).get("name"),
                            "year": None,
                            "source": "youtube",
                        }
                    )
                    print(f"      + 1 track agregado desde YouTube (fallback)")
            except Exception as e:
                print(f"[WARN] Error fallback YT for {art['name']}: {e}")
        print(f"   Total tracks acumulados: {len(dataset['tracks'])}")

        # Popularidad híbrida
        years = [
            int(t["year"])
            for t in dataset["tracks"]
            if t["artist_name"] == art["name"] and t.get("year") and t["year"].isdigit()
        ]
        first_year = min(years) if years else None
        art["popularity_hybrid"] = compute_popularity_hybrid(
            art.get("popularity", 0),
            art.get("listeners_lastfm", "0"),
            first_year,
        )

    # === 3. Filtrar mainstream ===
    dataset["artists"] = [a for a in all_artists if a["popularity_hybrid"] <= 100]

    print("\n>>> Dataset final listo")
    print(f"   Total artistas: {len(dataset['artists'])}")
    print(f"   Total tracks: {len(dataset['tracks'])}")

    return dataset


# == Funciones auxiliares ==


def get_app_token():
    response = requests.post(
        SPOTIFY_TOKEN_URL,
        data={"grant_type": "client_credentials"},
        auth=(CLIENT_ID, CLIENT_SECRET),
    )
    data = response.json()
    print(">>> App token response:", data)  # DEBUG
    return data.get("access_token")


# == Rutas ==


@app.route("/import_dataset_hybrid")
def import_dataset_hybrid():
    try:
        token = get_app_token()  # siempre Client Credentials
        dataset = import_dataset_logic(app_token=token)
        return jsonify(dataset)
    except Exception as e:
        print(f"[ERROR] import_dataset_hybrid: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/spotify_search_app/<genre>")
def spotify_search_app(genre):
    token = session.get("app_token") or get_app_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = requests.get(
        f"{SPOTIFY_API_BASE}/search",
        headers=headers,
        params={"q": f'genre:"{genre}"', "type": "artist", "limit": 20},
    )

    if res.status_code != 200:
        return jsonify({"error": res.json()}), res.status_code

    artists = res.json().get("artists", {}).get("items", [])
    emergentes = [
        {
            "id": a["id"],
            "name": a["name"],
            "popularity": a.get("popularity"),
            "followers": a.get("followers", {}).get("total", 0),
            "genres": a.get("genres", []),
        }
        for a in artists
        if a.get("popularity", 100) < 30
    ]

    return jsonify(emergentes)


@app.route("/show_token")
def show_token():
    user_id = session.get("user_id")
    print(">>> Session guardada:", session["user_id"])
    if not user_id:
        return "No hay usuario en sesión", 400

    user = User.query.get(user_id)
    return jsonify({"access_token": user.spotify_access_token})


@app.route("/spotify_emerging/<genre>")
def spotify_emerging(genre):
    token = get_app_token()
    headers = {"Authorization": f"Bearer {token}"}

    url = f"{SPOTIFY_API_BASE}/search"
    params = {"q": f'genre:"{genre}"', "type": "artist", "limit": 20}
    res = requests.get(url, headers=headers, params=params)

    if res.status_code != 200:
        return jsonify({"error": res.json()}), res.status_code

    data = res.json().get("artists", {}).get("items", [])
    # filtrar emergentes
    emergentes = [
        {
            "id": a["id"],
            "name": a["name"],
            "popularity": a.get("popularity"),
            "followers": a.get("followers", {}).get("total", 0),
            "genres": a.get("genres", []),
        }
        for a in data
        if a.get("popularity", 100) < 30
    ]

    return jsonify(emergentes)


@app.route("/")
def index():
    return "Bienvenido a miNoise 🎶 - <a href='/spotify_login'>Login con Spotify</a>"


@app.route("/spotify_login")
def spotify_login():
    scope = "user-read-email user-read-private playlist-read-private user-library-read user-top-read"
    auth_url = (
        f"{SPOTIFY_AUTH_URL}"
        f"?response_type=code"
        f"&client_id={CLIENT_ID}"
        f"&scope={scope}"
        f"&redirect_uri={REDIRECT_URI}"
    )
    print(">>> URL de login Spotify:", auth_url)
    return redirect(auth_url)


# Cerrar sesión
@app.route("/logout")
def logout():
    session.clear()  # limpia todo lo que guardaste en la sesión
    return redirect(url_for("index"))  # o a tu página de inicio


# == arranque ==
if __name__ == "__main__":
    app.run(debug=True)
