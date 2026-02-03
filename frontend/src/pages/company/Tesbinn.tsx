import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Layers, Gauge, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";

const Tesbinn = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", organization: "", notes: "" });

  const handleRequest = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast({
        title: "Missing details",
        description: "Add your name and email to request a demo.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Request received",
      description: "The TESBINN team will reach out within 1-2 business days.",
    });
    setForm({ name: "", email: "", organization: "", notes: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="bg-hero py-12 lg:py-16">
          <div className="container-wide section-padding">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">TESBINN</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                A smart platform experience built for outcomes
              </h1>
              <p className="text-muted-foreground">
                TESBINN combines learning, certification, and business enablement in a single
                platform so organizations can train, track, and grow with confidence.
              </p>
              <Button asChild>
                <Link to="/courses">
                  Explore the catalog
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="container-wide section-padding">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Modular learning</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Structured lessons, downloadable resources, and milestone certifications that
                  keep learners moving forward.
                </p>
              </div>
              <div className="rounded-2xl border border-border p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-secondary" />
                  <h2 className="text-lg font-semibold">Progress intelligence</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Track learner progress, completion, and outcomes from a unified dashboard with
                  actionable insights.
                </p>
              </div>
              <div className="rounded-2xl border border-border p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-success" />
                  <h2 className="text-lg font-semibold">Secure delivery</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Reliable authentication, certificate issuance, and platform controls built for
                  scale.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-16 bg-card">
          <div className="container-wide section-padding">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Why teams choose TESBINN</h2>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Practical training designed for real-world application.</li>
                  <li>Flexible delivery for individuals, teams, and enterprises.</li>
                  <li>Detailed progress tracking with completion reporting.</li>
                  <li>Certification workflows aligned with industry needs.</li>
                  <li>Ongoing platform enhancements based on user feedback.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-muted/40 p-6 space-y-4">
                <h3 className="text-lg font-semibold">Request a demo</h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="demo-name">Name</Label>
                    <Input
                      id="demo-name"
                      value={form.name}
                      onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="demo-email">Email</Label>
                    <Input
                      id="demo-email"
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, email: event.target.value }))
                      }
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="demo-org">Organization</Label>
                    <Input
                      id="demo-org"
                      value={form.organization}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, organization: event.target.value }))
                      }
                      placeholder="Company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="demo-notes">Notes</Label>
                    <Textarea
                      id="demo-notes"
                      value={form.notes}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, notes: event.target.value }))
                      }
                      placeholder="Tell us what you want to solve."
                      rows={3}
                    />
                  </div>
                </div>
                <Button onClick={handleRequest}>Submit request</Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Tesbinn;
