# CargoFlow — app

Customer booking portal, depot floor tools and admin panel.

**React 19 · Vite 6 · React Router 7 · TypeScript · Tailwind 4**

A plain React single-page app. No framework beyond React itself.

---

## Run it

The app needs the API. Start that first:

```bash
cd ../cargoflow-shipment-management-system-backend
npm install && npm run dev          # http://localhost:4000
```

Then here:

```bash
npm install
npm run dev                          # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Typecheck, then bundle to `dist/` |
| `npm run preview` | Serve the production bundle locally |
| `npm run typecheck` | `tsc --noEmit` |

Port 3000 is deliberate — the API's CORS allowlist and the session cookie are
both set up for that origin, so the backend needs no change.
`VITE_API_URL` in `.env.local` points at the API.

## Routes

| Route | Surface | What it is |
| --- | --- | --- |
| `/` | Customer | Landing page with a live price calculator |
| `/book` | Customer | Booking wizard — boxes, both parties, price, submit |
| `/track?id=…` | Customer | Public tracking — accepts a booking ref or a tracking ID |
| `/admin/login` | Admin | Staff sign in |
| `/admin` | Admin | Operations overview — the exceptions queue |
| `/admin/billing` | Admin | Price changes, with approve / waive / remind |
| `/admin/bookings` | Admin | Booking list |
| `/admin/containers` | Admin | Loading board, sealing, Master Bill of Lading |
| `/admin/invoices` | Admin | Issue invoices, mark paid, printable tax invoice |
| `/admin/messages` | Admin | Every email and SMS the system sent |
| `/depot` | Depot | Receiving station — scan, measure, re-rate, label |

`/depot` requires a staff session, like the admin panel. It renders its own
sign-in rather than bouncing to `/admin/login`, because the person at the
receiving bench is not going to the operations panel.

### Deploying a single-page app

Every route must serve `index.html` — routing happens in the browser. On
Netlify, Vercel or S3+CloudFront that is a rewrite rule of `/* → /index.html`;
on nginx it is `try_files $uri /index.html;`. Without it, a refresh on `/track`
returns a 404 from the web server before React ever loads.

---

## Three surfaces, one system

A grandmother sending boxes to her son, a depot worker in gloves, and a billing
clerk reconciling invoices are not the same person and should not get the same
interface. Each layout sets `data-surface` on its wrapper, and every design
token is redefined for that surface in `src/index.css`. The same utility class
renders correctly in all three without a single conditional in a component.

| | Customer | Admin | Depot |
| --- | --- | --- | --- |
| Ground | white | cool grey | warm paper |
| Accent | deep teal `#0F766E` | indigo `#4F46E5` | amber `#E0921B` |
| Alert | coral `#EF6351` | red `#DC2626` | clay `#B4402A` |
| Radius | 20 px cards, pill buttons | 14 px cards | square |
| Controls | 52 px | 40 px | 52–68 px |

The admin surface also carries a full dark theme on the same tokens
(`[data-surface='admin'][data-theme='dark']`).

Numbers a person might read aloud down a phone line, compare down a column, or
dispute — tracking IDs, dimensions, weights, money — are always monospace and
always tabular. That is the `.tnum` class, deliberately left unlayered so it
wins over any font utility on the same element.

**Base element styles live in `@layer base`.** Unlayered CSS beats anything in a
layer regardless of specificity, so an unlayered `a { color: … }` silently
overrides every text-colour utility on every link — which is how a
brand-coloured button ends up with brand-coloured text on it.

## Layout

```
src/
  main.tsx                  Root, router and auth provider
  App.tsx                   Every route in one file
  index.css                 Tailwind + the three surface token sets
  layouts/
    CustomerLayout.tsx      Nav and footer
    AdminSurface.tsx        Admin tokens only — no guard
    DashboardLayout.tsx     Sidebar + session guard
  pages/                    One file per screen
  components/
    customer/QuoteWidget.tsx  The live calculator
    admin/                    Login, logout, adjustment actions
  hooks/
    useAuth.tsx             Who is signed in, asked once and shared
    useAsync.ts             Load, with stale-response and unmount guards
  lib/
    http.ts                 The only file that knows the API exists
    api.ts  admin.ts  tracking.ts
```

## Auth

Sessions live in an httpOnly cookie set by the API, so JavaScript cannot read
the token — every request just sends it with `credentials: 'include'`.

`DashboardLayout` waits for the first `/v1/auth/me` before deciding anything.
Without server rendering the browser cannot know who is signed in until it asks,
and redirecting on a `null` it has not confirmed would bounce a signed-in
operator to the login screen on every reload.

**Navigation and buttons are filtered by permission, but that is a courtesy.**
The server enforces the same rules independently. Sign in as
`operator@cargoflow.test` and press approve — the API refuses it.

## The quote widget

`src/components/customer/QuoteWidget.tsx` proves the stack end to end.

- Loads lanes and packaging presets from `GET /v1/reference`, so it renders
  itself from the live rate card and hardcodes nothing.
- Debounces 350 ms, then calls `POST /v1/quotes/estimate`.
- Discards stale responses by sequence number, so a slow earlier request cannot
  overwrite a fresher price.
- Degrades to a plain sentence when the API is unreachable.

**No arithmetic happens in the browser.** Money arrives pre-formatted from the
server. A price a customer sees and a price stored on their booking have to come
from the same code, and there is only one copy of it — in the backend's pricing
engine, under test.

## The depot bench

`/depot` is built around the scanner, because on a warehouse floor that is the
only input device: it types an ID and presses Enter. So the scan box keeps
focus after every action, and one field takes both kinds of input — a tracking
ID opens the measuring bench, anything else is treated as a booking reference
and received.

Labels print through the browser at 100 × 150 mm, the standard thermal stock.
The barcode arrives from the API as SVG rather than an image, so it prints at
the label printer's own resolution; a resampled barcode is one that
intermittently fails to scan, and a scanner that works four times in five is
worse than one that never works, because people stop trusting it.

## Status

Every requirement in the brief is wired end to end. The backend's
`scripts/walk-the-brief.py` proves it over HTTP in the order a shipment moves.

Not built: customer accounts and OTP sign-in (tracking is by reference, which
is deliberate), a real email/SMS provider behind the notification queue, rate
card editing in the UI, and the arrival end — devanning and proof of
delivery.

The full UI/UX design these screens are built from lives in `../design`.
