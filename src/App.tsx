import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Spinner } from "@heroui/react";

import RequireAuth from "@/components/RequireAuth";
import AppLayout from "@/layouts/AppLayout";
import Login from "@/pages/Login";

// Every page is its own chunk so a cold load only fetches the shell plus the
// route being visited. Login stays eager: it's the guaranteed first paint for
// a signed-out user, and lazy-loading it would put a second spinner right
// after the one RequireAuth already shows while the session resolves.
// AppLayout renders its own Suspense around <Outlet />, so navigating between
// admin pages swaps only the content area and leaves the shell in place.
const Accounting = lazy(() => import("@/pages/Accounting"));
const Bookings = lazy(() => import("@/pages/Bookings"));
const CalendarPage = lazy(() => import("@/pages/Calendar"));
const Customers = lazy(() => import("@/pages/Customers"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Import = lazy(() => import("@/pages/Import"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const Messages = lazy(() => import("@/pages/Messages"));
const POS = lazy(() => import("@/pages/POS"));
const Settings = lazy(() => import("@/pages/Settings"));
const Tickets = lazy(() => import("@/pages/Tickets"));
const TrackTicket = lazy(() => import("@/pages/TrackTicket"));
const TradeIn = lazy(() => import("@/pages/TradeIn"));

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Spinner size="lg" />
        </div>
      }
    >
      <Routes>
        <Route element={<Login />} path="/login" />
        <Route element={<TrackTicket />} path="/track/:token" />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate replace to="/dashboard" />} />
          <Route element={<Dashboard />} path="/dashboard" />
          <Route element={<POS />} path="/pos" />
          <Route element={<Tickets />} path="/tickets" />
          <Route element={<Customers />} path="/customers" />
          <Route element={<Inventory />} path="/inventory" />
          <Route element={<TradeIn />} path="/trade-in" />
          <Route element={<CalendarPage />} path="/calendar" />
          <Route element={<Messages />} path="/messages" />
          <Route element={<Bookings />} path="/bookings" />
          <Route element={<Accounting />} path="/accounting" />
          <Route element={<Navigate replace to="/accounting" />} path="/reports" />
          <Route element={<Import />} path="/import" />
          <Route element={<Settings />} path="/settings" />
        </Route>
        <Route element={<Navigate replace to="/dashboard" />} path="*" />
      </Routes>
    </Suspense>
  );
}
