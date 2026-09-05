import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LabelSheet } from '@/components/depot/LabelSheet';
import { WalkInPanel } from '@/components/depot/WalkInPanel';
import { depot, type Label } from '@/lib/depot';

/**
 * Requirement 3.1: walk-in shipment intake, on its own screen.
 *
 * Someone is at the counter with a queue behind them, so this is the whole
 * page — no floor queue, no bench, nothing else competing for the operator's
 * attention while a customer waits.
 */
export function WalkInPage() {
  const navigate = useNavigate();
  const [labels, setLabels] = useState<Label[]>([]);
  const [done, setDone] = useState<string | null>(null);

  const addLabel = async (trackingId: string) => {
    const { label } = await depot.label(trackingId);
    setLabels((current) =>
      current.some((l) => l.trackingId === label.trackingId) ? current : [...current, label],
    );
  };

  return (
    <div className="flex flex-col gap-[22px] px-5 pb-9 pt-[26px] sm:px-8">
      {done && (
        <div className="rounded-[12px] bg-ok-tint px-5 py-4">
          <p className="text-[15px] font-medium text-ok-ink">{done}</p>
          <button
            type="button"
            onClick={() => navigate('/admin/depot')}
            className="mt-2 text-[13px] font-bold text-ok-ink underline"
          >
            Back to the dashboard
          </button>
        </div>
      )}

      {labels.length > 0 && (
        <LabelSheet
          labels={labels}
          onClear={() => setLabels([])}
          onPrinted={async () => {
            await depot.markPrinted(labels.map((l) => l.trackingId)).catch(() => undefined);
          }}
        />
      )}

      <WalkInPanel onDone={setDone} onPrint={addLabel} />
    </div>
  );
}
