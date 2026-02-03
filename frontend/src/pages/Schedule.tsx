import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { api } from "@/lib/api";
import type { ApiResponse, Schedule } from "@/lib/types";

const formatScheduleDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const formatMode = (mode: Schedule["mode"]) => {
  if (!mode) return "-";
  return mode.replace(/(^|\s|-)\w/g, (match) => match.toUpperCase()).replace("-", " ");
};

const SchedulePage = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await api.get<ApiResponse<Schedule[]>>("/schedules");
        if (!active) return;
        setSchedules(res.data.data || []);
      } catch (error) {
        if (!active) return;
        setSchedules([]);
      } finally {
        if (active) setIsLoading(false);
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

      <section className="pt-20 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.9) 45%, rgba(255,255,255,0.85) 100%), url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80')",
          }}
          aria-hidden="true"
        />
        <div className="container-wide section-padding py-12 lg:py-16 relative z-10">
          <div className="flex flex-col gap-4 text-center">
            <div className="flex items-center justify-center gap-2 text-primary">
              <CalendarDays className="h-6 w-6" />
              <span className="text-sm font-semibold uppercase tracking-[0.3em]">Schedule</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Upcoming Class Schedules
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Plan your next learning experience with TESBINN. New cohorts open regularly.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16 bg-background">
        <div className="container-wide section-padding">
          <div className="overflow-x-auto">
            <table className="w-full max-w-5xl mx-auto">
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
                {isLoading ? (
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
                          <a
                            className="px-3 py-1 rounded border border-border text-xs font-medium text-foreground hover:border-primary/60"
                            href={schedule.ctaUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {schedule.ctaLabel}
                          </a>
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
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SchedulePage;
