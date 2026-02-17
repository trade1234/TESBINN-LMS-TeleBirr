import { useEffect, useState } from "react";
import {
  Calendar,
  BookOpen,
  Video,
  MessageSquare,
  Headphones,
  ChevronDown,
  Play,
  Star,
  Smartphone,
  Youtube,
  Ship,
  TrendingUp,
  Megaphone,
  ShoppingBag,
  Coffee,
  Users,
  Bot,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { api } from "@/lib/api";
import type { Advert, ApiResponse, Schedule } from "@/lib/types";

const trainings = [
  { icon: Ship, label: "Import-Export" },
  { icon: TrendingUp, label: "Capital Market" },
  { icon: Megaphone, label: "Digital Marketing" },
  { icon: ShoppingBag, label: "Sales & Marketing" },
  { icon: Coffee, label: "Coffee & Barista" },
  { icon: Users, label: "Customer Service" },
  { icon: Bot, label: "AI for Business" },
  { icon: Truck, label: "Logistics & Supply Chain" },
];

const quickLinks = [
  { icon: Calendar, label: "Class Schedules" },
  { icon: BookOpen, label: "Our Trainings" },
  { icon: Video, label: "Free Videos" },
  { icon: MessageSquare, label: "SMS ON 9295" },
  { icon: Headphones, label: "Help & Support" },
];

type ChannelVideo = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  url: string;
  thumbnail: string;
};

const testimonials = [
  {
    name: "Yared Muluneh",
    avatar: "https://res.cloudinary.com/dznbmggrk/image/upload/ar_1:1,c_crop,g_auto:face,w_300/r_max/photo_2026-02-17_10-56-35_b14dgb",
    content: "After TESBINN's training, I successfully started my own export business.",
  },
  {
    name: "Nigiste G/Egziabher",
    avatar: "https://res.cloudinary.com/dznbmggrk/image/upload/ar_1:1,c_crop,g_auto:face,w_300/r_max/Screenshot_2026-02-17_111922_kdumoj",
    content: "The courses were practical and very informative.",
  },
  {
    name: "Yeabsira Zerihun",
    avatar: "https://res.cloudinary.com/dznbmggrk/image/upload/ar_1:1,c_crop,g_auto:face,w_300/r_max/Gemini_Generated_Image_603se5603se5603s_cwwogx",
    content: "Great experience! Highly recommended.",
  },
];

const promotions = [
  { text: "New Batch Starting Soon!", subtext: "Register Now!", color: "bg-green-600" },
  { text: "20% OFF", subtext: "All Courses This Month!", color: "bg-accent" },
  { text: "Apply for Our", subtext: "Scholarship Program!", color: "bg-secondary" },
];

const formatScheduleDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatMode = (mode: Schedule["mode"]) => {
  if (!mode) return "-";
  return mode.replace(/(^|\s|-)\w/g, (match) => match.toUpperCase()).replace("-", " ");
};

const Landing = () => {
  const [adverts, setAdverts] = useState<Advert[]>([]);
  const [advertsLoading, setAdvertsLoading] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [videos, setVideos] = useState<ChannelVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setAdvertsLoading(true);
      try {
        const res = await api.get<ApiResponse<Advert[]>>("/adverts");
        if (!active) return;
        setAdverts(res.data.data || []);
      } catch (error) {
        if (!active) return;
        setAdverts([]);
      } finally {
        if (active) setAdvertsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setSchedulesLoading(true);
      try {
        const res = await api.get<ApiResponse<Schedule[]>>("/schedules");
        if (!active) return;
        setSchedules(res.data.data || []);
      } catch (error) {
        if (!active) return;
        setSchedules([]);
      } finally {
        if (active) setSchedulesLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setVideosLoading(true);
      setVideosError("");
      try {
        const res = await api.get<ApiResponse<ChannelVideo[]>>(
          "/youtube/videos?handle=tradextv7&limit=3"
        );
        if (!active) return;
        setVideos(res.data.data || []);
      } catch (error) {
        if (!active) return;
        setVideos([]);
        setVideosError("Unable to load videos right now.");
      } finally {
        if (active) setVideosLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-20 bg-hero">
        <div className="container-wide section-padding py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4">
                Trade, Skills & Innovation
                <span className="block text-accent">for Real Business Growth</span>
              </h1>
              <p className="text-muted-foreground mb-6 max-w-lg">
                Practical, Affordable & Market-Driven Trainings in International Trade, Business, Coffee, Digital Marketing & Capital Markets.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  Register for Training
                </Button>
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  asChild
                >
                  <Link to="/schedule">View Class Schedule</Link>
                </Button>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Smartphone className="mr-2 h-4 w-4" />
                  Send SMS ON 9295 
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                src="https://cloud.appwrite.io/v1/storage/buckets/68de2cd2000edc9d02c9/files/lesson-30e0e9831a4b43c9a349d078e74d/view?project=66fa8216001614a2f7cd"
                alt="Training session"
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>

        {/* Quick Links Bar */}
        <div className="bg-primary">
          <div className="container-wide section-padding">
            <div className="flex flex-wrap justify-center gap-4 lg:gap-8 py-4">
              {quickLinks.map((link) => (
                <button
                  key={link.label}
                  className="flex items-center gap-2 text-primary-foreground/90 hover:text-primary-foreground transition-colors text-sm"
                >
                  <link.icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trainings We Offer */}
      <section className="py-12 lg:py-16 bg-card">
        <div className="container-wide section-padding">
          <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8 text-foreground">
            Trainings We Offer
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {trainings.map((training) => (
              <div
                key={training.label}
                className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="p-2 bg-primary/10 rounded-lg">
                  <training.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{training.label}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              View All Trainings
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Upcoming Class Schedules */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="container-wide section-padding">
          <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8 text-foreground">
            Upcoming Class Schedules
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full max-w-4xl mx-auto">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Course</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Start Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Duration</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Mode</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {schedulesLoading ? (
                  <tr>
                    <td className="py-6 px-4 text-center text-muted-foreground" colSpan={6}>
                      Loading schedules...
                    </td>
                  </tr>
                ) : schedules.length ? (
                  schedules.map((schedule) => (
                    <tr key={schedule._id} className="border-b border-border">
                      <td className="py-3 px-4 text-foreground">{schedule.title}</td>
                      <td className="py-3 px-4 text-foreground">
                        {formatScheduleDate(schedule.startDate)}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {schedule.startTime || "-"}
                      </td>
                      <td className="py-3 px-4 text-foreground">{schedule.durationLabel}</td>
                      <td className="py-3 px-4 text-foreground">{formatMode(schedule.mode)}</td>
                      <td className="py-3 px-4">
                        {schedule.ctaUrl && schedule.ctaLabel ? (
                          <Button size="sm" variant="outline" asChild>
                            <a href={schedule.ctaUrl} target="_blank" rel="noreferrer">
                              {schedule.ctaLabel}
                            </a>
                          </Button>
                        ) : (
                          <span className="px-3 py-1 bg-accent text-accent-foreground text-xs font-medium rounded">
                            Open
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-6 px-4 text-center text-muted-foreground" colSpan={6}>
                      No upcoming schedules yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-center text-muted-foreground mt-6 italic">
            Flexible Schedules for Professionals & Students
          </p>
        </div>
      </section>

      {/* Free Learning Section */}
      <section className="py-12 lg:py-16 bg-primary">
        <div className="container-wide section-padding">
          <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8 text-primary-foreground">
            Free Learning from TESBINN
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {videosLoading ? (
              <p className="text-center text-primary-foreground/80 col-span-full">
                Loading videos...
              </p>
            ) : videosError ? (
              <p className="text-center text-primary-foreground/80 col-span-full">
                {videosError}
              </p>
            ) : videos.length ? (
              videos.map((video) => (
                <div key={video.id} className="group cursor-pointer">
                  <div className="relative rounded-lg overflow-hidden mb-3">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                        <Play className="h-5 w-5 text-accent-foreground fill-current" />
                      </div>
                    </div>
                  </div>
                  <p className="text-primary-foreground text-center font-medium">
                    {video.title}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-primary-foreground/80 col-span-full">
                No videos found yet.
              </p>
            )}
          </div>
          <div className="flex justify-center mt-8">
            <Button
              variant="outline"
              className="border-accent bg-secondary text-accent-foreground hover:bg-accent"
              asChild
            >
              <Link to="/videos">
                <Youtube className="mr-2 h-4 w-4" />
                Watch More on YouTube
                <ChevronDown className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 lg:py-16 bg-card">
        <div className="container-wide section-padding">
          <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8 text-foreground">
            What Our Students Say
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-background rounded-lg p-6 text-center border border-border shadow-sm"
              >
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-4 border-accent/20"
                />
                <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                <p className="font-semibold text-foreground">— {testimonial.name}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mt-8">
            <span className="text-muted-foreground">Trusted by Students & Professionals</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 text-warning fill-warning" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SMS CTA Section */}
      <section className="py-10 bg-cta-solid">
        <div className="container-wide section-padding text-center">
          <h2 className="text-xl lg:text-2xl font-bold text-accent-foreground mb-4">
            Get Jobs, Scholarships & Free Trainings!
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
            <div className="flex items-center gap-2 text-accent-foreground">
              <Smartphone className="h-5 w-5" />
              <span>Send SMS to 9295</span>
            </div>
            <span className="text-accent-foreground">|</span>
            <div className="flex items-center gap-2 text-accent-foreground">
              <span className="font-bold">Type ON</span>
            </div>
            <span className="text-accent-foreground">|</span>
            <div className="flex items-center gap-2 text-accent-foreground">
              <Youtube className="h-5 w-5" />
              <span>Get Job Alerts & Free Updates</span>
            </div>
          </div>
          <Button className="bg-secondary hover:bg-secondary/90 text-primary-foreground px-8" asChild>
            <a href="sms:9295?body=OK">
              SMS ON 9295 
              <ChevronDown className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      {/* Promotions */}
      <section className="py-8 bg-background">
        <div className="container-wide section-padding">
          <div className="grid md:grid-cols-3 gap-4">
            {promotions.map((promo, index) => (
              <div
                key={index}
                className={`${promo.color} rounded-lg p-6 text-center text-white`}
              >
                <p className="text-xl font-bold">{promo.text}</p>
                <p className="text-sm opacity-90">{promo.subtext}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Pages */}
      <section className="py-12 bg-card">
        <div className="container-wide section-padding">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Company</h2>
              <p className="text-sm text-muted-foreground">
                Learn more about TESBINN, our mission, and how we grow.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/about">About TESBINN</Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <Link
              to="/about"
              className="rounded-lg border border-border bg-background p-4 hover:border-primary/50 hover:shadow-md transition-all"
            >
              <p className="font-semibold text-foreground">About</p>
              <p className="text-xs text-muted-foreground mt-2">Mission, vision, and impact.</p>
            </Link>
            <Link
              to="/tesbinn"
              className="rounded-lg border border-border bg-background p-4 hover:border-primary/50 hover:shadow-md transition-all"
            >
              <p className="font-semibold text-foreground">TESBINN</p>
              <p className="text-xs text-muted-foreground mt-2">Platform capabilities.</p>
            </Link>
            <Link
              to="/careers"
              className="rounded-lg border border-border bg-background p-4 hover:border-primary/50 hover:shadow-md transition-all"
            >
              <p className="font-semibold text-foreground">Careers</p>
              <p className="text-xs text-muted-foreground mt-2">Join the team.</p>
            </Link>
            <Link
              to="/blog"
              className="rounded-lg border border-border bg-background p-4 hover:border-primary/50 hover:shadow-md transition-all"
            >
              <p className="font-semibold text-foreground">Blog</p>
              <p className="text-xs text-muted-foreground mt-2">Insights and updates.</p>
            </Link>
            <Link
              to="/press"
              className="rounded-lg border border-border bg-background p-4 hover:border-primary/50 hover:shadow-md transition-all"
            >
              <p className="font-semibold text-foreground">Press</p>
              <p className="text-xs text-muted-foreground mt-2">Media resources.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Adverts Section */}
      <section className="py-8 bg-muted/50">
        <div className="container-wide section-padding">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex-1 h-px bg-border" />
            <h3 className="text-lg font-semibold text-foreground">Adverts & Promotions</h3>
            <div className="flex-1 h-px bg-border" />
          </div>

          {advertsLoading ? (
            <p className="text-center text-sm text-muted-foreground">Loading adverts...</p>
          ) : adverts.length ? (
            <div className="grid gap-4 md:grid-cols-3">
              {adverts.map((advert) => (
                <div
                  key={advert._id}
                  className="rounded-lg border border-border bg-background p-5 shadow-sm"
                >
                  {advert.imageUrl && (
                    <img
                      src={advert.imageUrl}
                      alt={advert.title}
                      className="mb-4 h-40 w-full rounded-md object-cover"
                    />
                  )}
                  <p className="text-lg font-semibold text-foreground">{advert.title}</p>
                  {advert.subtitle && (
                    <p className="text-sm text-muted-foreground mt-1">{advert.subtitle}</p>
                  )}
                  {advert.ctaLabel && advert.ctaUrl && (
                    <Button className="mt-4" size="sm" asChild>
                      <a href={advert.ctaUrl} target="_blank" rel="noreferrer">
                        {advert.ctaLabel}
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              No adverts are available right now.
            </p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
