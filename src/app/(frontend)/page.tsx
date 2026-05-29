import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Sitekick Starter</h1>
      <p className="text-muted-foreground">
        A minimal Next.js + Payload CMS starter. Edit{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
          src/app/(frontend)/page.tsx
        </code>{" "}
        to start building, or head to{" "}
        <Link
          className="underline underline-offset-4"
          href="/admin"
          prefetch={false}
        >
          /admin
        </Link>
        .
      </p>
    </div>
  );
}
