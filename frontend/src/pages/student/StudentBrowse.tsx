import DashboardLayout from "@/components/layout/DashboardLayout";
import CourseCatalogSection from "@/components/courses/CourseCatalogSection";

const StudentBrowse = () => {
  return (
    <DashboardLayout role="student">
      <CourseCatalogSection embedded studentMode />
    </DashboardLayout>
  );
};

export default StudentBrowse;
