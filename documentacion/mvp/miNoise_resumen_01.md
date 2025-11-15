
# 🎶 miNoise – Resumen de avances

## 1. **Backend Flask – Login y Canciones**

### `models.py`
```python
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)

class Song(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    artist = db.Column(db.String(150), nullable=False)
    year = db.Column(db.Integer)
    genre = db.Column(db.String(100))
```

---

### `app.py`
```python
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_login import (
    LoginManager, login_user, logout_user,
    login_required, current_user
)
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Song

app = Flask(__name__)
app.config["SECRET_KEY"] = "clave-super-secreta"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"

db.init_app(app)

login_manager = LoginManager()
login_manager.login_view = "login"
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route("/")
def index():
    return "Bienvenido a miNoise 🎶"

# Registro
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        if User.query.filter_by(username=username).first():
            flash("Ese usuario ya existe ❌")
            return redirect(url_for("register"))

        hashed_pw = generate_password_hash(password, method="pbkdf2:sha256")
        new_user = User(username=username, password=hashed_pw)
        db.session.add(new_user)
        db.session.commit()

        flash("Usuario creado con éxito 🎉")
        return redirect(url_for("login"))

    return render_template("register.html")

# Login
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for("dashboard"))
        else:
            flash("Usuario o contraseña incorrectos ❌")
            return redirect(url_for("login"))

    return render_template("login.html")

# Dashboard
@app.route("/dashboard")
@login_required
def dashboard():
    all_songs = Song.query.all()
    return render_template("dashboard.html", songs=all_songs)

# Logout
@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))

# Seed de canciones
@app.route("/seed_songs")
def seed_songs():
    demo_songs = [
        Song(title="Song A", artist="Artist 1", year=2001, genre="Rock"),
        Song(title="Song B", artist="Artist 2", year=2005, genre="Pop"),
        Song(title="Song C", artist="Artist 3", year=2010, genre="Indie"),
    ]
    db.session.add_all(demo_songs)
    db.session.commit()
    return "Canciones de prueba agregadas ✅"

# Exportar canciones a JSON
@app.route("/export_songs")
def export_songs():
    all_songs = Song.query.all()
    songs_data = [
        {"id": s.id, "title": s.title, "artist": s.artist,
         "year": s.year, "genre": s.genre}
        for s in all_songs
    ]
    import json
    with open("songs_export.json", "w", encoding="utf-8") as f:
        json.dump(songs_data, f, ensure_ascii=False, indent=2)
    return "Archivo songs_export.json creado ✅"

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
```

---

## 2. **Google Colab – PCA**

### Cargar JSON y aplicar PCA
```python
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt

# Cargar canciones exportadas
df = pd.read_json("songs_export.json")

# Simular features extra (para 3D)
import numpy as np
df["tempo"] = np.random.randint(80, 160, size=len(df))
df["energy"] = np.random.rand(len(df))
df["danceability"] = np.random.rand(len(df))

# Escalar
X = df[["year", "tempo", "energy", "danceability"]].fillna(0)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# PCA en 3D
pca = PCA(n_components=3)
pca_result = pca.fit_transform(X_scaled)

df["PC1"] = pca_result[:, 0]
df["PC2"] = pca_result[:, 1]
df["PC3"] = pca_result[:, 2]

# Guardar JSON con coordenadas
df_coords = df[["title", "artist", "year", "genre", "PC1", "PC2", "PC3"]]
df_coords.to_json("songs_pca.json", orient="records", indent=2)
```

---

## 3. **Frontend React – React Three Fiber**

### `App.jsx`
```jsx
import { useEffect, useState } from "react";
import Scene from "./Scene";

function App() {
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    fetch("/songs_pca.json")
      .then((res) => res.json())
      .then((data) => setSongs(data));
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Scene songs={songs} />
    </div>
  );
}

export default App;
```

---

### `Scene.jsx`
```jsx
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Html } from "@react-three/drei";
import { useState, useRef } from "react";

export default function Scene({ songs }) {
  const [selectedSong, setSelectedSong] = useState(null);

  // Calcular centroide
  const center = songs.length > 0
    ? [
        songs.reduce((sum, s) => sum + s.PC1, 0) / songs.length,
        songs.reduce((sum, s) => sum + s.PC2, 0) / songs.length,
        songs.reduce((sum, s) => sum + s.PC3, 0) / songs.length,
      ]
    : [0, 0, 0];

  // Texto siempre mirando a la cámara
  function BillboardText({ children, position, color }) {
    const ref = useRef();
    useFrame(({ camera }) => {
      if (ref.current) {
        ref.current.lookAt(camera.position);
      }
    });

    return (
      <group ref={ref} position={position}>
        <Text fontSize={0.2} color={color} anchorX="center" anchorY="middle">
          {children}
        </Text>
      </group>
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 5] }}
      onPointerMissed={() => setSelectedSong(null)} // click fuera → deseleccionar
    >
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls
        enableZoom={true}
        autoRotate={selectedSong === null} // gira solo si no hay selección
        autoRotateSpeed={1.0}
        target={center}
      />

      {songs.map((song, i) => (
        <group
          key={i}
          position={[song.PC1, song.PC2, song.PC3]}
          onClick={() => setSelectedSong(song)}
        >
          <BillboardText
            position={[song.PC1, song.PC2, song.PC3]}
            color={selectedSong === song ? "cyan" : "hotpink"}
          >
            {song.title}
          </BillboardText>

          {/* Tooltip retro */}
          {selectedSong === song && (
            <Html
              center
              style={{
                background: "black",
                color: "lime",
                padding: "5px",
                borderRadius: "5px",
                fontSize: "12px",
              }}
            >
              <div>
                <strong>{song.title}</strong><br />
                {song.artist}<br />
                {song.genre} – {song.year}
              </div>
            </Html>
          )}
        </group>
      ))}
    </Canvas>
  );
}
```
