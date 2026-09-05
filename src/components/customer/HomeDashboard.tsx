import { Link } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { useCustomer } from '@/hooks/useCustomer';
import { customer } from '@/lib/customer';

/**
 * The home page for someone who is signed in.
 *
 * A returning customer arriving at "/" is not shopping — they are checking on
 * a box, or sending another one. So the sales pitch moves down and the two
 * things they came for move to the top, with anything needing their attention
 * in front of both.
 */
export function HomeDashboard() {
  const { account } = useCustomer();
  const { data } = useAsync(() => customer.shipments(), [account?.reference]);

  if (!account) return null;

  const shipments = data?.shipments ?? [];
  const moving = shipments.filter(
    (shipment) => shipment.status !== 'delivered' && shipment.status !== 'cleared',
  );
  const needsYou = shipments.filter((shipment) => shipment.awaitingApproval);
  const latest = moving[0];

  return (
    <section className="border-b border-rule-2 bg-panel-2 px-5 py-8 sm:px-6 md:px-14 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-ink-4">
            Welcome back
          </p>
          <h2 className="mt-1 font-display text-[clamp(24px,4vw,32px)] font-extrabold leading-[1.1] tracking-[-0.03em]">
            {account.name.split(' ')[0]}
          </h2>
        </div>

        <Link to="/account" className="text-[14px] font-bold text-brand">
          All your shipping →
        </Link>
      </div>

      {needsYou.length > 0 && (
        <div className="mt-5 rounded-[18px] border-2 border-alert bg-alert-tint px-5 py-4">
          <p className="text-[15px] font-bold text-alert-ink">
            {needsYou.length === 1
              ? 'One shipment is waiting on your answer'
              : `${needsYou.length} shipments are waiting on your answer`}
          </p>
          <p className="mt-1 text-[14px] leading-[1.55] text-alert-ink">
            We measured your boxes and the price changed. Nothing ships and nothing is charged until
            you say yes.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {needsYou.map((shipment) => (
              <Link
                key={shipment.reference}
                to={`/track?id=${shipment.reference}`}
                className="tnum rounded-full bg-panel px-4 py-2 text-[14px] font-bold text-alert-ink"
              >
                {shipment.reference} · A${shipment.currentTotal}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          to="/book"
          className="flex h-14 items-center justify-center rounded-full bg-brand px-8 text-[16px] font-bold text-ink-invert"
        >
          Send a shipment
        </Link>
        <Link
          to="/track"
          className="flex h-14 items-center justify-center rounded-full border-2 border-rule bg-panel px-7 text-[16px] font-bold text-ink-2"
        >
          Track a box
        </Link>

        {moving.length > 0 && (
          <p className="tnum text-[14px] text-ink-3 sm:ml-2">
            {moving.length} {moving.length === 1 ? 'shipment' : 'shipments'} on the way
          </p>
        )}
      </div>

      {latest && (
        <Link
          to={`/track?id=${latest.reference}`}
          className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-rule bg-panel px-5 py-4"
        >
          <div className="min-w-0">
            <span className="tnum text-[15px] font-bold">{latest.reference}</span>
            <span className="ml-3 text-[14px] text-ink-3">
              {latest.route} · {latest.pieceCount} {latest.pieceCount === 1 ? 'box' : 'boxes'}
            </span>
          </div>
          <span className="rounded-full bg-ok-tint px-4 py-[7px] text-[13px] font-bold text-ok-ink">
            {latest.statusLabel}
          </span>
        </Link>
      )}
    </section>
  );
}
