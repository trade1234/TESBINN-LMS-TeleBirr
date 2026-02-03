export type UserRole = "admin" | "teacher" | "student";

export type CourseCategory =
  | "development"
  | "design"
  | "marketing"
  | "leadership"
  | "ai"
  | "business"
  | "productivity"
  | "other";

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: string;
}

export interface Advert {
  _id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  order?: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface Schedule {
  _id: string;
  title: string;
  startDate: string;
  startTime?: string;
  durationLabel: string;
  instructor?: string;
  mode: "online" | "in-person" | "hybrid";
  location?: string;
  notes?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  order?: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface Announcement {
  _id: string;
  title: string;
  message: string;
  audience: "all" | "students" | "teachers" | "admins";
  createdBy?: {
    _id?: string;
    name?: string;
    email?: string;
  };
  expiresAt?: string | null;
  createdAt?: string;
}

export interface Notification {
  _id: string;
  type:
    | "enrollment_requested"
    | "enrollment_pending_review"
    | "enrollment_approved"
    | "enrollment_rejected"
    | "course_submitted"
    | "course_approved"
    | "course_rejected"
    | "announcement";
  title: string;
  message: string;
  link?: string;
  readAt?: string | null;
  createdAt?: string;
  meta?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  role: UserRole;
}

export interface MeResponse {
  success: boolean;
  data: {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    status: string;
    profileImage?: string;
    bio?: string;
    phone?: string;
    location?: string;
    professional?: {
      headline?: string;
      currentRole?: string;
      company?: string;
      careerFocus?: CourseCategory;
      experienceLevel?: "beginner" | "intermediate" | "advanced";
      portfolioUrl?: string;
      careerGoals?: string;
      skills?: string[];
      openToOpportunities?: boolean;
      availableForMentorship?: boolean;
    };
    preferences?: {
      notifications?: {
        courseReminders?: boolean;
        mentorMessages?: boolean;
        productUpdates?: boolean;
        enrollmentUpdates?: boolean;
        courseUpdates?: boolean;
        adminAnnouncements?: boolean;
      };
      learning?: {
        weeklyStudyGoalHours?: number;
        personalizedSuggestions?: boolean;
        weeklyProgressReport?: boolean;
      };
    };
    security?: {
      mfaEnabled?: boolean;
      newDeviceAlerts?: boolean;
    };
  };
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "pending" | "active" | "suspended" | "blocked";
  profileImage?: string;
  bio?: string;
  phone?: string;
  location?: string;
  professional?: MeResponse["data"]["professional"];
  preferences?: MeResponse["data"]["preferences"];
  security?: MeResponse["data"]["security"];
  createdAt?: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  category: CourseCategory;
  price?: number;
  duration: number;
  level?: "beginner" | "intermediate" | "advanced";
  totalEnrollments: number;
  averageRating?: number;
  numberOfReviews?: number;
  imageUrl?: string;
  isPublished?: boolean;
  isApproved?: boolean;
  rejectionReason?: string | null;
  createdAt?: string;
  teacher?: {
    _id?: string;
    name?: string;
    email?: string;
    profileImage?: string;
  };
  modules?: Array<{
    _id: string;
    title: string;
    description?: string;
    order: number;
    lessons: Array<{
      _id: string;
      title: string;
      description: string;
      lessonType: "video" | "pdf" | "text" | "image";
      content?: string;
      videoUrl?: string;
      documentUrl?: string;
      imageUrl?: string;
      duration?: number;
      order: number;
      isFree?: boolean;
    }>;
    quiz?: {
      title?: string;
      description?: string;
      passingScore?: number;
      questions: Array<{
        _id?: string;
        question: string;
        options: string[];
        correctIndex: number;
      }>;
    } | null;
  }>;
  certificateTemplate?: {
    enabled?: boolean;
    title?: string;
    subtitle?: string;
    logoUrl?: string;
    backgroundUrl?: string;
    signatureName?: string;
    signatureTitle?: string;
  };
}

export interface Enrollment {
  _id: string;
  course: Course;
  student?: {
    _id?: string;
    name?: string;
    email?: string;
    status?: string;
  };
  percentComplete: number;
  completionStatus: "not_started" | "in_progress" | "completed";
  approvalStatus?: "pending" | "approved" | "rejected";
  reviewedAt?: string;
  rejectionReason?: string;
  rating?: number;
  review?: string;
  ratedAt?: string;
  paymentStatus?: "pending" | "paid" | "failed";
  enrolledAt: string;
  completedAt?: string;
  completedQuizzes?: Array<{
    moduleId: string;
    score: number;
    passed: boolean;
    completedAt?: string;
  }>;
}

export interface Certificate {
  _id: string;
  course: Course;
  recipientName: string;
  courseTitle: string;
  certificateNumber: string;
  issuedAt: string;
  templateSnapshot?: Course["certificateTemplate"];
}

export interface StudentDashboardActivity {
  id: string;
  type: "enrolled" | "completed" | "lesson" | "achievement";
  title: string;
  description: string;
  createdAt: string;
}

export interface StudentDashboardProgressPoint {
  name: string;
  lessons: number;
  hours: number;
  date?: string;
}

export interface StudentDashboardData {
  stats: {
    lessonsCompletedThisWeek: number;
    activityThisWeek: number;
  };
  weeklyProgress: StudentDashboardProgressPoint[];
  recentActivity: StudentDashboardActivity[];
}

export interface AdminAnalyticsSeriesPoint {
  date: string;
  value: number;
}

export interface AdminAnalyticsCourse {
  id: string;
  title: string;
  category?: CourseCategory;
  enrollments: number;
  revenue: number;
}

export interface AdminAnalyticsActivity {
  id: string;
  type: "user" | "enrollment" | "completion" | "certificate" | "course";
  title: string;
  description: string;
  createdAt: string;
}

export interface AdminAnalyticsData {
  range: {
    start: string;
    end: string;
    label: string;
    days: number;
  };
  summary: {
    totalUsers: number;
    totalCourses: number;
    activeCourses: number;
    newUsers: number;
    newEnrollments: number;
    pendingEnrollments: number;
    completedCourses: number;
    activeLearners: number;
    revenue: number;
  };
  deltas: {
    activeLearners: number;
    newUsers: number;
    newEnrollments: number;
    revenue: number;
  };
  series: {
    userGrowth: AdminAnalyticsSeriesPoint[];
    enrollments: AdminAnalyticsSeriesPoint[];
    revenue: AdminAnalyticsSeriesPoint[];
  };
  topCourses: AdminAnalyticsCourse[];
  recentActivity: AdminAnalyticsActivity[];
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  category?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  status?: "draft" | "published";
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
