import { Link } from 'react-router-dom';
import type { CurrentUser } from '@/lib/admin';

/**
 * Shown when the server refuses a page for this role.
 *
 * The server is the authority and it said no — so this is not an apology, it
 * is a signpost to the pages this person can actually use.
 */
export function NoAccess({
  user,
  message,
  alternatives,
}: {
  user: CurrentUser | null;
  message: string;
  alternatives: { label: string; to: string }[];
}) {
  return (
    <div className="flex flex-grow items-center justify-center px-8 py-20">
      <div className="max-w-[46ch] text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-warn-tint px-4 py-2 text-[12px] font-bold text-warn-ink">
          {user?.roleLabel ?? 'Not signed in'}
        </span>
        <h1 className="text-[24px] font-bold leading-tight tracking-[-0.02em]">Not for your role</h1>
        <p className="mt-3 text-[15px] leading-[1.6] text-ink-3">{message}</p>

        {alternatives.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {alternatives.map((alt) => (
              <Link
                key={alt.to}
                to={alt.to}
                className="rounded-[10px] border border-rule bg-panel px-4 py-[10px] text-[14px] font-semibold text-ink-2"
              >
                {alt.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
