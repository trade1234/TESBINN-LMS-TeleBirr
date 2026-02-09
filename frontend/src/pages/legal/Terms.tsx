import { FileText, ShieldCheck, Scale, AlertTriangle } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    title: "1. Acceptance of terms",
    content:
      "By accessing or using TESBINN, you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the platform.",
  },
  {
    title: "2. Eligibility and accounts",
    content:
      "You must be at least 13 years old to use TESBINN. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.",
  },
  {
    title: "3. Subscriptions, payments, and refunds",
    content:
      "Paid courses, memberships, or services may require payment before access is granted. Pricing, taxes, and any refund terms are displayed at checkout or in your course agreement. Failure to pay may result in suspended access.",
  },
  {
    title: "4. Course access and certificates",
    content:
      "Course access is provided for the duration specified at purchase. Certificates are issued upon successful completion of the required lessons or assessments and may be revoked if issued in error or obtained through misuse.",
  },
  {
    title: "5. User content and conduct",
    content:
      "You retain ownership of content you submit, but you grant TESBINN a non-exclusive, worldwide license to host, store, and display that content to deliver the service. You agree not to post unlawful, harmful, or infringing content.",
  },
  {
    title: "6. Prohibited use",
    content:
      "You may not misuse the platform, attempt to gain unauthorized access, disrupt service performance, or use automated systems to access the platform without permission.",
  },
  {
    title: "7. Intellectual property",
    content:
      "TESBINN content, branding, and course materials are protected by intellectual property laws and are licensed to you for personal learning use only unless otherwise stated.",
  },
  {
    title: "8. Third-party services",
    content:
      "TESBINN may link to or integrate with third-party services. We are not responsible for third-party content, services, or policies, and your use of them is governed by their terms.",
  },
  {
    title: "9. Termination",
    content:
      "We may suspend or terminate access if we believe you violated these terms or engaged in harmful conduct. You may stop using the platform at any time.",
  },
  {
    title: "10. Disclaimers",
    content:
      "TESBINN is provided on an as-is and as-available basis. We do not guarantee that the platform will be uninterrupted or error-free.",
  },
  {
    title: "11. Limitation of liability",
    content:
      "To the maximum extent permitted by law, TESBINN is not liable for indirect, incidental, or consequential damages arising from your use of the platform.",
  },
  {
    title: "12. Governing law",
    content:
      "These terms are governed by the laws of Ethiopia, without regard to conflict of law principles. Disputes should be resolved in the courts located in Addis Ababa, Ethiopia.",
  },
  {
    title: "13. Updates to these terms",
    content:
      "We may update these terms from time to time. Material changes will be communicated through the platform or via email.",
  },
];

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="bg-hero py-12 lg:py-16">
          <div className="container-wide section-padding">
            <div className="max-w-3xl space-y-4">
              <Badge className="bg-secondary/10 text-secondary border border-secondary/20">
                Legal
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                Terms of Service
              </h1>
              <p className="text-muted-foreground">
                These terms explain the rules for using TESBINN. Please read them carefully.
              </p>
              <div className="text-sm text-muted-foreground">
                Last updated: February 4, 2026
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="container-narrow section-padding">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Plain language</h2>
                <p className="text-sm text-muted-foreground">
                  We keep these terms readable and summarize key obligations and protections.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-secondary" />
                </div>
                <h2 className="text-lg font-semibold">Responsible use</h2>
                <p className="text-sm text-muted-foreground">
                  Use TESBINN for learning and collaboration without harming others or the platform.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Scale className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-lg font-semibold">Fair standards</h2>
                <p className="text-sm text-muted-foreground">
                  Our policies outline what you can expect and how disputes are handled.
                </p>
              </div>
            </div>

            <div className="mt-10 space-y-6">
              {sections.map((section) => (
                <div key={section.title} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{section.content}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-border bg-muted/40 p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Need clarification?</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Contact our support team at contact@tesbinn.com for questions about these terms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
