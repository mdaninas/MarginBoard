"use client";

import { useEffect } from "react";

// Error boundaries render outside the I18nProvider tree in some Next.js
// scenarios, so we use hardcoded strings here to avoid a missing-context crash.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled page error", error);
  }, [error]);

  return (
    <div className="card p-8 max-w-xl">
      <p className="font-semibold text-bad">Something went wrong</p>
      <p className="text-sm text-ink-muted mt-2">
        The page could not be rendered. This usually means the backend is
        unreachable, or an unexpected exception occurred.
      </p>
      {error.message && (
        <pre className="text-xs bg-surface-2 border border-rule rounded-mb-2 p-3 mt-3 overflow-x-auto">
          {error.message}
        </pre>
      )}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="bg-accent text-white text-sm font-medium px-3 py-1.5 rounded-mb-1 hover:opacity-90"
        >
          Try again
        </button>
        <a
          href="/overview"
          className="border border-rule text-sm font-medium px-3 py-1.5 rounded-mb-1 hover:bg-surface-2"
        >
          Back to overview
        </a>
      </div>
    </div>
  );
}
