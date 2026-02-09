import { Lock, Eye, Database, Share2, Mail } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";

const dataBlocks = [
  {
    title: "Information we collect",
    items: [
      "Account details such as name, email, phone number, and role.",
      "Course activity, progress, and assessment outcomes.",
      "Payment details and billing history when you purchase services.",
      "Messages, support requests, and feedback you send to us.",
      "Device and usage data like IP address, browser type, and cookies.",
    ],
  },
  {
    title: "How we use your information",
    items: [
      "Provide course access, certificates, and learning experiences.",
      "Process payments, invoices, and enrollment requests.",
      "Improve platform performance, security, and personalization.",
      "Communicate with you about updates, support, and new services.",
      "Comply with legal obligations and prevent misuse.",
    ],
  },
  {
    title: "When we share information",
    items: [
      "With instructors and organizations to deliver training services.",
      "With service providers that support hosting, analytics, and payments.",
      "To comply with legal requests or protect user safety.",
    ],
  },
];

const privacySections = [
  {
    title: "Security",
    content:
      "We use administrative, technical, and organizational safeguards to protect your information. No method of transmission is completely secure, but we work to protect your data.",
  },
  {
    title: "Data retention",
    content:
      "We retain personal data only as long as necessary to provide services, meet legal requirements, or resolve disputes.",
  },
  {
    title: "Your choices",
    content:
      "You can access, correct, or delete your account information by visiting your settings or contacting support. You can also opt out of marketing emails at any time.",
  },
  {
    title: "Children's privacy",
    content:
      "TESBINN is not directed to children under 13. We do not knowingly collect data from children under 13.",
  },
  {
    title: "International transfers",
    content:
      "Your information may be processed in countries where our service providers operate. We take steps to ensure appropriate safeguards are in place.",
  },
  {
    title: "Updates to this policy",
    content:
      "We may update this policy periodically. We will notify you about material changes through the platform or via email.",
  },
];

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="bg-hero py-12 lg:py-16">
          <div className="container-wide section-padding">
            <div className="max-w-3xl space-y-4">
              <Badge className="bg-primary/10 text-primary border border-primary/20">
                Privacy
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                Privacy Policy
              </h1>
              <p className="text-muted-foreground">
                This policy explains what information we collect, how we use it, and the choices you have.
              </p>
              <div className="text-sm text-muted-foreground">
                Last updated: February 4, 2026
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="container-narrow section-padding space-y-10">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-secondary" />
                </div>
                <h2 className="text-lg font-semibold">Protected by design</h2>
                <p className="text-sm text-muted-foreground">
                  We use security controls, access limitations, and monitoring to protect data.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Transparent use</h2>
                <p className="text-sm text-muted-foreground">
                  We explain why we collect data and how it supports your learning experience.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Database className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-lg font-semibold">Respectful retention</h2>
                <p className="text-sm text-muted-foreground">
                  We keep information only as long as needed for services and compliance.
                </p>
              </div>
            </div>

            <div className="grid gap-6">
              {dataBlocks.map((block) => (
                <div key={block.title} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="text-lg font-semibold text-foreground">{block.title}</h3>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc list-inside">
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {privacySections.map((section) => (
                <div key={section.title} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{section.content}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-muted/40 p-6">
              <div className="flex items-start gap-3">
                <Share2 className="h-5 w-5 text-secondary mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Questions or requests?</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Contact our privacy team at contact@tesbinn.com or write to
                    Bole Medhanialem Helzer Tower 8th Floor, Addis Ababa, Ethiopia.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                privacy@tesbinn.com
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
