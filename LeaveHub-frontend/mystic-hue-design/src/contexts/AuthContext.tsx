import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, authStorage, type AppRole, type AuthUser } from "@/lib/api";

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  profile: AuthUser | null;
  role: AppRole | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    department?: string,
    designation?: string
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const applyAuthState = (nextToken: string, nextUser: AuthUser) => {
    authStorage.setToken(nextToken);
    authStorage.setUser(nextUser);
    setToken(nextToken);
    setUser(nextUser);
    setProfile(nextUser);
    setRole(nextUser.role);
  };

  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = authStorage.getToken();
      const storedUser = authStorage.getUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setProfile(storedUser);
        setRole(storedUser.role);

        try {
          const refreshedUser = await api.me();
          authStorage.setUser(refreshedUser);
          setUser(refreshedUser);
          setProfile(refreshedUser);
          setRole(refreshedUser.role);
        } catch {
          authStorage.clearToken();
          authStorage.clearUser();
          setToken(null);
          setUser(null);
          setProfile(null);
          setRole(null);
        }
      }

      setLoading(false);
    };

    void bootstrap();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    department?: string,
    designation?: string
  ) => {
    try {
      const response = await api.signUp({ email, password, fullName, department, designation });
      applyAuthState(response.token, response.user);
      return { error: null };
    } catch (error) {
      const parsed = error instanceof Error ? error : new Error("Failed to sign up");
      return { error: parsed };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.signIn({ email, password });
      applyAuthState(response.token, response.user);
      return { error: null };
    } catch (error) {
      const parsed = error instanceof Error ? error : new Error("Failed to sign in");
      return { error: parsed };
    }
  };

  const signOut = async () => {
    authStorage.clearToken();
    authStorage.clearUser();
    setToken(null);
    setUser(null);
    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, profile, role, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
