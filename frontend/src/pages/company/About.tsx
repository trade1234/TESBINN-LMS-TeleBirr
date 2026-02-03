import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Target, Lightbulb, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";

const About = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const handleSubscribe = () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Add a valid email address to subscribe.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Subscribed",
      description: "You will receive TESBINN updates and product news.",
    });
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="bg-hero py-12 lg:py-16">
          <div className="container-wide section-padding">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">About TESBINN</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                Empowering modern learning and business growth
              </h1>
              <p className="text-muted-foreground">
                TESBINN is a modern digital learning and business support platform designed to
                empower individuals, professionals, and enterprises with practical knowledge,
                skills, and tools for today's competitive and digital-driven economy.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="container-wide section-padding">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <div className="space-y-6">
                <div className="glass-card rounded-2xl border border-border p-6 space-y-3">
                  <h2 className="text-xl font-semibold">Who we are</h2>
                  <p className="text-sm text-muted-foreground">
                    Built with a strong focus on education, innovation, and accessibility, TESBINN
                    delivers high-quality training programs, digital resources, and certification
                    systems that help learners and organizations grow sustainably and confidently.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Our mission</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Bridge the gap between knowledge and real-world application with practical,
                      industry-focused training and digital solutions.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-secondary" />
                      <h3 className="text-lg font-semibold">Our vision</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Become a leading digital learning platform in Africa and beyond, recognized
                      for innovation, quality education, and impact-driven solutions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-muted/30 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-success" />
                  <h3 className="text-lg font-semibold">TESBINN at a glance</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Digital learning platform</li>
                  <li>Professional and business training</li>
                  <li>Certification and skill development</li>
                  <li>Technology-driven education</li>
                  <li>Built for the future of learning</li>
                </ul>
                <Button variant="outline" asChild>
                  <Link to="/courses">
                    Explore trainings
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-16 bg-card">
          <div className="container-wide section-padding space-y-8">
            <div className="max-w-3xl space-y-3">
              <h2 className="text-2xl font-semibold">What we offer</h2>
              <p className="text-sm text-muted-foreground">
                TESBINN combines digital learning with business-ready guidance to support learners
                and organizations across the region.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border p-5 space-y-2">
                <h3 className="text-lg font-semibold">Digital learning and training</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Online courses with structured lessons</li>
                  <li>Downloadable materials and guides</li>
                  <li>Certification upon completion</li>
                  <li>Practical, skill-based programs</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-border p-5 space-y-2">
                <h3 className="text-lg font-semibold">Business development</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Training in digital marketing and trade</li>
                  <li>Business systems and growth strategy</li>
                  <li>Technology adoption guidance</li>
                  <li>Industry-relevant expertise</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-border p-5 space-y-2">
                <h3 className="text-lg font-semibold">Smart platform experience</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>User-friendly dashboards</li>
                  <li>Secure accounts and progress tracking</li>
                  <li>Scalable for teams and enterprises</li>
                  <li>Continuously improving tools</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="container-wide section-padding">
            <div className="rounded-2xl border border-border bg-muted/40 p-6 lg:p-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-center">
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold">Stay connected with TESBINN</h2>
                  <p className="text-sm text-muted-foreground">
                    Subscribe for platform updates, new course launches, and success stories from
                    the TESBINN community.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                  <Button onClick={handleSubscribe}>Subscribe</Button>
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

export default About;
