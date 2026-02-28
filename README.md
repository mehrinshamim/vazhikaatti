# Vazhikaatti 🌿
### *Navigate Smarter. Stay Safer.*

> A community-driven safety map that helps you discover nearby hazards, report issues, and make informed travel decisions in real time.
(Please view in mobile view)
---

## 🗺️ Project Description

**Vazhikaatti** (Malayalam for *"one who shows the way"*) is a community-powered public safety web platform that allows users to view real-time safety alerts around them, report local hazards, and plan safer routes based on crowd-sourced data. It acts as a live hyperlocal safety layer on top of city maps.

In cities, people face everyday risks — stray dogs, poor lighting, flooded roads, potholes — that are rarely reported officially in real time. Vazhikaatti bridges the gap between hazard occurrence and public awareness by turning every citizen into a safety contributor.

**Think:** Google Maps + Community Safety Alerts, focused purely on hyperlocal hazards and civic safety.

---

## ✨ Features

- 🗺️ **Live Hazard Map** — Interactive map powered by Leaflet.js and OpenStreetMap showing community-reported hazard markers in real time
- 📍 **Report an Issue** — Submit hazard reports with photo, description, category, severity, and GPS location
- 🧭 **Journey Mode** — Plan routes from point A to B and see hazard markers along your path via OpenRouteService API
- 🖼️ **AI Image Validation** — CLIP model (OpenAI) used for intelligent image validation of uploaded hazard photos
- ✏️ **My Reports** — View, edit, and delete your own submitted reports with a swipeable card interface


---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (TypeScript) |
| Backend | FastAPI (Python) |
| AI / ML | CLIP Model (OpenAI) |
| Map Rendering | Leaflet.js |
| Map Data | OpenStreetMap |
| Routing | OpenRouteService API |
| Auth | Google OAuth |
| Deployment | Vercel (frontend), Render (backend) |

---

## 📸 Screenshots
In [SCREENSHOTS.md](https://github.com/bonitoflakesorg/vazhikaatti/blob/main/SCREENSHOTS.md)

---

## 🎥 Demo Video

> 📹 [Watch Demo Video](https://drive.google.com/file/d/1-W5fl9lRgnHAFe1GFzuBqO2KyDyUqjZM/view?usp=drivesdk) 

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                   FRONTEND — Next.js 14 (TypeScript)             │
│                                                                  │
│  ┌─────────────┐   ┌──────────────┐   ┌───────────────────────┐ │
│  │  Map View   │   │ Report Form  │   │    Journey Mode       │ │
│  │ (Leaflet.js)│   │ (image +     │   │  (Route Planning UI)  │ │
│  │             │   │  metadata)   │   │                       │ │
│  └──────┬──────┘   └──────┬───────┘   └──────────┬────────────┘ │
│         │                 │                       │              │
│         ▼                 ▼                       ▼              │
│  ┌─────────────┐   ┌──────────────┐   ┌───────────────────────┐ │
│  │OpenStreetMap│   │   Supabase   │   │  OpenRouteService API │ │
│  │ (Map Tiles) │   │  JS Client   │   │  (Fetch 3 routes,     │ │
│  │             │   │              │   │   walking directions) │ │
│  └─────────────┘   └──────┬───────┘   └───────────────────────┘ │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │  (Auth + DB reads + Image upload)
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                           SUPABASE                               │
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │  Auth        │   │  Database    │   │   Storage            │ │
│  │  (Google     │   │  (Reports    │   │   (Hazard images     │ │
│  │   OAuth)     │   │   + Users)   │   │    uploaded by users)│ │
│  └──────────────┘   └──────────────┘   └──────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                            │
          (Image URL sent to backend for validation)
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND — FastAPI (Python)                    │
│                                                                  │
│   ┌────────────────────────────────────────────────────────────┐ │
│   │                  CLIP Model (OpenAI)                       │ │
│   │                                                            │ │
│   │  • Receives image URL from frontend                        │ │
│   │  • Validates image matches reported category               │ │
│   │    e.g. "stray dog" photo <-> "Stray Dogs" category        │ │
│   │  • Returns validation result -> frontend proceeds/rejects  │ │
│   └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow — Submitting a Report

```
User submits report
      │
      ├─ 1 ──▶ Image uploaded to Supabase Storage       (frontend)
      │
      ├─ 2 ──▶ Image URL + category sent to FastAPI     (frontend → backend)
      │             └─▶ CLIP model validates image matches category
      │             └─▶ Returns: { valid: true / false }
      │
      ├─ 3 ──▶ If valid → report saved to Supabase DB   (frontend)
      │
      └─ 4 ──▶ Map refreshes with new hazard marker     (Leaflet.js)
```

---


## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- pip

---

### Frontend (Next.js)

```bash
# Clone the repository
git clone https://github.com/bonitoflakesorg/vazhikaatti.git
cd vazhikaatti/client

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your keys to .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_ORS_API_KEY=your_openrouteservice_key
# NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# Start the development server
npm run dev
```

### Backend (FastAPI)

```bash
cd vazhikaatti/server

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Add your keys to .env:
# DATABASE_URL=your_db_url
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret

# Start the backend server
uvicorn app.main:app --reload
```

---

## ▶️ Run Commands

```bash
# Frontend
cd client && npm run dev        # http://localhost:3000

# Backend
cd server && uvicorn app.main:app --reload   # http://localhost:8000

# API Docs (auto-generated by FastAPI)
# http://localhost:8000/docs
```

---

## 👩‍💻 Team Members

| Name | Role | College |
|------|------|---------|
| Mehrin Fathima Shamim | Backend (FastAPI) + Auth | Government Model Engineering College, Thrikkakara |
| Diya Jojo | Frontend (Next.js) + Map Integration | Government Model Engineering College, Thrikkakara |


---

## 🎯 Target Audience

Daily commuters, students, women traveling alone, delivery drivers, elderly citizens, and urban residents who want safer, more informed travel.

---

## 🌍 Future Roadmap

- AI-based hazard clustering and heatmaps
- SMS alert system for high-severity zones
- Government / NGO dashboard integration
- Verified report badges
- Predictive risk zones using historical data

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

> Made with ❤️ at TinkerHub — *Tink-Her-Hack 4.0*
