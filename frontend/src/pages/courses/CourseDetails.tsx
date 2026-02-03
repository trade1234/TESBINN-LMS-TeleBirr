import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Users, Clock, Layers } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import { minutesToDurationLabel } from "@/lib/format";
import type { ApiResponse, Course, Enrollment } from "@/lib/types";

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [myEnrollment, setMyEnrollment] = useState<Enrollment | null>(null);
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);

      try {
        const res = await api.get<ApiResponse<Course>>(`/courses/${id}`);
        if (!active) return;
        setCourse(res.data.data);
      } catch (err: any) {
        if (!active) return;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load course.";
        setError(message);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;

    const token = authStorage.getToken();
    const role = authStorage.getRole();
    if (!token || role !== "student" || !id) return;

    setIsCheckingEnrollment(true);

    const loadEnrollment = async () => {
      try {
        const res = await api.get<ApiResponse<Enrollment[]>>("/enrollments/me");
        if (!active) return;
        const existing = res.data.data.find((enrollment) => enrollment.course?._id === id);
        setMyEnrollment(existing || null);
      } catch (error) {
        if (!active) return;
        setMyEnrollment(null);
      } finally {
        if (active) setIsCheckingEnrollment(false);
      }
    };

    loadEnrollment();

    return () => {
      active = false;
    };
  }, [id]);

  const stats = useMemo(() => {
    if (!course) return null;

    const modules = course.modules || [];
    const lessons = modules.reduce((sum, m) => sum + (m.lessons || []).length, 0);
    const durationLabel = minutesToDurationLabel(course.duration);

    return { modules: modules.length, lessons, durationLabel };
  }, [course]);

  const handleEnroll = async () => {
    const token = authStorage.getToken();
    const role = authStorage.getRole();

    if (!token) {
      navigate("/login");
      return;
    }

    if (role !== "student") {
      toast({
        title: "Enrollment not available",
        description: "Only student accounts can enroll in courses.",
        variant: "destructive",
      });
      return;
    }

    if (!course?._id) return;

    setIsEnrolling(true);
    navigate(`/checkout/${course._id}`);
    setIsEnrolling(false);
  };

  const categoryLabel = (cat?: string) => {
    const map: Record<string, string> = {
      development: "Development",
      design: "Design",
      marketing: "Marketing",
      leadership: "Leadership",
      ai: "AI & ML",
      business: "Business",
      productivity: "Productivity",
      other: "Other",
    };
    return (cat && map[cat]) || "Other";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 lg:pt-24">
        <div className="container-wide section-padding py-10">
          <div className="mb-6">
            <Button asChild variant="ghost" className="px-0">
              <Link to="/courses">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to courses
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <div className="h-8 w-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Loading course...</h3>
              <p className="text-muted-foreground">Please wait a moment.</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold mb-2">Could not load course</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : !course ? null : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="glass-card rounded-xl overflow-hidden">
                  <div className="aspect-video bg-muted">
                    <img
                      src={
                        course.imageUrl?.startsWith("http")
                          ? course.imageUrl
                          : "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=675&fit=crop"
                      }
                      alt={course.title}
                      className="w-full h-full object-contain bg-muted/80"
                    />
                  </div>

                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge className="bg-secondary text-secondary-foreground">
                        {categoryLabel(course.category)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Instructor: <span className="text-foreground font-medium">{course.teacher?.name || "TESBINN"}</span>
                      </span>
                    </div>

                    <h1 className="text-2xl lg:text-3xl font-bold mb-3">{course.title}</h1>
                    <p className="text-muted-foreground leading-relaxed">{course.description}</p>

                    {stats && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Layers className="h-4 w-4" />
                          <span>{stats.modules} modules</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BookOpen className="h-4 w-4" />
                          <span>{stats.lessons} lessons</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{stats.durationLabel}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{(course.totalEnrollments || 0).toLocaleString()} students</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <aside className="lg:col-span-1">
                  <div className="glass-card rounded-xl p-6 lg:sticky lg:top-28">
                    <h3 className="text-lg font-semibold mb-2">Ready to start?</h3>
                    <p className="text-sm text-muted-foreground mb-5">
                      {myEnrollment?.approvalStatus === "pending"
                        ? "An admin needs to approve your enrollment before you can access lessons."
                        : myEnrollment
                          ? "You are enrolled. Jump back into your course whenever you're ready."
                          : "Enroll to track progress and access all lessons."}
                    </p>

                    <Button
                      variant="gradient"
                      size="lg"
                      className="w-full"
                      onClick={
                        myEnrollment?.approvalStatus === "approved"
                          ? () => navigate(`/student/courses/${course._id}`)
                          : handleEnroll
                      }
                      disabled={
                        isEnrolling ||
                        (myEnrollment && isCheckingEnrollment) ||
                        myEnrollment?.approvalStatus === "pending"
                      }
                    >
                      {isEnrolling
                        ? "Submitting..."
                        : myEnrollment?.approvalStatus === "pending"
                          ? "Pending approval"
                          : myEnrollment?.approvalStatus === "approved"
                            ? "Continue Learning"
                            : "Enroll Now"}
                    </Button>

                    {myEnrollment?.approvalStatus === "rejected" ? (
                      <p className="text-xs text-destructive mt-3">
                        Enrollment rejected. You can request access again.
                      </p>
                    ) : myEnrollment && myEnrollment.enrolledAt ? (
                      <p className="text-xs text-muted-foreground mt-3">
                        Enrolled on {new Date(myEnrollment.enrolledAt).toLocaleDateString()}
                      </p>
                    ) : null}

                    <p className="text-xs text-muted-foreground mt-3">
                      Teachers require admin approval before they can create courses.
                    </p>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </main>

      <Footer />
    </div>
  );
};

export default CourseDetails;


