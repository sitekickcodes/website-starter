import type { GlobalConfig } from "payload";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site Settings",
  admin: {
    group: "Admin",
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        if (req.context.disableRevalidate) return doc;
        try {
          const { revalidatePath, revalidateTag } = await import("next/cache");
          // Site settings, social links, and analytics all read from this
          // global, so bust all three cache tags. Then revalidate the layout
          // since these values appear in the header/footer of every page.
          revalidateTag("cms:site-settings", "max");
          revalidateTag("cms:social-links", "max");
          revalidateTag("cms:analytics", "max");
          revalidatePath("/", "layout");
          req.payload.logger.info("[revalidate] site settings");
        } catch {}
        return doc;
      },
    ],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        /* ── General ── */
        {
          label: "General",
          description:
            "Site identity, contact info, and defaults.",
          fields: [
            {
              name: "siteName",
              label: "Site Name",
              type: "text",
              required: true,
              defaultValue: "My Site",
              admin: {
                description: 'Appears after every page title — e.g. "Events | My Site".',
              },
            },
            {
              name: "siteDescription",
              label: "Site Description",
              type: "textarea",
              admin: {
                description:
                  "Default meta description used on the homepage and as a fallback for pages without one.",
              },
            },
            {
              type: "ui",
              name: "siteSearchPreview",
              label: " ",
              admin: {
                components: {
                  Field: "@/components/payload/search-preview#SiteSettingsSearchPreview",
                },
              },
            },
            {
              name: "favicon",
              label: "Favicon",
              type: "upload",
              relationTo: "media",
              admin: {
                description:
                  "The small icon shown in browser tabs and bookmarks. Upload a 64×64px PNG.",
              },
            },
            {
              name: "ogImage",
              label: "Default Social Image",
              type: "upload",
              relationTo: "media",
              admin: {
                description:
                  "Default image shown when pages are shared on social media. Recommended: 1200×630px.",
              },
            },
            {
              name: "contact",
              type: "group",
              label: "Contact Info",
              fields: [
                {
                  name: "businessName",
                  label: "Business Name",
                  type: "text",
                  admin: {
                    description:
                      "Legal or display name of the business. Used in the admin panel title.",
                  },
                },
                {
                  name: "email",
                  type: "email",
                  admin: {
                    placeholder: "hello@example.com",
                    description: "Primary contact email shown on the site.",
                  },
                },
                {
                  name: "phone",
                  type: "text",
                  admin: {
                    placeholder: "+1 (555) 123-4567",
                  },
                },
                {
                  name: "street",
                  type: "text",
                  admin: { placeholder: "123 Main St" },
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "city",
                      type: "text",
                      admin: { placeholder: "Austin" },
                    },
                    {
                      name: "state",
                      type: "text",
                      admin: { placeholder: "TX" },
                    },
                    {
                      name: "zip",
                      label: "ZIP Code",
                      type: "text",
                      admin: { placeholder: "78701" },
                    },
                  ],
                },
              ],
            },
          ],
        },

        /* ── Analytics ── */
        {
          label: "Analytics",
          description: "Tracking and analytics integrations.",
          fields: [
            {
              name: "googleAnalyticsId",
              label: "Google Analytics ID",
              type: "text",
              admin: {
                placeholder: "G-XXXXXXXXXX",
                description:
                  "Your GA4 measurement ID. Leave empty to disable.",
              },
            },
            {
              name: "googleTagManagerId",
              label: "Google Tag Manager ID",
              type: "text",
              admin: {
                placeholder: "GTM-XXXXXXX",
                description:
                  "GTM container ID. Use this if you manage tags through Tag Manager instead of adding them individually.",
              },
            },
            {
              name: "facebookPixelId",
              label: "Facebook Pixel ID",
              type: "text",
              admin: {
                placeholder: "1234567890",
                description:
                  "Meta Pixel ID for Facebook/Instagram ad tracking.",
              },
            },
          ],
        },

        /* ── Social Links ── */
        {
          label: "Social Links",
          description: "Social media profile links displayed on the site.",
          fields: [
            {
              name: "instagram",
              type: "text",
              admin: {
                placeholder: "https://instagram.com/yourhandle",
              },
            },
            {
              name: "facebook",
              type: "text",
              admin: {
                placeholder: "https://facebook.com/yourpage",
              },
            },
            {
              name: "x",
              label: "X (Twitter)",
              type: "text",
              admin: { placeholder: "https://x.com/yourhandle" },
            },
            {
              name: "google",
              label: "Google",
              type: "text",
              admin: {
                description: "Google Maps or Google Business profile URL.",
                placeholder: "https://www.google.com/maps/place/...",
              },
            },
            {
              name: "linkedin",
              type: "text",
              admin: {
                placeholder: "https://linkedin.com/company/yourcompany",
              },
            },
            {
              name: "youtube",
              type: "text",
              admin: {
                placeholder: "https://youtube.com/@yourchannel",
              },
            },
            {
              name: "tiktok",
              type: "text",
              admin: {
                placeholder: "https://tiktok.com/@yourhandle",
              },
            },
          ],
        },

        /* ── Scripts ── */
        {
          label: "Scripts",
          description:
            "Custom code injected into the page. Use for tracking, widgets, or third-party integrations.",
          fields: [
            {
              name: "headScripts",
              label: "Head Scripts",
              type: "code",
              admin: {
                language: "html",
                description:
                  "Custom code injected into the <head> tag. Use for tracking scripts, meta tags, or third-party integrations.",
              },
            },
            {
              name: "bodyScripts",
              label: "Body Scripts",
              type: "code",
              admin: {
                language: "html",
                description:
                  "Custom code injected before the closing </body> tag. Use for chat widgets, analytics, or other scripts.",
              },
            },
          ],
        },

        /* ── Redirects ── */
        {
          label: "Redirects",
          description:
            "Redirect old URLs to new ones to maintain search engine ranking.",
          fields: [
            {
              name: "redirects",
              label: " ",
              type: "array",
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: {
                    path: "@/components/payload/RedirectRowLabel",
                  },
                },
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "from",
                      type: "text",
                      required: true,
                      admin: {
                        placeholder: "/old-page",
                        description:
                          "The URL path to redirect from (e.g. /old-page)",
                      },
                    },
                    {
                      name: "to",
                      type: "text",
                      required: true,
                      admin: {
                        placeholder: "/new-page",
                        description: "The URL path to redirect to",
                      },
                    },
                    {
                      name: "type",
                      type: "select",
                      required: true,
                      defaultValue: "301",
                      options: [
                        { label: "301 — Permanent", value: "301" },
                        { label: "302 — Temporary", value: "302" },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
