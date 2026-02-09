import { useEffect, useState } from "react";
import { CalendarDays, PlayCircle, Users } from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { api } from "@/lib/api";
import type { ApiResponse } from "@/lib/types";

type ChannelVideo = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  url: string;
  thumbnail: string;
};

const CHANNEL_HANDLE = "tradextv7";

const formatPublishedDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const trimDescription = (value: string, maxLength = 160) => {
  if (!value) return "Latest session highlight from TESBINN free learning.";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
};

const VideosPage = () => {
  const [videos, setVideos] = useState<ChannelVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadVideos = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await api.get<ApiResponse<ChannelVideo[]>>(
          `/youtube/videos?handle=${CHANNEL_HANDLE}&limit=9`
        );
        if (!active) return;
        setVideos(response.data.data || []);
      } catch (err) {
        if (!active) return;
        setError("Unable to load videos right now. Please try again soon.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadVideos();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="pt-20 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.92) 45%, rgba(255,255,255,0.85) 100%), url('https://images.unsplash.com/photo-1487014679447-9f8336841d58?auto=format&fit=crop&w=1600&q=80')",
          }}
          aria-hidden="true"
        />
        <div className="container-wide section-padding py-12 lg:py-16 relative z-10">
          <div className="grid gap-10 lg:grid-cols-[1.2fr,0.8fr] items-center">
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-primary">
                <PlayCircle className="h-6 w-6" />
                <span className="text-sm font-semibold uppercase tracking-[0.3em]">
                  TESBINN Free Learning
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
                Learn fast with bite-sized sessions designed for real growth.
              </h1>
              <p className="text-muted-foreground max-w-xl">
                Watch the latest TESBINN free learning sessions straight from the{" "}
                <span className="font-semibold text-foreground">@{CHANNEL_HANDLE}</span>{" "}
                YouTube channel. Discover live class previews, guided lessons, and
                career-ready tips from our mentors.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Weekly releases
                </div>
                <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2">
                  <Users className="h-4 w-4 text-primary" />
                  Live community support
                </div>
              </div>
            </div>
            <div className="bg-background/80 border border-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">What you get</h2>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  Curated lessons for absolute beginners to intermediate learners.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  Short sessions focused on practical projects and outcomes.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  Clear next steps for joining full TESBINN cohorts.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16 bg-background">
        <div className="container-wide section-padding">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Featured session videos</h2>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Each session is pulled live from YouTube so learners always get the
                newest uploads first.
              </p>
            </div>
            <a
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              href={`https://www.youtube.com/@${CHANNEL_HANDLE}`}
              target="_blank"
              rel="noreferrer"
            >
              Visit @{CHANNEL_HANDLE}
            </a>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full text-center text-muted-foreground">
                Loading videos...
              </div>
            ) : error ? (
              <div className="col-span-full text-center text-muted-foreground">{error}</div>
            ) : videos.length ? (
              videos.map((video) => (
                <article
                  key={video.id}
                  className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="relative">
                    <iframe
                      className="w-full aspect-video"
                      src={`https://www.youtube-nocookie.com/embed/${video.id}`}
                      title={video.title}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <div className="p-5 flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                      <span className="rounded-full bg-muted px-3 py-1">YouTube</span>
                      <span className="rounded-full bg-muted px-3 py-1">
                        {formatPublishedDate(video.publishedAt)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{video.title}</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        {trimDescription(video.description)}
                      </p>
                    </div>
                    <a
                      className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                      href={video.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Watch on YouTube →
                    </a>
                  </div>
                </article>
              ))
            ) : (
              <div className="col-span-full text-center text-muted-foreground">
                No videos found yet. Check back soon.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16 bg-muted/50">
        <div className="container-wide section-padding">
          <div className="rounded-3xl bg-background border border-border p-8 lg:p-10 grid gap-6 lg:grid-cols-[1.3fr,0.7fr] items-center">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Ready to join the next free learning cohort?
              </h2>
              <p className="text-muted-foreground mt-3">
                Explore upcoming class schedules, then register to secure your seat. Our
                sessions are hands-on, supportive, and designed to help you ship real
                projects.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <a
                href="/schedule"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                View class schedule
              </a>
              <a
                href="/register"
                className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/70 transition-colors"
              >
                Create a free account
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VideosPage;
