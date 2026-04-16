import { useParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CourseDetailsSection from "@/components/courses/CourseDetailsSection";

const StudentCourseDetails = () => {
  const { courseId } = useParams();

  return (
    <DashboardLayout role="student">
      <CourseDetailsSection
        courseId={courseId}
        backHref="/student/browse"
        backLabel="Back to browse"
      />
    </DashboardLayout>
  );
};

export default StudentCourseDetails;
