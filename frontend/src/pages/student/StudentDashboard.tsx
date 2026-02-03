import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, BookOpen, PlayCircle, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import ProgressChart from "@/components/dashboard/ProgressChart";
import CourseCard from "@/components/courses/CourseCard";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import { minutesToDurationLabel } from "@/lib/format";
import type {
  ApiResponse,
  Enrollment,
  MeResponse,
  StudentDashboardData,
} from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [me, setMe] = useState<MeResponse["data"] | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [dashboard, setDashboard] = useState<StudentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const token = authStorage.getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      setIsLoading(true);
      try {
        const [meRes, enrollRes] = await Promise.all([
          api.get<MeResponse>("/auth/me"),
          api.get<ApiResponse<Enrollment[]>>("/enrollments/me"),
        ]);

        if (!active) return;
        setMe(meRes.data.data);
        setEnrollments(enrollRes.data.data);

        try {
          const dashboardRes = await api.get<ApiResponse<StudentDashboardData>>(
            "/dashboard/student"
          );
          if (!active) return;
          setDashboard(dashboardRes.data.data);
        } catch (err: any) {
          if (!active) return;
          const status = err?.response?.status;
          const message =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            "Failed to load dashboard.";

          if (status === 401) {
            authStorage.clearAll();
            navigate("/login");
            return;
          }

          if (status !== 404) {
            toast({
              title: "Dashboard error",
              description: message,
              variant: "destructive",
            });
          }
        }
      } catch (err: any) {
        if (!active) return;
        const status = err?.response?.status;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load dashboard.";

        if (status === 401) {
          authStorage.clearAll();
          navigate("/login");
          return;
        }

        toast({
          title: "Dashboard error",
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
  }, [navigate, toast]);

  const stats = useMemo(() => {
    const approvedEnrollments = enrollments.filter(
      (e) => !e.approvalStatus || e.approvalStatus === "approved",
    );
    const enrolledCoursesCount = approvedEnrollments.length;
    const completedCoursesCount = approvedEnrollments.filter((e) => e.completionStatus === "completed").length;

    return {
      enrolledCoursesCount,
      completedCoursesCount,
      lessonsCompletedThisWeek: dashboard?.stats.lessonsCompletedThisWeek ?? 0,
      activityThisWeek: dashboard?.stats.activityThisWeek ?? 0,
    };
  }, [dashboard, enrollments]);

  const continueLearningCards = useMemo(() => {
    const labelByCategory: Record<string, string> = {
      development: "Development",
      design: "Design",
      marketing: "Marketing",
      leadership: "Leadership",
      ai: "AI & ML",
      business: "Business",
      productivity: "Productivity",
      other: "Other",
    };

    const sorted = enrollments
      .filter((en) => !en.approvalStatus || en.approvalStatus === "approved")
      .slice()
      .sort((a, b) => (b.percentComplete || 0) - (a.percentComplete || 0));

    return sorted.slice(0, 4).map((en) => {
      const c = en.course;
      const lessons = (c.modules || []).reduce((sum, m) => sum + (m.lessons || []).length, 0);
      const thumbnail = c.imageUrl?.startsWith("http")
        ? c.imageUrl
        : "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop";

      return {
        id: c._id,
        title: c.title,
        description: c.description,
        thumbnail,
        instructor: c.teacher?.name || "TESBINN",
        category: labelByCategory[c.category] || "Other",
        duration: minutesToDurationLabel(c.duration),
        students: c.totalEnrollments || 0,
        rating: c.averageRating || 0,
        lessons,
        price: c.price,
        progress: Math.round(en.percentComplete || 0),
        enrolled: true,
        ctaHref: `/student/courses/${c._id}`,
      };
    });
  }, [enrollments]);

  return (
    <DashboardLayout role="student">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">
              Welcome back{me?.name ? `, ${me.name}` : ""}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Continue learning and track your progress
            </p>
          </div>
          <Button variant="gradient" asChild>
            <Link to="/student/browse">
              Browse Courses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Enrolled Courses"
            value={stats.enrolledCoursesCount}
            change={isLoading ? "Loading..." : ""}
            changeType="neutral"
            icon={BookOpen}
            iconColor="primary"
          />
          <StatsCard
            title="Completed Courses"
            value={stats.completedCoursesCount}
            change={isLoading ? "Loading..." : ""}
            changeType="neutral"
            icon={Trophy}
            iconColor="warning"
          />
          <StatsCard
            title="Lessons This Week"
            value={stats.lessonsCompletedThisWeek}
            change={isLoading ? "Loading..." : ""}
            changeType="neutral"
            icon={PlayCircle}
            iconColor="secondary"
          />
          <StatsCard
            title="Activity This Week"
            value={stats.activityThisWeek}
            change={isLoading ? "Loading..." : ""}
            changeType="neutral"
            icon={Activity}
            iconColor="success"
          />
        </div>

        {/* Charts and Activity */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ProgressChart data={dashboard?.weeklyProgress} />
          </div>
          <div>
            <RecentActivity activities={dashboard?.recentActivity} isLoading={isLoading} />
          </div>
        </div>

        {/* Continue Learning */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Continue Learning</h2>
              <p className="text-sm text-muted-foreground">
                Pick up where you left off
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/student/courses">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {continueLearningCards.length > 0 ? (
              continueLearningCards.map((course) => (
              <CourseCard key={course.id} {...course} variant="compact" ctaHref={course.ctaHref} />
              ))
            ) : (
              <div className="md:col-span-2 glass-card rounded-xl p-6">
                <p className="text-muted-foreground">
                  {isLoading ? "Loading your enrollments..." : "No enrolled courses yet. Browse and enroll to get started."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
