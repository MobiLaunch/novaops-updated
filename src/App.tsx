import { lazy, Suspense, useEffect, useState } from "react";
import { createBrowserRouter, createHashRouter, Navigate, Outlet, RouterProvider, useNavigate } from "react-router-dom";

import { ToastStack, ToastStackProvider, useToastStack } from "@/components/arc/toast-stack/toast-stack";
import { registerToastApi } from "@/hooks/useToast";
import { AppShell } from "@/layouts/AppShell";
import { isElectron } from "@/lib/supabase";
import { useAppStore } from "@/lib/store";
import { Skeleton } from "@/components/arc/skeleton/skeleton";

const page = (loader: () => Promise<{ default: React.ComponentType }>) => lazy(loader);

const Login = page(() => import("@/pages/Login"));
const Register = page(() => import("@/pages/Register"));
const Intro = page(() => import("@/pages/Intro"));
const AuthCallback = page(() => import("@/pages/AuthCallback"));
const ProfileSetup = page(() => import("@/pages/ProfileSetup"));
const Lock = page(() => import("@/pages/Lock"));
const Dashboard = page(() => import("@/pages/Dashboard"));
const Bookings = page(() => import("@/pages/Bookings"));
const Customers = page(() => import("@/pages/Customers"));
const Inventory = page(() => import("@/pages/Inventory"));
const Pos = page(() => import("@/pages/Pos"));
const Library = page(() => import("@/pages/Library"));
const LibraryItem = page(() => import("@/pages/LibraryItem"));
const Analytics = page(() => import("@/pages/Analytics"));
const Tools = page(() => import("@/pages/Tools"));
const Settings = page(() => import("@/pages/Settings"));

function Fallback() {
  return <div className="nv-center"><Skeleton lines={4} /></div>;
}

/** Waits for the Supabase session, then sends visitors to the right side of the auth wall. */
function AuthGate({ publicRoute }: { publicRoute: boolean }) {
  const [ready, setReady] = useState(false);
  const user = useAppStore((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    const store = useAppStore.getState();
    const off = store.setupAuthListener(() => navigate("/login", { replace: true }));

    void store.checkAuth().then((u) => {
      if (u && !store.isLoaded) void store.initializeData();
      if (alive) setReady(true);
    });

    return () => { alive = false; off(); };
  }, [navigate]);

  if (!ready) return <Fallback />;
  if (publicRoute && user) return <Navigate to="/dashboard" replace />;
  if (!publicRoute && !user) return <Navigate to="/login" replace />;

  return <Suspense fallback={<Fallback />}>{publicRoute ? <Outlet /> : <AppShell />}</Suspense>;
}

const routes = [
  { path: "/", element: <Navigate to={localStorage.getItem("novaops_launched") ? "/dashboard" : "/intro"} replace /> },
  { element: <AuthGate publicRoute />, children: [
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/intro", element: <Intro /> },
  ] },
  { path: "/auth/callback", element: <Suspense fallback={<Fallback />}><AuthCallback /></Suspense> },
  { path: "/lock", element: <Suspense fallback={<Fallback />}><Lock /></Suspense> },
  { element: <AuthGate publicRoute={false} />, children: [
    { path: "/profile-setup", element: <ProfileSetup /> },
    { path: "/dashboard", element: <Dashboard /> },
    { path: "/bookings", element: <Bookings /> },
    { path: "/customers", element: <Customers /> },
    { path: "/inventory", element: <Inventory /> },
    { path: "/pos", element: <Pos /> },
    { path: "/library", element: <Library /> },
    { path: "/library/:id", element: <LibraryItem /> },
    { path: "/analytics", element: <Analytics /> },
    { path: "/tools", element: <Tools /> },
    { path: "/settings", element: <Settings /> },
  ] },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
];

// Electron loads from file://, so it needs hash routing.
const router = (isElectron() ? createHashRouter : createBrowserRouter)(routes);

function ToastBridge() {
  const api = useToastStack();

  useEffect(() => { registerToastApi(api); return () => registerToastApi(null); }, [api]);

  return null;
}

export default function App() {
  return (
    <ToastStackProvider>
      <ToastBridge />
      <RouterProvider router={router} />
      <ToastStack />
    </ToastStackProvider>
  );
}
