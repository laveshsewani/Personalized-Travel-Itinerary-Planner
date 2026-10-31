# System Architecture & Technical Specification

## 1. System Requirements & Hardware Guidelines

- **Processor**: Intel Core i5 (8th Gen or newer) / AMD Ryzen 5 (3000 series or newer) or Apple Silicon / Cloud vCPU (minimum 2 vCPU).
- **RAM**: Minimum 8 GB recommended (4 GB bare minimum for local dev).
- **Disk Space**: At least 2.5 GB free storage for monorepo code, node_modules, Python virtualenv, and build artifacts.
- **GPU**: Optional. The recommendation engine runs lightweight vector/rule scoring; heavy local transformers are not required.
- **Network**: Active broadband connection for Google Fonts, Leaflet tile servers (OpenStreetMap), Supabase Cloud, and LLM inference endpoints (Groq / Together / Gemini / OpenAI).

---

## 2. High-Level System Architecture

```mermaid
flowchart TD
    subgraph Client["Client (Browser / React SPA)"]
        UI["React 18 + Vite SPA"]
        State["State Management (Zustand / Context)"]
        Leaflet["Leaflet + OpenStreetMap"]
        AuthComp["Supabase Auth UI & Token Handler"]
    end

    subgraph CDN["Edge & Static Hosting"]
        Vercel["Vercel SPA Hosting (Edge CDN)"]
    end

    subgraph BackendApp["Backend (FastAPI on Render / Cloud)"]
        Router["FastAPI API Router (/api)"]
        RecEngine["Lightweight Recommendation Engine (ML/Rule-based)"]
        PromptEngine["Prompt Engineering & LLM Gateway"]
        AuthMiddleware["JWT / Supabase Auth Verifier"]
        Repo["Data Access Repository Layer"]
    end

    subgraph ExternalServices["External APIs & DB"]
        SupaDB[("Supabase PostgreSQL + RLS")]
        SupaAuth["Supabase Auth Service"]
        LLM["LLM APIs (Groq Llama-3 / Together / Gemini / OpenAI)"]
        MockLLM["Controlled Fallback Mock Generator"]
        OSMTiles["OpenStreetMap Tile Servers"]
    end

    Vercel --> UI
    UI --> State
    State --> Leaflet
    Leaflet --> OSMTiles
    UI -->|Auth operations with Anon Key| SupaAuth
    UI -->|Authenticated REST API Calls| Router

    Router --> AuthMiddleware
    AuthMiddleware --> SupaAuth
    Router --> RecEngine
    Router --> PromptEngine
    Router --> Repo

    Repo -->|Service-Role / PostgREST| SupaDB
    PromptEngine -->|If API Key configured| LLM
    PromptEngine -->|If no API Key configured| MockLLM
```

---

## 3. Data Flow: Itinerary Generation Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User as Traveler
    participant UI as React Frontend
    participant API as FastAPI Backend
    participant Rec as Recommendation Engine
    participant Prompt as Prompt Engineer
    participant LLM as Groq / Llama-3 API
    participant DB as Supabase PostgreSQL

    User->>UI: Selects destination, dates, budget, interests & style
    UI->>API: POST /api/recommendations (filters)
    API->>Rec: Score & rank attractions, stays, food, transport
    Rec-->>API: Top ranked items with scores
    API-->>UI: Recommendations preview
    
    User->>UI: Reviews & clicks "Generate Itinerary"
    UI->>API: POST /api/itineraries/generate (trip payload)
    API->>Rec: Fetch contextual attractions & logistical nodes
    Rec-->>API: Context payload
    API->>Prompt: Construct India-first system + user prompt with constraints
    Prompt->>LLM: Streamed or JSON-mode completion request
    alt LLM API succeeds
        LLM-->>Prompt: Raw JSON completion
    else LLM Fails or No Key Set
        Prompt-->>API: Controlled deterministic mock itinerary
    end
    API->>API: Pydantic v2 validation & budget constraint verify
    API->>DB: Persist trip, days, and itinerary items
    DB-->>API: Confirmation & IDs
    API-->>UI: Return full structured itinerary
    UI->>User: Renders Day timeline, breakdown, Leaflet map markers
```

---

## 4. Key Security & Operational Principles

1. **Defense-in-Depth RLS**: Row Level Security ensures users can only read, update, or delete trips they own or are members of.
2. **Secret Isolation**: Frontend only holds `VITE_SUPABASE_ANON_KEY`. Backend holds `SUPABASE_SERVICE_ROLE_KEY` and `LLM_API_KEY`.
3. **Graceful Fallbacks**: If external LLM keys are absent, system automatically falls back to an offline-capable mock generator with explanatory UI badges.
4. **Strict en-IN Financials**: INR (`₹`) formatting strictly standardized using `Intl.NumberFormat('en-IN')` without currency ambiguity.
