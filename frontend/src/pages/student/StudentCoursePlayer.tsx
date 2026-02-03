import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Layers, Play, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import type { ApiResponse, Certificate, Course, Enrollment } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

type CourseModule = NonNullable<Course["modules"]>[number];
type CourseLesson = NonNullable<CourseModule["lessons"]>[number];

type LessonKey = `${string}:${string}`;

type LessonSequenceEntry = {
  module: CourseModule;
  lesson: CourseLesson;
  key: LessonKey;
};

type NextItem =
  | { type: "lesson"; module: CourseModule; lesson: CourseLesson }
  | { type: "quiz"; module: CourseModule };

const PASSING_SCORE = 50;

const StudentCoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingLesson, setIsUpdatingLesson] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [currentLessonKey, setCurrentLessonKey] = useState<string | null>(null);
  const [currentQuizModuleId, setCurrentQuizModuleId] = useState<string | null>(null);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const [isOverlayFullscreen, setIsOverlayFullscreen] = useState(false);
  const mediaWrapperRef = useRef<HTMLDivElement | null>(null);
  const [certificateReady, setCertificateReady] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number[]>>({});
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [autoAdvanceModuleId, setAutoAdvanceModuleId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    let active = true;
    if (!courseId) return;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [courseRes, enrollRes] = await Promise.all([
          api.get<ApiResponse<Course>>(`/courses/${courseId}`),
          api.get<ApiResponse<Enrollment[]>>("/enrollments/me"),
        ]);

        if (!active) return;
        setCourse(courseRes.data.data);
        const found = enrollRes.data.data.find((en) => en.course?._id === courseId);
        if (!found || !found._id) {
          toast({
            title: "Enrollment required",
            description: "You must be enrolled in this course to continue learning.",
            variant: "destructive",
          });
          navigate("/student/courses");
          return;
        }
        if (found.approvalStatus && found.approvalStatus !== "approved") {
          const description =
            found.approvalStatus === "rejected"
              ? "Your enrollment request was rejected. Contact support or request access again."
              : "Your enrollment request is pending admin approval.";
          toast({
            title: "Enrollment not approved",
            description,
            variant: "destructive",
          });
          navigate("/student/courses");
          return;
        }
        setEnrollment(found);
      } catch (err: any) {
        if (!active) return;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load course player.";
        setError(message);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [courseId, navigate, toast]);

  useEffect(() => {
    let active = true;
    if (!courseId) return;
    if (!enrollment || enrollment.completionStatus !== "completed") {
      setCertificateReady(false);
      return;
    }

    const loadCertificates = async () => {
      try {
        const res = await api.get<ApiResponse<Certificate[]>>("/certificates/me");
        if (!active) return;
        const match = res.data.data.find((cert) => cert.course?._id === courseId);
        setCertificateReady(Boolean(match));
      } catch {
        if (active) {
          setCertificateReady(false);
        }
      }
    };

    loadCertificates();

    return () => {
      active = false;
    };
  }, [courseId, enrollment]);

  useEffect(() => {
    if (!enrollment) return;
    setRatingValue(enrollment.rating || 0);
    setRatingComment(enrollment.review || "");
  }, [enrollment]);

  const completedSet = useMemo<Set<LessonKey>>(() => {
    const set = new Set<LessonKey>();
    enrollment?.completedLessons?.forEach((lesson) => {
      if (lesson.moduleId && lesson.lessonId) {
        set.add(`${lesson.moduleId}:${lesson.lessonId}`);
      }
    });
    return set;
  }, [enrollment]);

  const passedQuizSet = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    enrollment?.completedQuizzes?.forEach((quiz) => {
      if (
        quiz.moduleId &&
        (quiz.passed || (typeof quiz.score === "number" && quiz.score >= PASSING_SCORE))
      ) {
        set.add(quiz.moduleId);
      }
    });
    return set;
  }, [enrollment]);

  const quizResultMap = useMemo(() => {
    const map = new Map<string, { score: number; passed: boolean }>();
    enrollment?.completedQuizzes?.forEach((quiz) => {
      if (quiz.moduleId) {
        map.set(quiz.moduleId, { score: quiz.score, passed: quiz.passed });
      }
    });
    return map;
  }, [enrollment]);

  const modules = useMemo(() => {
    if (!course?.modules) return [];
    return course.modules
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [course]);

  const getSortedLessons = useCallback(
    (module: CourseModule) =>
      (module.lessons || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0)),
    [],
  );

  const getNextModuleFirstLesson = useCallback(
    (moduleId: string) => {
      const currentIndex = modules.findIndex((mod) => mod._id === moduleId);
      if (currentIndex === -1) return null;
      for (let i = currentIndex + 1; i < modules.length; i += 1) {
        const module = modules[i];
        const lessons = getSortedLessons(module);
        if (lessons.length) {
          return { module, lesson: lessons[0] };
        }
      }
      return null;
    },
    [getSortedLessons, modules],
  );

  const getBlockingModuleId = useCallback(
    (moduleId: string) => {
      const targetModule = modules.find((module) => module._id === moduleId);
      if (!targetModule) return null;
      const targetOrder = targetModule.order || 0;
      const blockingModule = modules.find((module) => {
        if ((module.order || 0) >= targetOrder) return false;
        if (!module.quiz?.questions?.length) return false;
        return !passedQuizSet.has(module._id);
      });
      return blockingModule?._id || null;
    },
    [modules, passedQuizSet],
  );

  const isModuleUnlocked = (moduleId: string) => {
    const currentModule = modules.find((module) => module._id === moduleId);
    if (!currentModule) return false;
    return !modules.some((module) => {
      if ((module.order || 0) >= (currentModule.order || 0)) return false;
      if (!module.quiz?.questions?.length) return false;
      return !passedQuizSet.has(module._id);
    });
  };

  const unlockedModules = useMemo(
    () => modules.filter((module) => isModuleUnlocked(module._id)),
    [modules, passedQuizSet],
  );

  const hasLockedModules = useMemo(
    () => modules.some((module) => !isModuleUnlocked(module._id)),
    [modules, passedQuizSet],
  );

  const lessonSequence = useMemo<LessonSequenceEntry[]>(() => {
    const sequence: LessonSequenceEntry[] = [];
    unlockedModules.forEach((module) => {
      getSortedLessons(module).forEach((lesson) => {
        sequence.push({
          module,
          lesson,
          key: `${module._id}:${lesson._id}` as LessonKey,
        });
      });
    });
    return sequence;
  }, [getSortedLessons, unlockedModules]);

  const currentLessonIndex = useMemo(() => {
    if (!currentLessonKey) return -1;
    return lessonSequence.findIndex((entry) => entry.key === currentLessonKey);
  }, [currentLessonKey, lessonSequence]);

  const prevSequenceEntry =
    currentLessonIndex > 0 ? lessonSequence[currentLessonIndex - 1] : null;

  const nextSequenceEntry =
    currentLessonIndex >= 0 && currentLessonIndex < lessonSequence.length - 1
      ? lessonSequence[currentLessonIndex + 1]
      : null;

  const nextLesson = useMemo(() => {
    for (const module of unlockedModules) {
      const lessons = getSortedLessons(module);
      for (const lesson of lessons) {
        const key = `${module._id}:${lesson._id}` as LessonKey;
        if (!completedSet.has(key)) {
          return { module, lesson };
        }
      }
    }
    return null;
  }, [completedSet, getSortedLessons, unlockedModules]);

  const nextItem = useMemo<NextItem | null>(() => {
    if (nextLesson) {
      return { type: "lesson", module: nextLesson.module, lesson: nextLesson.lesson };
    }

    for (const module of unlockedModules) {
      const lessons = getSortedLessons(module);
      const allLessonsComplete = lessons.every((lesson) =>
        completedSet.has(`${module._id}:${lesson._id}` as LessonKey),
      );
      if (allLessonsComplete && module.quiz?.questions?.length && !passedQuizSet.has(module._id)) {
        return { type: "quiz", module };
      }
    }

    return null;
  }, [completedSet, getSortedLessons, nextLesson, passedQuizSet, unlockedModules]);

  useEffect(() => {
    if (!nextItem) return;
    if (currentLessonKey || currentQuizModuleId) return;
    const moduleId = nextItem.module._id;
    setExpandedModules((prev) => (prev.includes(moduleId) ? prev : [...prev, moduleId]));
    if (nextItem.type === "lesson") {
      const key = `${nextItem.module._id}:${nextItem.lesson._id}` as LessonKey;
      setCurrentLessonKey(key);
    } else {
      setCurrentQuizModuleId(nextItem.module._id);
      setIsOverlayFullscreen(true);
    }
  }, [currentLessonKey, currentQuizModuleId, nextItem]);

  const handleSelectLesson = (
    moduleId: string,
    lessonId: string,
    options?: { openFullscreen?: boolean },
  ) => {
    if (!isModuleUnlocked(moduleId)) {
      const blockingModuleId = getBlockingModuleId(moduleId);
      if (blockingModuleId) {
        toast({
          title: "Module quiz required",
          description: "Complete the quiz to unlock the next module.",
          variant: "destructive",
        });
        handleSelectQuiz(blockingModuleId, { openFullscreen: true });
        return;
      }
      toast({
        title: "Module locked",
        description: "Complete the previous module quiz to continue.",
        variant: "destructive",
      });
      return;
    }
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev : [...prev, moduleId],
    );
    setCurrentLessonKey(`${moduleId}:${lessonId}` as LessonKey);
    setCurrentQuizModuleId(null);
    if (options?.openFullscreen) {
      setIsOverlayFullscreen(true);
    }
  };

  const handleSelectQuiz = (
    moduleId: string,
    options?: { openFullscreen?: boolean },
  ) => {
    if (!isModuleUnlocked(moduleId)) {
      toast({
        title: "Module locked",
        description: "Complete the previous module quiz to continue.",
        variant: "destructive",
      });
      return;
    }
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev : [...prev, moduleId],
    );
    setCurrentQuizModuleId(moduleId);
    setCurrentLessonKey(null);
    if (options?.openFullscreen) {
      setIsOverlayFullscreen(true);
    }
  };

  const handleTogglePlayerSize = () => {
    setIsPlayerMinimized((prev) => !prev);
  };

  const handleFullscreen = () => {
    setIsOverlayFullscreen(true);
  };

  const handleCloseFullscreen = () => {
    setIsOverlayFullscreen(false);
  };

  useEffect(() => {
    setIsPlayerMinimized(false);
  }, [currentLessonKey, currentQuizModuleId]);

  const handleMarkLessonComplete = async (moduleId: string, lessonId: string) => {
    if (!enrollment) return false;
    setIsUpdatingLesson(true);
    try {
      const res = await api.put<ApiResponse<Enrollment>>(
        `/enrollments/${enrollment._id}/progress`,
        { moduleId, lessonId },
      );
      setEnrollment(res.data.data);
      toast({ title: "Lesson marked as complete" });
      return true;
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Unable to save progress.";
      toast({ title: "Progress error", description: message, variant: "destructive" });
      return false;
    } finally {
      setIsUpdatingLesson(false);
    }
  };

  const handleQuizAnswerSelect = (moduleId: string, questionIndex: number, optionIndex: number) => {
    setQuizAnswers((prev) => {
      const current = prev[moduleId] ? [...prev[moduleId]] : [];
      current[questionIndex] = optionIndex;
      return { ...prev, [moduleId]: current };
    });
  };

  const handleSubmitQuiz = async (moduleId: string) => {
    if (!enrollment || !course) return;
    const module = modules.find((mod) => mod._id === moduleId);
    if (!module?.quiz?.questions?.length) return;

    const answers = quizAnswers[moduleId] || [];
    const missingAnswer = module.quiz.questions.some((_, index) => answers[index] === undefined);
    if (missingAnswer) {
      toast({
        title: "Quiz incomplete",
        description: "Answer every question before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingQuiz(true);
    try {
      const res = await api.put<ApiResponse<Enrollment>>(
        `/enrollments/${enrollment._id}/quiz`,
        { moduleId, answers },
      );
      const updatedEnrollment = res.data.data;
      setEnrollment(updatedEnrollment);
      const updatedQuiz = updatedEnrollment.completedQuizzes?.find(
        (quiz) => quiz.moduleId === moduleId,
      );
      if (updatedQuiz && typeof updatedQuiz.score === "number" && updatedQuiz.score >= PASSING_SCORE) {
        setAutoAdvanceModuleId(moduleId);
      }
      toast({ title: "Quiz submitted" });
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Unable to submit quiz.";
      toast({ title: "Quiz error", description: message, variant: "destructive" });
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!enrollment) return;
    if (enrollment.completionStatus !== "completed") {
      toast({
        title: "Finish the course first",
        description: "Complete all lessons before submitting a rating.",
        variant: "destructive",
      });
      return;
    }
    if (!ratingValue) {
      toast({
        title: "Rating required",
        description: "Choose a rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingRating(true);
    try {
      const res = await api.put<ApiResponse<Enrollment>>(
        `/enrollments/${enrollment._id}/rating`,
        { rating: ratingValue, review: ratingComment.trim() || undefined },
      );
      setEnrollment(res.data.data);
      toast({ title: "Thanks for your feedback!" });
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Unable to submit rating.";
      toast({ title: "Rating error", description: message, variant: "destructive" });
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleNextLesson = async (entry: LessonSequenceEntry) => {
    if (!currentLessonEntry) return;
    const currentKey = `${currentLessonEntry.module._id}:${currentLessonEntry.lesson._id}` as LessonKey;
    if (!completedSet.has(currentKey)) {
      const didComplete = await handleMarkLessonComplete(
        currentLessonEntry.module._id,
        currentLessonEntry.lesson._id,
      );
      if (!didComplete) return;
    }
    handleSelectLesson(entry.module._id, entry.lesson._id);
  };

  useEffect(() => {
    if (!autoAdvanceModuleId) return;
    const nextLesson = getNextModuleFirstLesson(autoAdvanceModuleId);
    if (!nextLesson) {
      setIsOverlayFullscreen(false);
      setAutoAdvanceModuleId(null);
      return;
    }
    setExpandedModules((prev) =>
      prev.includes(nextLesson.module._id) ? prev : [...prev, nextLesson.module._id],
    );
    setCurrentLessonKey(`${nextLesson.module._id}:${nextLesson.lesson._id}` as LessonKey);
    setCurrentQuizModuleId(null);
    setIsOverlayFullscreen(true);
    setAutoAdvanceModuleId(null);
  }, [autoAdvanceModuleId, getNextModuleFirstLesson]);

  const getLessonResourceUrl = (lesson: CourseLesson) => {
    if (lesson.lessonType === "video") return lesson.videoUrl;
    if (lesson.lessonType === "pdf") return lesson.documentUrl;
    if (lesson.lessonType === "image") return lesson.imageUrl;
    return undefined;
  };

  const getLessonResourceLabel = (lesson: CourseLesson) => {
    if (lesson.lessonType === "video") return "Watch lesson";
    if (lesson.lessonType === "pdf") return "Download document";
    if (lesson.lessonType === "image") return "View image";
    return "Open resource";
  };

  const downloadResource = async (url: string, fallbackName?: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Download failed");
      }
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fallbackName || "download";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch {
      toast({
        title: "Download failed",
        description: "We could not download the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getLessonDownloadName = (lesson: CourseLesson) => {
    const baseName = lesson.title?.trim() || "lesson";
    const resourceUrl = getLessonResourceUrl(lesson);
    if (resourceUrl) {
      try {
        const parsed = new URL(resourceUrl);
        const filename = parsed.pathname.split("/").pop();
        if (filename && filename.includes(".")) {
          return filename;
        }
      } catch {
        // ignore
      }
    }
    if (lesson.lessonType === "pdf") return `${baseName}.pdf`;
    if (lesson.lessonType === "image") return `${baseName}.jpg`;
    if (lesson.lessonType === "video") return `${baseName}.mp4`;
    return baseName;
  };

  const resolveVideoEmbedUrl = (url?: string) => {
    if (!url) return undefined;
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
      if (hostname === "youtu.be") {
        return `https://www.youtube.com/embed${parsed.pathname}`;
      }
      if (hostname === "youtube.com" || hostname === "youtube-nocookie.com") {
        const videoId = parsed.searchParams.get("v");
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
        if (parsed.pathname.startsWith("/embed/") || parsed.pathname.startsWith("/shorts/")) {
          return url;
        }
      }
    } catch {
      // ignore
    }
    return url;
  };

  const renderLessonMedia = (
    lesson: CourseLesson,
    options?: { minimized?: boolean; fullscreen?: boolean; onRequestFullscreen?: () => void },
  ) => {
    const minimized = options?.minimized ?? false;
    const fullscreen = options?.fullscreen ?? false;
    const canOpenFullscreen = Boolean(options?.onRequestFullscreen) && !fullscreen;
    const handleOpenFullscreen = () => {
      if (canOpenFullscreen) {
        options?.onRequestFullscreen?.();
      }
    };

    if (lesson.lessonType === "video" && lesson.videoUrl) {
      const embedUrl = resolveVideoEmbedUrl(lesson.videoUrl);
      const wrapperClass = fullscreen
        ? `w-full h-full max-h-full bg-black ${canOpenFullscreen ? "cursor-pointer" : ""}`
        : `mb-5 rounded-2xl overflow-hidden shadow-xl border border-border bg-black ${
            minimized ? "h-28 md:h-32" : "aspect-video"
          } ${canOpenFullscreen ? "cursor-pointer" : ""}`;
      if (embedUrl?.includes("youtube.com/embed")) {
        return (
          <div className={wrapperClass} onClick={handleOpenFullscreen}>
            <iframe
              title={lesson.title}
              src={embedUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
              loading="lazy"
            />
          </div>
        );
      }
      return (
        <div className={wrapperClass} onClick={handleOpenFullscreen}>
          <video
            controls
            src={lesson.videoUrl}
            className="w-full h-full bg-black"
            preload="auto"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
    if (lesson.lessonType === "image" && lesson.imageUrl) {
      const imageClass = fullscreen
        ? `w-full h-full max-h-full bg-black ${canOpenFullscreen ? "cursor-pointer" : ""}`
        : `mb-5 rounded-2xl overflow-hidden border border-border bg-background flex items-center justify-center ${
            minimized ? "h-28 md:h-32" : ""
          } ${canOpenFullscreen ? "cursor-pointer" : ""}`;
      const imgClass = fullscreen
        ? "w-full h-full max-h-full max-w-full object-contain"
        : `w-full object-contain ${minimized ? "h-full" : "h-72"}`;
      return (
        <div className={imageClass} onClick={handleOpenFullscreen}>
          <img
            src={lesson.imageUrl}
            alt={lesson.title}
            className={imgClass}
            loading="lazy"
          />
        </div>
      );
    }
    if (lesson.lessonType === "pdf" && lesson.documentUrl) {
      const pdfClass = fullscreen
        ? `w-full h-full max-h-full bg-background ${canOpenFullscreen ? "cursor-pointer" : ""}`
        : `mb-5 rounded-2xl overflow-hidden border border-border bg-background ${
            minimized ? "h-28 md:h-32" : "h-[600px]"
          } ${canOpenFullscreen ? "cursor-pointer" : ""}`;
      return (
        <div className={pdfClass} onClick={handleOpenFullscreen}>
          <iframe
            src={lesson.documentUrl}
            title={lesson.title}
            className="w-full h-full"
            frameBorder="0"
            loading="lazy"
          />
        </div>
      );
    }
    return null;
  };

  const renderPdfDownload = (lesson: CourseLesson) => {
    if (lesson.lessonType !== "pdf" || !lesson.documentUrl) return null;
    const fallbackName = getLessonDownloadName(lesson);
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadResource(lesson.documentUrl as string, fallbackName)}
      >
        Download PDF
      </Button>
    );
  };

  const lessonStatusLabel = (lesson: CourseLesson, moduleId: string) => {
    const key = `${moduleId}:${lesson._id}` as LessonKey;
    return completedSet.has(key) ? "Completed" : "Pending";
  };

  const currentLessonEntry = useMemo(() => {
    if (!currentLessonKey) return null;
    const [moduleId, lessonId] = currentLessonKey.split(":");
    const module = modules.find((m) => m._id === moduleId);
    const lesson = module?.lessons?.find((l) => l._id === lessonId);
    return module && lesson ? { module, lesson } : null;
  }, [currentLessonKey, modules]);

  const currentModuleLessons = useMemo(() => {
    if (!currentLessonEntry) return [];
    return getSortedLessons(currentLessonEntry.module);
  }, [currentLessonEntry, getSortedLessons]);

  const isLastLessonInModule =
    currentLessonEntry &&
    currentModuleLessons[currentModuleLessons.length - 1]?._id ===
      currentLessonEntry.lesson._id;

  const isCurrentModuleQuizRequired =
    Boolean(currentLessonEntry?.module.quiz?.questions?.length);
  const currentModuleQuizScore = currentLessonEntry
    ? quizResultMap.get(currentLessonEntry.module._id)?.score
    : undefined;
  const isCurrentModuleQuizPassed =
    typeof currentModuleQuizScore === "number" && currentModuleQuizScore >= PASSING_SCORE;

  const nextModuleFirstLesson = useMemo(() => {
    if (!currentLessonEntry) return null;
    return getNextModuleFirstLesson(currentLessonEntry.module._id);
  }, [currentLessonEntry, getNextModuleFirstLesson]);

  const currentQuizEntry = useMemo(() => {
    if (!currentQuizModuleId) return null;
    const module = modules.find((m) => m._id === currentQuizModuleId);
    if (!module?.quiz?.questions?.length) return null;
    return { module, quiz: module.quiz };
  }, [currentQuizModuleId, modules]);

  const currentLessonResourceUrl = currentLessonEntry
    ? getLessonResourceUrl(currentLessonEntry.lesson)
    : undefined;
  const currentLessonResourceLabel = currentLessonEntry
    ? getLessonResourceLabel(currentLessonEntry.lesson)
    : "";
  const currentLessonDownloadName = currentLessonEntry
    ? getLessonDownloadName(currentLessonEntry.lesson)
    : "lesson";

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" asChild size="icon">
              <Link to="/student/courses">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold">
            {course?.title || "Continue Learning"}
          </h1>
          <div />
        </div>

        <div className="glass-card rounded-3xl border border-border p-6 space-y-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading course...</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : !course ? (
            <p className="text-sm text-muted-foreground">No course information available.</p>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Last session: {new Date(enrollment?.enrolledAt || Date.now()).toLocaleDateString()}
                  </p>
                  <h2 className="text-xl font-semibold">{course.title}</h2>
                  <p className="text-sm text-muted-foreground max-w-3xl">{course.description}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-2xl font-bold">
                    {enrollment?.percentComplete?.toFixed(0) ?? 0}%
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {enrollment?.completionStatus ?? "not started"}
                  </p>
                  {enrollment?.completionStatus === "completed" && (
                    <div className="pt-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        asChild
                        disabled={!certificateReady}
                      >
                        <Link to="/student/certificates">
                          {certificateReady ? "View Certificate" : "Generating certificate..."}
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-border p-4">
                  <p className="text-xs text-muted-foreground uppercase">Modules</p>
                  <p className="text-lg font-semibold">{modules.length || 0}</p>
                </div>
                <div className="rounded-2xl border border-border p-4">
                  <p className="text-xs text-muted-foreground uppercase">Lessons</p>
                  <p className="text-lg font-semibold">
                    {modules.reduce((sum, module) => sum + (module.lessons?.length || 0), 0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border p-4">
                  <p className="text-xs text-muted-foreground uppercase">Next Item</p>
                  <p className="text-lg font-semibold">
                    {nextItem
                      ? nextItem.type === "lesson"
                        ? nextItem.lesson.title
                        : "Module quiz"
                      : "All done!"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">Rate this course</p>
                    <p className="text-xs text-muted-foreground">
                      {enrollment?.completionStatus === "completed"
                        ? "Share your experience to help other learners."
                        : "Complete the course to unlock ratings."}
                    </p>
                  </div>
                  {enrollment?.rating ? (
                    <span className="text-xs text-muted-foreground">
                      Current rating: {enrollment.rating}/5
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={`rating-${value}`}
                      type="button"
                      className="rounded-full p-1 text-muted-foreground transition hover:text-warning disabled:opacity-60"
                      onClick={() => setRatingValue(value)}
                      disabled={
                        enrollment?.completionStatus !== "completed" || isSubmittingRating
                      }
                      aria-label={`Rate ${value} out of 5`}
                    >
                      <Star
                        className={`h-5 w-5 ${
                          value <= ratingValue ? "text-warning fill-warning" : ""
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-muted-foreground ml-2">
                    {ratingValue ? `${ratingValue}/5` : "Select a rating"}
                  </span>
                </div>
                <Textarea
                  value={ratingComment}
                  onChange={(event) => setRatingComment(event.target.value)}
                  placeholder="Share a quick review (optional)"
                  className="min-h-[90px]"
                  disabled={enrollment?.completionStatus !== "completed" || isSubmittingRating}
                />
                <div className="flex justify-end">
                  <Button
                    variant="gradient"
                    onClick={handleSubmitRating}
                    disabled={
                      enrollment?.completionStatus !== "completed" ||
                      isSubmittingRating ||
                      !ratingValue
                    }
                  >
                    {isSubmittingRating ? "Submitting..." : "Submit rating"}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Next up</p>
                    {nextItem ? (
                      <p className="text-sm text-muted-foreground">
                        {nextItem.type === "lesson"
                          ? `${nextItem.module.title} - ${nextItem.lesson.title}`
                          : `${nextItem.module.title} - Module quiz`}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {hasLockedModules
                          ? "Complete the module quiz to unlock the next module."
                          : "You completed all lessons."}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="gradient"
                    disabled={
                      !nextItem ||
                      (nextItem.type === "lesson" ? isUpdatingLesson : isSubmittingQuiz)
                    }
                    onClick={() => {
                      if (!nextItem) return;
                      if (nextItem.type === "lesson") {
                        handleMarkLessonComplete(nextItem.module._id, nextItem.lesson._id);
                      } else {
                        handleSelectQuiz(nextItem.module._id);
                      }
                    }}
                  >
                    {nextItem
                      ? nextItem.type === "lesson"
                        ? isUpdatingLesson
                          ? "Saving progress..."
                          : "Mark lesson complete"
                        : isSubmittingQuiz
                          ? "Opening quiz..."
                          : "Start quiz"
                      : "All lessons done"}
                  </Button>
                </div>
                {nextItem && nextItem.type === "lesson" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      <Layers className="mr-1 h-3.5 w-3.5" />
                      {nextItem.module.title}
                    </Badge>
                    <Badge variant="outline">
                      <Play className="mr-1 h-3.5 w-3.5" />
                      {nextItem.lesson.lessonType}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Order {nextItem.lesson.order ?? "?"}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {!course || modules.length === 0 ? null : (
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <div className="space-y-3 md:max-h-[65vh] md:overflow-y-auto md:pr-1">
              {modules.map((module) => {
                const isExpanded = expandedModules.includes(module._id);
                const isLocked = !isModuleUnlocked(module._id);
                const quizResult = quizResultMap.get(module._id);
                return (
                  <div key={module._id} className="rounded-2xl border border-border p-4 bg-background/70">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between text-left"
                      onClick={() =>
                        setExpandedModules((prev) =>
                          prev.includes(module._id)
                            ? prev.filter((m) => m !== module._id)
                            : [...prev, module._id],
                        )
                      }
                    >
                      <div>
                        <p className="font-semibold">{module.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {module.description || "No description available."}
                        </p>
                      </div>
                      <Badge variant={isLocked ? "secondary" : "outline"}>
                        {isLocked ? "Locked" : `Order ${module.order ?? "?"}`}
                      </Badge>
                    </button>
                    {isExpanded && (module.lessons || []).length > 0 && (
                      <div className="mt-4 space-y-2">
                        {getSortedLessons(module).map((lesson) => {
                            const key = `${module._id}:${lesson._id}` as LessonKey;
                            const isCompleted = completedSet.has(key);
                            const isSelected = currentLessonKey === key;
                            const moduleLessons = getSortedLessons(module);
                            const isLastLesson = moduleLessons[moduleLessons.length - 1]?._id === lesson._id;
                            const moduleQuizScore = quizResultMap.get(module._id)?.score;
                            const isModuleQuizPassed =
                              typeof moduleQuizScore === "number" && moduleQuizScore >= PASSING_SCORE;
                            const showQuizNotice =
                              isLastLesson && module.quiz?.questions?.length && !isModuleQuizPassed;
                            return (
                              <button
                                key={lesson._id}
                                type="button"
                                onClick={() => handleSelectLesson(module._id, lesson._id, { openFullscreen: true })}
                                className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left transition ${
                                  isSelected
                                    ? "border-primary bg-primary/10"
                                    : "border-border/50 hover:border-primary/60 hover:bg-primary/5"
                                }`}
                              >
                                <div>
                                  <p className="text-sm font-medium">{lesson.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {lesson.lessonType.toUpperCase()} - Order {lesson.order ?? "?"}
                                  </p>
                                  {showQuizNotice ? (
                                    <button
                                      type="button"
                                      className="text-[11px] text-warning mt-1 underline underline-offset-2"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleSelectQuiz(module._id, { openFullscreen: true });
                                      }}
                                    >
                                      Quiz required to continue
                                    </button>
                                  ) : null}
                                </div>
                                <Badge variant={isCompleted ? "secondary" : "outline"}>
                                  {isCompleted ? "Completed" : "Pending"}
                                </Badge>
                              </button>
                            );
                          })}
                      </div>
                    )}
                    {isExpanded && module.quiz?.questions?.length ? (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => handleSelectQuiz(module._id, { openFullscreen: true })}
                          className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left transition ${
                            currentQuizModuleId === module._id
                              ? "border-primary bg-primary/10"
                              : "border-border/50 hover:border-primary/60 hover:bg-primary/5"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium">Module quiz</p>
                            <p className="text-xs text-muted-foreground">
                              {module.quiz.questions.length} questions • Pass {PASSING_SCORE}%
                            </p>
                          </div>
                          <Badge variant={quizResult?.passed ? "secondary" : "outline"}>
                            {quizResult?.passed ? `Passed ${quizResult.score}%` : "Not started"}
                          </Badge>
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="glass-card rounded-2xl border border-border p-5 space-y-4">
              <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">
                Selected item
              </p>
              {currentQuizEntry ? (
                <>
                  <div>
                    <h3 className="text-lg font-semibold">{currentQuizEntry.module.title} Quiz</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentQuizEntry.quiz.description || "Complete the quiz to unlock the next module."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Passing score: {PASSING_SCORE}%
                    </p>
                  </div>
                  <div className="space-y-4">
                    {currentQuizEntry.quiz.questions.map((question, questionIndex) => {
                      const selectedAnswer =
                        quizAnswers[currentQuizEntry.module._id]?.[questionIndex];
                      return (
                        <div
                          key={`${currentQuizEntry.module._id}-question-${questionIndex}`}
                          className="rounded-2xl border border-border/60 bg-background/80 p-4 space-y-2"
                        >
                          <p className="text-sm font-medium">
                            {questionIndex + 1}. {question.question}
                          </p>
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <label
                                key={`${currentQuizEntry.module._id}-${questionIndex}-${optionIndex}`}
                                className="flex items-center gap-2 text-sm text-muted-foreground"
                              >
                                <input
                                  type="radio"
                                  name={`quiz-${currentQuizEntry.module._id}-${questionIndex}`}
                                  checked={selectedAnswer === optionIndex}
                                  onChange={() =>
                                    handleQuizAnswerSelect(
                                      currentQuizEntry.module._id,
                                      questionIndex,
                                      optionIndex,
                                    )
                                  }
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      variant="gradient"
                      disabled={isSubmittingQuiz || quizResultMap.get(currentQuizEntry.module._id)?.passed}
                      onClick={() => handleSubmitQuiz(currentQuizEntry.module._id)}
                    >
                      {isSubmittingQuiz ? "Submitting..." : "Submit quiz"}
                    </Button>
                    {quizResultMap.get(currentQuizEntry.module._id) && (
                      <Badge variant={quizResultMap.get(currentQuizEntry.module._id)?.passed ? "secondary" : "outline"}>
                        Score {quizResultMap.get(currentQuizEntry.module._id)?.score ?? 0}%
                      </Badge>
                    )}
                  </div>
                </>
              ) : !currentLessonEntry ? (
                <p className="text-sm text-muted-foreground">
                  Choose a lesson from the left to begin.
                </p>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-semibold">{currentLessonEntry.lesson.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentLessonEntry.module.title} - {currentLessonEntry.lesson.lessonType.toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {currentLessonEntry.lesson.description || "No description available."}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-muted-foreground">Lesson player</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="ghost"
                          className="text-xs px-3"
                          disabled={!prevSequenceEntry}
                          onClick={() =>
                            prevSequenceEntry &&
                            handleSelectLesson(
                              prevSequenceEntry.module._id,
                              prevSequenceEntry.lesson._id,
                            )
                          }
                        >
                          Previous lesson
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-xs px-3"
                          disabled={!nextSequenceEntry}
                          onClick={() =>
                            nextSequenceEntry &&
                            handleNextLesson(nextSequenceEntry)
                          }
                        >
                          Next lesson
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-xs px-3"
                          onClick={handleTogglePlayerSize}
                        >
                          {isPlayerMinimized ? "Expand player" : "Minimize player"}
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-xs px-3"
                          onClick={handleFullscreen}
                        >
                          Fullscreen
                        </Button>
                      </div>
                    </div>
                    <div ref={mediaWrapperRef}>
                      {renderLessonMedia(currentLessonEntry.lesson, {
                        minimized: isPlayerMinimized,
                        onRequestFullscreen: handleFullscreen,
                      })}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentLessonResourceUrl ? (
                      currentLessonEntry.lesson.lessonType === "pdf" ? (
                        <p>PDF attached. Use the download button below.</p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleFullscreen}
                          className="underline transition-colors hover:text-primary"
                        >
                          {currentLessonResourceLabel}
                        </button>
                      )
                    ) : (
                      <p>No resource attached for this lesson.</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {currentLessonEntry.lesson.lessonType !== "pdf" && (
                      <Button
                        variant="outline"
                        disabled={!currentLessonResourceUrl}
                        onClick={() =>
                          currentLessonResourceUrl &&
                          downloadResource(currentLessonResourceUrl, currentLessonDownloadName)
                        }
                      >
                        Download
                      </Button>
                    )}
                    {renderPdfDownload(currentLessonEntry.lesson)}
                    <Button
                      variant="gradient"
                      disabled={
                        isUpdatingLesson ||
                        completedSet.has(
                          `${currentLessonEntry.module._id}:${currentLessonEntry.lesson._id}`,
                        )
                      }
                      onClick={() =>
                        handleMarkLessonComplete(
                          currentLessonEntry.module._id,
                          currentLessonEntry.lesson._id,
                        )
                      }
                    >
                      {isUpdatingLesson ? "Saving..." : "Mark complete"}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    {isLastLessonInModule &&
                      isCurrentModuleQuizRequired &&
                      !isCurrentModuleQuizPassed && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            handleSelectQuiz(currentLessonEntry.module._id, {
                              openFullscreen: true,
                            })
                          }
                        >
                          Take Module Quiz
                        </Button>
                      )}
                    {isLastLessonInModule &&
                      nextModuleFirstLesson &&
                      (!isCurrentModuleQuizRequired || isCurrentModuleQuizPassed) && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleSelectLesson(
                            nextModuleFirstLesson.module._id,
                            nextModuleFirstLesson.lesson._id,
                            { openFullscreen: true },
                          )
                        }
                      >
                        Next Module - First Lesson
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {isOverlayFullscreen && (currentLessonEntry || currentQuizEntry) && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <p className="text-sm font-semibold">
                {currentQuizEntry
                  ? `${currentQuizEntry.module.title} Quiz`
                  : currentLessonEntry?.lesson.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentQuizEntry
                  ? `${currentQuizEntry.quiz.questions.length} questions • Pass ${PASSING_SCORE}%`
                  : `${currentLessonEntry?.module.title} - ${currentLessonEntry?.lesson.lessonType}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {currentLessonEntry && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (prevSequenceEntry) {
                        handleSelectLesson(prevSequenceEntry.module._id, prevSequenceEntry.lesson._id);
                      }
                    }}
                    disabled={!prevSequenceEntry}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (nextSequenceEntry) {
                        handleNextLesson(nextSequenceEntry);
                      }
                    }}
                    disabled={!nextSequenceEntry}
                  >
                    Next
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={handleCloseFullscreen}>
                Close
              </Button>
            </div>
          </div>

          {currentQuizEntry ? (
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="w-full max-w-4xl mx-auto space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {currentQuizEntry.quiz.description ||
                      "Complete the quiz to unlock the next module."}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Passing score: {PASSING_SCORE}%
                  </p>
                </div>
                <div className="space-y-4">
                  {currentQuizEntry.quiz.questions.map((question, questionIndex) => {
                    const selectedAnswer =
                      quizAnswers[currentQuizEntry.module._id]?.[questionIndex];
                    return (
                      <div
                        key={`${currentQuizEntry.module._id}-fs-question-${questionIndex}`}
                        className="rounded-2xl border border-border/60 bg-background/80 p-4 space-y-2"
                      >
                        <p className="text-sm font-medium">
                          {questionIndex + 1}. {question.question}
                        </p>
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <label
                              key={`${currentQuizEntry.module._id}-fs-${questionIndex}-${optionIndex}`}
                              className="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                              <input
                                type="radio"
                                name={`quiz-fs-${currentQuizEntry.module._id}-${questionIndex}`}
                                checked={selectedAnswer === optionIndex}
                                onChange={() =>
                                  handleQuizAnswerSelect(
                                    currentQuizEntry.module._id,
                                    questionIndex,
                                    optionIndex,
                                  )
                                }
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    variant="gradient"
                    disabled={
                      isSubmittingQuiz ||
                      quizResultMap.get(currentQuizEntry.module._id)?.passed
                    }
                    onClick={() => handleSubmitQuiz(currentQuizEntry.module._id)}
                  >
                    {isSubmittingQuiz ? "Submitting..." : "Submit quiz"}
                  </Button>
                  {quizResultMap.get(currentQuizEntry.module._id) && (
                    <Badge
                      variant={
                        quizResultMap.get(currentQuizEntry.module._id)?.passed
                          ? "secondary"
                          : "outline"
                      }
                    >
                      Score {quizResultMap.get(currentQuizEntry.module._id)?.score ?? 0}%
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 space-y-2 text-sm text-muted-foreground border-b border-border">
                <p>{currentLessonEntry?.lesson.description || "No description provided."}</p>
                {currentLessonResourceUrl ? (
                  currentLessonEntry?.lesson.lessonType === "pdf" ? (
                    <span>PDF attached. Use the download button below.</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFullscreen}
                      className="underline"
                    >
                      {currentLessonResourceLabel}
                    </button>
                  )
                ) : (
                  <span>No attached resource.</span>
                )}
                {currentLessonEntry?.lesson.lessonType === "pdf" &&
                  renderPdfDownload(currentLessonEntry.lesson)}
              </div>
              <div className="flex-1 min-h-0 w-full px-2 sm:px-4">
                <div className="w-full h-full min-h-0">
                  {currentLessonEntry &&
                    renderLessonMedia(currentLessonEntry.lesson, {
                      fullscreen: true,
                    })}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border-t border-border">
                <Button
                  variant="ghost"
                  className="text-xs"
                  onClick={() => {
                    setIsPlayerMinimized(false);
                    handleCloseFullscreen();
                  }}
                >
                  Resume lesson
                </Button>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    disabled={!prevSequenceEntry}
                    onClick={() =>
                      prevSequenceEntry &&
                      handleSelectLesson(prevSequenceEntry.module._id, prevSequenceEntry.lesson._id)
                    }
                  >
                    Previous lesson
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={!nextSequenceEntry}
                    onClick={() =>
                      nextSequenceEntry &&
                      handleNextLesson(nextSequenceEntry)
                    }
                  >
                    Next lesson
                  </Button>
                  {isLastLessonInModule &&
                    isCurrentModuleQuizRequired &&
                    !isCurrentModuleQuizPassed && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          currentLessonEntry &&
                          handleSelectQuiz(currentLessonEntry.module._id, {
                            openFullscreen: true,
                          })
                        }
                      >
                        Take Module Quiz
                      </Button>
                    )}
                  {isLastLessonInModule &&
                    nextModuleFirstLesson &&
                    (!isCurrentModuleQuizRequired || isCurrentModuleQuizPassed) && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleSelectLesson(
                            nextModuleFirstLesson.module._id,
                            nextModuleFirstLesson.lesson._id,
                            { openFullscreen: true },
                          )
                        }
                      >
                        Next Module - First Lesson
                      </Button>
                    )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentCoursePlayer;
