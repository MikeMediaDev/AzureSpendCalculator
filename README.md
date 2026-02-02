# Azure Spend Calculator

A full-stack Azure cost calculator for standalone Windows Server VMs with user profile storage on Azure NetApp Files.

## Features

- Calculate Azure costs based on concurrent users and workload type
- Support for US Azure regions
- VM sizing based on workload intensity (light/medium/heavy)
- Azure NetApp Files capacity planning
- 3-year reserved pricing with Hybrid Benefit
- Save and manage cost scenarios
- Export results to CSV

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL 16
- **Infrastructure:** Docker Compose

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- npm

## Getting Started

### 1. Start the Database

```bash
docker compose up -d
```

This starts PostgreSQL and automatically runs the init.sql schema.

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env.local` file (already provided with defaults):

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/azurespendcalc
```

### 4. Refresh Azure Prices

Before calculating costs, fetch current Azure prices:

```bash
curl -X POST http://localhost:3000/api/prices/refresh
```

Or start the dev server first and use the API.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with navigation
│   ├── page.tsx                # Calculator dashboard
│   ├── scenarios/
│   │   ├── page.tsx            # Scenario list
│   │   └── [id]/page.tsx       # Scenario detail
│   └── api/
│       ├── calculate/          # Cost calculation endpoint
│       ├── prices/             # Price management endpoints
│       └── scenarios/          # Scenario CRUD endpoints
├── components/
│   ├── Calculator.tsx          # Input form
│   ├── ResultsTable.tsx        # Cost breakdown display
│   ├── ScenarioList.tsx        # Saved scenarios list
│   └── ExportButton.tsx        # CSV export
├── lib/
│   ├── calculator.ts           # Core calculation logic
│   ├── azure-prices.ts         # Azure API client
│   ├── db.ts                   # Database operations
│   └── constants.ts            # Configuration values
└── types/
    └── index.ts                # TypeScript definitions
```

## API Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/api/prices` | GET | Get cached prices |
| `/api/prices/refresh` | POST | Refresh prices from Azure |
| `/api/calculate` | POST | Calculate costs |
| `/api/scenarios` | GET | List scenarios |
| `/api/scenarios` | POST | Create scenario |
| `/api/scenarios/[id]` | GET | Get scenario |
| `/api/scenarios/[id]` | PUT | Update scenario |
| `/api/scenarios/[id]` | DELETE | Delete scenario |
| `/api/scenarios/[id]/export` | GET | Export to CSV |

## Calculator Assumptions

- **VM:** Standard_D4as_v5 (4 vCPUs, 16 GB RAM)
- **Disk:** E10 Standard SSD (128 GiB) per VM
- **Reservation:** 3-year term
- **Hybrid Benefit:** Enabled (Windows license not included)
- **ANF Profile Size:** 5 GB per user

### User Density by Workload

| Workload | vCPU/User | Users/VM |
|----------|-----------|----------|
| Light    | 0.15      | ~26      |
| Medium   | 0.25      | 16       |
| Heavy    | 0.50      | 8        |

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
npm run typecheck # Run TypeScript type check
```

## License

MIT
