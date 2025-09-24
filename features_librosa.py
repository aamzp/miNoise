import os
import librosa


def extract_librosa_features(audio_path, delete_after=True):
    """Extrae features básicos con librosa y opcionalmente elimina el wav."""
    try:
        y, sr = librosa.load(audio_path, sr=22050, mono=True)

        features = {
            "zcr": float(librosa.feature.zero_crossing_rate(y).mean()),
            "rms": float(librosa.feature.rms(y=y).mean()),
            "centroid": float(librosa.feature.spectral_centroid(y=y, sr=sr).mean()),
            "bandwidth": float(librosa.feature.spectral_bandwidth(y=y, sr=sr).mean()),
            "rolloff": float(librosa.feature.spectral_rolloff(y=y, sr=sr).mean()),
            "mfcc": [
                float(x)
                for x in librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13).mean(axis=1)
            ],
            "chroma": [
                float(x) for x in librosa.feature.chroma_stft(y=y, sr=sr).mean(axis=1)
            ],
        }

        print(f"[OK] Features extraídos de {audio_path}")

        # 🔥 borrar el archivo después de procesar
        if delete_after:
            os.remove(audio_path)
            print(f"[INFO] Eliminado archivo temporal: {audio_path}")

        return features

    except Exception as e:
        print(f"[WARN] Error al extraer features con librosa: {e}")
        return None
