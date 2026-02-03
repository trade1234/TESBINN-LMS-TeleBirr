import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpDown,
  BookOpen,
  Layers,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import type { ApiResponse, Course } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

type StatusFilter = "all" | "published" | "pending" | "draft";
type SortKey = "newest" | "oldest" | "title";

const TeacherCourses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");

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
        const res = await api.get<ApiResponse<Course[]>>("/courses/me");
        if (!active) return;
        setCourses(res.data.data || []);
      } catch (err: any) {
        if (!active) return;
        const status = err?.response?.status;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load courses.";

        if (status === 401) {
          authStorage.clearAll();
          navigate("/login");
          return;
        }

        toast({
          title: "Load error",
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

  const statusLabel = (course: Course) => {
    if (course.isPublished && course.isApproved) return "published";
    if (course.isPublished && !course.isApproved) return "pending";
    return "draft";
  };

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let result = courses.filter((course) => {
      if (!q) return true;
      return (
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q)
      );
    });

    if (statusFilter !== "all") {
      result = result.filter((course) => statusLabel(course) === statusFilter);
    }

    result = [...result].sort((a, b) => {
      if (sortKey === "title") return a.title.localeCompare(b.title);
      const aDate = new Date(a.createdAt || 0).getTime();
      const bDate = new Date(b.createdAt || 0).getTime();
      return sortKey === "newest" ? bDate - aDate : aDate - bDate;
    });

    return result;
  }, [courses, searchQuery, sortKey, statusFilter]);

  const stats = useMemo(() => {
    const total = courses.length;
    const published = courses.filter((course) => course.isPublished && course.isApproved).length;
    const pending = courses.filter((course) => course.isPublished && !course.isApproved).length;
    const drafts = courses.filter((course) => !course.isPublished).length;
    return { total, published, pending, drafts };
  }, [courses]);

  const handleDeleteCourse = async (courseId: string) => {
    const confirmed = window.confirm("Delete this course? This action cannot be undone.");
    if (!confirmed) return;

    try {
      await api.delete(`/courses/${courseId}`);
      setCourses((prev) => prev.filter((course) => course._id !== courseId));
      toast({
        title: "Course deleted",
        description: "The course was removed successfully.",
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to delete course.";
      toast({
        title: "Delete error",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">My Courses</h1>
            <p className="text-muted-foreground mt-1">
              Manage course content, approvals, and engagement from one place.
            </p>
          </div>
          <Button variant="gradient" asChild>
            <Link to="/teacher/courses/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Course
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Courses"
            value={stats.total}
            change="All courses"
            changeType="neutral"
            icon={BookOpen}
            iconColor="primary"
          />
          <StatsCard
            title="Published"
            value={stats.published}
            change="Visible to learners"
            changeType="positive"
            icon={BookOpen}
            iconColor="success"
          />
          <StatsCard
            title="Pending Approval"
            value={stats.pending}
            change="Awaiting admin review"
            changeType="neutral"
            icon={BookOpen}
            iconColor="warning"
          />
          <StatsCard
            title="Drafts"
            value={stats.drafts}
            change="Not published"
            changeType="neutral"
            icon={BookOpen}
            iconColor="secondary"
          />
        </div>

        <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
          <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by title or description"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortKey} onValueChange={(value: SortKey) => setSortKey(value)}>
                  <SelectTrigger className="w-full sm:w-44">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="title">Title A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="rounded-xl border border-border bg-card p-6 text-muted-foreground">
                Loading your courses...
              </div>
            ) : filteredCourses.length ? (
              <div className="grid gap-5">
                {filteredCourses.map((course) => {
                  const status = statusLabel(course);
                  const statusStyles =
                    status === "published"
                      ? "bg-success/10 text-success border-success/20"
                      : status === "pending"
                      ? "bg-warning/10 text-warning border-warning/20"
                      : "bg-muted text-muted-foreground border-border";

                  return (
                    <div
                      key={course._id}
                      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="h-20 w-full sm:w-32 rounded-xl bg-muted overflow-hidden">
                            {course.imageUrl ? (
                              <img
                                src={course.imageUrl}
                                alt={course.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-muted to-muted/40" />
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold text-foreground">
                                {course.title}
                              </h3>
                              <Badge className={statusStyles}>{status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {course.description}
                            </p>
                            {course.rejectionReason && status !== "published" && (
                              <p className="text-xs text-destructive mt-2">
                                Revisions requested: {course.rejectionReason}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-3">
                              <span>{(course.totalEnrollments || 0).toLocaleString()} students</span>
                              <span>Rating {course.averageRating?.toFixed(1) || "-"}</span>
                              <span>Price {Number(course.price || 0).toLocaleString()}</span>
                              <span>Level {course.level || "beginner"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/teacher/courses/${course._id}`}>
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link to="/teacher/modules">
                              <Layers className="mr-2 h-3.5 w-3.5" />
                              Modules
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/course/${course._id}`}>
                              View
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteCourse(course._id)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-8 text-center">
                <h3 className="text-lg font-semibold text-foreground">No courses yet</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Create your first course and submit it for approval.
                </p>
                <Button className="mt-4" asChild>
                  <Link to="/teacher/courses/create">Create a course</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-muted/40 p-6">
              <h3 className="text-lg font-semibold text-foreground">Course management toolkit</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Keep your courses healthy with these quick actions.
              </p>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <div>Review lesson flow and add assessments every 2-3 modules.</div>
                <div>Check engagement weekly to spot drop-offs early.</div>
                <div>Update course images for seasonal campaigns.</div>
              </div>
              <Button variant="outline" className="mt-5 w-full" asChild>
                <Link to="/support">Talk to support</Link>
              </Button>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground">Quick links</h3>
              <div className="mt-4 space-y-3">
                <Link to="/teacher/modules" className="flex items-center justify-between text-sm text-primary">
                  Manage modules & lessons
                  <ArrowUpDown className="h-4 w-4 rotate-90" />
                </Link>
                <Link to="/teacher/analytics" className="flex items-center justify-between text-sm text-primary">
                  View course analytics
                  <ArrowUpDown className="h-4 w-4 rotate-90" />
                </Link>
                <Link to="/teacher/settings" className="flex items-center justify-between text-sm text-primary">
                  Update instructor profile
                  <ArrowUpDown className="h-4 w-4 rotate-90" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherCourses;
