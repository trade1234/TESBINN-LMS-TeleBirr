import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { ApiResponse, Course } from "@/lib/types";

const Checkout = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!courseId) return;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [courseRes, checkoutRes] = await Promise.all([
          api.get<ApiResponse<Course>>(`/courses/${courseId}`),
          api.post<ApiResponse<{ checkoutUrl: string }>>("/payments/telebirr/create-order", {
            courseId,
          }),
        ]);
        if (!active) return;
        setCourse(courseRes.data.data);
        setCheckoutUrl(checkoutRes.data?.data?.checkoutUrl || null);
        if (!checkoutRes.data?.data?.checkoutUrl) {
          setError("Unable to start payment. Please try again.");
        }
      } catch (err: any) {
        if (!active) return;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Unable to start payment.";
        setError(message);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [courseId]);

  const priceValue = Number(course?.price || 0);
  const priceLabel = priceValue > 0 ? `ETB ${priceValue.toLocaleString()}` : "Free";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 lg:pt-24">
        <div className="container-wide section-padding py-10">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card rounded-2xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/2">
                  <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                    {course?.imageUrl ? (
                      <img
                        src={course.imageUrl}
                        alt={course.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        {isLoading ? "Loading..." : "Course image"}
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:w-1/2 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Checkout
                    </p>
                    <h1 className="text-2xl font-semibold">
                      {course?.title || "Course checkout"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2">
                      {course?.description || "Review your course and proceed to payment."}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 p-4">
                    <p className="text-xs text-muted-foreground uppercase">Total</p>
                    <p className="text-2xl font-semibold">{priceLabel}</p>
                  </div>
                  {error && !isLoading && (
                    <p className="text-sm text-destructive">
                      {error}
                    </p>
                  )}
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => navigate(-1)}>
                      Back
                    </Button>
                    <Button
                      variant="gradient"
                      className="flex-1"
                      disabled={isLoading || isRedirecting || !checkoutUrl}
                      onClick={() => {
                        if (!checkoutUrl) return;
                        setIsRedirecting(true);
                        window.location.href = checkoutUrl;
                      }}
                    >
                      {isRedirecting ? "Redirecting..." : "Proceed"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
