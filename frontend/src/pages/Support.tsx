import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Bug,
  CalendarCheck,
  ChevronRight,
  ClipboardCheck,
  Headphones,
  LifeBuoy,
  Mail,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  Wrench,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const quickActions = [
  {
    title: "Live chat with support",
    description: "Get real-time answers from a TESBINN specialist.",
    icon: MessageCircle,
    cta: "Start chat",
    tone: "bg-secondary text-secondary-foreground",
  },
  {
    title: "Create a support ticket",
    description: "Track progress and upload files in one place.",
    icon: Ticket,
    cta: "Open ticket",
    tone: "bg-accent text-accent-foreground",
  },
  {
    title: "Call our hotline",
    description: "Talk to an expert for urgent or billing questions.",
    icon: Phone,
    cta: "Call now",
    tone: "bg-primary text-primary-foreground",
  },
];

const supportPillars = [
  {
    title: "Getting started",
    description: "Accounts, onboarding, and first course setup.",
    icon: Sparkles,
  },
  {
    title: "Learning experience",
    description: "Course access, progress tracking, and certificates.",
    icon: BookOpen,
  },
  {
    title: "Technical help",
    description: "Playback issues, device checks, and system status.",
    icon: Wrench,
  },
  {
    title: "Security & privacy",
    description: "Password resets, permissions, and data protection.",
    icon: ShieldCheck,
  },
  {
    title: "Community & cohorts",
    description: "Class schedules, reminders, and collaboration tools.",
    icon: Users,
  },
  {
    title: "Teaching & admin",
    description: "Instructor tools, approvals, and analytics.",
    icon: BrainCircuit,
  },
];

const responseTargets = [
  { title: "Live chat", value: "< 5 min", note: "Weekdays 9am - 6pm EAT" },
  { title: "Email support", value: "< 4 hrs", note: "Mon - Sat coverage" },
  { title: "Critical incident", value: "< 30 min", note: "24/7 escalation" },
];

const faqs = [
  {
    question: "How do I reset my password?",
    answer:
      "Use the Forgot Password link on the sign-in page. We send a secure reset link to your registered email. If you do not receive it within 5 minutes, check spam or contact support.",
  },
  {
    question: "Where can I find my course certificates?",
    answer:
      "Certificates appear under Student Dashboard > Certificates once you complete all required lessons and assessments.",
  },
  {
    question: "How do I switch my learning mode or schedule?",
    answer:
      "Open the course details page and review the schedule options. If your cohort requires approval, submit a schedule change request from the course page.",
  },
  {
    question: "My video is buffering. What should I do?",
    answer:
      "Try lowering the video quality, close background downloads, and refresh the player. If the issue persists, run the device check below or contact support with your device details.",
  },
  {
    question: "How do I contact my instructor?",
    answer:
      "Inside your course player, use the Message Instructor button or the class community feed. You can also open a ticket and choose Instructor Support.",
  },
  {
    question: "Can I update my billing details?",
    answer:
      "Yes. Go to Account Settings > Billing. For invoiced organizations, open a ticket and select Billing so our team can assist you.",
  },
];

const studentGuides = [
  {
    title: "Start your first course",
    description: "Enroll, access modules, and track completion.",
  },
  {
    title: "Join a live session",
    description: "Add calendar reminders and join on time.",
  },
  {
    title: "Download your certificate",
    description: "Verify completion and export as PDF.",
  },
];

const teacherGuides = [
  {
    title: "Publish a new module",
    description: "Upload lessons, quizzes, and resources quickly.",
  },
  {
    title: "Manage student requests",
    description: "Approve enrollments and monitor progress.",
  },
  {
    title: "Track engagement",
    description: "Review analytics and attendance trends.",
  },
];

const adminGuides = [
  {
    title: "User approvals",
    description: "Verify profiles and assign roles securely.",
  },
  {
    title: "Advert management",
    description: "Schedule promotions and update banners.",
  },
  {
    title: "Compliance exports",
    description: "Download audits and training reports.",
  },
];

const deviceChecklist = [
  "Stable internet connection (5 Mbps or higher)",
  "Updated browser (Chrome, Edge, or Firefox)",
  "Pop-ups allowed for live sessions",
  "Audio output enabled for videos",
  "Camera access for interactive classes",
];

const supportContacts = [
  {
    title: "Email support",
    value: "support@tesbinn.com",
    icon: Mail,
    detail: "Replies within 4 business hours.",
  },
  {
    title: "Phone hotline",
    value: "+251 (0) 11 234 5678",
    icon: Phone,
    detail: "Weekdays, 9am - 6pm EAT.",
  },
  {
    title: "Community help",
    value: "Community Forum",
    icon: Users,
    detail: "Ask peers and mentors anytime.",
  },
];

const Support = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero */}
        <section className="pt-20 bg-gradient-hero relative overflow-hidden">
          <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute top-32 -left-10 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
          <div className="container-wide section-padding py-16 lg:py-20 relative">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
              <div>
                <Badge className="mb-4 bg-secondary/10 text-secondary border border-secondary/20">
                  Help & Support Hub
                </Badge>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                  We are here to keep your learning moving.
                </h1>
                <p className="mt-4 text-muted-foreground max-w-xl">
                  Get immediate answers, explore step-by-step guides, or connect with our team.
                  Everything you need to succeed is in one place.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search help articles, billing, or technical issues"
                      className="h-12 pl-10 bg-background/90 border-border/60"
                    />
                  </div>
                  <Button className="h-12 btn-gradient">
                    Search support
                  </Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>Popular:</span>
                  <span className="rounded-full bg-muted px-3 py-1">Reset password</span>
                  <span className="rounded-full bg-muted px-3 py-1">Join live class</span>
                  <span className="rounded-full bg-muted px-3 py-1">Certificate download</span>
                  <span className="rounded-full bg-muted px-3 py-1">Billing help</span>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6 lg:p-8 shadow-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-secondary/10 flex items-center justify-center">
                    <Headphones className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Support availability</p>
                    <p className="text-lg font-semibold text-foreground">Weekdays 9am - 6pm EAT</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {responseTargets.map((target) => (
                    <div
                      key={target.title}
                      className="flex items-center justify-between rounded-xl border border-border/70 bg-background/80 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{target.title}</p>
                        <p className="text-xs text-muted-foreground">{target.note}</p>
                      </div>
                      <span className="text-sm font-semibold text-secondary">{target.value}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="mt-6 w-full">
                  View service status
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section className="py-14 bg-background">
          <div className="container-wide section-padding">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                  Get help in the fastest way for you.
                </h2>
                <p className="text-muted-foreground mt-2 max-w-2xl">
                  Choose a path that matches your urgency. Live chat is best for quick fixes,
                  tickets are ideal for detailed requests, and phone support handles critical needs.
                </p>
              </div>
              <Button variant="ghost" asChild>
                <Link to="/register" className="flex items-center gap-2 text-primary">
                  New here? Start onboarding <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {quickActions.map((action) => (
                <div
                  key={action.title}
                  className="rounded-2xl border border-border bg-card p-6 shadow-card flex flex-col gap-4 card-hover"
                >
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${action.tone}`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{action.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                  </div>
                  <Button className="w-full" variant="outline">
                    {action.cta}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Support pillars */}
        <section className="py-14 bg-muted/50">
          <div className="container-wide section-padding">
            <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
              <div>
                <Badge variant="secondary">Guided Support</Badge>
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground mt-3">
                  Follow structured paths to resolve common requests.
                </h2>
                <p className="text-muted-foreground mt-3">
                  Our support flows combine quick checks, documentation, and escalation to keep
                  you moving without long wait times.
                </p>
                <div className="mt-6 space-y-4">
                  {supportPillars.slice(0, 3).map((pillar, index) => (
                    <div key={pillar.title} className="flex gap-4">
                      <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-secondary">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{pillar.title}</p>
                        <p className="text-sm text-muted-foreground">{pillar.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button className="btn-gradient">Submit a request</Button>
                  <Button variant="outline">Browse knowledge base</Button>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                {supportPillars.map((pillar) => (
                  <div
                    key={pillar.title}
                    className="rounded-2xl border border-border bg-background p-5 shadow-sm hover:shadow-card transition-shadow"
                  >
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                      <pillar.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">{pillar.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{pillar.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Role-based guidance */}
        <section className="py-14 bg-background">
          <div className="container-wide section-padding">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                Personalized help by role.
              </h2>
              <p className="text-muted-foreground mt-3">
                We organize resources based on how you use TESBINN. Choose your role to see the
                most relevant actions and guides.
              </p>
            </div>

            <Tabs defaultValue="students" className="w-full">
              <TabsList className="grid w-full max-w-xl mx-auto grid-cols-3">
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="teachers">Teachers</TabsTrigger>
                <TabsTrigger value="admins">Admins</TabsTrigger>
              </TabsList>
              <TabsContent value="students" className="mt-8">
                <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-6">
                  <div className="rounded-2xl bg-card border border-border p-6 shadow-card">
                    <h3 className="text-lg font-semibold text-foreground">Student essentials</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Quick fixes and resources for your learning journey.
                    </p>
                    <div className="mt-5 grid gap-4">
                      {studentGuides.map((guide) => (
                        <div key={guide.title} className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
                            <CalendarCheck className="h-4 w-4 text-accent" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{guide.title}</p>
                            <p className="text-sm text-muted-foreground">{guide.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border p-6 bg-muted/40">
                    <h3 className="text-base font-semibold text-foreground">Need extra help?</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Send a course issue report and attach screenshots or files.
                    </p>
                    <Button className="mt-4 w-full btn-gradient-accent">Report a course issue</Button>
                    <div className="mt-6 text-xs text-muted-foreground">
                      Most student requests are resolved within 24 hours.
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="teachers" className="mt-8">
                <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-6">
                  <div className="rounded-2xl bg-card border border-border p-6 shadow-card">
                    <h3 className="text-lg font-semibold text-foreground">Instructor toolkit</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Everything you need to run great classes.
                    </p>
                    <div className="mt-5 grid gap-4">
                      {teacherGuides.map((guide) => (
                        <div key={guide.title} className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-lg bg-secondary/10 flex items-center justify-center">
                            <ClipboardCheck className="h-4 w-4 text-secondary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{guide.title}</p>
                            <p className="text-sm text-muted-foreground">{guide.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border p-6 bg-muted/40">
                    <h3 className="text-base font-semibold text-foreground">Teacher priorities</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Request classroom tools, content audits, or engagement insights.
                    </p>
                    <Button className="mt-4 w-full btn-gradient">Submit instructor request</Button>
                    <div className="mt-6 text-xs text-muted-foreground">
                      Priority response within 8 hours for live classes.
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="admins" className="mt-8">
                <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-6">
                  <div className="rounded-2xl bg-card border border-border p-6 shadow-card">
                    <h3 className="text-lg font-semibold text-foreground">Admin operations</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Policies, approvals, and platform health resources.
                    </p>
                    <div className="mt-5 grid gap-4">
                      {adminGuides.map((guide) => (
                        <div key={guide.title} className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{guide.title}</p>
                            <p className="text-sm text-muted-foreground">{guide.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border p-6 bg-muted/40">
                    <h3 className="text-base font-semibold text-foreground">Escalate a case</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Mark an urgent request and our team will respond within 30 minutes.
                    </p>
                    <Button className="mt-4 w-full btn-gradient-accent">Escalate issue</Button>
                    <div className="mt-6 text-xs text-muted-foreground">
                      Escalations are reviewed 24/7 for critical incidents.
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Device check + Status */}
        <section className="py-14 bg-muted/60">
          <div className="container-wide section-padding">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8">
              <div className="rounded-2xl bg-card border border-border p-6 lg:p-8 shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Bug className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Device readiness checklist</h3>
                    <p className="text-sm text-muted-foreground">Quick fixes before opening a ticket.</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  {deviceChecklist.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <LifeBuoy className="h-4 w-4 text-secondary mt-0.5" />
                      <span className="text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="mt-6">
                  Run full diagnostics
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="rounded-2xl border border-border bg-background p-6 lg:p-8">
                <h3 className="text-lg font-semibold text-foreground">Service status</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Real-time health for the TESBINN platform and core services.
                </p>
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">Learning portal</p>
                      <p className="text-xs text-muted-foreground">Web + Mobile</p>
                    </div>
                    <Badge className="bg-success/10 text-success border border-success/20">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">Live classrooms</p>
                      <p className="text-xs text-muted-foreground">Streaming & chat</p>
                    </div>
                    <Badge className="bg-warning/10 text-warning border border-warning/20">Degraded</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">Payments</p>
                      <p className="text-xs text-muted-foreground">Billing & invoices</p>
                    </div>
                    <Badge className="bg-success/10 text-success border border-success/20">Operational</Badge>
                  </div>
                </div>
                <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Incident updates</p>
                  <p className="mt-1">
                    Live classroom latency elevated in East Africa. Teams are applying fixes.
                  </p>
                  <Button variant="outline" className="mt-4 w-full">
                    Subscribe to status alerts
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14 bg-background">
          <div className="container-narrow section-padding">
            <div className="text-center mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Frequently asked questions</h2>
              <p className="text-muted-foreground mt-2">
                Quick answers to the questions we hear most often.
              </p>
            </div>
            <Accordion type="single" collapsible className="w-full rounded-2xl border border-border bg-card px-6">
              {faqs.map((faq) => (
                <AccordionItem key={faq.question} value={faq.question}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Contact */}
        <section className="py-14 bg-muted/50">
          <div className="container-wide section-padding">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 items-start">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Still need help?</h2>
                <p className="text-muted-foreground mt-2">
                  Tell us what you need and we will route you to the right specialist.
                </p>
                <div className="mt-6 grid gap-4">
                  {supportContacts.map((contact) => (
                    <div
                      key={contact.title}
                      className="flex items-start gap-4 rounded-2xl border border-border bg-background p-5"
                    >
                      <div className="h-11 w-11 rounded-xl bg-secondary/10 flex items-center justify-center">
                        <contact.icon className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{contact.title}</p>
                        <p className="text-base font-semibold text-foreground">{contact.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{contact.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 lg:p-8 shadow-card">
                <h3 className="text-lg font-semibold text-foreground">Send a message</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Our team will respond within one business day.
                </p>
                <div className="mt-5 space-y-4">
                  <Input placeholder="Full name" />
                  <Input type="email" placeholder="Email address" />
                  <Input placeholder="Topic (billing, course, technical)" />
                  <Textarea placeholder="Describe your issue and include any screenshots or order numbers." />
                  <Button className="w-full btn-gradient">
                    Send message
                  </Button>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4" />
                    We keep your details private and secure.
                  </div>
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

export default Support;
