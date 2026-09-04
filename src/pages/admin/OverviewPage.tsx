import { Link } from 'react-router-dom';
import { NoAccess } from '@/components/admin/NoAccess';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { admin, type Exception } from '@/lib/admin';

const toneClasses: Record<Exception['tone'], { chip: string; dot: string; text: string }> = {
  alert: { chip: 'bg-alert-tint', dot: 'bg-alert', text: 'text-alert-ink' },
  warn: { chip: 'bg-warn-tint', dot: 'bg-warn', text: 'text-warn-ink' },
  muted: { chip: 'bg-panel-2', dot: 'bg-ink-4', text: 'text-ink-2' },
};

export function OverviewPage() {
  const { user } = useAuth();
  const { data, error, loading } = useAsync(() => admin.overview(), []);

  if (error?.status === 403) {
    return (
      <NoAccess
        user={user}
        message={`${error.message}. The overview is for supervisors and above.`}
        alternatives={[
          { label: 'Bookings', to: '/admin/bookings' },
          { label: 'Price changes', to: '/admin/billing' },
          { label: 'Depot floor', to: '/depot' },
        ]}
      />
    );
  }

  const tiles = data
    ? [
        { label: 'Booked today', value: String(data.kpis.bookedToday), note: 'across all channels' },
        { label: 'Awaiting check', value: String(data.kpis.awaitingCheck), note: 'pieces at the depot' },
        {
          label: 'Unapproved re-rates',
          value: String(data.kpis.unapprovedRerates),
          note: `${data.kpis.heldValueDisplay} held back`,
          urgent: data.kpis.unapprovedRerates > 0,
        },
        { label: 'Signed in as', value: user?.role ?? '—', note: user?.name ?? '' },
      ]
    : [];

  return (
    <>
      <header className="flex h-[68px] items-center justify-between border-b border-rule bg-panel px-8">
        <span className="text-[19px] font-bold tracking-[-0.015em]">Operations overview</span>
        <span className="text-[13px] font-medium text-ink-4">
          {new Date().toLocaleString('en-AU', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </header>

      <div className="flex flex-col gap-[22px] px-8 pb-9 pt-[26px]">
        {loading && <p className="text-[15px] text-ink-3">Loading…</p>}

        {error && error.status !== 403 && (
          <div className="rounded-[12px] bg-alert-tint px-5 py-4 text-[14px] text-alert-ink">
            {error.message}
          </div>
        )}

        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {tiles.map((tile) => (
                <div
                  key={tile.label}
                  className={`flex flex-col gap-3 rounded-[14px] border bg-panel p-5 ${
                    tile.urgent ? 'border-alert' : 'border-rule'
                  }`}
                >
                  <span
                    className={`text-[13px] font-semibold ${tile.urgent ? 'text-alert-ink' : 'text-ink-3'}`}
                  >
                    {tile.label}
                  </span>
                  <span
                    className={`tnum text-[32px] font-bold capitalize leading-none ${
                      tile.urgent ? 'text-alert-ink' : ''
                    }`}
                  >
                    {tile.value}
                  </span>
                  <span className={`text-xs font-medium ${tile.urgent ? 'text-alert' : 'text-ink-4'}`}>
                    {tile.note}
                  </span>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-[14px] border border-rule bg-panel">
              <div className="flex items-center justify-between border-b border-rule px-[22px] py-[18px]">
                <div className="flex items-center gap-[11px]">
                  <span className="text-base font-bold tracking-[-0.01em]">Needs a person</span>
                  <span
                    className={`inline-flex h-[21px] min-w-[22px] items-center justify-center rounded-full px-[7px] text-xs font-bold ${
                      data.exceptions.length > 0 ? 'bg-alert-tint text-alert-ink' : 'bg-ok-tint text-ok-ink'
                    }`}
                  >
                    {data.exceptions.length}
                  </span>
                </div>
                <span className="hidden text-[13px] text-ink-4 md:block">
                  Anything the system could not settle by itself
                </span>
              </div>

              {data.exceptions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                  <span className="text-[17px] font-bold">Nothing needs you right now</span>
                  <span className="max-w-[46ch] text-[14px] leading-[1.6] text-ink-3">
                    Every re-rate is settled, every message got through and no invoice is overdue. This is
                    what a good morning looks like.
                  </span>
                </div>
              ) : (
                data.exceptions.map((item) => {
                  const tone = toneClasses[item.tone];
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-[110px_150px_minmax(0,1fr)_80px_110px] items-center gap-[14px] border-b border-rule-2 px-[22px] py-[15px] last:border-b-0"
                    >
                      <span
                        className={`inline-flex w-fit items-center gap-[7px] rounded-[7px] px-[10px] py-[5px] ${tone.chip}`}
                      >
                        <span className={`h-[5px] w-[5px] rounded-full ${tone.dot}`} />
                        <span className={`text-[11px] font-bold ${tone.text}`}>{item.type}</span>
                      </span>
                      <span className="tnum text-[13px] font-medium">{item.reference}</span>
                      <span className="text-sm text-ink-2">{item.what}</span>
                      <span className="tnum text-right text-[13px] font-medium">{item.waiting}</span>
                      {item.action.href ? (
                        <Link
                          to={item.action.href}
                          className="text-right text-[13px] font-bold text-brand"
                        >
                          {item.action.label}
                        </Link>
                      ) : (
                        <span className="text-right text-[13px] font-medium text-ink-4">
                          {item.action.label}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <p className="text-[13px] text-ink-4">
              Live from the database. Warehouse, containers, rate cards and customers are still to build.
            </p>
          </>
        )}
      </div>
    </>
  );
}
