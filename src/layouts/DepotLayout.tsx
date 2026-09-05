import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { can } from '@/lib/admin';
import { depot } from '@/lib/depot';
import { ApiError } from '@/lib/http';

const TABS = [
  { to: '/admin/depot', label: 'Dashboard', end: true },
  { to: '/admin/depot/receiving', label: 'Receiving & checks', end: false },
  { to: '/admin/depot/walk-in', label: 'Walk-in intake', end: false },
];

/**
 * The depot floor, as an ordinary page of the operations panel.
 *
 * It used to carry its own surface tokens — warm paper, amber, square corners —
 * on the theory that a warehouse bench wants different chrome from an office
 * desk. Inside the admin sidebar that read as a different application rather
 * than a different context, so it now uses the same look as every other page
 * here: same header bar, same cards, same indigo.
 *
 * The scan bar stays in the layout rather than on any one screen, because a
 * barcode scanner is a keyboard that types an ID and presses Enter. Keeping it
 * here means it survives moving between the tabs below.
 */
export function DepotLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scan, setScan] = useState('');
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);
  const scanBox = useRef<HTMLInputElement>(null);

  // Focus follows the work: after any navigation the scanner is live again.
  useEffect(() => {
    scanBox.current?.focus();
  }, [location.pathname]);

  if (user && !can(user, 'depot:receive')) {
    return (
      <>
        <header className="flex h-[68px] items-center border-b border-rule bg-panel px-5 sm:px-8">
          <span className="text-[19px] font-bold tracking-[-0.015em]">Depot floor</span>
        </header>
        <div className="flex flex-grow items-center justify-center px-5 py-20 sm:px-8">
          <div className="max-w-[46ch] text-center">
            <h1 className="text-[24px] font-bold leading-tight tracking-[-0.02em]">
              The floor is not your job
            </h1>
            <p className="mt-3 text-[15px] leading-[1.6] text-ink-3">
              Your role ({user.roleLabel}) does not receive or measure boxes. That separation is
              deliberate — the person who weighs a box is not the person who prices it.
            </p>
            <Link
              to="/admin"
              className="mt-6 inline-flex h-12 items-center rounded-[10px] bg-brand px-6 text-[15px] font-bold text-ink-invert"
            >
              Back to the overview
            </Link>
          </div>
        </div>
      </>
    );
  }

  const submitScan = async (raw: string) => {
    const value = raw.trim().toUpperCase();
    if (!value) return;

    setBusy(true);
    setFlash(null);
    try {
      if (/^CF-\d+-\d+$/.test(value)) {
        // A tracking ID is a box in someone's hands. Go straight to its bench.
        navigate(`/admin/depot/receiving?piece=${encodeURIComponent(value)}`);
      } else {
        const result = await depot.receive(value);
        const fresh = result.received.length;
        const already = result.alreadyReceived.length;
        setFlash({
          tone: 'ok',
          text:
            fresh > 0
              ? `${result.reference}: received ${fresh} ${fresh === 1 ? 'box' : 'boxes'} — ${result.received
                  .map((piece) => piece.trackingId)
                  .join(', ')}${already ? `. ${already} already had labels.` : ''}`
              : `${result.reference}: all ${already} ${
                  already === 1 ? 'box was' : 'boxes were'
                } already received.`,
        });
        navigate('/admin/depot/receiving');
      }
      setScan('');
    } catch (caught) {
      setFlash({
        tone: 'bad',
        text: caught instanceof ApiError ? caught.message : 'That scan did not work',
      });
    } finally {
      setBusy(false);
      scanBox.current?.focus();
    }
  };

  return (
    <>
      <header className="flex h-[68px] items-center justify-between border-b border-rule bg-panel px-5 sm:px-8">
        <span className="text-[19px] font-bold tracking-[-0.015em]">Depot floor</span>
        <span className="tnum text-[13px] font-medium text-ink-4">
          {user?.depotId ?? 'WS-03'} · Peliyagoda
        </span>
      </header>

      <div className="flex flex-col gap-4 border-b border-rule bg-panel px-5 pb-4 sm:px-8">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `whitespace-nowrap border-b-2 px-4 py-3 text-[13px] font-semibold ${
                  isActive ? 'border-brand text-brand' : 'border-transparent text-ink-3'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form
            className="flex h-12 min-w-0 flex-grow items-center gap-3 rounded-[10px] border border-rule bg-panel-2 px-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submitScan(scan);
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 22 22"
              fill="none"
              aria-hidden="true"
              className="shrink-0"
            >
              <path d="M3 7V4h3M19 7V4h-3M3 15v3h3M19 15v3h-3" stroke="var(--ink-3)" strokeWidth="1.6" />
              <path d="M6.5 8v6M9 8v6M11.5 8v6M14 8v6M16 8v6" stroke="var(--brand)" strokeWidth="1.4" />
            </svg>
            <input
              ref={scanBox}
              autoFocus
              value={scan}
              onChange={(event) => setScan(event.target.value)}
              placeholder="Scan a tracking ID, or type a booking reference"
              aria-label="Scan a tracking ID or booking reference"
              className="tnum h-full min-w-0 flex-grow bg-transparent text-[14px] uppercase outline-none placeholder:normal-case placeholder:text-ink-4"
            />
            {busy && <span className="shrink-0 text-xs text-ink-4">…</span>}
          </form>

          <Link
            to="/admin/depot/walk-in"
            className="flex h-12 shrink-0 items-center rounded-[10px] bg-brand px-5 text-[13px] font-bold text-ink-invert"
          >
            Walk-in intake
          </Link>
        </div>
      </div>

      {flash && (
        <div className="px-5 pt-[26px] sm:px-8">
          <p
            className={`rounded-[12px] px-5 py-4 text-[14px] leading-[1.55] ${
              flash.tone === 'ok' ? 'bg-ok-tint text-ok-ink' : 'bg-alert-tint text-alert-ink'
            }`}
          >
            {flash.text}
          </p>
        </div>
      )}

      <Outlet />
    </>
  );
}
