# librosa_test.py
import os
import librosa
import numpy as np
import yt_dlp

CACHE_DIR = "audio_cache"
os.makedirs(CACHE_DIR, exist_ok=True)


def download_audio(name, url):
    """Descarga audio de YouTube como WAV y lo guarda en audio_cache/"""
    safe_name = name.replace(" ", "_").lower()
    filename = os.path.join(CACHE_DIR, f"{safe_name}.wav")

    if os.path.exists(filename):
        print(f"[INFO] Ya existe {filename}, omitiendo descarga")
        return filename

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": filename,
        "postprocessors": [
            {  # convertir a WAV
                "key": "FFmpegExtractAudio",
                "preferredcodec": "wav",
                "preferredquality": "192",
            }
        ],
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    print(f"[OK] Descargado {filename}")
    return filename


def extract_features(audio_path):
    """Extrae features de audio usando librosa."""
    y, sr = librosa.load(audio_path, sr=22050, duration=30, mono=True)

    feats = {
        "zcr": float(np.mean(librosa.feature.zero_crossing_rate(y))),
        "rms": float(np.mean(librosa.feature.rms(y=y))),
        "centroid": float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))),
        "bandwidth": float(np.mean(librosa.feature.spectral_bandwidth(y=y, sr=sr))),
        "rolloff": float(np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr))),
        "mfcc": np.mean(librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13), axis=1).tolist(),
        "chroma": np.mean(librosa.feature.chroma_stft(y=y, sr=sr), axis=1).tolist(),
    }

    return feats


if __name__ == "__main__":
    # Ejemplo con Miles Davis - So What
    name = "so_what"
    url = "https://www.youtube.com/watch?v=zqNTltOGh5c"

    audio_path = download_audio(name, url)
    features = extract_features(audio_path)

    print("\n=== Features extraídos ===")
    for k, v in features.items():
        if isinstance(v, list):
            print(f"{k}: {len(v)} valores (ej: {v[:5]}...)")
        else:
            print(f"{k}: {v:.4f}")
