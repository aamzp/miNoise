from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

    # Campos Spotify
    spotify_access_token = db.Column(db.String(500), nullable=True)
    spotify_refresh_token = db.Column(db.String(500), nullable=True)


class Song(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    artist = db.Column(db.String(200), nullable=False)
    year = db.Column(db.Integer, nullable=True)
    genre = db.Column(db.String(100), nullable=True)

    # Metadatos Spotify
    spotify_id = db.Column(db.String(100), unique=True, nullable=True)
    tempo = db.Column(db.Float, nullable=True)
    energy = db.Column(db.Float, nullable=True)
    danceability = db.Column(db.Float, nullable=True)
    valence = db.Column(db.Float, nullable=True)
