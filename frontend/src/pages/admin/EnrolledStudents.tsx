import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, CheckCircle, Clock5 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import type { ApiResponse, Course, Enrollment } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const AdminEnrolledStudents = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let active = true;

    const loadCourses = async () => {
      const token = authStorage.getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      setIsLoadingCourses(true);
      try {
        const response = await api.get<ApiResponse<Course[]>>("/courses/admin/all");
        if (!active) return;
        const data = response.data.data || [];
        setCourses(data);
        if (data.length && !selectedCourseId) {
          setSelectedCourseId(data[0]._id);
        }
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
          title: "Unable to load courses",
          description: message,
          variant: "destructive",
        });
      } finally {
        if (active) setIsLoadingCourses(false);
      }
    };

    loadCourses();

    return () => {
      active = false;
    };
  }, [navigate, toast]);

  useEffect(() => {
    let active = true;

    const loadEnrollments = async () => {
      if (!selectedCourseId) {
        setEnrollments([]);
        return;
      }

      const token = authStorage.getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      setIsLoadingEnrollments(true);
      try {
        const response = await api.get<ApiResponse<Enrollment[]>>(
          `/enrollments/course/${selectedCourseId}`,
        );
        if (!active) return;
        setEnrollments(response.data.data || []);
      } catch (err: any) {
        if (!active) return;
        const status = err?.response?.status;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load enrollments.";

        if (status === 401) {
          authStorage.clearAll();
          navigate("/login");
          return;
        }

        toast({
          title: "Unable to load enrollments",
          description: message,
          variant: "destructive",
        });
      } finally {
        if (active) setIsLoadingEnrollments(false);
      }
    };

    loadEnrollments();

    return () => {
      active = false;
    };
  }, [navigate, selectedCourseId, toast]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course._id === selectedCourseId),
    [courses, selectedCourseId],
  );

  const filteredEnrollments = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return enrollments;
    return enrollments.filter((enrollment) => {
      const name = enrollment.student?.name?.toLowerCase() || "";
      const email = enrollment.student?.email?.toLowerCase() || "";
      return name.includes(normalized) || email.includes(normalized);
    });
  }, [enrollments, searchTerm]);

  const stats = useMemo(() => {
    const total = enrollments.length;
    const approved = enrollments.filter((item) => item.approvalStatus === "approved").length;
    const pending = enrollments.filter((item) => item.approvalStatus === "pending").length;
    const completed = enrollments.filter((item) => item.completionStatus === "completed").length;
    return { total, approved, pending, completed };
  }, [enrollments]);

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 max-w-5xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Enrollments
            </p>
            <h1 className="text-2xl font-semibold">Enrolled students</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select a course to review its enrolled learners and progress.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>

        <div className="glass-card rounded-xl border border-border/70 p-6 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Course enrollment roster</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="">
                  {isLoadingCourses ? "Loading courses..." : "Select a course"}
                </option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search student"
                className="w-56"
              />
            </div>
          </div>

          {selectedCourse && (
            <p className="text-sm text-muted-foreground">
              Showing enrollments for <span className="font-medium">{selectedCourse.title}</span>.
            </p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard
            title="Total students"
            value={isLoadingEnrollments ? "..." : stats.total}
            change="All enrollments"
            icon={Users}
          />
          <StatsCard
            title="Approved"
            value={stats.approved}
            change="Active learners"
            icon={CheckCircle}
            iconColor="success"
          />
          <StatsCard
            title="Pending"
            value={stats.pending}
            change="Awaiting review"
            icon={Clock5}
            iconColor="warning"
          />
          <StatsCard
            title="Completed"
            value={stats.completed}
            change="Finished courses"
            icon={CheckCircle}
            iconColor="secondary"
          />
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between border-b border-border/70 pb-4">
            <div>
              <h3 className="text-lg font-semibold">Enrolled students</h3>
              <p className="text-xs text-muted-foreground">
                Review approval status, progress, and completion dates.
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            {isLoadingEnrollments ? (
              <p className="text-sm text-muted-foreground">Loading enrollments...</p>
            ) : selectedCourseId && filteredEnrollments.length ? (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <th className="py-2 px-4">Student</th>
                    <th className="py-2 px-4">Status</th>
                    <th className="py-2 px-4">Progress</th>
                    <th className="py-2 px-4">Enrolled</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnrollments.map((enrollment) => (
                    <tr key={enrollment._id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-4 px-4">
                        <p className="font-medium">{enrollment.student?.name || "Unknown student"}</p>
                        <p className="text-xs text-muted-foreground">{enrollment.student?.email}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                            enrollment.approvalStatus === "approved"
                              ? "bg-success/10 text-success"
                              : enrollment.approvalStatus === "rejected"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-warning/10 text-warning"
                          }`}
                        >
                          {enrollment.approvalStatus || "pending"}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1 capitalize">
                          {enrollment.completionStatus?.replace("_", " ") || "not started"}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        {Number.isFinite(enrollment.percentComplete)
                          ? `${enrollment.percentComplete}%`
                          : "0%"}
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        {enrollment.enrolledAt
                          ? new Date(enrollment.enrolledAt).toLocaleDateString()
                          : "Unknown"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : selectedCourseId ? (
              <p className="text-sm text-muted-foreground">No enrollments for this course.</p>
            ) : (
              <p className="text-sm text-muted-foreground">Select a course to view enrollments.</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminEnrolledStudents;
