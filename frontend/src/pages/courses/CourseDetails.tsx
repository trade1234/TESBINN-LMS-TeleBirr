import { useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CourseDetailsSection from "@/components/courses/CourseDetailsSection";

const CourseDetails = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 lg:pt-24">
        <div className="container-wide section-padding">
          <CourseDetailsSection courseId={id} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CourseDetails;


