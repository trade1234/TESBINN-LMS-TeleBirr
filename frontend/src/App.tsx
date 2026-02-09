import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/layout/ScrollToTop";

// Pages
import Landing from "./pages/Landing";
import SchedulePage from "./pages/Schedule";
import VideosPage from "./pages/Videos";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import CourseCatalog from "./pages/courses/CourseCatalog";
import CourseDetails from "./pages/courses/CourseDetails";
import Checkout from "./pages/payments/Checkout";
import PaymentReturn from "./pages/payments/PaymentReturn";
import Support from "./pages/Support";
import About from "./pages/company/About";
import Tesbinn from "./pages/company/Tesbinn";
import Careers from "./pages/company/Careers";
import Blog from "./pages/company/Blog";
import BlogPostPage from "./pages/company/BlogPost";
import Press from "./pages/company/Press";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentCoursePlayer from "./pages/student/StudentCoursePlayer";
import StudentCourses from "./pages/student/StudentCourses";
import StudentCertificates from "./pages/student/StudentCertificates";
import StudentSettings from "./pages/student/StudentSettings";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherCourses from "./pages/teacher/TeacherCourses";
import TeacherCourseEdit from "./pages/teacher/TeacherCourseEdit";
import TeacherModules from "./pages/teacher/ModulesLessons";
import TeacherSettings from "./pages/teacher/TeacherSettings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminApprovals from "./pages/admin/Approvals";
import AdminUsers from "./pages/admin/Users";
import AdminCourses from "./pages/admin/Courses";
import AdminCategories from "./pages/admin/Categories";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminSettings from "./pages/admin/Settings";
import AdminAdverts from "./pages/admin/Adverts";
import AdminAnnouncements from "./pages/admin/Announcements";
import AdminCertificates from "./pages/admin/Certificates";
import AdminSchedules from "./pages/admin/Schedules";
import AdminBlog from "./pages/admin/Blog";
import AdminEnrolledStudents from "./pages/admin/EnrolledStudents";
import NotFound from "./pages/NotFound";
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/courses" element={<CourseCatalog />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/videos" element={<VideosPage />} />
          <Route path="/course/:id" element={<CourseDetails />} />
          <Route path="/checkout/:courseId" element={<Checkout />} />
          <Route path="/payment/return" element={<PaymentReturn />} />
          <Route path="/support" element={<Support />} />
          <Route path="/help" element={<Support />} />
          <Route path="/about" element={<About />} />
          <Route path="/tesbinn" element={<Tesbinn />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/press" element={<Press />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* Student Routes */}
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/courses" element={<StudentCourses />} />
          <Route path="/student/courses/:courseId" element={<StudentCoursePlayer />} />
          <Route path="/student/browse" element={<CourseCatalog />} />
          <Route path="/student/certificates" element={<StudentCertificates />} />
          <Route path="/student/progress" element={<StudentDashboard />} />
          <Route path="/student/settings" element={<StudentSettings />} />

          {/* Teacher Routes */}
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/courses" element={<TeacherCourses />} />
          <Route path="/teacher/courses/create" element={<TeacherDashboard />} />
          <Route path="/teacher/courses/:courseId" element={<TeacherCourseEdit />} />
          <Route path="/teacher/students" element={<TeacherDashboard />} />
          <Route path="/teacher/analytics" element={<TeacherDashboard />} />
          <Route path="/teacher/settings" element={<TeacherSettings />} />
          <Route path="/teacher/modules" element={<TeacherModules />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/approvals" element={<AdminApprovals />} />
          <Route path="/admin/courses" element={<AdminCourses />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/adverts" element={<AdminAdverts />} />
          <Route path="/admin/announcements" element={<AdminAnnouncements />} />
          <Route path="/admin/blog" element={<AdminBlog />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/certificates" element={<AdminCertificates />} />
          <Route path="/admin/schedules" element={<AdminSchedules />} />
          <Route path="/admin/enrolled-students" element={<AdminEnrolledStudents />} />
          <Route path="/admin/settings" element={<AdminSettings />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
