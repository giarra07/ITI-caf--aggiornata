# The ITI Café — Prompt per presentazione Genspark

> **Copia e incolla questo documento in Genspark** per generare slide, pitch deck o video demo dell'applicazione.

---

## Istruzione per l'AI (Genspark)

Crea una **presentazione professionale in italiano** (10–15 slide) per un progetto scolastico/universitario. Tono: **satirico ma tecnico**, stile cyberpunk/rasta-hacker. Target: docenti e compagni di classe. Evidenzia stack moderno, gameplay, autenticazione cloud e PWA. Includi screenshot mockup descritti testualmente dove utile.

---

## 1. Cos'è The ITI Café

**The ITI Café** è una **PWA (Progressive Web App)** — simulatore di gestione satirico ambientato all'**ITI Copernico**. Il giocatore interpreta uno studente che gestisce un'attività parallela nel campus: compra merce, risponde a richieste random su chat/missioni, accumula **CoperniCoin (CPN)**, evita il **sospetto** della preside e sopravvive a **giornate da 10 minuti**.

**Disclaimer:** contenuto ironico e fittizio, pensato come parodia del management game / darknet aesthetic — non promuove comportamenti reali.

---

## 2. Concept & USP

| Elemento | Descrizione |
|----------|-------------|
| **Genere** | Management sim + visual novel lite + minigame |
| **Estetica** | Terminale DOS/Matrix, pixel art, scanlines, font mono |
| **Audio** | *Three Little Birds* (Bob Marley) in loop + SFX 8-bit |
| **Economia** | CoperniCoin, stock, prezzi dinamici, eventi casuali |
| **Rischio** | Barra **sospetto** → raid preside → minigame drag-and-drop |
| **Persistenza** | Account cloud (Supabase) + fallback offline localStorage/IndexedDB |
| **Social** | Login/registrazione email, Google OAuth, GitHub OAuth |

---

## 3. Stack tecnologico

### Frontend
- **React 19** + **TypeScript**
- **TanStack Start / TanStack Router** — routing file-based, SSR-ready
- **TanStack React Query** — data fetching
- **Tailwind CSS v4** — design system utility-first
- **Vite 7** — bundler e dev server
- **Radix UI** + **Lucide React** — componenti accessibili e icone
- **Zod** + **React Hook Form** — validazione form

### Backend / Cloud
- **Supabase** (BaaS)
  - Auth (email/password, Google, GitHub)
  - PostgreSQL con **Row Level Security (RLS)**
  - Salvataggio partita in JSONB
  - Classifica globale

### Deploy & PWA
- **Service Worker** (`/sw.js`) — cache offline (disabilitato su localhost)
- Compatibile **Cloudflare Workers** (`@cloudflare/vite-plugin`)
- Asset audio locale: `public/audio/three-little-birds.mp3`

---

## 4. Architettura applicazione

```
┌─────────────────────────────────────────────────────────┐
│  Browser (PWA)                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ AuthContext │  │ GameContext  │  │ gamePrefs     │  │
│  │ (Supabase)  │◄─┤ reducer+save │──► localStorage │  │
│  └──────┬──────┘  └──────┬───────┘  │ IndexedDB     │  │
│         │                │          └───────────────┘  │
│         ▼                ▼                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Supabase: profiles · game_saves · leaderboard    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Flusso auth:**
1. Boot screen `/` → login/registrazione o codename offline
2. OAuth → redirect `/auth/callback` → sessione → `/dashboard`
3. `AuthGate` protegge le route se Supabase è configurato
4. Al login: `loadCloudSave(userId)` → hydrate GameState
5. Ogni modifica stato: debounce 1.2s → `saveCloudSave` + `upsertCloudLeaderboard`

---

## 5. Database Supabase (schema)

File: `supabase/schema.sql`

### Tabella `profiles`
| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | FK → auth.users |
| handle | text | Codename giocatore |
| created_at, updated_at | timestamptz | |

### Tabella `game_saves`
| Colonna | Tipo | Note |
|---------|------|------|
| user_id | uuid PK | FK → auth.users |
| state | jsonb | Intero `GameState` serializzato |
| updated_at | timestamptz | |

### Tabella `leaderboard`
| Colonna | Tipo | Note |
|---------|------|------|
| user_id | uuid PK | |
| handle | text | |
| total_earned | integer | CPN totali |
| days_survived | integer | Giorni sopravvissuti |
| total_sold | integer | Unità vendute |
| updated_at | timestamptz | |

**Sicurezza:** RLS attivo — ogni utente legge/scrive solo i propri save e profilo; la leaderboard è leggibile da tutti, scrivibile solo dal proprietario.

**Trigger:** `handle_new_user()` crea profilo automatico alla registrazione.

---

## 6. Schermate e navigazione

### Route principali
| Path | Nome | Funzione |
|------|------|----------|
| `/` | Boot / Login | Sequenza boot, auth email/OAuth, fallback offline |
| `/auth/callback` | OAuth callback | Scambio token Supabase |
| `/dashboard` | Term | Stats giornata, CPN, sospetto, eventi |
| `/shop` | Shop | Acquisto stock (Pizzini.exe, Compiti, erbe, gadget…) |
| `/chat` | Pizz | Chat clienti — ordini **random** (non legati allo stock) |
| `/inventory` | Stock | Inventario e quantità |
| `/missions` | Stats/Missions | Missioni con reward; toggle Class Simulation |
| `/minigame` | RAID | Minigame drag-and-drop nascondere merce |
| `/profile` | Profilo | Achievement + classifica (cloud o locale) |
| `/settings` | Impostazioni | Audio, difficoltà, export, logout, reset |
| `/game-over` | Game Over | Fine partita dopo raid fallito |

### Bottom navigation (5 tab)
`term` · `shop` · `pizz` · **stock** · `stats`

### Menu hamburger
Compiti, Settings, Help

---

## 7. Gameplay loop

1. **Giornata:** 10 minuti reali → nuovo giorno, eventi, difficoltà crescente
2. **Shop:** spendi CPN per rifornire inventario (prodotti satirici: erbe, pasticche, gadget)
3. **Chat & Missioni:** arrivano richieste **casuali** — il giocatore deve avere stock giusto
4. **Vendita:** checkout → guadagni CPN, aumenta sospetto in base al `risk` del prodotto
5. **Crisi:** sospetto ≥ 100 → **RAID** → redirect minigame
6. **Minigame RAID:** trascina pezzi di merce in 9 cassetti entro **14 secondi**
   - Successo → torna al dashboard, sospetto ridotto
   - Fallimento → game over
7. **Progressi:** salvati su account Supabase + backup locale

### Prodotti (esempi)
- Amnesia da Interrogazione, Prof's Kush, Math-Magic Molly
- Pizzini.exe, Compiti.zip, cartine, bong d'istituto…

### Modalità extra
- **Class Simulation:** +50% CPN, più sospetto
- **Difficoltà** e preferenze audio/notifiche/vibrazione in Settings

---

## 8. Autenticazione (implementazione reale)

| Metodo | Provider Supabase |
|--------|-------------------|
| Email + password | `signInWithPassword` / `signUp` |
| Google | OAuth 2.0 |
| GitHub | OAuth 2.0 |
| Offline | Codename locale (senza `.env`) |

**File chiave:**
- `src/auth/AuthContext.tsx` — sessione, sign-in/out, update handle
- `src/lib/supabase.ts` — client singleton, redirect URL
- `src/components/AuthGate.tsx` — guard route
- `src/routes/index.tsx` — UI login/registrazione
- `src/routes/auth.callback.tsx` — callback OAuth

**Variabili ambiente** (`.env.local`):
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## 9. Minigame Drag-and-Drop

- **Tecnologia:** HTML5 Drag and Drop API nativa (no librerie esterne)
- **Meccanica:** pool di pezzi → trascina in slot cassetti
- **Timer:** 14s, barra progresso visiva
- **Win condition:** tutti i pezzi nascosti prima del timeout
- **Integrazione:** `resolveRaid(true|false)` nel `GameContext`

File: `src/routes/minigame.tsx`

---

## 10. Audio & UX

- **BGM:** Three Little Birds — volume default **100%**, regolabile in Settings
- **SFX:** click, error Windows 7, vendita — toggle in preferenze
- **Tutorial overlay** al primo accesso
- **Day notifier** — avviso fine giornata
- **Crisis banner** — alert sospetto alto
- **RaidWatcher** — vibrazione (se abilitata) e redirect automatico al minigame
- **Breadcrumbs** e header terminale coerenti su tutte le pagine

---

## 11. Struttura cartelle progetto

```
building-our-app-together-main/
├── public/
│   ├── audio/three-little-birds.mp3
│   └── sw.js
├── src/
│   ├── auth/AuthContext.tsx
│   ├── components/     # UI condivisa (BottomNav, Tutorial, Music…)
│   ├── game/           # Logica core (GameContext, products, sales, cloud)
│   ├── lib/supabase.ts
│   └── routes/         # Pagine TanStack Router
├── supabase/schema.sql
├── .env.example
└── docs/GENSPARK_PRESENTAZIONE.md
```

---

## 12. Setup sviluppo

```bash
npm install
cp .env.example .env.local   # opzionale — abilita cloud
# Esegui supabase/schema.sql nel SQL Editor Supabase
npm run dev                    # http://localhost:5173
npm run build                  # build produzione
npm run lint                   # ESLint
```

**Supabase Dashboard:**
1. Authentication → Providers: Email, Google, GitHub
2. URL redirect: `http://localhost:5173/auth/callback` + dominio produzione

---

## 13. Messaggi chiave per la presentazione

1. **Progetto full-stack moderno** — React 19, TypeScript, Supabase, PWA
2. **Auth sociale vera** — non mock: OAuth Google/GitHub + email con persistenza cloud
3. **Game design completo** — economia, rischio, eventi, minigame interattivo
4. **Resilienza offline** — funziona anche senza backend configurato
5. **Identità visiva forte** — terminale hacker/rasta, coerente su ogni schermata
6. **Satira consapevole** — parodia del campus life, non endorsement di comportamenti illegali

---

## 14. Slide suggerite (outline Genspark)

1. **Titolo** — The ITI Café · PWA Management Sim
2. **Problema / Idea** — gamificare la "sopravvivenza" scolastica in chiave ironica
3. **Demo flow** — boot → login → dashboard → vendita → raid
4. **Stack** — diagramma frontend + Supabase
5. **Auth & Cloud Save** — schema DB + flusso utente
6. **Gameplay** — economia, sospetto, ordini random
7. **Minigame** — drag-and-drop RAID (GIF o mockup)
8. **UI/UX** — terminale, audio, PWA offline
9. **Sicurezza** — RLS Supabase, sessioni JWT
10. **Setup & Deploy** — env, schema SQL, Cloudflare
11. **Metriche / Achievement** — leaderboard globale
12. **Conclusioni** — cosa abbiamo imparato, roadmap futura
13. **Q&A**

---

## 15. Roadmap opzionale (future)

- Merge intelligente save locale ↔ cloud al primo login
- Touch-friendly drag on mobile (Pointer Events)
- Push notifications per eventi giornata
- Multiplayer / mercato studenti in tempo reale
- Localizzazione EN

---

## 16. One-liner per pitch (30 secondi)

> *"The ITI Café è una PWA satirica dove gestisci un impero parodico nel campus Copernico: compri stock, rispondi a clienti random su chat, eviti la preside con un minigame drag-and-drop, e salvi tutto sul tuo account Supabase — con login Google, GitHub o email. React 19, TypeScript, Tailwind, audio Bob Marley incluso."*

---

*Documento generato per The ITI Café — ITI Copernico · 2026*
