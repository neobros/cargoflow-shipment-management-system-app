import { useEffect } from 'react';
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

/**
 * The one packaging type whose size the customer sets.
 *
 * Every other preset is a box we supply at a known size, so its dimensions are
 * the preset's, not a suggestion. Weight is always theirs to enter — nothing
 * about the carton tells you what is inside it.
 */
const CUSTOM: PackagingKind = 'custom_carton';

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
   * Picking a supplied box sets its size and locks it. Picking "your own
   * carton" unlocks the three fields and leaves whatever is in them.
   */
  const choosePackaging = (piece: PieceDraft, kind: PackagingKind) => {
    const preset = presets.find((p) => p.kind === kind);

    // Switching to a supplied box takes that box's dimensions, always — they
    // are not editable afterwards, so a stale figure would simply be wrong.
    // Switching to a custom carton keeps whatever is on screen as a starting
    // point rather than blanking three fields the customer then retypes.
    // Weight survives either way; it is the one number that is theirs.
    update(piece.id, {
      packaging: kind,
      ...(preset && kind !== CUSTOM
        ? {
            lengthCm: String(preset.lengthMm / 10),
            widthCm: String(preset.widthMm / 10),
            heightCm: String(preset.heightMm / 10),
          }
        : {}),
    });
  };

  /**
   * A supplied box's dimensions are read-only, so anything that creates a piece
   * without them — the first one on the page, "+ Another box", a shipment
   * carried over from the landing calculator — would leave three fields empty
   * that nobody can fill. Seed them as soon as the presets arrive.
   */
  useEffect(() => {
    if (presets.length === 0) return;

    const needsSeeding = pieces.filter(
      (piece) =>
        piece.packaging !== CUSTOM &&
        (!piece.lengthCm || !piece.widthCm || !piece.heightCm),
    );
    if (needsSeeding.length === 0) return;

    onChange(
      pieces.map((piece) => {
        if (!needsSeeding.includes(piece)) return piece;
        const preset = presets.find((candidate) => candidate.kind === piece.packaging);
        if (!preset) return piece;
        return {
          ...piece,
          lengthCm: String(preset.lengthMm / 10),
          widthCm: String(preset.widthMm / 10),
          heightCm: String(preset.heightMm / 10),
        };
      }),
    );
  }, [pieces, presets, onChange]);

  return (
    <section className="rounded-[22px] border border-rule bg-panel p-6">
      <h2 className="font-display text-[21px] font-bold tracking-[-0.02em]">What are you sending?</h2>
      <p className="mt-1 text-[14px] leading-[1.55] text-ink-3">
        Pick one of our boxes, or choose <strong className="font-semibold">Custom size</strong> and
        enter your own measurements. Either way, tell us roughly what it weighs — we weigh and
        measure every box on arrival and tell you before anything changes.
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

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {presets
                .filter((preset) => preset.kind !== CUSTOM)
                .map((preset) => {
                  const active = piece.packaging === preset.kind;
                  return (
                    <button
                      key={preset.kind}
                      type="button"
                      onClick={() => choosePackaging(piece, preset.kind)}
                      title={`${preset.note} · ${preset.lengthMm / 10} × ${preset.widthMm / 10} × ${
                        preset.heightMm / 10
                      } cm`}
                      className={`flex flex-col items-start rounded-[14px] border-2 px-4 py-2 text-left ${
                        active ? 'border-brand bg-brand-tint text-brand-deep' : 'border-rule bg-panel'
                      }`}
                    >
                      <span className="text-[13px] font-semibold">{preset.name}</span>
                      <span className="tnum text-[11px] opacity-70">
                        {preset.lengthMm / 10} × {preset.widthMm / 10} × {preset.heightMm / 10} cm
                      </span>
                    </button>
                  );
                })}

              <span className="mx-1 hidden h-8 w-px bg-rule sm:block" />

              {presets
                .filter((preset) => preset.kind === CUSTOM)
                .map((preset) => {
                  const active = piece.packaging === preset.kind;
                  return (
                    <button
                      key={preset.kind}
                      type="button"
                      onClick={() => choosePackaging(piece, preset.kind)}
                      title={preset.note}
                      className={`flex flex-col items-start rounded-[14px] border-2 border-dashed px-4 py-2 text-left ${
                        active ? 'border-brand bg-brand-tint text-brand-deep' : 'border-rule bg-panel'
                      }`}
                    >
                      <span className="text-[13px] font-semibold">{preset.name}</span>
                      <span className="text-[11px] opacity-70">you enter the size</span>
                    </button>
                  );
                })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-[10px] sm:grid-cols-4">
              {FIELDS.map(([key, label]) => {
                const isWeight = key === 'weightKg';
                const locked = !isWeight && piece.packaging !== CUSTOM;
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
                      readOnly={locked}
                      tabIndex={locked ? -1 : undefined}
                      aria-label={`Box ${index + 1} ${label.toLowerCase()}`}
                      aria-readonly={locked || undefined}
                      className={`tnum h-[54px] rounded-[14px] text-center text-[18px] font-bold ${
                        isWeight
                          ? 'border-2 border-brand bg-brand-tint text-brand-deep'
                          : locked
                            ? 'cursor-not-allowed bg-panel-2 text-ink-3'
                            : 'bg-panel text-ink'
                      }`}
                    />
                  </label>
                );
              })}
            </div>

            <p className="mt-3 text-[12px] leading-[1.5] text-ink-4">
              {piece.packaging === CUSTOM
                ? 'Measure the longest points of your carton. Rough is fine — we re-measure everything at the depot.'
                : 'This is a box we supply, so its size is fixed. Choose “Custom size” to enter your own measurements. Weight is always yours to enter.'}
            </p>
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
