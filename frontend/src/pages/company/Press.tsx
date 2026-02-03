import { useState } from "react";
import { Download, Mail, Newspaper } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";

const Press = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", outlet: "", message: "" });

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText("press@tesbinn.com");
      toast({ title: "Email copied", description: "press@tesbinn.com" });
    } catch {
      toast({ title: "Copy failed", description: "Unable to access clipboard.", variant: "destructive" });
    }
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast({
        title: "Missing details",
        description: "Add your name and email for press inquiries.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Request received",
      description: "Our press team will respond shortly.",
    });
    setForm({ name: "", email: "", outlet: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="bg-hero py-12 lg:py-16">
          <div className="container-wide section-padding space-y-4 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Press</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              TESBINN press and media resources
            </h1>
            <p className="text-muted-foreground">
              Access our latest announcements, brand assets, and media contacts.
            </p>
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="container-wide section-padding grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-border p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Press highlights</h2>
                </div>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>TESBINN launches new professional certification tracks.</li>
                  <li>Expanded course catalog for digital trade and marketing.</li>
                  <li>Platform growth milestones across East Africa.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-border p-6 space-y-3">
                <h3 className="text-lg font-semibold">Brand assets</h3>
                <p className="text-sm text-muted-foreground">
                  Download TESBINN logos, product screenshots, and brand guidelines.
                </p>
                <Button variant="outline" asChild>
                  <a href="#" onClick={(event) => event.preventDefault()}>
                    <Download className="mr-2 h-4 w-4" />
                    Download press kit
                  </a>
                </Button>
              </div>
              <div className="rounded-2xl border border-border p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-secondary" />
                  <h3 className="text-lg font-semibold">Media contact</h3>
                </div>
                <p className="text-sm text-muted-foreground">press@tesbinn.com</p>
                <Button variant="ghost" size="sm" onClick={handleCopyEmail}>
                  Copy email
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-muted/40 p-6 space-y-4">
              <h2 className="text-lg font-semibold">Press inquiry</h2>
              <div className="space-y-3">
                <Input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Full name"
                />
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="Email"
                />
                <Input
                  value={form.outlet}
                  onChange={(event) => setForm((prev) => ({ ...prev, outlet: event.target.value }))}
                  placeholder="Media outlet"
                />
                <Textarea
                  value={form.message}
                  onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                  placeholder="Tell us about your request."
                  rows={4}
                />
              </div>
              <Button onClick={handleSubmit}>Send request</Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Press;
