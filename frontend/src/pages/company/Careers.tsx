import { useMemo, useState } from "react";
import { MapPin, Briefcase, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";

const roles = [
  {
    id: "instr-ops",
    title: "Instructor Operations Lead",
    team: "Learning",
    location: "Addis Ababa",
    type: "Full-time",
  },
  {
    id: "content-strat",
    title: "Content Strategy Specialist",
    team: "Content",
    location: "Remote",
    type: "Contract",
  },
  {
    id: "growth",
    title: "Growth Marketing Manager",
    team: "Marketing",
    location: "Addis Ababa",
    type: "Full-time",
  },
  {
    id: "platform-success",
    title: "Platform Success Associate",
    team: "Customer",
    location: "Remote",
    type: "Full-time",
  },
];

const Careers = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [email, setEmail] = useState("");

  const filteredRoles = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return roles.filter((role) => {
      if (teamFilter !== "all" && role.team !== teamFilter) return false;
      if (!normalized) return true;
      return role.title.toLowerCase().includes(normalized);
    });
  }, [search, teamFilter]);

  const handleAlertSignup = () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Add an email to receive job alerts.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Job alert created",
      description: "We will notify you when new roles open.",
    });
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="relative py-12 lg:py-16 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "linear-gradient(120deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.9) 45%, rgba(255,255,255,0.85) 100%), url('https://cloud.appwrite.io/v1/storage/buckets/68de2cd2000edc9d02c9/files/lesson-4f80e72498ff49918ef41e8ad932/view?project=66fa8216001614a2f7cd')",
            }}
            aria-hidden="true"
          />
          <div className="container-wide section-padding space-y-4 max-w-3xl relative z-10">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Careers</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              Build the future of learning with TESBINN
            </h1>
            <p className="text-muted-foreground">
              Join a team focused on practical education, business impact, and scalable digital
              systems across Africa and beyond.
            </p>
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="container-wide section-padding space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Open roles</h2>
                <p className="text-sm text-muted-foreground">
                  Explore roles that match your strengths.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search roles"
                  className="w-56"
                />
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All teams</SelectItem>
                    <SelectItem value="Learning">Learning</SelectItem>
                    <SelectItem value="Content">Content</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4">
              {filteredRoles.map((role) => (
                <div
                  key={role.id}
                  className="rounded-2xl border border-border p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{role.title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        {role.team}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {role.location}
                      </span>
                      <span>{role.type}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      toast({
                        title: "Application started",
                        description: `We will follow up about the ${role.title} role.`,
                      })
                    }
                  >
                    Apply now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ))}
              {!filteredRoles.length && (
                <p className="text-sm text-muted-foreground">No roles match your search.</p>
              )}
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-16 bg-card">
          <div className="container-wide section-padding">
            <div className="rounded-2xl border border-border bg-muted/40 p-6 lg:p-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold">Get job alerts</h2>
                  <p className="text-sm text-muted-foreground">
                    Share your email and we will notify you about new opportunities.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                  <Button onClick={handleAlertSignup}>Notify me</Button>
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

export default Careers;
