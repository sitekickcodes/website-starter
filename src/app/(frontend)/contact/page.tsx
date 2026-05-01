import type { Metadata } from "next";
import { MapPin, Phone, Mail } from "lucide-react";
import { pageMetadata } from "@/lib/page-metadata";
import { ContactForm } from "@/components/contact/contact-form";
import { cms } from "@/lib/cms";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/contact", {
    title: "Contact",
    description: "Get in touch with us. We'd love to hear from you.",
  });
}

export default async function ContactPage() {
  const [settings, socialLinks] = await Promise.all([
    cms.getSiteSettings(),
    cms.getSocialLinks(),
  ]);
  const contact = settings.contact;

  return (
    <section className="container section-lg">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="h2">Contact Us</h1>
        <p className="body-md mt-3 text-muted-foreground">
          Have a question or want to work together? We&apos;d love to hear from you.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-10 lg:grid-cols-[1fr_1.2fr]">
        {/* Contact info */}
        {(contact?.street || contact?.phone || contact?.email) && (
          <div className="space-y-6">
            <h2 className="h5">Get in Touch</h2>
            <div className="space-y-4">
              {contact?.street && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                  <a
                    href={socialLinks?.google || `https://maps.google.com/?q=${encodeURIComponent(`${contact.street}, ${contact.city}, ${contact.state} ${contact.zip}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="body-md text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {contact.street}
                    <br />
                    {contact.city}, {contact.state} {contact.zip}
                  </a>
                </div>
              )}
              {contact?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="size-5 shrink-0 text-muted-foreground" />
                  <a
                    href={`tel:${contact.phone.replace(/\D/g, "")}`}
                    className="body-md text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact?.email && (
                <div className="flex items-center gap-3">
                  <Mail className="size-5 shrink-0 text-muted-foreground" />
                  <a
                    href={`mailto:${contact.email}`}
                    className="body-md text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {contact.email}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact form */}
        <ContactForm />
      </div>
    </section>
  );
}
