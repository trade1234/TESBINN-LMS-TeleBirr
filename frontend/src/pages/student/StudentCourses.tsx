import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CourseCard from "@/components/courses/CourseCard";
import { api } from "@/lib/api";
import { minutesToDurationLabel } from "@/lib/format";
import type { ApiResponse, Enrollment } from "@/lib/types";

type StatusFilterValue = Enrollment["completionStatus"] | "all";

const statusFilters: { label: string; value: StatusFilterValue }[] = [
  { label: "All Courses", value: "all" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Not Started", value: "not_started" },
];

const statusLabelMap: Record<Exclude<Enrollment["completionStatus"], undefined>, string> = {
  in_progress: "In Progress",
  completed: "Completed",
  not_started: "Not Started",
};

const statusBadgeVariant: Record<Exclude<Enrollment["completionStatus"], undefined>, "default" | "secondary" | "outline"> = {
  in_progress: "default",
  completed: "secondary",
  not_started: "outline",
};

const categoryLabels: Record<string, string> = {
  development: "Development",
  design: "Design",
  marketing: "Marketing",
  leadership: "Leadership",
  ai: "AI & ML",
  business: "Business",
  productivity: "Productivity",
  other: "Other",
};

const StudentCourses = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadEnrollments = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await api.get<ApiResponse<Enrollment[]>>("/enrollments/me");
        if (!active) return;
        setEnrollments(res.data.data);
      } catch (err: any) {
        if (!active) return;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load your courses.";
        setError(message);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadEnrollments();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = enrollments.length;
    const completed = enrollments.filter((en) => en.completionStatus === "completed").length;
    const inProgress = enrollments.filter((en) => en.completionStatus === "in_progress").length;
    const notStarted = enrollments.filter((en) => en.completionStatus === "not_started").length;
    const totalMinutes = enrollments.reduce((sum, en) => {
      const minutes = en.course?.duration || 0;
      const pct = typeof en.percentComplete === "number" ? en.percentComplete : 0;
      return sum + (minutes * pct) / 100;
    }, 0);
    const avgProgress = total ? Math.round(enrollments.reduce((sum, en) => sum + (en.percentComplete || 0), 0) / total) : 0;

    return {
      total,
      completed,
      inProgress,
      notStarted,
      learningHours: (totalMinutes / 60).toFixed(1),
      avgProgress,
    };
  }, [enrollments]);

  const filteredEnrollments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return enrollments.filter((enrollment) => {
      const matchesStatus = statusFilter === "all" || enrollment.completionStatus === statusFilter;
      if (!matchesStatus) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      const course = enrollment.course;
      const titleMatch = course.title.toLowerCase().includes(normalizedSearch);
      const descriptionMatch = course.description.toLowerCase().includes(normalizedSearch);
      const instructorMatch = course.teacher?.name?.toLowerCase().includes(normalizedSearch);
      return titleMatch || descriptionMatch || Boolean(instructorMatch);
    });
  }, [enrollments, searchTerm, statusFilter]);

  const studentCourseCards = useMemo(() => {
    return filteredEnrollments.map((enrollment) => {
      const course = enrollment.course;
      const approvalStatus = enrollment.approvalStatus ?? "approved";
      const isApproved = approvalStatus === "approved";
      const ctaLabel =
        approvalStatus === "pending"
          ? "Pending approval"
          : approvalStatus === "rejected"
            ? "Request access again"
            : undefined;
      const ctaHref =
        approvalStatus === "rejected" ? `/courses/${course._id}` : `/student/courses/${course._id}`;
      const lessons = (course.modules || []).reduce((sum, module) => sum + (module.lessons || []).length, 0);
      const thumbnail = course.imageUrl?.startsWith("http")
        ? course.imageUrl
        : "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop";

      return {
        id: course._id,
        title: course.title,
        description: course.description,
        thumbnail,
        instructor: course.teacher?.name || "TESBINN",
        category: categoryLabels[course.category] || "Other",
        duration: minutesToDurationLabel(course.duration),
        students: course.totalEnrollments || 0,
        rating: course.averageRating || 0,
        lessons,
        price: course.price,
        progress: Math.round(enrollment.percentComplete || 0),
        enrolled: isApproved,
        status: enrollment.completionStatus,
        approvalStatus,
        ctaHref,
        ctaLabel,
        ctaDisabled: approvalStatus === "pending",
      };
    });
  }, [filteredEnrollments]);

  return (
    <DashboardLayout role="student">
      <div className="space-y-8">
        <section className="bg-card border border-border rounded-3xl p-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-1">
                Student Portal
              </p>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                My Courses
              </h1>
              <p className="text-sm text-muted-foreground">
                Stay on track with your enrolled content and jump back into fast-growing skills.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/student/browse">
                Browse new courses
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-4 bg-gradient-to-br from-background/60 to-background">
              <p className="text-xs text-muted-foreground uppercase">Active</p>
              <p className="text-3xl font-semibold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">courses</p>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs text-muted-foreground uppercase">In progress</p>
              <p className="text-3xl font-semibold text-foreground">{stats.inProgress}</p>
              <p className="text-xs text-muted-foreground">keeping momentum</p>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs text-muted-foreground uppercase">Completed</p>
              <p className="text-3xl font-semibold text-foreground">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">certified wins</p>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs text-muted-foreground uppercase">Learning hours</p>
              <p className="text-3xl font-semibold text-foreground">{stats.learningHours}</p>
              <p className="text-xs text-muted-foreground">estimated time</p>
            </div>
          </div>
        </section>

        <section className="space-y-6 bg-card border border-border rounded-3xl p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <Button
                  key={filter.value}
                  size="sm"
                  variant={statusFilter === filter.value ? "gradient" : "outline"}
                  onClick={() => setStatusFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-1 md:flex-none">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                className="flex-1"
                placeholder="Search courses"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-2xl border border-border/60 p-10 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Loading your enrolled courses...</p>
            </div>
          ) : studentCourseCards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center space-y-4">
              <p className="text-lg font-semibold text-foreground">No courses yet</p>
              <p className="text-sm text-muted-foreground">
                Enroll in a course to have it appear here. Browse the catalog to get started.
              </p>
              <Button variant="ghost" className="border-muted" asChild>
                <Link to="/student/browse">
                  Browse Catalog
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {studentCourseCards.map((card) => {
                const { status, approvalStatus, ctaHref, ctaLabel, ctaDisabled, ...courseProps } = card;
                const statusLabel =
                  approvalStatus === "approved"
                    ? statusLabelMap[status]
                    : approvalStatus === "pending"
                      ? "Pending approval"
                      : "Rejected";
                const badgeVariant =
                  approvalStatus === "approved" ? statusBadgeVariant[status] : "outline";
                return (
                  <div key={card.id} className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <Badge variant={badgeVariant}>{statusLabel}</Badge>
                      <span>{card.progress}% complete</span>
                    </div>
                    <CourseCard
                      {...courseProps}
                      variant="compact"
                      ctaHref={ctaHref}
                      ctaLabel={ctaLabel}
                      ctaDisabled={ctaDisabled}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default StudentCourses;
