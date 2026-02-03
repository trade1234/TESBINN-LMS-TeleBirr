import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Award } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import type { ApiResponse, Certificate } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const AdminCertificates = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");

  useEffect(() => {
    let active = true;

    const loadCertificates = async () => {
      const token = authStorage.getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      setIsLoading(true);
      try {
        const response = await api.get<ApiResponse<Certificate[]>>("/certificates");
        if (!active) return;
        setCertificates(response.data.data || []);
      } catch (err: any) {
        if (!active) return;
        const status = err?.response?.status;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load certificates.";

        if (status === 401) {
          authStorage.clearAll();
          navigate("/login");
          return;
        }

        toast({
          title: "Unable to load certificates",
          description: message,
          variant: "destructive",
        });
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadCertificates();

    return () => {
      active = false;
    };
  }, [navigate, toast]);

  const courseOptions = useMemo(() => {
    const map = new Map<string, string>();
    certificates.forEach((certificate) => {
      if (certificate.course?._id && certificate.course?.title) {
        map.set(certificate.course._id, certificate.course.title);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [certificates]);

  const filteredCertificates = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return certificates.filter((certificate) => {
      if (courseFilter !== "all" && certificate.course?._id !== courseFilter) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      const name = certificate.recipientName?.toLowerCase() || "";
      const courseTitle = certificate.courseTitle?.toLowerCase() || "";
      const number = certificate.certificateNumber?.toLowerCase() || "";
      return (
        name.includes(normalizedSearch) ||
        courseTitle.includes(normalizedSearch) ||
        number.includes(normalizedSearch)
      );
    });
  }, [certificates, searchTerm, courseFilter]);

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 max-w-5xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Certificates</p>
            <h1 className="text-2xl font-semibold">Issued credentials</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track every certificate issued across the catalog.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex flex-col gap-3 border-b border-border/70 pb-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Certificate log</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
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
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading certificates...</p>
            ) : filteredCertificates.length ? (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <th className="py-2 px-4">Student</th>
                    <th className="py-2 px-4">Course</th>
                    <th className="py-2 px-4">Certificate ID</th>
                    <th className="py-2 px-4 text-right">Issued</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCertificates.map((certificate) => (
                    <tr key={certificate._id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-4 px-4">
                        <p className="font-medium">{certificate.recipientName}</p>
                        <p className="text-xs text-muted-foreground">{certificate.course?.title}</p>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        {certificate.courseTitle}
                      </td>
                      <td className="py-4 px-4 text-xs text-muted-foreground">
                        {certificate.certificateNumber}
                      </td>
                      <td className="py-4 px-4 text-right text-sm text-muted-foreground">
                        {certificate.issuedAt
                          ? new Date(certificate.issuedAt).toLocaleDateString()
                          : "Unknown"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">No certificates issued yet.</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminCertificates;
