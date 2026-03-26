import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, ShieldCheck, Play, FileText, Image as ImageIcon } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { ApiResponse, Course } from "@/lib/types";
import { minutesToDurationLabel } from "@/lib/format";

const AdminCoursePreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeMedia, setActiveMedia] = useState<{ type: string; url: string; title: string; content?: string } | null>(null);

  useEffect(() => {
    let active = true;
    const fetchCourse = async () => {
      try {
        const res = await api.get<ApiResponse<Course>>(`/courses/${id}`);
        if (active) setCourse(res.data.data);
      } catch (err: any) {
        if (active) toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchCourse();
    return () => { active = false; };
  }, [id, toast]);

  const handleAction = async (action: "approve" | "reject") => {
    if (!course) return;
    let reason;
    if (action === "reject") {
      reason = window.prompt("Reason for rejection:");
      if (reason === null) return;
    }

    setIsProcessing(true);
    try {
      const endpoint = action === "approve" ? "approve" : "reject";
      await api.put(`/courses/${course._id}/${endpoint}`, action === "reject" ? { reason } : {});
      toast({ title: `Course ${action}d successfully.` });
      navigate("/admin/courses");
    } catch (err: any) {
      toast({ title: "Action failed", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderMedia = () => {
    if (!activeMedia) return null;
    const { type, url, title, content } = activeMedia;
    
    if (type === "video") {
      let embedUrl = url;
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        try {
          const videoId = new URL(url).searchParams.get("v") || url.split("/").pop();
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
          return <iframe src={embedUrl} className="w-full aspect-video rounded-xl" allowFullScreen />;
        } catch {}
      }
      return <video src={url} controls className="w-full aspect-video rounded-xl bg-black" />;
    }
    if (type === "pdf") {
      return <iframe src={url} className="w-full h-[600px] rounded-xl" />;
    }
    if (type === "image") {
      return <img src={url} alt={title} className="w-full max-h-[600px] object-contain rounded-xl bg-muted" />;
    }
    if (type === "text") {
      return <div className="p-8 bg-background border rounded-xl whitespace-pre-wrap">{content || "No text content provided."}</div>;
    }
    return <div className="p-10 text-center bg-muted rounded-xl">Cannot preview this media format.</div>;
  };

  if (isLoading) return <DashboardLayout role="admin"><div className="p-10">Loading...</div></DashboardLayout>;
  if (!course) return <DashboardLayout role="admin"><div className="p-10">Course not found.</div></DashboardLayout>;

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 border-b pb-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/courses"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              {course.title}
              {course.isApproved ? (
                <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full uppercase tracking-wider font-semibold">Approved</span>
              ) : course.rejectionReason ? (
                <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded-full uppercase tracking-wider font-semibold">Rejected</span>
              ) : (
                <span className="text-xs bg-warning/20 text-warning px-2 py-1 rounded-full uppercase tracking-wider font-semibold">Pending Review</span>
              )}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Instructor: {course.teacher?.name || "Unknown"} | Category: {course.category || "N/A"}</p>
          </div>
          <div className="ml-auto flex gap-2">
            {!course.isApproved && (
              <Button onClick={() => handleAction("approve")} disabled={isProcessing} className="bg-success text-white hover:bg-success/90">
                <CheckCircle className="w-4 h-4 mr-2" /> Approve Publish
              </Button>
            )}
            <Button onClick={() => handleAction("reject")} disabled={isProcessing} variant="destructive">
              <ShieldCheck className="w-4 h-4 mr-2" /> {course.isApproved ? "Revoke Approval" : "Send back for fixes"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2 space-y-6">
            {activeMedia ? (
              <div className="space-y-4">
                {renderMedia()}
                <h2 className="text-xl font-semibold px-2">{activeMedia.title}</h2>
              </div>
            ) : (
              <div className="aspect-video bg-muted border border-border/50 rounded-xl flex items-center justify-center text-muted-foreground flex-col gap-3 shadow-inner">
                <div className="p-4 bg-background/50 rounded-full">
                  <Play className="w-12 h-12 opacity-50" />
                </div>
                <p className="font-medium">Select a lesson to preview its content</p>
                <p className="text-xs opacity-70">You can preview videos, documents, text, and images directly here.</p>
              </div>
            )}
            
            <div className="glass-card p-6 rounded-xl space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Course Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{course.description || "No description provided."}</p>
            </div>
          </div>

          <div className="col-span-1 space-y-4 max-h-[800px] overflow-y-auto pr-2">
            <h3 className="font-semibold text-lg sticky top-0 bg-background/95 pb-2 z-10 pt-2">Curriculum Preview</h3>
            {course.modules?.map((module, mIdx) => (
              <div key={module._id} className="border border-border/60 rounded-xl overflow-hidden bg-card shadow-sm">
                <div className="bg-muted/50 p-3 font-medium text-sm border-b">
                  Module {mIdx + 1}: {module.title}
                </div>
                <div className="p-2 space-y-1">
                  {module.lessons?.map((lesson, lIdx) => (
                    <button
                      key={lesson._id}
                      onClick={() => {
                        const url = lesson.lessonType === "video" ? lesson.videoUrl : lesson.lessonType === "pdf" ? lesson.documentUrl : lesson.imageUrl;
                        if (url || lesson.lessonType === "text") {
                           setActiveMedia({ type: lesson.lessonType, url: url || "", title: lesson.title, content: lesson.content });
                        }
                      }}
                      className="w-full text-left p-2 hover:bg-primary/5 rounded-md text-sm flex items-center justify-between transition-colors border border-transparent hover:border-primary/10"
                    >
                      <span className="truncate pr-2 flex items-center gap-2">
                        {lesson.lessonType === "video" ? <Play className="w-4 h-4 text-primary" /> : lesson.lessonType === "pdf" ? <FileText className="w-4 h-4 text-warning" /> : lesson.lessonType === "image" ? <ImageIcon className="w-4 h-4 text-success" /> : <FileText className="w-4 h-4 text-secondary" />}
                        <span className="truncate max-w-[180px]">{lIdx + 1}. {lesson.title}</span>
                      </span>
                      {lesson.duration && <span className="text-xs text-muted-foreground whitespace-nowrap bg-muted px-1.5 py-0.5 rounded">{minutesToDurationLabel(lesson.duration)}</span>}
                    </button>
                  ))}
                  {(!module.lessons || module.lessons.length === 0) && <p className="text-xs text-muted-foreground p-3 text-center italic">No lessons in this module.</p>}
                  {module.quiz?.questions?.length ? (
                    <div className="p-3 bg-primary/5 text-xs text-primary font-medium border-t mt-2 flex items-center gap-2 justify-center">
                      <ShieldCheck className="w-4 h-4" /> Assessment Quiz ({module.quiz.questions.length} Questions)
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {(!course.modules || course.modules.length === 0) && (
              <div className="p-6 text-center border border-dashed rounded-xl">
                <p className="text-sm text-muted-foreground">No modules created yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminCoursePreview;
