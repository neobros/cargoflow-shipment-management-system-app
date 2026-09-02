# CargoFlow — app

Customer booking portal, depot floor tools and admin panel.

**Next.js 15 · React 19 · TypeScript · Tailwind v4**

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

| Route | Surface | What it is |
| --- | --- | --- |
| `/` | Customer | Landing page with a **live price calculator** |
| `/admin` | Admin | Operations overview — the exceptions queue |
| `/depot` | Depot | Receiving station shell |

`NEXT_PUBLIC_API_URL` in `.env.local` points at the API. Default
`http://localhost:4000`.

---

## Three surfaces, one system

A grandmother sending boxes to her son, a depot worker in gloves, and a billing
clerk reconciling invoices are not the same person and should not get the same
interface. Each route group sets `data-surface` on its wrapper, and every design
token is redefined for that surface in `app/globals.css`. The same utility class
renders correctly in all three without a single conditional in a component.

| | Customer | Admin | Depot |
| --- | --- | --- | --- |
| Ground | white | cool grey | warm paper |
| Accent | deep teal `#0F766E` | indigo `#4F46E5` | amber `#E0921B` |
| Alert | coral `#EF6351` | red `#DC2626` | clay `#B4402A` |
| Radius | 20 px cards, pill buttons | 14 px cards | square |
| Controls | 52 px | 40 px | 52–68 px |
| Type | Bricolage Grotesque + Plus Jakarta Sans | Plus Jakarta Sans | Plus Jakarta Sans |

The admin surface also carries a full dark theme on the same tokens
(`[data-surface='admin'][data-theme='dark']`) — depot offices are dim and
billing shifts run late.

Numbers a person might read aloud down a phone line, compare down a column, or
dispute — tracking IDs, dimensions, weights, money — are always monospace and
always tabular. That is the `.tnum` class, and it applies on all three surfaces
without exception.

## Layout

```
app/
  layout.tsx              Root: fonts, metadata
  globals.css             Tailwind + the three surface token sets
  (customer)/
    layout.tsx            Nav and footer, data-surface="customer"
    page.tsx              Landing page
  (admin)/admin/
    layout.tsx            Sidebar shell, data-surface="admin"
    page.tsx              Operations overview
  (depot)/depot/
    page.tsx              Receiving station, data-surface="depot"
components/
  Logo.tsx
  customer/QuoteWidget.tsx   The live calculator
lib/
  api.ts                  The only file that knows the API exists
```

## The quote widget

`components/customer/QuoteWidget.tsx` is the one genuinely working feature so
far, and it is deliberately the first thing built — it proves the whole stack
end to end.

- Loads lanes and packaging presets from `GET /v1/reference`, so the wizard
  renders itself from the live rate card and hardcodes nothing.
- Debounces 350 ms, then calls `POST /v1/quotes/estimate`.
- Discards stale responses by sequence number, so a slow earlier request cannot
  overwrite a fresher price.
- Degrades to a plain sentence when the API is unreachable, which is a normal
  condition in development rather than something a user should see a stack
  trace for.

**No arithmetic happens in the browser.** Money arrives from the server
pre-formatted. A price a customer sees and a price stored on their booking have
to come from the same code, and there is only one copy of it — in the backend's
pricing engine, under test.

## Status

Built: the three surfaces and their token systems, the customer landing page,
the live quote calculator wired to the API, and shells for admin and depot that
prove the routing and theming.

Next: the three-step booking wizard, OTP sign-in, the customer dashboard and
tracking timeline with the re-rate approval, then the depot verification bench
against `/v1/quotes/compare` — which is already built and tested on the backend.

The full UI/UX design these screens are built from lives in `../design`.
