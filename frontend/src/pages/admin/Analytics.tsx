import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Download,
  DollarSign,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/format";
import type { AdminAnalyticsData, ApiResponse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [range, setRange] = useState("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const token = authStorage.getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      if (range === "custom" && (!startDate || !endDate)) return;

      setIsLoading(true);
      setError(null);
      try {
        const params =
          range === "custom"
            ? { start: startDate, end: endDate }
            : { range };

        const res = await api.get<ApiResponse<AdminAnalyticsData>>("/analytics/admin", {
          params,
        });

        if (!active) return;
        setAnalytics(res.data.data);
      } catch (err: any) {
        if (!active) return;
        const status = err?.response?.status;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load analytics.";

        if (status === 401) {
          authStorage.clearAll();
          navigate("/login");
          return;
        }

        setError(message);
        toast({
          title: "Analytics error",
          description: message,
          variant: "destructive",
        });
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [endDate, navigate, range, startDate, toast]);

  const formatDelta = (value: number) => {
    const rounded = Math.round(value);
    const sign = rounded > 0 ? "+" : "";
    return `${sign}${rounded}% vs previous period`;
  };

  const formatAxisDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  const stats = useMemo(() => {
    const summary = analytics?.summary;
    const deltas = analytics?.deltas;

    return [
      {
        title: "Active learners",
        value: summary ? summary.activeLearners.toLocaleString() : "...",
        change: summary ? formatDelta(deltas?.activeLearners || 0) : "Loading...",
        changeType: (deltas?.activeLearners || 0) >= 0 ? "positive" : "negative",
        icon: Users,
        iconColor: "primary" as const,
      },
      {
        title: "New users",
        value: summary ? summary.newUsers.toLocaleString() : "...",
        change: summary ? formatDelta(deltas?.newUsers || 0) : "Loading...",
        changeType: (deltas?.newUsers || 0) >= 0 ? "positive" : "negative",
        icon: UserPlus,
        iconColor: "secondary" as const,
      },
      {
        title: "New enrollments",
        value: summary ? summary.newEnrollments.toLocaleString() : "...",
        change: summary ? formatDelta(deltas?.newEnrollments || 0) : "Loading...",
        changeType: (deltas?.newEnrollments || 0) >= 0 ? "positive" : "negative",
        icon: BarChart3,
        iconColor: "accent" as const,
      },
      {
        title: "Revenue",
        value: summary ? formatCurrency(summary.revenue) : "...",
        change: summary ? formatDelta(deltas?.revenue || 0) : "Loading...",
        changeType: (deltas?.revenue || 0) >= 0 ? "positive" : "negative",
        icon: DollarSign,
        iconColor: "warning" as const,
      },
      {
        title: "Completed courses",
        value: summary ? summary.completedCourses.toLocaleString() : "...",
        change: summary ? `${summary.pendingEnrollments} pending enrollments` : "Loading...",
        changeType: "neutral" as const,
        icon: Trophy,
        iconColor: "success" as const,
      },
      {
        title: "Active courses",
        value: summary ? summary.activeCourses.toLocaleString() : "...",
        change: summary ? `${summary.totalCourses} total courses` : "Loading...",
        changeType: "neutral" as const,
        icon: BookOpen,
        iconColor: "primary" as const,
      },
    ];
  }, [analytics]);

  const handleExport = () => {
    if (!analytics) return;
    const rows: string[][] = [
      ["Metric", "Value"],
      ["Active learners", analytics.summary.activeLearners.toString()],
      ["New users", analytics.summary.newUsers.toString()],
      ["New enrollments", analytics.summary.newEnrollments.toString()],
      ["Completed courses", analytics.summary.completedCourses.toString()],
      ["Revenue", analytics.summary.revenue.toString()],
      ["Active courses", analytics.summary.activeCourses.toString()],
      ["Total users", analytics.summary.totalUsers.toString()],
      ["Total courses", analytics.summary.totalCourses.toString()],
      [],
      ["Top courses"],
      ["Course", "Enrollments", "Revenue"],
      ...analytics.topCourses.map((course) => [
        course.title,
        course.enrollments.toString(),
        course.revenue.toString(),
      ]),
      [],
      ["Recent activity"],
      ["Title", "Description", "Time"],
      ...analytics.recentActivity.map((activity) => [
        activity.title,
        activity.description,
        activity.createdAt,
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tesbinn-analytics-${analytics.range.label}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Analytics</p>
            <h1 className="text-2xl font-semibold">Platform pulse</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Key metrics to keep TESBINN running smoothly.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-9 px-3 rounded-md border border-input bg-background text-sm"
              value={range}
              onChange={(event) => setRange(event.target.value)}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="365d">Last 12 months</option>
              <option value="custom">Custom range</option>
            </select>
            {range === "custom" && (
              <>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="h-9 w-[150px]"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="h-9 w-[150px]"
                />
              </>
            )}
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!analytics}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="glass-card rounded-xl border border-destructive/30 p-5 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {stats.map((metric) => (
            <StatsCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              change={metric.change}
              changeType={metric.changeType}
              icon={metric.icon}
              iconColor={metric.iconColor}
            />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="glass-card rounded-xl border border-border/70 p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">User growth</h3>
                <p className="text-xs text-muted-foreground">New accounts created over time.</p>
              </div>
            </div>
            <ChartContainer
              className="h-64"
              config={{ value: { label: "New users", color: "hsl(222, 47%, 20%)" } }}
            >
              <LineChart data={analytics?.series.userGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatAxisDate} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="value" stroke="var(--color-value)" strokeWidth={2} />
              </LineChart>
            </ChartContainer>
          </div>

          <div className="glass-card rounded-xl border border-border/70 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Top courses</h3>
                <p className="text-xs text-muted-foreground">Highest enrollments this period.</p>
              </div>
            </div>
            <div className="space-y-3">
              {(analytics?.topCourses || []).map((course) => (
                <div key={course.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{course.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {course.enrollments.toLocaleString()} enrollments
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(course.revenue)}</p>
                </div>
              ))}
              {!analytics && (
                <p className="text-sm text-muted-foreground">
                  {isLoading ? "Loading courses..." : "No courses to display."}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="glass-card rounded-xl border border-border/70 p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Enrollment trend</h3>
                <p className="text-xs text-muted-foreground">Approved enrollments by day.</p>
              </div>
            </div>
            <ChartContainer
              className="h-64"
              config={{ value: { label: "Enrollments", color: "hsl(213, 60%, 22%)" } }}
            >
              <BarChart data={analytics?.series.enrollments || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatAxisDate} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>

          <div className="glass-card rounded-xl border border-border/70 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Recent activity</h3>
                <p className="text-xs text-muted-foreground">Platform changes at a glance.</p>
              </div>
            </div>
            <div className="space-y-3">
              {(analytics?.recentActivity || []).map((activity) => (
                <div key={activity.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(activity.createdAt)}
                  </p>
                </div>
              ))}
              {!analytics && (
                <p className="text-sm text-muted-foreground">
                  {isLoading ? "Loading activity..." : "No recent activity yet."}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl border border-border/70 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Revenue trend</h3>
              <p className="text-xs text-muted-foreground">Estimated earnings by day.</p>
            </div>
          </div>
          <ChartContainer
            className="h-64"
            config={{ value: { label: "Revenue", color: "hsl(24, 95%, 50%)" } }}
          >
            <AreaChart data={analytics?.series.revenue || []}>
              <defs>
                <linearGradient id="analyticsRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(24, 95%, 50%)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(24, 95%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatAxisDate} />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2}
                fill="url(#analyticsRevenue)"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminAnalytics;
