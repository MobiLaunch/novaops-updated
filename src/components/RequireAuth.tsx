import type { ReactNode } from "react";

import { Navigate } from "react-router-dom";
import { Spinner } from "@heroui/react";

import { useAuth } from "@/lib/AuthContext";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return <Navigate replace to="/login" />;

  return <>{children}</>;
}
