"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="text-muted-foreground">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-2 inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
