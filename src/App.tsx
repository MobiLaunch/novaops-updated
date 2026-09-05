import { Navigate, Route, Routes } from "react-router-dom";

import RequireAuth from "@/components/RequireAuth";
import AppLayout from "@/layouts/AppLayout";
import Accounting from "@/pages/Accounting";
import Bookings from "@/pages/Bookings";
import CalendarPage from "@/pages/Calendar";
import Customers from "@/pages/Customers";
import Dashboard from "@/pages/Dashboard";
import Import from "@/pages/Import";
import Inventory from "@/pages/Inventory";
import Login from "@/pages/Login";
import Messages from "@/pages/Messages";
import POS from "@/pages/POS";
import Settings from "@/pages/Settings";
import Tickets from "@/pages/Tickets";
import TrackTicket from "@/pages/TrackTicket";
import TradeIn from "@/pages/TradeIn";

export default function App() {
  return (
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
  );
}
