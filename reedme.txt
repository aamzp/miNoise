# 🎧 miNoise — Guía de instalación y ejecución

Repositorio experimental de análisis musical y detección de conceptos en texto y audio, desarrollado con **Flask**, **React/Vite**, y herramientas de IA como `librosa`, `transformers` y `ytmusicapi`.

---

## 🧩 Requisitos previos

Antes de comenzar, asegúrate de tener instalado:

- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js (LTS)](https://nodejs.org/es/download)
- [Git](https://git-scm.com/downloads)
- PostgreSQL (opcional, si usas base de datos real)

---

## ⚙️ Configuración inicial

### 1. Clonar el repositorio
```bash
git clone https://github.com/usuario/miNoise.git
cd miNoise
```

### 2. Crear y activar el entorno virtual

```
python -m venv .venv
.\.venv\Scripts\activate
```

### 3. Instalar dependencias del backend

```
pip install flask flask_sqlalchemy flask_migrate flask_cors flask_login \
flask_session python-dotenv psycopg[binary] ytmusicapi yt-dlp \
torch torchvision torchaudio transformers librosa soundfile scikit-learn numpy
```

### 4. Configurar variables de entorno

Crea un archivo .env en la raíz del proyecto con el siguiente contenido:

```
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=supersecreto
SQLALCHEMY_DATABASE_URI=sqlite:///minoise.db
```

## 🚀 Ejecutar el backend

Desde la carpeta raíz del proyecto, ejecuta:

```
flask run
```

💻 Ejecutar el frontend

### 1. Ir al directorio del frontend

```
cd miNoise-frontend
```

### 2. Instalar dependencias de Node

```
npm install
```

### 3. Ejecutar el servidor de desarrollo

```
npm run dev
```

## 🔁 Conectar frontend y backend

En el archivo vite.config.js, agrega un proxy para redirigir las peticiones de API al backend Flask:

```
export default {
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:5000',
    },
  },
};
```

## 🧱 Estructura general del proyecto

```
miNoise/
│
├── app.py                # Backend Flask principal
├── models.py             # Modelos SQLAlchemy
├── requirements.txt      # Dependencias Python
├── .env                  # Variables de entorno
│
├── miNoise-frontend/     # Frontend React + Vite
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│
└── README.md
```

