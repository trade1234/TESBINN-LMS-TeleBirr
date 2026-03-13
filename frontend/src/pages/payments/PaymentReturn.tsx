import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { ApiResponse, Enrollment } from "@/lib/types";

const parseTelebirrReturnParams = () => {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  const rawSearch = window.location.search || "";
  const normalizedSearch = rawSearch.startsWith("?")
    ? `?${rawSearch.slice(1).replace(/\?/g, "&")}`
    : rawSearch.replace(/\?/g, "&");

  return new URLSearchParams(normalizedSearch);
};

const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"pending" | "approved" | "failed">("pending");
  const [courseId, setCourseId] = useState<string | null>(null);
  const [callbackForwarded, setCallbackForwarded] = useState(false);

  useEffect(() => {
    let active = true;
    const returnParams = parseTelebirrReturnParams();
    const course = returnParams.get("courseId") || searchParams.get("courseId");
    const merchOrderId = returnParams.get("merch_order_id");
    const paymentOrderId = returnParams.get("payment_order_id");
    const tradeStatus = returnParams.get("trade_status");
    const orderStatus = returnParams.get("order_status");
    if (course) setCourseId(course);

    const check = async () => {
      try {
        if (!callbackForwarded && merchOrderId && (tradeStatus || orderStatus)) {
          await api.post("/payments/telebirr/notify", {
            ...Object.fromEntries(returnParams.entries()),
            merch_order_id: merchOrderId,
            payment_order_id: paymentOrderId,
            trade_status: tradeStatus,
            order_status: orderStatus,
          });
          if (!active) return;
          setCallbackForwarded(true);
        }

        const res = await api.get<ApiResponse<Enrollment[]>>("/enrollments/me");
        if (!active) return;
        if (!course) {
          setStatus("pending");
          return;
        }
        const enrollment = res.data.data.find((e) => e.course?._id === course);
        if (enrollment?.approvalStatus === "approved") {
          setStatus("approved");
          if (course) {
            navigate(`/course/${course}`, { replace: true });
          }
        } else if (enrollment?.paymentStatus === "failed") {
          setStatus("failed");
        } else {
          setStatus("pending");
        }
      } catch {
        if (active) setStatus("pending");
      }
    };

    check();
    const interval = setInterval(check, 4000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [searchParams, navigate, callbackForwarded]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 lg:pt-24">
        <div className="container-wide section-padding py-10">
          <div className="max-w-2xl mx-auto glass-card rounded-2xl p-6 space-y-4">
            <h1 className="text-2xl font-semibold">Payment status</h1>
            {status === "approved" ? (
              <p className="text-sm text-muted-foreground">
                Payment confirmed. Your enrollment is approved.
              </p>
            ) : status === "failed" ? (
              <p className="text-sm text-destructive">
                Payment failed. Please try again.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                We’re confirming your payment. This may take a moment.
              </p>
            )}
            <div className="flex gap-3">
              <Button asChild variant="outline">
                <Link to="/student/courses">My courses</Link>
              </Button>
              {courseId && (
                <Button asChild variant="gradient">
                  <Link to={`/course/${courseId}`}>Back to course</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentReturn;
