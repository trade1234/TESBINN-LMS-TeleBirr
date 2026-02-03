import { useEffect, useMemo, useState } from "react";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CourseCard from "@/components/courses/CourseCard";
import CategoryFilter from "@/components/courses/CategoryFilter";
import { api } from "@/lib/api";
import { minutesToDurationLabel } from "@/lib/format";
import type { ApiResponse, Course } from "@/lib/types";

const CourseCatalog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get<ApiResponse<Course[]>>("/courses", {
          params: selectedCategory !== "all" ? { category: selectedCategory } : undefined,
        });
        if (!active) return;
        setCourses(res.data.data);
      } catch (err: any) {
        if (!active) return;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load courses.";
        setError(message);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [selectedCategory]);

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((course) => {
      return (
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q)
      );
    });
  }, [courses, searchQuery]);

  const courseCards = useMemo(() => {
    const labelByCategory: Record<string, string> = {
      development: "Development",
      design: "Design",
      marketing: "Marketing",
      leadership: "Leadership",
      ai: "AI & ML",
      business: "Business",
      productivity: "Productivity",
      other: "Other",
    };

    return filteredCourses.map((c) => {
      const lessons = (c.modules || []).reduce((sum, m) => sum + (m.lessons || []).length, 0);
      const thumbnail = c.imageUrl?.startsWith("http")
        ? c.imageUrl
        : "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop";

      return {
        id: c._id,
        title: c.title,
        description: c.description,
        thumbnail,
        instructor: c.teacher?.name || "TESBINN",
        category: labelByCategory[c.category] || "Other",
        duration: minutesToDurationLabel(c.duration),
        students: c.totalEnrollments || 0,
        rating: c.averageRating || 0,
        lessons,
        price: c.price,
      };
    });
  }, [filteredCourses]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 lg:pt-24">
        {/* Hero Section */}
        <section className="relative py-16 lg:py-24 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "linear-gradient(120deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.9) 45%, rgba(255,255,255,0.85) 100%), url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80')",
            }}
            aria-hidden="true"
          />
          <div className="container-wide section-padding relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl lg:text-5xl font-bold mb-4">
                Explore Our Courses
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Discover hundreds of courses taught by industry experts. 
                Find the perfect course to advance your career.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 pl-12 pr-4 text-lg bg-background text-foreground border-0 shadow-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Filters and Courses */}
        <section className="py-12 lg:py-16">
          <div className="container-wide section-padding">
            {/* Category Filter */}
            <div className="mb-8">
              <CategoryFilter onCategoryChange={setSelectedCategory} />
            </div>

            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <p className="text-muted-foreground">
                Showing <span className="font-medium text-foreground">{filteredCourses.length}</span> courses
              </p>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <select className="h-9 px-3 rounded-md border border-input bg-background text-sm">
                  <option>Most Popular</option>
                  <option>Highest Rated</option>
                  <option>Newest</option>
                  <option>Price: Low to High</option>
                </select>
              </div>
            </div>

            {/* Course Grid */}
            {isLoading ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <div className="h-8 w-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Loading courses...</h3>
                <p className="text-muted-foreground">Please wait a moment.</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <h3 className="text-xl font-semibold mb-2">Could not load courses</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
            ) : filteredCourses.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courseCards.map((course) => (
                  <CourseCard key={course.id} {...course} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No courses found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
              </div>
            )}

            {/* Load More */}
            {filteredCourses.length > 0 && (
              <div className="text-center mt-12">
                <Button variant="outline" size="lg">
                  Load More Courses
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CourseCatalog;
