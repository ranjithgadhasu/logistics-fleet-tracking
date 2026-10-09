# FleetOps: Logistics & Fleet Tracking Platform

FleetOps is a frontend app for running day-to-day logistics. It manages **vehicles, drivers, shipments and deliveries**, and includes a **live tracking map**, **advanced search and filters**, and **automatic alerts**.

It's built with **React.js (JavaScript/JSX)**, **Tailwind CSS** and **React Router**. Vite is the build tool, Zustand handles state, Recharts draws the charts and Leaflet draws the maps. It works on desktop, tablet and mobile.

> **No TypeScript.** All application code is plain JavaScript (`.js` / `.jsx`). Data shapes are documented with JSDoc in `src/types/models.js`.
>
> **No backend needed.** A small mock API runs in the browser. It simulates network delay, errors, side effects (such as notifications) and live GPS updates. Set one environment variable to use a real REST API instead.

---

## 📑 Table of contents

1. [Requirements checklist](#-requirements-checklist)
2. [Tech stack and dependencies](#-tech-stack-and-dependencies)
3. [Getting started](#-getting-started)
4. [Configuration files](#-configuration-files)
5. [Folder structure](#-folder-structure)
6. [Architecture](#-architecture)
7. [Responsive behaviour](#-responsive-behaviour)
8. [Demo tools](#-demo-tools)
9. [Connecting a real backend](#-connecting-a-real-backend)
10. [Troubleshooting](#-troubleshooting)

---

## ✅ Requirements checklist

| # | Requirement | What's included | Where |
|---|-------------|-----------------|-------|
| 1 | **Dashboard** | Totals for vehicles, drivers and active shipments · delivered / in-transit / delayed / pending cards · 14-day delivery performance chart and on-time rate · shipment status chart · fleet performance (status split, utilisation, average fuel, services due, distance) · active alerts · recent activity · small live map · top drivers | `/` → `src/pages/DashboardPage.jsx`, `src/features/dashboard/` |
| 2 | **Vehicle management** | Add, edit and remove vehicles (validated form) · status · driver assignment · fuel level and maintenance info ("Mark as serviced") · specs · current location / live trip map · trip history · activity timeline | `/vehicles`, `/vehicles/:id` |
| 3 | **Driver management** | Driver profiles · availability/status · assigned vehicle · delivery history table · performance metrics (deliveries, on-time %, rating, score, weekly chart) · license expiry warning | `/drivers`, `/drivers/:id` |
| 4 | **Shipment management** | Create, edit and delete · shipment ID and customer details · pickup and delivery locations · driver and vehicle assignment · status workflow with notes · progress stepper · full history timeline | `/shipments`, `/shipments/:id` |
| 5 | **Tracking** | Interactive Leaflet map · vehicle markers coloured by status · route split into travelled (solid) and remaining (dashed) · pickup **A** and delivery **B** pins · ETA, remaining km and drive time · positions update every 8 seconds | `/tracking` |
| 6 | **Search & filters** | Filters for **vehicle, driver, shipment, status, date range and location** on every list page · filters are saved in the URL so views can be shared · global search with **Ctrl/⌘ + K** | All list pages + top bar |
| 7 | **Notifications & alerts** | Delayed shipment alerts · maintenance and low-fuel alerts · delivery updates · driver status changes · unread badge · dropdown from the bell · full page with filters · mark as read, delete, clear all | `/notifications` + bell icon |

### Technical requirements

| Requirement | How it's met |
|-------------|--------------|
| **React.js** | React 19 with function components and hooks, written in `.jsx` |
| **Tailwind CSS** | Tailwind v4 via `@tailwindcss/vite`, with a `tailwind.config.js` for theme and content |
| **React Router** | Nested layout route, URL params (`/vehicles/:id`), query-string filters, 404 route |
| **Reusable components** | `src/components/ui/`: Button, Card, Badge, Modal, ConfirmDialog, Field/Input/Select, DataTable, Pagination, Tabs, StatCard, EmptyState, ErrorState, Skeleton, Toaster… |
| **API integration structure** | `api/client.js` → `api/endpoints.js` → `api/services/*` → `store/` |
| **Form validation** | Custom `useForm` hook plus composable rules in `utils/validators.js` (required, email, phone, pattern, number range, date-after, not-equal, vehicle capacity check) |
| **Loading / error / empty states** | `DataBoundary` (skeleton → error with retry → content), empty states for "no data" and "no filter results", loading spinners on buttons and forms |
| **Responsive design** | Mobile-first Tailwind; sidebar slides in on phones; tables become cards; modals open from the bottom of the screen on phones |
| **State management** | Zustand stores (`fleetStore`, `uiStore`) plus memoised selectors |
| **Scalable folder structure** | Split by layer and by feature (see below) |

---

## 🧰 Tech stack and dependencies

### Runtime dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 19.2.x | UI library |
| `react-dom` | 19.2.x | DOM renderer |
| `react-router-dom` | ^7.x | Client-side routing |
| `zustand` | ^5.x | Global state management |
| `recharts` | ^3.x | Charts (area, pie, bar) |
| `leaflet` | ^1.9.x | Interactive maps |
| `lucide-react` | latest | Icons |
| `clsx` | 2.1.x | Conditional class names |
| `tailwind-merge` | 3.4.x | Resolves conflicting Tailwind classes |

### Dev dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | 7.x | Dev server and bundler |
| `@vitejs/plugin-react` | 5.x | JSX transform and fast refresh |
| `tailwindcss` | 4.1.x | Utility-first CSS framework |
| `@tailwindcss/vite` | 4.1.x | Tailwind integration for Vite |
| `vite-plugin-singlefile` | 2.x | *(optional)* Inlines the build into one `index.html` |

### Install everything from scratch

```bash
# runtime
npm install react react-dom react-router-dom zustand recharts leaflet lucide-react clsx tailwind-merge

# dev
npm install -D vite @vitejs/plugin-react tailwindcss @tailwindcss/vite
```

---

## 🚀 Getting started

### Prerequisites

- **Node.js 18 or newer** (20 LTS recommended). Check with `node -v`.
- **npm 9 or newer**. Check with `npm -v`.

### Steps

```bash
# 1. Go into the project folder
cd fleetops

# 2. Install dependencies
npm install

# 3. (optional) create your env file
cp .env.example .env

# 4. Start the dev server: http://localhost:5173
npm run dev

# 5. Build for production (output goes to /dist)
npm run build

# 6. Preview the production build locally
npm run preview
```

On first load, a realistic demo dataset is generated and saved in `localStorage`. Nothing else needs to be set up.

### npm scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Starts the dev server with hot reload |
| `build` | `vite build` | Production build into `dist/` |
| `preview` | `vite preview` | Serves the production build locally |

---

## ⚙️ Configuration files

### `package.json`

```json
{
  "name": "fleetops",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "clsx": "2.1.1",
    "leaflet": "^1.9.4",
    "lucide-react": "^1.52.0",
    "react": "19.2.6",
    "react-dom": "19.2.6",
    "react-router-dom": "^7.18.4",
    "recharts": "^3.10.1",
    "tailwind-merge": "3.4.0",
    "zustand": "^5.0.15"
  },
  "devDependencies": {
    "@tailwindcss/vite": "4.1.17",
    "@vitejs/plugin-react": "5.1.1",
    "tailwindcss": "4.1.17",
    "vite": "7.3.2"
  }
}
```

✅ No `typescript`, no `@types/*`. This is the same file as `pure-js-setup/package.json`.

### `vite.config.js`

```js
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // lets you write: import { Button } from "@/components/ui"
    },
  },
});
```

### `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
```

### `src/index.css` (Tailwind entry)

```css
@import "tailwindcss";
@config "../tailwind.config.js";
```

Tailwind v4 needs **no `postcss.config.js`**, because the `@tailwindcss/vite` plugin handles everything.

### `jsconfig.json` (editor support for the `@/` alias)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "jsx": "react-jsx",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"]
}
```

### `.env`

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | *(empty)* | Base URL of your REST API, e.g. `https://api.example.com/v1`. **If empty, the built-in mock API is used.** |

### 🧹 Make the project 100% JavaScript (remove `typescript`)

The online editor this project was built in manages `package.json` and `vite.config.ts` itself, so they still list `"typescript": "5.9.3"` and some `@types/*` packages. **No application code uses them.** Clean versions of both files are in **`pure-js-setup/`**. Run one command after downloading the project:

```bash
node scripts/make-pure-js.mjs     # swaps in the pure-JS package.json + vite.config.js, deletes vite.config.ts
rm -rf node_modules package-lock.json
npm install
npm run dev
```

Or do it by hand:

1. Copy `pure-js-setup/package.json` to the project root and overwrite the existing one.
2. Copy `pure-js-setup/vite.config.js` to the project root.
3. Delete `vite.config.ts`.
4. Run `npm install`.

After this, the project has **no TypeScript anywhere**. It has no `.ts` / `.tsx` files, no `tsconfig.json`, and no `typescript` or `@types/*` packages.

---

## 🗂 Folder structure

```
fleetops/
├── index.html                 # HTML entry, loads /src/main.jsx
├── tailwind.config.js         # Tailwind theme and content paths
├── jsconfig.json              # "@/..." path alias for editors
├── vite.config.js             # Vite + React + Tailwind plugins, "@" alias
├── .env.example               # Environment variable template
├── package.json               # React + Tailwind dependencies (no TypeScript)
├── pure-js-setup/             # Clean pure-JS package.json + vite.config.js
├── scripts/make-pure-js.mjs   # One-command switch to the pure-JS setup
└── src/
    ├── main.jsx               # React root
    ├── App.jsx                # Route definitions
    ├── index.css              # Tailwind import, animations, map marker styles
    │
    ├── api/                   # Everything that talks to "the server"
    │   ├── client.js          # fetch wrapper (http), ApiError, mockRequest, dev settings
    │   ├── endpoints.js       # REST endpoint map
    │   ├── index.js           # Public API exports + systemService
    │   ├── services/          # One service per resource (mock ↔ real switch)
    │   │   ├── vehicleService.js
    │   │   ├── driverService.js
    │   │   ├── shipmentService.js
    │   │   └── notificationService.js
    │   └── mock/              # In-browser mock backend
    │       ├── seed.js        # Demo data generator (same data every reset)
    │       ├── db.js          # Database saved in localStorage
    │       └── handlers.js    # Business rules: assignments, status flow, alerts, GPS tick
    │
    ├── components/
    │   ├── ui/                # Reusable building blocks (Button, Card, Modal, DataTable…)
    │   ├── layout/            # AppLayout, Sidebar, Topbar, GlobalSearch, NotificationBell
    │   ├── filters/           # FilterBar, FilterSelect, FilterDate
    │   └── map/               # FleetMap (Leaflet wrapper)
    │
    ├── features/              # Feature-specific components
    │   ├── dashboard/         # Charts.jsx, Panels.jsx
    │   ├── vehicles/          # VehicleFormModal.jsx, ServiceBadge.jsx
    │   ├── drivers/           # DriverFormModal.jsx
    │   ├── shipments/         # ShipmentFormModal.jsx, ShipmentStatusParts.jsx
    │   ├── tracking/          # mapData.js (markers, routes, ETA helpers)
    │   ├── notifications/     # NotificationItem.jsx
    │   └── activity/          # ActivityFeed.jsx
    │
    ├── pages/                 # One file per route
    │   ├── DashboardPage.jsx
    │   ├── VehiclesPage.jsx      VehicleDetailPage.jsx
    │   ├── DriversPage.jsx       DriverDetailPage.jsx
    │   ├── ShipmentsPage.jsx     ShipmentDetailPage.jsx
    │   ├── TrackingPage.jsx
    │   ├── NotificationsPage.jsx
    │   └── NotFoundPage.jsx
    │
    ├── hooks/                 # useForm, useUrlFilters, usePagination, useDebounce, useDocumentTitle
    ├── store/                 # fleetStore.js (data), uiStore.js (sidebar/toasts), selectors.js
    ├── constants/             # Status labels/colours, cities, thresholds
    ├── types/                 # models.js: JSDoc data shapes (documentation only)
    └── utils/                 # format.js, geo.js, validators.js, cn.js
```

---

## 🏗 Architecture

```
  Page / Component
        │ uses
        ▼
  Zustand store (fleetStore) ───► selectors (dashboard stats, driver metrics)
        │ calls
        ▼
  Services (vehicleService, …)
        │
        ├── VITE_API_URL empty ──► mockRequest() ──► mock/handlers.js ──► localStorage
        └── VITE_API_URL set   ──► http (fetch)  ──► your REST API
```

- **Pages never call the API directly.** They call store actions such as `createVehicle()` or `updateShipmentStatus()`.
- After each change, the store **refreshes the related data**, because the server may have changed other records too (driver ↔ vehicle links, new notifications). It also shows a success or error toast.
- **Business rules live in the "backend"** (`mock/handlers.js`), as they would in production:
  - Assigning a driver keeps the vehicle and driver records in sync.
  - Vehicles and drivers on a live trip can't be deleted (409 response).
  - Status changes update the vehicle and driver state and create notifications.
  - A GPS "tick" moves trucks along their routes, marks late shipments as delayed, completes deliveries, and starts assigned shipments when their pickup time arrives.

---

## 📱 Responsive behaviour

| Breakpoint | Behaviour |
|------------|-----------|
| **Mobile** (< 640px) | Sidebar slides in from the left · search opens full-width · tables become cards · filters behind a "Filters" button · forms open from the bottom of the screen · tracking map above the vehicle list |
| **Tablet** (640–1024px) | Two-column grids · table view from 768px · collapsible filters |
| **Desktop** (≥ 1024px) | Fixed sidebar · all filters shown inline · extra table columns from 1280px · tracking list and map side by side |

---

## 🧪 Demo tools

In mock mode, the sidebar has a **Demo tools** section:

- **Simulate API errors**: every request fails, so you can see error screens, retry buttons and error toasts.
- **Reset demo data**: restores the original dataset.

Things to try:

- Open **Live Tracking** and click a vehicle. The map zooms to its route and shows the ETA.
- Create a shipment and pick a driver. Their vehicle fills in automatically, and the weight is checked against the vehicle's capacity.
- Move a shipment to **Delayed**. A critical alert appears in the bell menu and on the dashboard.
- Filter a list, then copy the URL. The filters are saved in it.

---

## 🔌 Connecting a real backend

1. Set `VITE_API_URL` in `.env`.
2. Provide the endpoints listed in `src/api/endpoints.js` (`GET/POST /vehicles`, `PATCH/DELETE /vehicles/:id`, `POST /shipments/:id/status`, …).
3. Return JSON in the shapes described in `src/types/models.js`.
4. Auth: the client sends `Authorization: Bearer <token>` if `localStorage["fleetops.token"]` is set.
5. For live GPS, replace `shipmentService.tick` with a WebSocket or SSE subscription that calls `useFleetStore.getState().refresh()`.

---

## 🛠 Troubleshooting

| Problem | Fix |
|---------|-----|
| Map tiles don't load | The map needs internet access to download tiles from CARTO/OpenStreetMap |
| Data looks old or broken | Use **Reset demo data** in the sidebar, or clear the site's `localStorage` |
| `@/…` imports show red in the editor | Make sure `jsconfig.json` is in the project root and restart the editor |
| Links contain `#/` | The app uses `HashRouter` so it works on any static host. Switch to `BrowserRouter` in `src/App.jsx` if your host supports SPA fallbacks |

---

## ⚠️ Known limitations

- Routes are drawn as smooth curves between cities, not real roads. Distances are straight-line distance × 1.22.
- Pickup and delivery locations are chosen from 26 preset US cities.
- In mock mode, data lives in each browser's `localStorage` and isn't shared between users.

---

## 📄 License

MIT. Free to use for learning and as a starting point for your own projects.
