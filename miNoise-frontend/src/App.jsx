import { useEffect, useState } from "react";
import Scene from "./Scene";

export default function App() {
  const [songs, setSongs] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verificar estado de login
  useEffect(() => {
    fetch("/api/spotify_status", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(">>> status recibido:", data);
        setLoggedIn(data.logged_in);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error verificando login:", err);
        setLoading(false);
      });
  }, []);

  // Si ya hay login, pedir dataset
  useEffect(() => {
    if (loggedIn) {
      fetch("/api/spotify_pca_dataset", {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(">>> Dataset recibido:", data);
          setSongs(data);
        })
        .catch((err) => console.error("Error cargando dataset:", err));
    }
  }, [loggedIn]);

  const loginSpotify = () => {
    window.location.href = "http://127.0.0.1:5000/spotify_login";
  };

  if (loading) return <p>Cargando…</p>;

  return (
    <div>
      <h1>miNoise 🎶</h1>
      {!loggedIn ? (
        <button onClick={loginSpotify}>Login con Spotify</button>
      ) : (
        <>
          <p>Cargadas {songs.length} canciones</p>
          <Scene songs={songs} />
        </>
      )}
    </div>
  );
}
