import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-5xl font-semibold tracking-tight">404</h1>
      <p className="text-muted-foreground">
        The page you&rsquo;re looking for doesn&rsquo;t exist.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Back to home
      </Link>
    </div>
  );
}
