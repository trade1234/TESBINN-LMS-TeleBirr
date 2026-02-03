import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Download, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import type { ApiResponse, Certificate } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

  const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const buildCertificateSvg = (certificate: Certificate) => {
  const template = certificate.templateSnapshot || {};
  const title = template.title || "Certificate of Completion";
  const subtitle = template.subtitle || "This certifies that";
  const signatureName = template.signatureName || "TESBINN Learning";
  const signatureTitle = template.signatureTitle || "Program Director";
  const logoUrl = template.logoUrl || "";
  const backgroundUrl = template.backgroundUrl || "";

  const bgLayer = backgroundUrl
    ? `<image href="${backgroundUrl}" x="0" y="0" width="1200" height="900" preserveAspectRatio="xMidYMid slice" />`
    : `<rect width="1200" height="900" fill="#f8f5ee" />`;

  const logoLayer = logoUrl
    ? `<image href="${logoUrl}" x="80" y="70" width="140" height="140" preserveAspectRatio="xMidYMid meet" />`
    : "";

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      ${bgLayer}
      <rect x="40" y="40" width="1120" height="820" fill="none" stroke="#c2b280" stroke-width="4" />
      ${logoLayer}
      <text x="600" y="180" text-anchor="middle" font-size="48" font-family="Georgia, serif" fill="#2b2b2b">${escapeXml(title)}</text>
      <text x="600" y="270" text-anchor="middle" font-size="24" font-family="Arial, sans-serif" fill="#5a5a5a">${escapeXml(subtitle)}</text>
      <text x="600" y="360" text-anchor="middle" font-size="42" font-family="Georgia, serif" fill="#111">${escapeXml(
        certificate.recipientName || "Student"
      )}</text>
      <text x="600" y="430" text-anchor="middle" font-size="18" font-family="Arial, sans-serif" fill="#5a5a5a">has successfully completed</text>
      <text x="600" y="500" text-anchor="middle" font-size="32" font-family="Georgia, serif" fill="#1b1b1b">${escapeXml(
        certificate.courseTitle
      )}</text>
      <text x="600" y="570" text-anchor="middle" font-size="16" font-family="Arial, sans-serif" fill="#7a7a7a">Certificate ID: ${escapeXml(
        certificate.certificateNumber
      )}</text>
      <line x1="780" y1="690" x2="1060" y2="690" stroke="#2b2b2b" stroke-width="2" />
      <text x="920" y="720" text-anchor="middle" font-size="18" font-family="Georgia, serif" fill="#2b2b2b">${escapeXml(
        signatureName
      )}</text>
      <text x="920" y="745" text-anchor="middle" font-size="14" font-family="Arial, sans-serif" fill="#5a5a5a">${escapeXml(
        signatureTitle
      )}</text>
      <text x="120" y="760" text-anchor="start" font-size="14" font-family="Arial, sans-serif" fill="#6b6b6b">${
        certificate.issuedAt
          ? `Issued ${new Date(certificate.issuedAt).toLocaleDateString()}`
          : "Issued"
      }</text>
    </svg>
  `;
};

const StudentCertificates = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    const loadCertificates = async () => {
      const token = authStorage.getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      setIsLoading(true);
      try {
        const response = await api.get<ApiResponse<Certificate[]>>("/certificates/me");
        if (!active) return;
        setCertificates(response.data.data || []);
      } catch (err: any) {
        if (!active) return;
        const status = err?.response?.status;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load certificates.";

        if (status === 401) {
          authStorage.clearAll();
          navigate("/login");
          return;
        }

        toast({
          title: "Unable to load certificates",
          description: message,
          variant: "destructive",
        });
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadCertificates();

    return () => {
      active = false;
    };
  }, [navigate, toast]);

  useEffect(() => {
    let active = true;

    const buildPreviews = async () => {
      const entries = await Promise.all(
        certificates.map(async (certificate) => {
          const svg = buildCertificateSvg(certificate);
          const inlinedSvg = await inlineSvgAssets(svg);
          const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(inlinedSvg)}`;
          return [certificate._id, url] as const;
        }),
      );

      if (!active) return;
      setPreviewUrls(Object.fromEntries(entries));
    };

    if (certificates.length) {
      buildPreviews();
    } else {
      setPreviewUrls({});
    }

    return () => {
      active = false;
    };
  }, [certificates]);

  const filteredCertificates = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return certificates;
    return certificates.filter((certificate) => {
      const courseTitle = certificate.courseTitle?.toLowerCase() || "";
      const number = certificate.certificateNumber?.toLowerCase() || "";
      return courseTitle.includes(normalizedSearch) || number.includes(normalizedSearch);
    });
  }, [certificates, searchTerm]);

  const handlePrint = (certificate: Certificate) => {
    const svg = buildCertificateSvg(certificate);
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>Certificate</title></head>
        <body style="margin:0;display:flex;align-items:center;justify-content:center;background:#fff;">
          <img src="${dataUrl}" style="max-width:100%;height:auto;" />
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const inlineSvgAssets = async (svgContent: string) => {
    const regex = /href="(https?:\/\/[^"]+)"/g;
    const matches = Array.from(svgContent.matchAll(regex));
    if (!matches.length) return svgContent;

    let updated = svgContent;
    for (const match of matches) {
      const url = match[1];
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        updated = updated.replaceAll(`href="${url}"`, `href="${dataUrl}"`);
      } catch {
        // If the asset is blocked by CORS, leave it as-is.
      }
    }

    return updated;
  };

  const handleDownloadPng = async (certificate: Certificate) => {
    const svg = buildCertificateSvg(certificate);
    const inlinedSvg = await inlineSvgAssets(svg);
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(inlinedSvg)}`;
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 900;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pngUrl = canvas.toDataURL("image/png");
      triggerDownload(pngUrl, `certificate-${certificate.certificateNumber}.png`);
    };
    image.src = svgUrl;
  };

  const handleDownloadSvg = async (certificate: Certificate) => {
    const svg = buildCertificateSvg(certificate);
    const inlinedSvg = await inlineSvgAssets(svg);
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(inlinedSvg)}`;
    triggerDownload(svgUrl, `certificate-${certificate.certificateNumber}.svg`);
  };

  return (
    <DashboardLayout role="student">
      <div className="space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Certificates
            </p>
            <h1 className="text-2xl lg:text-3xl font-bold">My Certificates</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Download or print your course credentials.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by course or ID"
              className="w-56"
            />
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Issued certificates</h2>
            </div>
            <span className="text-sm text-muted-foreground">
              {certificates.length} total
            </span>
          </div>

          <div className="mt-5 space-y-6">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading certificates...</p>
            ) : filteredCertificates.length ? (
              filteredCertificates.map((certificate) => {
                const dataUrl = previewUrls[certificate._id] || "";
                return (
                  <div
                    key={certificate._id}
                    className="rounded-2xl border border-border/60 p-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
                  >
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                      <img
                        src={dataUrl || undefined}
                        alt={`${certificate.courseTitle} certificate`}
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Course</p>
                        <p className="text-lg font-semibold">{certificate.courseTitle}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">
                          Certificate ID
                        </p>
                        <p className="text-sm text-muted-foreground">{certificate.certificateNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">
                          Issued
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {certificate.issuedAt
                            ? new Date(certificate.issuedAt).toLocaleDateString()
                            : "Unknown"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button variant="outline" onClick={() => handleDownloadSvg(certificate)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download SVG
                        </Button>
                        <Button variant="outline" onClick={() => handleDownloadPng(certificate)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download PNG
                        </Button>
                        <Button variant="ghost" onClick={() => handlePrint(certificate)}>
                          <Printer className="mr-2 h-4 w-4" />
                          Print
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                No certificates issued yet. Complete a course to unlock your certificate.
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentCertificates;
