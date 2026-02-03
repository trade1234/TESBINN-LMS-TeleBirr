export type AuthRole = "admin" | "teacher" | "student";

const TOKEN_KEY = "tesbinn_token";
const ROLE_KEY = "tesbinn_role";
export const AUTH_CHANGE_EVENT = "tesbinn-auth-change";

const notifyAuthChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
};

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    notifyAuthChange();
  },
  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    notifyAuthChange();
  },
  getRole(): AuthRole | null {
    const r = localStorage.getItem(ROLE_KEY);
    return (r as AuthRole) || null;
  },
  setRole(role: AuthRole) {
    localStorage.setItem(ROLE_KEY, role);
    notifyAuthChange();
  },
  clearRole() {
    localStorage.removeItem(ROLE_KEY);
    notifyAuthChange();
  },
  clearAll() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    notifyAuthChange();
  },
};
