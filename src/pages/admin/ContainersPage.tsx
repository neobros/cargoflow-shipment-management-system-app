import { useCallback, useEffect, useState } from 'react';
import { BolSheet } from '@/components/admin/BolSheet';
import { OpenContainer } from '@/components/admin/OpenContainer';
import { useAuth } from '@/hooks/useAuth';
import { can } from '@/lib/admin';
import {
  containers,
  type Bol,
  type ContainerPiece,
  type ContainerSummary,
} from '@/lib/depot';
import { ApiError } from '@/lib/http';

const STATUS_CHIP: Record<ContainerSummary['status'], string> = {
  open: 'bg-ok-tint text-ok-ink',
  sealed: 'bg-warn-tint text-warn-ink',
  in_transit: 'bg-accent-tint text-accent',
  arrived: 'bg-brand-tint text-brand',
  devanned: 'bg-panel-2 text-ink-2',
};

const STATUS_LABEL: Record<ContainerSummary['status'], string> = {
  open: 'Open',
  sealed: 'Sealed',
  in_transit: 'On the water',
  arrived: 'Arrived',
  devanned: 'Unpacked',
};

const day = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });

/** Requirement 2.3: the loading board. */
export function ContainersPage() {
  const { user } = useAuth();
  const [list, setList] = useState<ContainerSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    container: ContainerSummary;
    pieces: ContainerPiece[];
  } | null>(null);
  const [bol, setBol] = useState<Bol | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loadInput, setLoadInput] = useState('');
  const [sealInput, setSealInput] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { containers: all } = await containers.list();
      setList(all);
      setSelected((current) => current ?? all[0]?.containerNumber ?? null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not load containers');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!selected) return;
    let alive = true;
    containers
      .get(selected)
      .then((data) => alive && setDetail(data))
      .catch(() => alive && setDetail(null));
    return () => {
      alive = false;
    };
  }, [selected, notice]);

  const act = async (work: () => Promise<string>) => {
    setBusy(true);
    setError(null);
    try {
      setNotice(await work());
      await refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'That did not work');
    } finally {
      setBusy(false);
    }
  };

  const load = () =>
    act(async () => {
      const ids = loadInput
        .split(/[\s,]+/)
        .map((id) => id.trim().toUpperCase())
        .filter(Boolean);
      if (ids.length === 0) throw new ApiError('Enter at least one tracking ID', 'empty', 400);

      const result = await containers.load(selected!, ids);
      setLoadInput('');
      const parts = [
        result.loaded.length > 0 ? `Loaded ${result.loaded.join(', ')}.` : '',
        ...result.refused.map((r) => `${r.trackingId} refused — ${r.reason}.`),
      ].filter(Boolean);
      return parts.join(' ');
    });

  const seal = () =>
    act(async () => {
      const result = await containers.seal(selected!, sealInput.trim());
      setSealInput('');
      return `${result.container.containerNumber} sealed with ${result.container.sealNumber}. Every box aboard is now In Transit and the customers have been told.`;
    });

  const openBol = () =>
    act(async () => {
      const { bol: built } = await containers.bol(selected!);
      setBol(built);
      return `${built.number} ready.`;
    });

  const mayOpen = user && can(user, 'containers:manage');
  const mayPrintBol = user && can(user, 'documents:read');
  const mayLoad = user && can(user, 'containers:load');
  const maySeal = user && can(user, 'containers:seal');

  return (
    <>
      <header className="flex h-[68px] items-center justify-between border-b border-rule bg-panel px-5 sm:px-8">
        <span className="text-[19px] font-bold tracking-[-0.015em]">Containers</span>
        <span className="tnum text-[13px] font-medium text-ink-4">{list.length} on the board</span>
      </header>

      <div className="flex flex-col gap-5 px-5 pb-9 pt-[26px] sm:px-8">
        {error && (
          <p className="rounded-[12px] bg-alert-tint px-5 py-4 text-[14px] text-alert-ink">{error}</p>
        )}
        {notice && (
          <p className="rounded-[12px] bg-ok-tint px-5 py-4 text-[14px] text-ok-ink">{notice}</p>
        )}

        {mayOpen && (
          <OpenContainer
            onOpened={(message) => {
              setNotice(message);
              void refresh();
            }}
          />
        )}

        {list.length === 0 && (
          <div className="rounded-[14px] border border-rule bg-panel px-6 py-14 text-center">
            <p className="text-[16px] font-semibold">No containers on the board</p>
            <p className="mx-auto mt-2 max-w-[46ch] text-[15px] leading-[1.6] text-ink-3">
              {mayOpen
                ? 'Open one above and checked boxes can be loaded into it.'
                : 'A supervisor opens the next one. Checked boxes wait on the floor until then.'}
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((container) => {
            const active = container.containerNumber === selected;
            return (
              <button
                key={container.containerNumber}
                type="button"
                onClick={() => setSelected(container.containerNumber)}
                className={`flex flex-col gap-3 rounded-[14px] border-2 p-5 text-left ${
                  active ? 'border-brand bg-brand-tint' : 'border-rule bg-panel'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="tnum text-[15px] font-bold">{container.containerNumber}</span>
                  <span
                    className={`rounded-[7px] px-[10px] py-[5px] text-[11px] font-bold ${
                      STATUS_CHIP[container.status]
                    }`}
                  >
                    {STATUS_LABEL[container.status]}
                  </span>
                </div>

                <span className="text-[13px] text-ink-3">
                  {container.vessel} {container.voyage} · {container.route}
                </span>

                <div className="flex flex-col gap-1">
                  <div className="h-2 overflow-hidden rounded-full bg-panel-2">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${Math.min(container.fillPercent, 100)}%` }}
                    />
                  </div>
                  <span className="tnum text-[12px] text-ink-4">
                    {container.loaded} / {container.capacity} m³ · {container.fillPercent}% ·{' '}
                    {container.pieceCount} boxes
                  </span>
                </div>

                <span className="tnum text-[12px] text-ink-4">
                  cut-off {day(container.cutOffAt)} · sails {day(container.sailsAt)} · eta{' '}
                  {day(container.etaAt)}
                </span>
              </button>
            );
          })}
        </div>

        {detail && (
          <section className="rounded-[14px] border border-rule bg-panel">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-4">
              <div>
                <span className="tnum text-base font-bold">{detail.container.containerNumber}</span>
                <span className="ml-3 text-[13px] text-ink-3">
                  {detail.container.type}
                  {detail.container.sealNumber ? ` · seal ${detail.container.sealNumber}` : ''}
                </span>
              </div>
              {mayPrintBol && (
                <button
                  type="button"
                  onClick={openBol}
                  disabled={busy || detail.pieces.length === 0}
                  className="h-10 rounded-[10px] bg-panel-2 px-4 text-[13px] font-bold text-ink-2 disabled:opacity-40"
                >
                  Master Bill of Lading
                </button>
              )}
            </div>

            {detail.container.status === 'open' && mayLoad && (
              <div className="flex flex-col gap-3 border-b border-rule px-5 py-4 sm:flex-row">
                <input
                  value={loadInput}
                  onChange={(event) => setLoadInput(event.target.value)}
                  placeholder="Scan tracking IDs to load, separated by spaces"
                  aria-label="Tracking IDs to load"
                  className="tnum h-11 min-w-0 flex-grow rounded-[10px] bg-panel-2 px-4 text-[14px] uppercase placeholder:normal-case"
                />
                <button
                  type="button"
                  onClick={load}
                  disabled={busy || !loadInput.trim()}
                  className="h-11 shrink-0 rounded-[10px] bg-brand px-5 text-[13px] font-bold text-ink-invert disabled:opacity-40"
                >
                  Load
                </button>
              </div>
            )}

            {detail.container.status === 'open' && maySeal && detail.pieces.length > 0 && (
              <div className="flex flex-col gap-3 border-b border-rule bg-warn-tint px-5 py-4 sm:flex-row sm:items-center">
                <p className="flex-grow text-[13px] leading-[1.5] text-warn-ink">
                  Sealing is final. Nothing can be added or re-measured afterwards, and every box
                  aboard becomes In Transit.
                </p>
                <input
                  value={sealInput}
                  onChange={(event) => setSealInput(event.target.value)}
                  placeholder="Seal number"
                  aria-label="Seal number"
                  className="tnum h-11 w-full rounded-[10px] bg-panel px-4 text-[14px] sm:w-[160px]"
                />
                <button
                  type="button"
                  onClick={seal}
                  disabled={busy || sealInput.trim().length < 3}
                  className="h-11 shrink-0 rounded-[10px] bg-alert px-5 text-[13px] font-bold text-ink-invert disabled:opacity-40"
                >
                  Seal and sail
                </button>
              </div>
            )}

            {detail.pieces.length === 0 ? (
              <p className="px-5 py-12 text-center text-[15px] text-ink-3">
                Empty. Load checked boxes bound for {detail.container.destinationLabel}.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <div className="grid min-w-[720px] grid-cols-[140px_130px_minmax(0,1fr)_90px_90px] gap-3 border-b border-rule bg-panel-2 px-5 py-3">
                  {['Tracking ID', 'Booking', 'Consignee', 'Weight', 'Volume'].map((head) => (
                    <span key={head} className="text-[11px] font-bold text-ink-3">
                      {head}
                    </span>
                  ))}
                </div>
                {detail.pieces.map((piece) => (
                  <div
                    key={piece.trackingId}
                    className="grid min-w-[720px] grid-cols-[140px_130px_minmax(0,1fr)_90px_90px] items-center gap-3 border-b border-rule-2 px-5 py-3 last:border-b-0"
                  >
                    <span className="tnum text-[13px] font-semibold">{piece.trackingId}</span>
                    <span className="tnum text-[13px] text-ink-3">{piece.bookingRef}</span>
                    <span className="truncate text-[14px]">
                      {piece.consignee} · {piece.destination}
                    </span>
                    <span className="tnum text-right text-[13px]">{piece.weightKg} kg</span>
                    <span className="tnum text-right text-[13px]">{piece.volume} m³</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {bol && selected && (
          <BolSheet bol={bol} containerNumber={selected} onClose={() => setBol(null)} />
        )}
      </div>
    </>
  );
}
