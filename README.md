# Finest Diners — Frontend

The customer-facing web app for **Finest Diners**, a restaurant food-delivery platform. Customers browse a live menu, build a cart, check out with GPS-based delivery, and track orders in real time.

Built with **React 19 + Vite 8 + Tailwind CSS 4**, animated with **Framer Motion**, and talking to a Node/Express backend over **REST** (Axios) and **Socket.IO**.

## What This Application Does

Finest Diners is a full-featured food delivery platform that connects customers with restaurants. The frontend application provides:

### Customer Experience
- **Browse Restaurants**: View featured restaurants and their menus with rich media (hero videos, food images)
- **Menu Exploration**: Filter food by categories, view detailed item information, and add items to cart
- **Cart Management**: Real-time cart updates with quantity controls, price calculations, and restaurant mixing prevention
- **GPS-Based Checkout**: Automatic location detection using browser geolocation, reverse-geocoded to readable addresses
- **Payment Processing**: Multiple payment methods (Card, Apple Pay, Cash on Delivery) with Paystack integration
- **Order Tracking**: Real-time order status updates and live GPS tracking of delivery drivers
- **Account Management**: User registration, login, and order history

### Technical Features
- **Real-Time Communication**: Socket.IO integration for live order updates and driver location tracking
- **Geolocation Services**: Browser GPS API for customer location, backend reverse-geocoding via OpenCage API
- **Responsive Design**: Mobile-first approach with adaptive layouts for all screen sizes
- **Performance Optimizations**: Request caching, lazy loading, and optimized asset delivery
- **Security**: JWT authentication, protected routes, and secure API communication

---

## Tech Stack

| Layer         | Technology                                        |
| ------------- | ------------------------------------------------- |
| Framework     | React 19, Vite 8                                  |
| Styling       | Tailwind CSS 4 (via `@tailwindcss/vite`)          |
| Routing       | React Router 7                                    |
| Animation     | Framer Motion                                     |
| HTTP          | Axios                                             |
| Realtime      | Socket.IO Client                                  |
| Icons         | lucide-react                                      |
| Carousels     | Swiper                                            |
| Utilities     | Three.js, Leaflet (installed; map UI is simulated)|

---

## Getting Started

### Prerequisites

- Node.js 18+ (Vite 8)
- A running backend (see the `finest-diners-backend` repo) reachable at `VITE_API_URL`
- A seeded restaurant `_id` for `VITE_RESTAURANT_ID`

### Environment variables

Copy `.env.example` to `.env` and fill in your values:

```
# Your backend URL (REST API is mounted under /api)
VITE_API_URL=https://your-backend.up.railway.app/api

# MongoDB _id of the restaurant document you seeded
VITE_RESTAURANT_ID=your_restaurant_id_here
```

> `VITE_API_URL` is **required** — the app throws at startup if it is missing.
> `VITE_SOCKET_URL` is optional; the Socket.IO client derives its URL from `VITE_API_URL` by stripping the trailing `/api`.

### Install & run

```bash
npm install
npm run dev        # start the dev server with HMR
npm run build      # production build into dist/
npm run preview    # preview the production build
```

### Scripts

| Script            | Purpose                                                            |
| ----------------- | ------------------------------------------------------------------ |
| `npm run dev`     | Start the Vite dev server                                           |
| `npm run build`   | Production build                                                    |
| `npm run preview` | Preview the production build locally                                |
| `npm run lint`    | ESLint (`eslint .`)                                                 |
| `npm run build:videos` | Re-encode the scroll-scrubbed hero videos with ffmpeg (see below) |

---

## Project Structure

```
finest-diners/
├── public/                 # Static assets (hero-food.mp4, menu-hero.mp4, favicon)
├── scripts/
│   └── build-hero-videos.mjs   # ffmpeg encoding of the scrubbed hero videos
├── src/
│   ├── App.jsx             # Router, providers, layout, floating cart button
│   ├── main.jsx            # React entry point
│   ├── index.css           # Tailwind + global styles
│   ├── assets/             # Images, background vectors, hero video frames
│   ├── components/         # Reusable UI (header, footer, FoodCard, cart drawer…)
│   ├── context/            # AuthContext, CartContext
│   ├── hooks/              # useGeolocation, useLiveTracking, useOrderLiveLocation
│   ├── pages/              # Route pages (Home, Menu, Checkout, Orders…)
│   ├── services/           # api.js (Axios), socket.js (Socket.IO)
│   ├── theme/              # Shared brand tokens (brand.js)
│   └── utils/              # mapPlaceholder.js (simulated-map math)
├── index.html
├── vite.config.js          # React + Tailwind plugins
└── package.json
```

---

## Routes

| Path                 | Page             | Protected |
| -------------------- | ---------------- | --------- |
| `/`                  | Home             | –         |
| `/menu/:restaurantId`| Menu             | –         |
| `/about`             | About            | –         |
| `/login`             | Sign in          | –         |
| `/register`          | Create account   | –         |
| `/checkout`          | Checkout         | Yes       |
| `/orders`            | My orders        | Yes       |
| `/orders/:id`        | Order tracking   | Yes       |

Protected routes redirect to `/login` when unauthenticated (`ProtectedRoute`).

---

## Key Features

### Home
Scroll-scrubbed hero video (`public/hero-food.mp4` — an all-keyframe H.264 file encoded by `build-hero-videos.mjs` so frames scrub smoothly and decode on the GPU), category chips, featured "subscription" banners, a product grid, a white brand-pillars section, and an animated burger-ad strip.

### Menu
A 250vh sticky hero whose `menu-hero.mp4` is scrubbed by scroll position (frame-quantized seeks), plus category filtering and a responsive food grid.

### Cart
- `CartContext` keeps items keyed by `spoonacularId`, tracks quantity and totals, and prevents mixing items from two restaurants.
- A draggable floating cart button (bottom-right) opens the slide-in `CartPopup` drawer.
- Checkout is gated on login.

### Checkout
- Auto-fetches the customer's GPS location on mount.
- Reverse-geocodes the coordinates into a readable address via the backend (`/location/reverse`, powered by OpenCage).
- Payment methods: Card / Apple Pay / Cash on Delivery.
- Totals: items + flat `$5.00` delivery fee + 7.5% VAT.
- Places the order and initializes card payment for non-COD orders.

### Live tracking
- **Customer side** (`useLiveTracking`): while an order is active (`pending` → `out_for_delivery`), the customer's GPS is streamed into the order's Socket.IO room (throttled to once every 3s).
- **Driver side** (`DriverOrderTracking` + `useOrderLiveLocation`): joins the room as a read-only listener and renders the customer's position as a pin on a simulated map (`utils/mapPlaceholder.js`), with stale-location detection.

### Authentication
JWT stored in `localStorage`, attached to every request as a `Bearer` token. A 401 response clears the session and redirects to `/login`.

---

## Hero video build (optional)

The two scroll-scrubbed heroes (`hero-food.mp4`, `menu-hero.mp4`) are pre-encoded assets. To rebuild them from source frames:

```bash
npm run build:videos
```

This requires the `ffmpeg-static` dev dependency and the source material:
- `src/assets/foodframes/ezgif-frame-%03d.jpg` → `public/hero-food.mp4` (all-keyframe, 1080p, `-g 1`)
- `public/Hand_navigating_food_delivery_app_*.mp4` → `public/menu-hero.mp4` (tight 0.5s keyframes, faststart)

---

## Deployment

Build the app and serve `dist/` from any static host (Vercel / Netlify / Railway static). Set `VITE_API_URL` and `VITE_RESTAURANT_ID` in the host's environment variables at build time. See the backend repo's `render.yaml` for the API deployment.
