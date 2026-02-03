import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, UserCheck, BookOpen, ShieldCheck, AlertCircle, GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import type { ApiResponse, User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const courseSteps = [
  "Review learning objectives and description",
  "Confirm media quality and asset rights",
  "Ensure pricing and localization are accurate",
];

type PendingEnrollment = {
  _id: string;
  approvalStatus: "pending" | "approved" | "rejected";
  createdAt?: string;
  student?: {
    _id?: string;
    name?: string;
    email?: string;
    status?: string;
  };
  course?: {
    _id?: string;
    title?: string;
    category?: string;
    teacher?: {
      _id?: string;
      name?: string;
    };
  };
};

const AdminApprovals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollment[]>([]);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
  const [enrollmentSearch, setEnrollmentSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");

  useEffect(() => {
    let active = true;

    const loadUsers = async () => {
      const token = authStorage.getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      setIsFetching(true);
      try {
        const response = await api.get<ApiResponse<User[]>>("/users");
        if (!active) return;
        setUsers(response.data.data || []);
      } catch (err: any) {
        if (!active) return;
        const status = err?.response?.status;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load users.";

        if (status === 401) {
          authStorage.clearAll();
          navigate("/login");
          return;
        }

        toast({
          title: "Unable to load users",
          description: message,
          variant: "destructive",
        });
      } finally {
        if (active) setIsFetching(false);
      }
    };

    loadUsers();

    return () => {
      active = false;
    };
  }, [navigate, toast]);

  useEffect(() => {
    let active = true;

    const loadEnrollments = async () => {
      const token = authStorage.getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      setIsLoadingEnrollments(true);
      try {
        const response = await api.get<ApiResponse<PendingEnrollment[]>>("/enrollments/pending");
        if (!active) return;
        setPendingEnrollments(response.data.data || []);
      } catch (err: any) {
        if (!active) return;
        const status = err?.response?.status;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load enrollment requests.";

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
  }, [navigate, toast]);

  const teacherUsers = useMemo(() => users.filter((user) => user.role === "teacher"), [users]);
  const teacherStats = useMemo(
    () => ({
      total: teacherUsers.length,
      pending: teacherUsers.filter((user) => user.status === "pending").length,
      active: teacherUsers.filter((user) => user.status === "active").length,
    }),
    [teacherUsers],
  );
  const pendingEnrollmentCount = pendingEnrollments.length;

  const courseOptions = useMemo(() => {
    const map = new Map<string, string>();
    pendingEnrollments.forEach((enrollment) => {
      if (enrollment.course?._id && enrollment.course.title) {
        map.set(enrollment.course._id, enrollment.course.title);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [pendingEnrollments]);

  const filteredEnrollments = useMemo(() => {
    const normalizedSearch = enrollmentSearch.trim().toLowerCase();
    return pendingEnrollments.filter((enrollment) => {
      if (courseFilter !== "all" && enrollment.course?._id !== courseFilter) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      const studentName = enrollment.student?.name?.toLowerCase() || "";
      const studentEmail = enrollment.student?.email?.toLowerCase() || "";
      const courseTitle = enrollment.course?.title?.toLowerCase() || "";
      const teacherName = enrollment.course?.teacher?.name?.toLowerCase() || "";
      return (
        studentName.includes(normalizedSearch) ||
        studentEmail.includes(normalizedSearch) ||
        courseTitle.includes(normalizedSearch) ||
        teacherName.includes(normalizedSearch)
      );
    });
  }, [pendingEnrollments, enrollmentSearch, courseFilter]);

  const handleReviewEnrollment = async (enrollmentId: string, status: "approved" | "rejected") => {
    setUpdatingIds((prev) => [...prev, enrollmentId]);
    try {
      const rejectionReason =
        status === "rejected" ? window.prompt("Reason for rejection (optional):") || undefined : undefined;
      await api.put<ApiResponse<PendingEnrollment>>(`/enrollments/${enrollmentId}/review`, {
        status,
        rejectionReason,
      });
      setPendingEnrollments((prev) => prev.filter((item) => item._id !== enrollmentId));
      toast({
        title: status === "approved" ? "Enrollment approved" : "Enrollment rejected",
        description: "The student enrollment status has been updated.",
      });
    } catch (err: any) {
      const statusCode = err?.response?.status;
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to update enrollment.";

      if (statusCode === 401) {
        authStorage.clearAll();
        navigate("/login");
        return;
      }

      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUpdatingIds((prev) => prev.filter((id) => id !== enrollmentId));
    }
  };

  const handleToggleStatus = async (user: User, nextChecked: boolean) => {
    const nextStatus: User["status"] = nextChecked ? "active" : "pending";
    setUpdatingIds((prev) => [...prev, user._id]);
    try {
      const res = await api.put<ApiResponse<User>>(`/users/${user._id}/status`, {
        status: nextStatus,
      });
      setUsers((prev) =>
        prev.map((current) => (current._id === user._id ? res.data.data : current)),
      );

      toast({
        title: "Status updated",
        description: `${user.name} is now ${nextStatus}.`,
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to update the status.";

      if (status === 401) {
        authStorage.clearAll();
        navigate("/login");
        return;
      }

      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUpdatingIds((prev) => prev.filter((id) => id !== user._id));
    }
  };

  const teacherRows = teacherUsers.map((teacher) => {
    const isUpdating = updatingIds.includes(teacher._id);
    return (
      <tr key={teacher._id} className="border-b border-border/50 hover:bg-muted/50">
        <td className="py-4 px-4">
          <p className="font-medium">{teacher.name}</p>
          <p className="text-xs text-muted-foreground">{teacher.email}</p>
        </td>
        <td className="py-4 px-4">
          <p
            className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-semibold ${
              teacher.status === "active"
                ? "bg-success/10 text-success"
                : "bg-warning/10 text-warning"
            }`}
          >
            {teacher.status}
          </p>
        </td>
        <td className="py-4 px-4 text-right">
          <Switch
            checked={teacher.status === "active"}
            onCheckedChange={(checked) => handleToggleStatus(teacher, checked)}
            disabled={isUpdating || isFetching}
            aria-label={`Toggle ${teacher.name} active status`}
          />
        </td>
      </tr>
    );
  });

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 max-w-5xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Teacher & Course Approvals
            </p>
            <h1 className="text-2xl font-semibold">Approve what&apos;s next</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Teachers and courses require your attention before they become public.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard
            title="Teachers"
            value={teacherStats.total}
            change={`${teacherStats.active} active`}
            icon={UserCheck}
          />
          <StatsCard
            title="Pending"
            value={teacherStats.pending}
            change="Awaiting approval"
            icon={AlertCircle}
            iconColor="warning"
          />
          <StatsCard
            title="Enrollments"
            value={pendingEnrollmentCount}
            change="Pending requests"
            icon={GraduationCap}
            iconColor="secondary"
          />
          <StatsCard
            title="Actions"
            value="Toggle active"
            change="Instant updates"
            icon={ShieldCheck}
            iconColor="secondary"
          />
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex flex-col gap-3 border-b border-border/70 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Enrollment approvals</h2>
              <p className="text-xs text-muted-foreground">
                Review student requests and approve access to their courses.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                value={enrollmentSearch}
                onChange={(event) => setEnrollmentSearch(event.target.value)}
                placeholder="Search student or course"
                className="w-56"
              />
              <select
                value={courseFilter}
                onChange={(event) => setCourseFilter(event.target.value)}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="all">All courses</option>
                {courseOptions.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            {isLoadingEnrollments ? (
              <p className="text-sm text-muted-foreground">Loading enrollment requests...</p>
            ) : filteredEnrollments.length ? (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <th className="py-2 px-4">Student</th>
                    <th className="py-2 px-4">Course</th>
                    <th className="py-2 px-4">Requested</th>
                    <th className="py-2 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnrollments.map((enrollment) => {
                    const isUpdating = updatingIds.includes(enrollment._id);
                    return (
                      <tr key={enrollment._id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-4 px-4">
                          <p className="font-medium">{enrollment.student?.name || "Unknown student"}</p>
                          <p className="text-xs text-muted-foreground">{enrollment.student?.email}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-medium">{enrollment.course?.title || "Unknown course"}</p>
                          <p className="text-xs text-muted-foreground">
                            Instructor: {enrollment.course?.teacher?.name || "N/A"}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">
                          {enrollment.createdAt
                            ? new Date(enrollment.createdAt).toLocaleDateString()
                            : "Unknown"}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isUpdating}
                              onClick={() => handleReviewEnrollment(enrollment._id, "rejected")}
                            >
                              Reject
                            </Button>
                            <Button
                              variant="gradient"
                              size="sm"
                              disabled={isUpdating}
                              onClick={() => handleReviewEnrollment(enrollment._id, "approved")}
                            >
                              Approve
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">No pending enrollment requests.</p>
            )}
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between border-b border-border/70 pb-4">
            <div>
              <h2 className="text-lg font-semibold">Teacher approvals</h2>
              <p className="text-xs text-muted-foreground">
                Toggle a teacher to `active` so they can publish courses immediately.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/users">Manage all users</Link>
            </Button>
          </div>

          <div className="mt-4 overflow-x-auto">
            {isFetching ? (
              <p className="text-sm text-muted-foreground">Loading teachers...</p>
            ) : teacherUsers.length ? (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <th className="py-2 px-4">Name</th>
                    <th className="py-2 px-4">Status</th>
                    <th className="py-2 px-4 text-right">Approve</th>
                  </tr>
                </thead>
                <tbody>{teacherRows}</tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">No teachers yet.</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="glass-card rounded-xl border border-border/70 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-warning" />
              <h2 className="text-lg font-semibold">Teacher checklist</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Keep the teaching staff high quality by approving verified educators.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-secondary" />
                Verify identity documents and qualifications.
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-secondary" />
                Confirm payout setup before activation.
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-secondary" />
                Assign onboarding resources when approved.
              </li>
            </ul>
          </div>

          <div className="glass-card rounded-xl border border-border/70 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Course approvals</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Courses must pass the launch checklist to appear in the catalog.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {courseSteps.map((step) => (
                <li key={step} className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/courses">Review courses</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminApprovals;
