import { useEffect, useId, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { GoogleAuthConfigResponse, LoginResponse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

type GoogleAuthMode = "login" | "register";

type GoogleAuthButtonProps = {
  mode: GoogleAuthMode;
  disabled?: boolean;
  disabledReason?: string;
  onSuccess: (response: LoginResponse) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number | boolean>
          ) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let googleScriptPromise: Promise<void> | null = null;

const loadGoogleScript = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google sign-in is only available in the browser."));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (!googleScriptPromise) {
    googleScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Failed to load Google sign-in.")), {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.src = GOOGLE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google sign-in."));
      document.head.appendChild(script);
    });
  }

  return googleScriptPromise;
};

const GoogleAuthButton = ({
  mode,
  disabled = false,
  disabledReason,
  onSuccess,
}: GoogleAuthButtonProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);
  const [clientId, setClientId] = useState<string | null>(import.meta.env.VITE_GOOGLE_CLIENT_ID || null);
  const [isAvailable, setIsAvailable] = useState(Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID));
  const [isLoading, setIsLoading] = useState(true);
  const instanceId = useId();
  const { toast } = useToast();

  useEffect(() => {
    let active = true;

    const loadConfig = async () => {
      if (clientId) {
        setIsAvailable(true);
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get<GoogleAuthConfigResponse>("/auth/google/config");
        if (!active) {
          return;
        }

        const nextClientId = response.data.data.clientId;
        setClientId(nextClientId);
        setIsAvailable(Boolean(response.data.data.enabled && nextClientId));
      } catch (error) {
        if (!active) {
          return;
        }
        setIsAvailable(false);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadConfig();

    return () => {
      active = false;
    };
  }, [clientId]);

  useEffect(() => {
    if (!clientId || !isAvailable || !containerRef.current || disabled) {
      return;
    }

    let active = true;

    const setup = async () => {
      try {
        await loadGoogleScript();
        if (!active || !window.google?.accounts?.id || !containerRef.current) {
          return;
        }

        const handleCredential = async (googleResponse: { credential?: string }) => {
          if (!googleResponse.credential) {
            toast({
              title: "Google sign-in failed",
              description: "Google did not return a valid credential.",
              variant: "destructive",
            });
            return;
          }

          try {
            const response = await api.post<LoginResponse>("/auth/google", {
              credential: googleResponse.credential,
              mode,
              clientId,
            });
            onSuccess(response.data);
          } catch (error: any) {
            const message =
              error?.response?.data?.error ||
              error?.response?.data?.message ||
              "Google sign-in could not be completed.";

            toast({
              title: "Google sign-in failed",
              description: message,
              variant: "destructive",
            });
          }
        };

        window.google.accounts.id.cancel();
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredential,
        });

        containerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text: mode === "register" ? "signup_with" : "signin_with",
          width: 320,
          logo_alignment: "left",
        });
        initializedRef.current = true;
      } catch (error: any) {
        if (!active) {
          return;
        }

        toast({
          title: "Google sign-in unavailable",
          description: error?.message || "Failed to load Google sign-in.",
          variant: "destructive",
        });
      }
    };

    void setup();

    return () => {
      active = false;
    };
  }, [clientId, disabled, isAvailable, mode, onSuccess, toast]);

  if (disabled) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled
          className="flex h-12 w-full items-center justify-center rounded-md border border-border bg-muted px-4 text-sm text-muted-foreground"
        >
          Sign {mode === "register" ? "up" : "in"} with Google
        </button>
        {disabledReason ? <p className="text-xs text-muted-foreground">{disabledReason}</p> : null}
      </div>
    );
  }

  if (!isLoading && (!isAvailable || !clientId)) {
    return (
      <p className="text-sm text-muted-foreground">
        Google sign-in is currently unavailable. Add `GOOGLE_CLIENT_ID` on the backend or
        `VITE_GOOGLE_CLIENT_ID` on the frontend to enable it.
      </p>
    );
  }

  return (
    <div className="flex justify-center">
      <div
        key={`${mode}-${instanceId}`}
        ref={containerRef}
        className={initializedRef.current ? "" : "min-h-12"}
      />
    </div>
  );
};

export default GoogleAuthButton;
