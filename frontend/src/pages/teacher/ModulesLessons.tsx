import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Layers,
  FileText,
  Play,
  Activity,
  ListMusic,
  Edit3,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import type { ApiResponse, Course } from "@/lib/types";
type CourseModule = NonNullable<Course["modules"]>[number];
type CourseLesson = NonNullable<CourseModule["lessons"]>[number];
import { useToast } from "@/hooks/use-toast";

type QuizQuestionForm = {
  question: string;
  options: string[];
  correctIndex: number;
};

type QuizForm = {
  title: string;
  description: string;
  passingScore: string;
  questions: QuizQuestionForm[];
};

const TeacherModules = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: "", description: "", order: "" });
  const [moduleEditId, setModuleEditId] = useState<string | null>(null);
  const [moduleEditForm, setModuleEditForm] = useState({ title: "", description: "", order: "" });
  const [quizEditModuleId, setQuizEditModuleId] = useState<string | null>(null);
  const [quizForm, setQuizForm] = useState<QuizForm>({
    title: "",
    description: "",
    passingScore: "70",
    questions: [{ question: "", options: ["", ""], correctIndex: 0 }],
  });
  const [lessonForm, setLessonForm] = useState({
    moduleId: "",
    title: "",
    description: "",
    lessonType: "video",
    duration: "",
    order: "",
    content: "",
    videoUrl: "",
    imageUrl: "",
    documentUrl: "",
  });
  const [lessonEditTarget, setLessonEditTarget] = useState<{
    moduleId: string;
    lessonId: string;
  } | null>(null);
  const [lessonEditForm, setLessonEditForm] = useState({
    title: "",
    description: "",
    lessonType: "video",
    duration: "",
    order: "",
    content: "",
    videoUrl: "",
    imageUrl: "",
    documentUrl: "",
  });
  const [moduleSaving, setModuleSaving] = useState(false);
  const [lessonSaving, setLessonSaving] = useState(false);
  const [moduleUpdating, setModuleUpdating] = useState(false);
  const [quizUpdating, setQuizUpdating] = useState(false);
  const [lessonUpdating, setLessonUpdating] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

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
        const res = await api.get<ApiResponse<Course[]>>("/courses/me");
        if (!active) return;
        setCourses(res.data.data || []);
        if (!selectedCourseId && res.data.data?.length) {
          setSelectedCourseId(res.data.data[0]._id);
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
          title: "Load error",
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
  }, [navigate, selectedCourseId, toast]);

  const selectedCourse = courses.find((course) => course._id === selectedCourseId) || null;
  const activeModules = selectedCourse?.modules || [];

  useEffect(() => {
    if (selectedCourse && activeModules.length && !lessonForm.moduleId) {
      setLessonForm((prev) => ({ ...prev, moduleId: activeModules[0]._id }));
    }
  }, [activeModules, lessonForm.moduleId, selectedCourse]);

  useEffect(() => {
    setSelectedFile(null);
    setUploadFeedback(null);
    setFileInputKey((prev) => prev + 1);
  }, [lessonForm.lessonType]);

  const stats = useMemo(() => {
    const moduleCount = courses.reduce((sum, course) => sum + (course.modules?.length || 0), 0);
    const lessonCount = courses.reduce(
      (sum, course) =>
        sum +
        (course.modules?.reduce((moduleSum, module) => moduleSum + (module.lessons?.length || 0), 0) ||
          0),
      0,
    );
    return { moduleCount, lessonCount };
  }, [courses]);

  const buildQuizForm = (module: CourseModule | null): QuizForm => {
    const quiz = module?.quiz;
    if (!quiz) {
      return {
        title: "",
        description: "",
        passingScore: "70",
        questions: [{ question: "", options: ["", ""], correctIndex: 0 }],
      };
    }
    return {
      title: quiz.title || "",
      description: quiz.description || "",
      passingScore: quiz.passingScore !== undefined ? String(quiz.passingScore) : "70",
      questions: (quiz.questions || []).map((question) => ({
        question: question.question,
        options: question.options || ["", ""],
        correctIndex: Number.isFinite(question.correctIndex) ? question.correctIndex : 0,
      })),
    };
  };

  const handleQuizEditStart = (module: CourseModule) => {
    setQuizEditModuleId(module._id);
    setQuizForm(buildQuizForm(module));
  };

  const handleQuizAddQuestion = () => {
    setQuizForm((prev) => ({
      ...prev,
      questions: [...prev.questions, { question: "", options: ["", ""], correctIndex: 0 }],
    }));
  };

  const handleQuizRemoveQuestion = (index: number) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleQuizQuestionChange = (index: number, value: string) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, i) =>
        i === index ? { ...question, question: value } : question
      ),
    }));
  };

  const handleQuizAnswerChange = (index: number, value: number) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, i) =>
        i === index ? { ...question, correctIndex: value } : question
      ),
    }));
  };

  const handleQuizOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, i) => {
        if (i !== questionIndex) return question;
        const options = question.options.map((option, idx) =>
          idx === optionIndex ? value : option
        );
        return { ...question, options };
      }),
    }));
  };

  const handleQuizAddOption = (questionIndex: number) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, i) =>
        i === questionIndex
          ? { ...question, options: [...question.options, ""] }
          : question
      ),
    }));
  };

  const handleQuizRemoveOption = (questionIndex: number, optionIndex: number) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, i) => {
        if (i !== questionIndex) return question;
        const options = question.options.filter((_, idx) => idx !== optionIndex);
        const correctIndex =
          question.correctIndex >= options.length ? options.length - 1 : question.correctIndex;
        return { ...question, options, correctIndex: Math.max(correctIndex, 0) };
      }),
    }));
  };

  const handleQuizSave = async (module: CourseModule) => {
    if (!selectedCourse) return;

    if (!quizForm.questions.length) {
      toast({ title: "Add at least one question", variant: "destructive" });
      return;
    }

    const sanitizedQuestions = quizForm.questions.map((question, index) => ({
      question: question.question.trim(),
      options: question.options.map((option) => option.trim()).filter(Boolean),
      correctIndex: question.correctIndex,
      order: index + 1,
    }));

    const invalidQuestion = sanitizedQuestions.find(
      (question) => !question.question || question.options.length < 2
    );

    if (invalidQuestion) {
      toast({
        title: "Quiz validation error",
        description: "Each question needs text and at least two options.",
        variant: "destructive",
      });
      return;
    }

    setQuizUpdating(true);
    try {
      const payload = {
        quiz: {
          title: quizForm.title.trim() || "Module Quiz",
          description: quizForm.description.trim() || undefined,
          passingScore: Number.isFinite(Number(quizForm.passingScore))
            ? Number(quizForm.passingScore)
            : 70,
          questions: sanitizedQuestions.map(({ question, options, correctIndex }) => ({
            question,
            options,
            correctIndex: Math.min(Math.max(correctIndex, 0), options.length - 1),
          })),
        },
      };

      const res = await api.put(`/modules/${selectedCourse._id}/${module._id}`, payload);
      const updatedModule = res.data.data;
      setCourses((prev) =>
        prev.map((course) =>
          course._id === selectedCourse._id
            ? {
                ...course,
                modules: (course.modules || []).map((mod) =>
                  mod._id === module._id ? { ...mod, ...updatedModule } : mod
                ),
              }
            : course
        )
      );
      setQuizEditModuleId(null);
      toast({ title: "Quiz saved" });
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.response?.data?.message || "Unable to save quiz.";
      toast({ title: "Quiz error", description: message, variant: "destructive" });
    } finally {
      setQuizUpdating(false);
    }
  };

  const handleQuizRemove = async (module: CourseModule) => {
    if (!selectedCourse) return;

    const confirmed = window.confirm("Remove the quiz from this module?");
    if (!confirmed) return;

    setQuizUpdating(true);
    try {
      const res = await api.put(`/modules/${selectedCourse._id}/${module._id}`, { quiz: null });
      const updatedModule = res.data.data;
      setCourses((prev) =>
        prev.map((course) =>
          course._id === selectedCourse._id
            ? {
                ...course,
                modules: (course.modules || []).map((mod) =>
                  mod._id === module._id ? { ...mod, ...updatedModule } : mod
                ),
              }
            : course
        )
      );
      setQuizEditModuleId(null);
      toast({ title: "Quiz removed" });
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.response?.data?.message || "Unable to remove quiz.";
      toast({ title: "Quiz error", description: message, variant: "destructive" });
    } finally {
      setQuizUpdating(false);
    }
  };

  const handleModuleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCourse) {
      toast({ title: "Select a course first", variant: "destructive" });
      return;
    }

    if (!moduleForm.title.trim()) {
      toast({ title: "Module title required", variant: "destructive" });
      return;
    }

    const orderInput = Number(moduleForm.order);
    const order = Number.isFinite(orderInput) ? orderInput : activeModules.length + 1;

    setModuleSaving(true);
    try {
      const res = await api.post("/modules", {
        courseId: selectedCourse._id,
        title: moduleForm.title.trim(),
        description: moduleForm.description.trim(),
        order,
      });
      setCourses((prev) =>
        prev.map((course) =>
          course._id === selectedCourse._id
            ? { ...course, modules: [...(course.modules || []), res.data.data] }
            : course,
        ),
      );
      setModuleForm({ title: "", description: "", order: "" });
      toast({ title: "Module created" });
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.response?.data?.message || "Unable to create module.";
      toast({ title: "Module error", description: message, variant: "destructive" });
    } finally {
      setModuleSaving(false);
    }
  };

  const handleLessonSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCourse || !lessonForm.moduleId) {
      toast({ title: "Select module", variant: "destructive" });
      return;
    }

    if (!lessonForm.title.trim()) {
      toast({ title: "Lesson title required", variant: "destructive" });
      return;
    }

    if (lessonForm.lessonType === "video") {
      if (!lessonForm.videoUrl.trim()) {
        toast({ title: "Video URL required", variant: "destructive" });
        return;
      }
      if (!lessonForm.duration.trim()) {
        toast({ title: "Duration required for video lessons", variant: "destructive" });
        return;
      }
    }

    if (lessonForm.lessonType === "pdf" && !lessonForm.documentUrl.trim()) {
      toast({ title: "Document URL required for PDF lessons", variant: "destructive" });
      return;
    }

    if (lessonForm.lessonType === "text" && !lessonForm.content.trim()) {
      toast({ title: "Content required for text lessons", variant: "destructive" });
      return;
    }

    if (lessonForm.lessonType === "image" && !lessonForm.imageUrl.trim()) {
      toast({ title: "Image URL required for image lessons", variant: "destructive" });
      return;
    }

    setLessonSaving(true);
    try {
      const payload: Record<string, unknown> = {
        courseId: selectedCourse._id,
        moduleId: lessonForm.moduleId,
        title: lessonForm.title.trim(),
        description: lessonForm.description.trim(),
        lessonType: lessonForm.lessonType,
        order: Number(lessonForm.order) || undefined,
      };

      if (lessonForm.lessonType === "video") {
        payload.duration = Number(lessonForm.duration);
        payload.videoUrl = lessonForm.videoUrl.trim();
      }

      if (lessonForm.lessonType === "text") {
        payload.content = lessonForm.content.trim();
      }

      if (lessonForm.lessonType === "pdf") {
        payload.documentUrl = lessonForm.documentUrl.trim();
      }
      if (lessonForm.lessonType === "image") {
        payload.imageUrl = lessonForm.imageUrl.trim();
      }

      const res = await api.post("/lessons", payload);
      setCourses((prev) =>
        prev.map((course) =>
          course._id === selectedCourse._id
            ? {
                ...course,
                modules: course.modules.map((module) =>
                  module._id === lessonForm.moduleId
                    ? { ...module, lessons: [...(module.lessons || []), res.data.data] }
                    : module,
                ),
              }
            : course,
        ),
      );
    setLessonForm((prev) => ({
      ...prev,
      title: "",
      description: "",
      content: "",
      duration: "",
      order: "",
      videoUrl: "",
      documentUrl: "",
      imageUrl: "",
    }));
      toast({ title: "Lesson created" });
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.response?.data?.message || "Unable to create lesson.";
      toast({ title: "Lesson error", description: message, variant: "destructive" });
    } finally {
      setLessonSaving(false);
    }
  };

  const uploadTargetField: "videoUrl" | "documentUrl" | "imageUrl" | null =
    lessonForm.lessonType === "video"
      ? "videoUrl"
      : lessonForm.lessonType === "pdf"
        ? "documentUrl"
        : lessonForm.lessonType === "image"
          ? "imageUrl"
          : null;
  const uploadAccept =
    uploadTargetField === "videoUrl"
      ? "video/*"
      : uploadTargetField === "documentUrl"
        ? ".pdf,.doc,.docx,.ppt,.pptx"
        : uploadTargetField === "imageUrl"
          ? "image/*"
          : undefined;

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setUploadFeedback(null);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadFeedback("Select a file before uploading.");
      return;
    }
    if (!uploadTargetField) {
      setUploadFeedback("File uploads require a video or PDF lesson type.");
      return;
    }

    setUploadingFile(true);
    setUploadFeedback(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await api.post("/files/appwrite", formData);

      const url =
        res.data?.data?.viewUrl ||
        res.data?.data?.url ||
        res.data?.data?.downloadUrl ||
        res.data?.data?.fileUrl;
      if (!url) {
        throw new Error("Appwrite did not return a file URL.");
      }

      setLessonForm((prev) => ({ ...prev, [uploadTargetField]: url }));
      setUploadFeedback(`Uploaded to Appwrite: ${url}`);
      setSelectedFile(null);
      setFileInputKey((prev) => prev + 1);
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Upload failed.";
      setUploadFeedback(message);
    } finally {
      setUploadingFile(false);
    }
  };

  const replaceModuleInCourse = (moduleId: string, updater: (module: CourseModule) => CourseModule) => {
    if (!selectedCourse) return;
    setCourses((prev) =>
      prev.map((course) =>
        course._id === selectedCourse._id
          ? {
              ...course,
              modules: course.modules?.map((module) =>
                module._id === moduleId ? updater(module) : module,
              ),
            }
          : course,
      ),
    );
  };

  const handleModuleUpdateStart = (module: CourseModule) => {
    setModuleEditId(module._id);
    setModuleEditForm({
      title: module.title,
      description: module.description || "",
      order: module.order !== undefined ? module.order.toString() : "",
    });
  };

  const handleModuleUpdateSave = async () => {
    if (!moduleEditId || !selectedCourse) return;
    if (!moduleEditForm.title.trim()) {
      toast({ title: "Module title required", variant: "destructive" });
      return;
    }

    const payload = {
      title: moduleEditForm.title.trim(),
      description: moduleEditForm.description.trim(),
      order: moduleEditForm.order ? Number(moduleEditForm.order) : undefined,
    };

    setModuleUpdating(true);
    try {
      const res = await api.put(`/modules/${selectedCourse._id}/${moduleEditId}`, payload);
      replaceModuleInCourse(moduleEditId, () => res.data.data);
      toast({ title: "Module updated" });
      setModuleEditId(null);
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.response?.data?.message || "Unable to update module.";
      toast({ title: "Module error", description: message, variant: "destructive" });
    } finally {
      setModuleUpdating(false);
    }
  };

  const handleModuleDelete = async (moduleId: string) => {
    if (!selectedCourse) return;
    if (!window.confirm("Delete this module and all its lessons?")) return;
    setModuleUpdating(true);
    try {
      await api.delete(`/modules/${selectedCourse._id}/${moduleId}`);
      setCourses((prev) =>
        prev.map((course) =>
          course._id === selectedCourse._id
            ? { ...course, modules: course.modules?.filter((module) => module._id !== moduleId) }
            : course,
        ),
      );
      toast({ title: "Module removed" });
      if (moduleEditId === moduleId) {
        setModuleEditId(null);
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.response?.data?.message || "Unable to delete module.";
      toast({ title: "Module error", description: message, variant: "destructive" });
    } finally {
      setModuleUpdating(false);
    }
  };

  const startLessonEdit = (moduleId: string, lesson: CourseLesson) => {
    setLessonEditTarget({ moduleId, lessonId: lesson._id });
    setLessonEditForm({
      title: lesson.title,
      description: lesson.description || "",
      lessonType: lesson.lessonType,
      duration: lesson.duration?.toString() || "",
      order: lesson.order?.toString() || "",
      content: lesson.content || "",
      videoUrl: lesson.videoUrl || "",
      imageUrl: lesson.imageUrl || "",
      documentUrl: lesson.documentUrl || "",
    });
  };

  const handleLessonUpdateSave = async () => {
    if (!lessonEditTarget || !selectedCourse) return;
    if (!lessonEditForm.title.trim()) {
      toast({ title: "Lesson title required", variant: "destructive" });
      return;
    }

    if (lessonEditForm.lessonType === "video" && !lessonEditForm.videoUrl.trim()) {
      toast({ title: "Video URL required", variant: "destructive" });
      return;
    }

    if (lessonEditForm.lessonType === "pdf" && !lessonEditForm.documentUrl.trim()) {
      toast({ title: "Document URL required", variant: "destructive" });
      return;
    }

    if (lessonEditForm.lessonType === "text" && !lessonEditForm.content.trim()) {
      toast({ title: "Content required", variant: "destructive" });
      return;
    }

    if (lessonEditForm.lessonType === "image" && !lessonEditForm.imageUrl.trim()) {
      toast({ title: "Image URL required", variant: "destructive" });
      return;
    }

    setLessonUpdating(true);
    try {
      const payload: Record<string, unknown> = {
        title: lessonEditForm.title.trim(),
        description: lessonEditForm.description.trim(),
        lessonType: lessonEditForm.lessonType,
        order: lessonEditForm.order ? Number(lessonEditForm.order) : undefined,
      };

      if (lessonEditForm.lessonType === "video") {
        payload.videoUrl = lessonEditForm.videoUrl.trim();
        payload.duration = lessonEditForm.duration ? Number(lessonEditForm.duration) : undefined;
      } else if (lessonEditForm.lessonType === "text") {
        payload.content = lessonEditForm.content.trim();
      } else if (lessonEditForm.lessonType === "pdf") {
        payload.documentUrl = lessonEditForm.documentUrl.trim();
      } else if (lessonEditForm.lessonType === "image") {
        payload.imageUrl = lessonEditForm.imageUrl.trim();
      }

      const res = await api.put(
        `/lessons/${selectedCourse._id}/${lessonEditTarget.moduleId}/${lessonEditTarget.lessonId}`,
        payload,
      );
      setCourses((prev) =>
        prev.map((course) => {
          if (course._id !== selectedCourse._id) return course;
          return {
            ...course,
            modules: course.modules?.map((mod) => {
              if (mod._id !== lessonEditTarget.moduleId) return mod;
              return {
                ...mod,
                lessons: mod.lessons?.map((lesson) =>
                  lesson._id === lessonEditTarget.lessonId ? res.data.data : lesson,
                ),
              };
            }),
          };
        }),
      );
      toast({ title: "Lesson updated" });
      setLessonEditTarget(null);
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.response?.data?.message || "Unable to update lesson.";
      toast({ title: "Lesson error", description: message, variant: "destructive" });
    } finally {
      setLessonUpdating(false);
    }
  };

  const handleLessonDelete = async (moduleId: string, lessonId: string) => {
    if (!selectedCourse) return;
    if (!window.confirm("Delete this lesson?")) return;
    setLessonUpdating(true);
    try {
      await api.delete(`/lessons/${selectedCourse._id}/${moduleId}/${lessonId}`);
      setCourses((prev) =>
        prev.map((course) => {
          if (course._id !== selectedCourse._id) return course;
          return {
            ...course,
            modules: course.modules?.map((mod) =>
              mod._id === moduleId
                ? { ...mod, lessons: mod.lessons?.filter((lesson) => lesson._id !== lessonId) }
                : mod,
            ),
          };
        }),
      );
      toast({ title: "Lesson removed" });
      if (lessonEditTarget?.lessonId === lessonId) {
        setLessonEditTarget(null);
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.response?.data?.message || "Unable to delete lesson.";
      toast({ title: "Lesson error", description: message, variant: "destructive" });
    } finally {
      setLessonUpdating(false);
    }
  };

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Modules & Lessons</h1>
            <p className="text-muted-foreground mt-1">
              Build your curriculum once the base course is approved.
            </p>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/teacher">Back to dashboard</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Courses" value={courses.length} icon={BookOpen} />
          <StatsCard title="Modules" value={stats.moduleCount} icon={Layers} />
          <StatsCard title="Lessons" value={stats.lessonCount} icon={ListMusic} />
          <StatsCard title="Recent activity" value="Live" icon={Activity} iconColor="success" />
        </div>

        <div className="glass-card rounded-xl border border-border/70 p-5 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Label>Choose course</Label>
            <Select
              value={selectedCourseId || ""}
              onValueChange={(value) => setSelectedCourseId(value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course._id} value={course._id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="link" size="sm" asChild>
              <Link to="/teacher/courses/create">
                Add course
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={handleModuleSubmit} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Add new module</p>
                <span className="text-xs text-muted-foreground">
                  Order {moduleForm.order || activeModules.length + 1}
                </span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="module-title">Title</Label>
                <Input
                  id="module-title"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="module-description">Description</Label>
                <Textarea
                  id="module-description"
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="module-order">Order</Label>
                <Input
                  id="module-order"
                  type="number"
                  min={1}
                  value={moduleForm.order}
                  onChange={(e) => setModuleForm((prev) => ({ ...prev, order: e.target.value }))}
                />
              </div>
              <Button type="submit" disabled={moduleSaving}>
                {moduleSaving ? "Saving..." : "Save module"}
              </Button>
            </form>

            <form onSubmit={handleLessonSubmit} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Add new lesson</p>
                <span className="text-xs text-muted-foreground">
                  Type {lessonForm.lessonType.toUpperCase()}
                </span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson-module">Module</Label>
                <Select
                  id="lesson-module"
                  value={lessonForm.moduleId}
                  onValueChange={(value) => setLessonForm((prev) => ({ ...prev, moduleId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeModules.map((module) => (
                      <SelectItem key={module._id} value={module._id}>
                        {module.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson-title">Title</Label>
                <Input
                  id="lesson-title"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson-description">Description</Label>
                <Textarea
                  id="lesson-description"
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lesson-type">Type</Label>
                  <Select
                    id="lesson-type"
                    value={lessonForm.lessonType}
                    onValueChange={(value) => setLessonForm((prev) => ({ ...prev, lessonType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Video/Text/PDF" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  {lessonForm.lessonType === "video" ? (
                    <>
                      <Label htmlFor="lesson-duration">Duration (min)</Label>
                      <Input
                        id="lesson-duration"
                        type="number"
                        value={lessonForm.duration}
                        onChange={(e) => setLessonForm((prev) => ({ ...prev, duration: e.target.value }))}
                      />
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Duration is optional unless you select video lessons.
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lesson-order">Order</Label>
                  <Input
                    id="lesson-order"
                    type="number"
                    value={lessonForm.order}
                    onChange={(e) => setLessonForm((prev) => ({ ...prev, order: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                {lessonForm.lessonType === "video" ? (
                  <>
                    <Label htmlFor="lesson-video-url">Video URL</Label>
                    <Input
                      id="lesson-video-url"
                      value={lessonForm.videoUrl}
                      onChange={(e) => setLessonForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </>
                ) : lessonForm.lessonType === "pdf" ? (
                  <>
                    <Label htmlFor="lesson-document-url">Document URL</Label>
                    <Input
                      id="lesson-document-url"
                      value={lessonForm.documentUrl}
                        onChange={(e) => setLessonForm((prev) => ({ ...prev, documentUrl: e.target.value }))}
                        placeholder="https://..."
                    />
                  </>
                  ) : lessonForm.lessonType === "image" ? (
                    <>
                      <Label htmlFor="lesson-image-url">Image URL</Label>
                      <Input
                        id="lesson-image-url"
                        value={lessonForm.imageUrl}
                        onChange={(e) => setLessonForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                        placeholder="https://..."
                      />
                    </>
                  ) : (
                    <>
                      <Label htmlFor="lesson-content">Content</Label>
                      <Textarea
                        id="lesson-content"
                        value={lessonForm.content}
                        onChange={(e) => setLessonForm((prev) => ({ ...prev, content: e.target.value }))}
                      />
                    </>
                  )}
                </div>
              </div>
              {uploadTargetField ? (
                <div className="rounded-2xl border border-dashed border-border/60 bg-muted/40 p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Upload file to Appwrite</span>
                    <span className="text-xs text-muted-foreground">
                      {uploadTargetField === "videoUrl"
                        ? "Video"
                        : uploadTargetField === "documentUrl"
                          ? "Document"
                          : "Image"} asset
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      key={`file-input-${fileInputKey}`}
                      type="file"
                      accept={uploadAccept}
                      onChange={handleFileInputChange}
                    />
                    <Button
                      variant="outline"
                      disabled={!selectedFile || uploadingFile}
                      onClick={handleFileUpload}
                      className="whitespace-nowrap"
                    >
                      {uploadingFile ? "Uploading..." : "Upload file"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedFile?.name ?? "no file selected"}
                  </p>
                  {uploadFeedback && (
                    <p className="text-xs text-muted-foreground break-words">{uploadFeedback}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  File uploads are only supported for Video, PDF, or Image lessons.
                </p>
              )}
              <Button type="submit" disabled={lessonSaving}>
                {lessonSaving ? "Saving..." : "Save lesson"}
              </Button>
            </form>
          </div>

          <div>
            <p className="text-sm font-semibold text-muted-foreground">Existing modules</p>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading modules...</p>
            ) : activeModules.length ? (
              <div className="space-y-4 mt-4">
                {activeModules.map((module) => (
                  <div
                    key={module._id}
                    className="rounded-xl border border-border/70 p-4 bg-background/50 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{module.title}</p>
                        <span className="text-xs text-muted-foreground">Order {module.order}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleModuleUpdateStart(module)}
                          disabled={moduleUpdating}
                          className="flex items-center gap-1"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleModuleDelete(module._id)}
                          disabled={moduleUpdating}
                          className="flex items-center gap-1 text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{module.description}</p>
                    <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">Module quiz</p>
                          <p className="text-xs text-muted-foreground">
                            {module.quiz?.questions?.length
                              ? `${module.quiz.questions.length} questions • Pass ${module.quiz.passingScore ?? 70}%`
                              : "No quiz assigned to this module."}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleQuizEditStart(module)}
                            disabled={quizUpdating}
                          >
                            {module.quiz ? "Edit quiz" : "Add quiz"}
                          </Button>
                          {module.quiz && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleQuizRemove(module)}
                              disabled={quizUpdating}
                              className="text-destructive"
                            >
                              Remove quiz
                            </Button>
                          )}
                        </div>
                      </div>

                      {quizEditModuleId === module._id && (
                        <div className="mt-4 space-y-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Input
                              value={quizForm.title}
                              onChange={(e) =>
                                setQuizForm((prev) => ({ ...prev, title: e.target.value }))
                              }
                              placeholder="Quiz title"
                            />
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={quizForm.passingScore}
                              onChange={(e) =>
                                setQuizForm((prev) => ({ ...prev, passingScore: e.target.value }))
                              }
                              placeholder="Passing score (%)"
                            />
                          </div>
                          <Textarea
                            value={quizForm.description}
                            onChange={(e) =>
                              setQuizForm((prev) => ({ ...prev, description: e.target.value }))
                            }
                            placeholder="Quiz instructions (optional)"
                            rows={2}
                          />

                          <div className="space-y-4">
                            {quizForm.questions.map((question, questionIndex) => (
                              <div
                                key={`question-${questionIndex}`}
                                className="rounded-xl border border-border/70 bg-background/70 p-4 space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-semibold">Question {questionIndex + 1}</p>
                                  {quizForm.questions.length > 1 && (
                                    <Button
                                      variant="ghost"
                                      size="xs"
                                      onClick={() => handleQuizRemoveQuestion(questionIndex)}
                                      className="text-destructive"
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </div>
                                <Input
                                  value={question.question}
                                  onChange={(e) =>
                                    handleQuizQuestionChange(questionIndex, e.target.value)
                                  }
                                  placeholder="Enter the question"
                                />
                                <div className="space-y-2">
                                  {question.options.map((option, optionIndex) => (
                                    <div key={`option-${questionIndex}-${optionIndex}`} className="flex gap-2">
                                      <Input
                                        value={option}
                                        onChange={(e) =>
                                          handleQuizOptionChange(
                                            questionIndex,
                                            optionIndex,
                                            e.target.value,
                                          )
                                        }
                                        placeholder={`Option ${optionIndex + 1}`}
                                      />
                                      {question.options.length > 2 && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="xs"
                                          onClick={() => handleQuizRemoveOption(questionIndex, optionIndex)}
                                          className="text-destructive"
                                        >
                                          Remove
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    onClick={() => handleQuizAddOption(questionIndex)}
                                  >
                                    Add option
                                  </Button>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                                  <Label>Correct answer</Label>
                                  <Select
                                    value={String(question.correctIndex)}
                                    onValueChange={(value) =>
                                      handleQuizAnswerChange(questionIndex, Number(value))
                                    }
                                  >
                                    <SelectTrigger className="sm:w-40">
                                      <SelectValue placeholder="Correct answer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {question.options.map((_, optionIndex) => (
                                        <SelectItem
                                          key={`correct-${questionIndex}-${optionIndex}`}
                                          value={String(optionIndex)}
                                        >
                                          Option {optionIndex + 1}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            ))}
                            <Button type="button" variant="outline" onClick={handleQuizAddQuestion}>
                              Add question
                            </Button>
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              onClick={() => setQuizEditModuleId(null)}
                              disabled={quizUpdating}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              type="button"
                              onClick={() => handleQuizSave(module)}
                              disabled={quizUpdating}
                            >
                              {quizUpdating ? "Saving..." : "Save quiz"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    {moduleEditId === module._id && (
                      <div className="space-y-3 rounded-xl border border-border/70 bg-muted/40 p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input
                            value={moduleEditForm.title}
                            onChange={(e) =>
                              setModuleEditForm((prev) => ({ ...prev, title: e.target.value }))
                            }
                            placeholder="Module title"
                          />
                          <Input
                            type="number"
                            value={moduleEditForm.order}
                            onChange={(e) =>
                              setModuleEditForm((prev) => ({ ...prev, order: e.target.value }))
                            }
                            placeholder="Order"
                          />
                        </div>
                        <Textarea
                          value={moduleEditForm.description}
                          onChange={(e) =>
                            setModuleEditForm((prev) => ({ ...prev, description: e.target.value }))
                          }
                          placeholder="Module description"
                          rows={2}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setModuleEditId(null)}
                            type="button"
                            disabled={moduleUpdating}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleModuleUpdateSave}
                            disabled={moduleUpdating}
                          >
                            {moduleUpdating ? "Saving..." : "Save module"}
                          </Button>
                        </div>
                      </div>
                    )}
                    {module.lessons && module.lessons.length > 0 && (
                      <div className="space-y-2 pt-2">
                        {module.lessons.map((lesson) => {
                          const isEditingLesson =
                            lessonEditTarget?.lessonId === lesson._id &&
                            lessonEditTarget?.moduleId === module._id;
                          return (
                            <div key={lesson._id} className="space-y-2">
                              <div className="flex items-start justify-between text-sm">
                                <div>
                                  <p className="font-medium">{lesson.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {lesson.lessonType} • {lesson.duration || "?"} min
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    onClick={() => startLessonEdit(module._id, lesson)}
                                    disabled={lessonUpdating}
                                    className="flex items-center gap-1"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => handleLessonDelete(module._id, lesson._id)}
                                    disabled={lessonUpdating}
                                    className="flex items-center gap-1 text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground">Order {lesson.order}</span>
                              {isEditingLesson && (
                                <div className="space-y-3 rounded-xl border border-border/70 bg-muted/40 p-4">
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <Input
                                      value={lessonEditForm.title}
                                      onChange={(e) =>
                                        setLessonEditForm((prev) => ({ ...prev, title: e.target.value }))
                                      }
                                      placeholder="Lesson title"
                                    />
                                    <Input
                                      type="number"
                                      value={lessonEditForm.order}
                                      onChange={(e) =>
                                        setLessonEditForm((prev) => ({ ...prev, order: e.target.value }))
                                      }
                                      placeholder="Order"
                                    />
                                  </div>
                                  <Textarea
                                    value={lessonEditForm.description}
                                    onChange={(e) =>
                                      setLessonEditForm((prev) => ({
                                        ...prev,
                                        description: e.target.value,
                                      }))
                                    }
                                    placeholder="Lesson description"
                                    rows={2}
                                  />
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <Select
                                      value={lessonEditForm.lessonType}
                                      onValueChange={(value) =>
                                        setLessonEditForm((prev) => ({ ...prev, lessonType: value }))
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Lesson type" />
                                      </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                                    </Select>
                                    {lessonEditForm.lessonType === "video" ? (
                                      <Input
                                        type="number"
                                        value={lessonEditForm.duration}
                                        onChange={(e) =>
                                          setLessonEditForm((prev) => ({
                                            ...prev,
                                            duration: e.target.value,
                                          }))
                                        }
                                        placeholder="Duration (min)"
                                      />
                                    ) : (
                                      <p className="text-xs text-muted-foreground">
                                        Duration optional unless video
                                      </p>
                                    )}
                                  </div>
                                  {lessonEditForm.lessonType === "video" ? (
                                    <Input
                                      value={lessonEditForm.videoUrl}
                                      onChange={(e) =>
                                        setLessonEditForm((prev) => ({
                                          ...prev,
                                          videoUrl: e.target.value,
                                        }))
                                      }
                                      placeholder="Video URL"
                                    />
                                  ) : lessonEditForm.lessonType === "pdf" ? (
                                    <Input
                                      value={lessonEditForm.documentUrl}
                                      onChange={(e) =>
                                        setLessonEditForm((prev) => ({
                                          ...prev,
                                          documentUrl: e.target.value,
                                        }))
                                      }
                                      placeholder="Document URL"
                                    />
                                  ) : lessonEditForm.lessonType === "image" ? (
                                    <Input
                                      value={lessonEditForm.imageUrl}
                                      onChange={(e) =>
                                        setLessonEditForm((prev) => ({
                                          ...prev,
                                          imageUrl: e.target.value,
                                        }))
                                      }
                                      placeholder="Image URL"
                                    />
                                  ) : (
                                    <Textarea
                                      value={lessonEditForm.content}
                                      onChange={(e) =>
                                        setLessonEditForm((prev) => ({
                                          ...prev,
                                          content: e.target.value,
                                        }))
                                      }
                                      placeholder="Content"
                                      rows={3}
                                    />
                                  )}
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setLessonEditTarget(null)}
                                      type="button"
                                      disabled={lessonUpdating}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={handleLessonUpdateSave}
                                      disabled={lessonUpdating}
                                    >
                                      {lessonUpdating ? "Saving..." : "Save lesson"}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">
                No modules yet. Create one to unlock lessons.
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherModules;
