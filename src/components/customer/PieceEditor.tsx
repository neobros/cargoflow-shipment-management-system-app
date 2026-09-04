import type { PackagingKind, PackagingPreset, PieceInput } from '@/lib/api';
import { cmToMm, kgToGrams } from '@/lib/api';

/**
 * Requirement 1.1: choose a shipment type and describe each box.
 *
 * Held as strings rather than numbers while the customer types. A number state
 * forces a decision about what "" and "1." mean on every keystroke, and the
 * usual fix — coercing to 0 — silently turns a half-typed weight into a valid
 * one. Strings until they parse; then, and only then, they become a piece.
 */
export interface PieceDraft {
  id: string;
  packaging: PackagingKind;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  weightKg: string;
}

let counter = 0;
export const blankPiece = (packaging: PackagingKind = 'medium_box'): PieceDraft => ({
  id: `piece-${++counter}`,
  packaging,
  lengthCm: '',
  widthCm: '',
  heightCm: '',
  weightKg: '',
});

const positive = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

/** A draft becomes a piece only when all four numbers are real and positive. */
export const toPieceInput = (draft: PieceDraft): PieceInput | null => {
  const length = positive(draft.lengthCm);
  const width = positive(draft.widthCm);
  const height = positive(draft.heightCm);
  const weight = positive(draft.weightKg);
  if (length === null || width === null || height === null || weight === null) return null;

  return {
    packaging: draft.packaging,
    lengthMm: cmToMm(length),
    widthMm: cmToMm(width),
    heightMm: cmToMm(height),
    weightGrams: kgToGrams(weight),
  };
};

const FIELDS: [keyof PieceDraft, string][] = [
  ['lengthCm', 'Length'],
  ['widthCm', 'Width'],
  ['heightCm', 'Height'],
  ['weightKg', 'Weight'],
];

export function PieceEditor({
  pieces,
  onChange,
  presets,
}: {
  pieces: PieceDraft[];
  onChange: (pieces: PieceDraft[]) => void;
  presets: PackagingPreset[];
}) {
  const update = (id: string, patch: Partial<PieceDraft>) =>
    onChange(pieces.map((piece) => (piece.id === id ? { ...piece, ...piece, ...patch } : piece)));

  /**
   * Picking a packaging type fills in its nominal size — but only over empty
   * fields. Overwriting a measurement someone has already typed, because they
   * corrected the box type afterwards, is the kind of small betrayal that makes
   * people stop trusting a form.
   */
  const choosePackaging = (piece: PieceDraft, kind: PackagingKind) => {
    const preset = presets.find((p) => p.kind === kind);
    const untouched = !piece.lengthCm && !piece.widthCm && !piece.heightCm;
    update(piece.id, {
      packaging: kind,
      ...(preset && untouched
        ? {
            lengthCm: String(preset.lengthMm / 10),
            widthCm: String(preset.widthMm / 10),
            heightCm: String(preset.heightMm / 10),
            weightKg: piece.weightKg || String(preset.weightGrams / 1000),
          }
        : {}),
    });
  };

  return (
    <section className="rounded-[22px] border border-rule bg-panel p-6">
      <h2 className="font-display text-[21px] font-bold tracking-[-0.02em]">What are you sending?</h2>
      <p className="mt-1 text-[14px] leading-[1.55] text-ink-3">
        Rough sizes are fine — we measure every box on arrival and tell you if anything changes.
      </p>

      <div className="mt-6 flex flex-col gap-5">
        {pieces.map((piece, index) => (
          <div key={piece.id} className="rounded-[18px] bg-panel-2 p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[15px] font-bold">Box {index + 1}</span>
              {pieces.length > 1 && (
                <button
                  type="button"
                  onClick={() => onChange(pieces.filter((p) => p.id !== piece.id))}
                  className="text-[14px] font-bold text-alert-ink"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {presets.map((preset) => {
                const active = piece.packaging === preset.kind;
                return (
                  <button
                    key={preset.kind}
                    type="button"
                    onClick={() => choosePackaging(piece, preset.kind)}
                    title={preset.note}
                    className={`rounded-full border-2 px-4 py-2 text-[13px] font-semibold ${
                      active ? 'border-brand bg-brand-tint text-brand-deep' : 'border-rule bg-panel'
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-[10px] sm:grid-cols-4">
              {FIELDS.map(([key, label]) => {
                const isWeight = key === 'weightKg';
                return (
                  <label key={key} className="flex flex-col gap-2">
                    <span
                      className={`text-center text-[11px] font-bold ${
                        isWeight ? 'text-brand' : 'text-ink-3'
                      }`}
                    >
                      {label} {isWeight ? '(kg)' : '(cm)'}
                    </span>
                    <input
                      inputMode="decimal"
                      value={piece[key] as string}
                      onChange={(e) => update(piece.id, { [key]: e.target.value })}
                      aria-label={`Box ${index + 1} ${label.toLowerCase()}`}
                      className={`tnum h-[54px] rounded-[14px] text-center text-[18px] font-bold ${
                        isWeight
                          ? 'border-2 border-brand bg-brand-tint text-brand-deep'
                          : 'bg-panel text-ink'
                      }`}
                    />
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange([...pieces, blankPiece(pieces.at(-1)?.packaging)])}
        className="mt-5 h-12 rounded-full border-2 border-dashed border-rule px-6 text-[15px] font-bold text-ink-2"
      >
        + Another box
      </button>
    </section>
  );
}
