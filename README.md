# KSP Crime Database AI Console
## Karnataka State Crime Records Bureau (SCRB)

An intelligent conversational AI platform built for the State Crime Records Bureau (SCRB) of Karnataka, enabling law enforcement investigators to query crime databases using natural language, discover network associations, detect risk hotspots, and generate confidential investigation logs.

---

## 🚀 Key Features

* **Sleek, High-Contrast Console**: Designed with clean, professional Apple HIG aesthetics utilizing dark base interfaces (`#0A0A0F`), translucent glassmorphic components, and dynamic transitions.
* **Dual-Engine NL-to-SQL Parsing**:
  * **Primary (Dynamic)**: HuggingFace Serverless Inference utilizing the Qwen2.5-Coder model to convert queries to SQLite commands.
  * **Fallback (Deterministic)**: 10ms local keyword-based semantic mapper to guarantee zero-latency offline performance.
* **Criminal Network Visualization**: Interactive Canvas-based spring force-directed graph to inspect associates, syndicate ties, and active threat clusters.
* **Proactive Warning Logs**: Real-time correlation tracking of socio-demographic indicators (literacy rates, unemployment rates, police patrol densities) to compute district risk levels.
* **Audit Trails & Security Controls**: Role-based access control (Investigator, Analyst, Administrator) with automated query logging and performance tracking.

---

## 🛠️ Architecture

```
Datathon-2026/
├── app/                  # Next.js App Router (Console pages & APIs)
│   ├── api/
│   │   ├── chat/        # NLP-to-SQL & Database Query Engine
│   │   └── predict/     # Risk hotspots & Early warning data
│   ├── globals.css      # CSS Design Tokens & Animations
│   └── page.js          # Unified Monitor Console
├── data/
│   └── ksp_crime.db     # Local SQLite database (seeded)
├── lib/
│   └── db.js            # SQLite connection helper
├── memory-bank/         # Active context mapping docs
└── scripts/
    └── seed.js          # Mock data seed script
```

---

## 📦 Getting Started

### Prerequisites
- Node.js `v20.x` or above

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/adityashirsatrao007/Datathon-2026.git
   cd Datathon-2026
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 📋 Security & Compliance Note
All operations, natural language requests, and generated SQL logs are strictly stored in the `audit_trail` table. Access level views are restricted based on credentials (selectable from the top console dropdown).
