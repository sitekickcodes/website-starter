import type { GlobalConfig } from "payload";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site Settings",
  admin: {
    group: "Admin",
  },
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        if (req.context?.disableRevalidate) return doc;
        try {
          const { revalidatePath, revalidateTag } = await import("next/cache");
          revalidateTag("cms:site-settings", "max");
          revalidatePath("/");
        } catch {}
        return doc;
      },
    ],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Analytics",
          fields: [
            {
              name: "analytics",
              type: "group",
              fields: [
                {
                  name: "googleAnalyticsId",
                  label: "Google Analytics ID",
                  type: "text",
                  admin: {
                    description: "Example: G-XXXXXXXXXX",
                  },
                },
                {
                  name: "googleTagManagerId",
                  label: "Google Tag Manager ID",
                  type: "text",
                  admin: {
                    description: "Example: GTM-XXXXXXX",
                  },
                },
                {
                  name: "metaPixelId",
                  label: "Meta Pixel ID",
                  type: "text",
                },
                {
                  name: "posthogKey",
                  label: "PostHog Project API Key",
                  type: "text",
                },
                {
                  name: "posthogHost",
                  label: "PostHog Host",
                  type: "text",
                  defaultValue: "https://us.i.posthog.com",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
