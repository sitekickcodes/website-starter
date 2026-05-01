import { cms } from "@/lib/cms";
import { JsonLd } from "@/components/json-ld";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/structured-data";

// ISR: serve a cached render and rebuild at most once per hour. Inside the
// admin's Live Preview iframe, /api/draft enables draftMode and the render
// bypasses this cache. CMS edits trigger revalidatePath() via afterChange
// hooks so published changes also invalidate.
export const revalidate = 3600;

export default async function Home() {
  const [settings, socialLinks] = await Promise.all([
    cms.getSiteSettings(),
    cms.getSocialLinks(),
  ]);

  return (
    <>
      <JsonLd data={buildOrganizationSchema(settings, socialLinks)} />
      <JsonLd data={buildWebSiteSchema(settings)} />

      {/* Hero */}
      <section className="container section-lg flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="hero-text-reveal">
          <p className="type-eyebrow text-muted-foreground">Welcome to</p>
        </div>
        <h1 className="h1 mt-4 hero-text-reveal" style={{ animationDelay: "100ms" }}>
          {settings.siteName}
        </h1>
        {settings.siteDescription && (
          <p
            className="body-lg mt-6 max-w-lg text-muted-foreground hero-text-reveal"
            style={{ animationDelay: "200ms" }}
          >
            {settings.siteDescription}
          </p>
        )}
        <div className="mt-10 flex gap-4 hero-text-reveal" style={{ animationDelay: "300ms" }}>
          <a
            href="/contact"
            className="type-button inline-flex items-center rounded-full bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get in Touch
          </a>
          <a
            href="/about"
            className="type-button inline-flex items-center rounded-full border border-border px-6 py-3 transition-colors hover:bg-muted"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Newsletter */}
      <AnimateOnScroll>
        <section className="container section border-t border-border">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="h3">Stay in the loop</h2>
            <p className="body-md mt-3 text-muted-foreground">
              Subscribe to get updates and news straight to your inbox.
            </p>
            <div className="mx-auto mt-6 max-w-sm">
              <NewsletterForm />
            </div>
          </div>
        </section>
      </AnimateOnScroll>
    </>
  );
}
