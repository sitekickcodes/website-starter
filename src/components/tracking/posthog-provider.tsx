"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

type Props = {
  children: React.ReactNode;
  posthogKey?: string;
  posthogHost?: string;
};

let initializedConfig: string | undefined;

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!ph || !pathname) return;
    const url = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, ph]);

  return null;
}

export function PostHogProvider({
  children,
  posthogKey,
  posthogHost = "https://us.i.posthog.com",
}: Props) {
  useEffect(() => {
    const configKey = `${posthogKey}:${posthogHost}`;
    if (!posthogKey || initializedConfig === configKey) return;
    posthog.init(posthogKey, {
      api_host: posthogHost,
      capture_pageview: false,
      capture_pageleave: true,
    });
    initializedConfig = configKey;
  }, [posthogKey, posthogHost]);

  if (!posthogKey) return children;

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}
