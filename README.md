# Imaginity

> Type a word. Get a 3D model. Explore it in your browser.

Imaginity is a web app that lets you search for any object — `dog`, `car`, `spaceship` — and instantly renders an interactive 3D model of it in the browser, powered by the Sketchfab API and Three.js.

![Status](https://img.shields.io/badge/status-in%20development-orange)
![License](https://img.shields.io/badge/license-ISC-blue)

---

## ✨ Features

- 🔍 **Prompt-based 3D search** — type anything and get a matching 3D model
- 🧊 **Real-time 3D rendering** — powered by Three.js with orbit controls
- 🌌 **Animated space background** — rotating starfield scene
- ⚡ **Auto model caching** — downloaded models are cached locally so repeat searches are instant
- 📡 **LAN-ready** — works across devices on the same network

---

## 🛠 Tech Stack

| Layer    | Tech |
|----------|------|
| Frontend | Vanilla JS, Three.js, Vite |
| Backend  | Node.js, Express |
| 3D Data  | Sketchfab API (glTF models) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- A free [Sketchfab](https://sketchfab.com) account + API token

### 1. Clone the repo

```bash
git clone https://github.com/chiragmishraa/Imaginity.git
cd Imaginity
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
SKETCHFAB_TOKEN=your_sketchfab_api_token_here
```

> Get your token from: https://sketchfab.com/settings/password (scroll to API Token)

Start the backend:

```bash
node server.js
```

Backend runs on **http://localhost:3001**

### 3. Set up the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

---

## 📁 Project Structure

```
Imaginity/
├── backend/
│   ├── server.js          # Express API — searches & downloads models
│   ├── package.json
│   ├── .env               # ← your Sketchfab token (not committed)
│   └── public/
│       └── models/        # ← cached glTF models (not committed)
│
├── frontend/
│   ├── index.html         # Main UI
│   ├── src/
│   │   └── main.js        # Three.js scene, loader, controls
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🔧 How It Works

1. User types a prompt (e.g. `wolf`)
2. Frontend sends request to `GET /api/getModel?q=wolf`
3. Backend searches Sketchfab for a downloadable glTF model
4. Downloads and extracts the zip, caches it in `backend/public/models/`
5. Returns the local URL of the `.gltf` file
6. Frontend loads it with `GLTFLoader` and renders it in Three.js

---

## ⚠️ Current Status

This project is actively under development. Some features are still being built:

- [ ] AI-powered model generation
- [ ] Expanded model variety & better search ranking
- [ ] Camera, lighting & controls refinement
- [ ] UI polish & final design pass

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

---

## 📄 License

ISC © [Chirag Mishra](https://github.com/chiragmishraa)
