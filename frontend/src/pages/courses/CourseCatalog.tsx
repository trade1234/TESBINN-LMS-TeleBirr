import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CourseCatalogSection from "@/components/courses/CourseCatalogSection";

const CourseCatalog = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CourseCatalogSection />

      <Footer />
    </div>
  );
};

export default CourseCatalog;
