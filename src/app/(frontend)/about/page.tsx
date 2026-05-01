import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/about", {
    title: "About",
    description: "Learn more about who we are and what we do.",
  });
}

export default function AboutPage() {
  return (
    <section className="container section-lg">
      <div className="mx-auto max-w-2xl">
        <h1 className="h2">About</h1>
        <div className="prose mt-6">
          <p>
            Tell your story here. This is a great place to share your mission,
            values, and what makes your business unique.
          </p>
        </div>
      </div>
    </section>
  );
}
