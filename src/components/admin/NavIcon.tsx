export type NavIconName =
  | 'overview'
  | 'bookings'
  | 'depot'
  | 'containers'
  | 'billing'
  | 'invoices'
  | 'messages'
  | 'rates'
  | 'customers';

/**
 * Sidebar icons.
 *
 * Hand-drawn on one 20×20 grid at a single stroke weight, rather than pulled
 * from an icon set — a package from one library beside a container from another
 * is the fastest way to make a sidebar look assembled instead of designed.
 *
 * They take `currentColor`, so an active item's icon turns brand with its label
 * and nothing has to be told twice. `aria-hidden` throughout: every one sits
 * next to the word it illustrates, and a screen reader announcing "grid,
 * Overview" is noise.
 */
const PATHS: Record<NavIconName, React.ReactNode> = {
  // Four panes — the shape of a dashboard.
  overview: (
    <>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1.5" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" />
    </>
  ),

  // A docket: a page with lines written on it.
  bookings: (
    <>
      <path d="M4.5 2.5h11v15h-11z" />
      <path d="M7.5 6.5h5M7.5 10h5M7.5 13.5h3" />
    </>
  ),

  // A box seen in three-quarter view, with the seam down the front.
  depot: (
    <>
      <path d="M10 2.5 17.5 6v8L10 17.5 2.5 14V6z" />
      <path d="M2.5 6 10 9.5 17.5 6M10 9.5v8" />
    </>
  ),

  // A shipping container: ribbed sides, doors at the end.
  containers: (
    <>
      <rect x="2" y="5.5" width="16" height="9" rx="1" />
      <path d="M6 5.5v9M10 5.5v9M14 5.5v9" />
    </>
  ),

  // A price that moved: a tag with an arrow through it.
  billing: (
    <>
      <path d="M10.5 2.5h6v6l-8 8-6-6 8-8z" />
      <circle cx="13.5" cy="6.5" r="1.25" />
    </>
  ),

  // A receipt, torn along the bottom.
  invoices: (
    <>
      <path d="M4.5 2.5h11v15l-2-1.5-1.8 1.5-1.7-1.5-1.7 1.5-1.8-1.5-2 1.5z" />
      <path d="M7.5 6.5h5M7.5 10h5" />
    </>
  ),

  // An envelope.
  messages: (
    <>
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" />
      <path d="m3 6 7 5 7-5" />
    </>
  ),

  // A card with a rate written across it.
  rates: (
    <>
      <rect x="2" y="4" width="16" height="12" rx="2" />
      <path d="M2 8h16M5.5 12h4" />
    </>
  ),

  // A person.
  customers: (
    <>
      <circle cx="10" cy="6.5" r="3" />
      <path d="M3.5 17c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" />
    </>
  ),
};

export function NavIcon({ name, className = '' }: { name: NavIconName; className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {PATHS[name]}
    </svg>
  );
}
