import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, CheckCircle, Clock5, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import type { ApiResponse, Course } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const approvalChecklist = [
  "Confirm the curriculum covers the advertised learning outcomes.",
  "Verify assets comply with copyright and quality standards.",
  "Check that pricing, duration, and language match expectations.",
];

const getCourseStatus = (course: Course) => {
  if (course.rejectionReason) {
    return { label: "Rejected", badge: "bg-destructive/10 text-destructive" };
  }

  if (course.isApproved && course.isPublished) {
    return { label: "Approved", badge: "bg-success/10 text-success" };
  }

  return { label: "Pending review", badge: "bg-warning/10 text-warning" };
};

const AdminCourses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    const loadCourses = async () => {
      const token = authStorage.getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      setIsLoading(true);
      try {
        const response = await api.get<ApiResponse<Course[]>>("/courses/admin/all");
        if (!active) return;
        setCourses(response.data.data || []);
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
        if (active) setIsLoading(false);
      }
    };

    loadCourses();

    return () => {
      active = false;
    };
  }, [navigate, toast]);

  const stats = useMemo(() => {
    const approved = courses.filter((course) => course.isApproved && course.isPublished).length;
    const rejected = courses.filter((course) => !!course.rejectionReason).length;
    const pending = courses.filter(
      (course) => !course.isApproved && !course.rejectionReason,
    ).length;

    return { total: courses.length, pending, approved, rejected };
  }, [courses]);

  const handleCourseAction = async (
    course: Course,
    action: "approve" | "reject",
    reason?: string,
  ) => {

    const endpoint = action === "approve" ? "approve" : "reject";
    const payload: Record<string, string> = {};

    if (action === "reject" && reason) {
      payload.reason = reason;
    }

    setProcessingIds((prev) => [...prev, course._id]);

    try {
      const response = await api.put<ApiResponse<Course>>(`/courses/${course._id}/${endpoint}`, payload);
      setCourses((prev) =>
        prev.map((current) => (current._id === course._id ? response.data.data : current)),
      );

      toast({
        title: `${course.title} ${action === "approve" ? "approved" : "rejected"}`,
        description:
          action === "approve"
            ? "The course is live for students."
            : "The course has been marked for revisions.",
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Unable to update the course.";

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
      setProcessingIds((prev) => prev.filter((id) => id !== course._id));
    }
  };

  const handleEditCertificateTemplate = async (course: Course) => {
    const enabled = window.confirm("Enable certificates for this course?");
    const title = window.prompt(
      "Certificate title",
      course.certificateTemplate?.title || "Certificate of Completion",
    );
    if (title === null) {
      return;
    }
    const subtitle = window.prompt(
      "Certificate subtitle",
      course.certificateTemplate?.subtitle || "This certifies that",
    );
    if (subtitle === null) {
      return;
    }
    const signatureName = window.prompt(
      "Signature name",
      course.certificateTemplate?.signatureName || "TESBINN Learning",
    );
    if (signatureName === null) {
      return;
    }
    const signatureTitle = window.prompt(
      "Signature title",
      course.certificateTemplate?.signatureTitle || "Program Director",
    );
    if (signatureTitle === null) {
      return;
    }
    const logoUrl = window.prompt(
      "Logo URL (optional)",
      course.certificateTemplate?.logoUrl || "",
    );
    if (logoUrl === null) {
      return;
    }
    const backgroundUrl = window.prompt(
      "Background URL (optional)",
      course.certificateTemplate?.backgroundUrl || "",
    );
    if (backgroundUrl === null) {
      return;
    }

    setProcessingIds((prev) => [...prev, course._id]);
    try {
      const response = await api.put<ApiResponse<Course["certificateTemplate"]>>(
        `/courses/${course._id}/certificate-template`,
        {
          enabled,
          title: title.trim(),
          subtitle: subtitle.trim(),
          signatureName: signatureName.trim(),
          signatureTitle: signatureTitle.trim(),
          logoUrl: logoUrl.trim() || undefined,
          backgroundUrl: backgroundUrl.trim() || undefined,
        },
      );
      setCourses((prev) =>
        prev.map((current) =>
          current._id === course._id
            ? { ...current, certificateTemplate: response.data.data }
            : current,
        ),
      );
      toast({
        title: "Certificate template updated",
        description: `${course.title} template saved.`,
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Unable to update certificate template.";

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
      setProcessingIds((prev) => prev.filter((id) => id !== course._id));
    }
  };

  const handleRejectClick = (course: Course) => {
    const reason = window.prompt(
      "Optional reason for rejection (helps instructors improve):",
      "Needs updates",
    );

    if (reason === null) {
      return;
    }

    handleCourseAction(course, "reject", reason.trim());
  };

  const courseRows = courses.map((course) => {
    const isProcessing = processingIds.includes(course._id);
    const status = getCourseStatus(course);
    const certificateEnabled = course.certificateTemplate?.enabled !== false;

    return (
      <tr key={course._id} className="border-b border-border/50 hover:bg-muted/50">
        <td className="py-4 px-4">
          <p className="font-medium">{course.title}</p>
          <p className="text-xs text-muted-foreground">
            {course.teacher?.name || "Unknown instructor"}
          </p>
          <p className="text-xs text-muted-foreground">{course.teacher?.email}</p>
        </td>
        <td className="py-4 px-4">
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${status.badge}`}
          >
            {status.label}
          </span>
          {course.rejectionReason && (
            <p className="text-xs text-destructive mt-1">{course.rejectionReason}</p>
          )}
        </td>
        <td className="py-4 px-4 text-muted-foreground">
          {course.category}
        </td>
        <td className="py-4 px-4">
          <div className="flex flex-col items-start gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                certificateEnabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
              }`}
            >
              {certificateEnabled ? "Enabled" : "Disabled"}
            </span>
            <Button
              size="sm"
              variant="ghost"
              disabled={isProcessing}
              onClick={() => handleEditCertificateTemplate(course)}
            >
              Edit template
            </Button>
          </div>
        </td>
        <td className="py-4 px-4 text-right">
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isProcessing || status.label === "Approved"}
              onClick={() => handleCourseAction(course, "approve")}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isProcessing}
              onClick={() => handleRejectClick(course)}
            >
              Reject
            </Button>
          </div>
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
              Courses
            </p>
            <h1 className="text-2xl font-semibold">Catalog supervision</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track every course, approve quality content, and reject submissions that need work.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total courses"
            value={isLoading ? "..." : stats.total}
            change="Including drafts"
            icon={BookOpen}
          />
          <StatsCard
            title="Pending"
            value={stats.pending}
            change="Need review"
            changeType="neutral"
            icon={Clock5}
            iconColor="warning"
          />
          <StatsCard
            title="Approved"
            value={stats.approved}
            change="Live in catalog"
            icon={CheckCircle}
            iconColor="success"
          />
          <StatsCard
            title="Rejected"
            value={stats.rejected}
            change="Sent back for edits"
            icon={ShieldCheck}
            iconColor="destructive"
          />
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between border-b border-border/70 pb-4">
            <div>
              <h2 className="text-lg font-semibold">Approval queue</h2>
              <p className="text-xs text-muted-foreground">
                Approve to publish, reject to send back for improvements.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/approvals">Back to approvals</Link>
            </Button>
          </div>

          <div className="mt-4 overflow-x-auto">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading catalog...</p>
            ) : courses.length ? (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <th className="py-2 px-4">Course</th>
                    <th className="py-2 px-4">Status</th>
                    <th className="py-2 px-4">Category</th>
                    <th className="py-2 px-4">Certificate</th>
                    <th className="py-2 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>{courseRows}</tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">No courses created yet.</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="glass-card rounded-xl border border-border/70 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Course checklist</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Focus on the dimensions that matter before approving a course.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {approvalChecklist.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card rounded-xl border border-border/70 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-warning" />
              <h2 className="text-lg font-semibold">Catalog health</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Keep rejected submissions on deck until instructors resubmit updates.
            </p>
            <p className="text-sm text-muted-foreground">
              Use this table to approve new launches or signal revisions immediately.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminCourses;
