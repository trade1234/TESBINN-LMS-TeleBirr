import type { LoginResponse } from "@/lib/types";

type GoogleAuthMode = "login" | "register";

type GoogleAuthButtonProps = {
  mode: GoogleAuthMode;
  disabled?: boolean;
  disabledReason?: string;
  onSuccess: (response: LoginResponse) => void;
};

const GoogleAuthButton = (_props: GoogleAuthButtonProps) => null;

export default GoogleAuthButton;
