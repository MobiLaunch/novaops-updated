import { Navigate, Route, Routes } from "react-router-dom";

import RequireAuth from "@/components/RequireAuth";
import AppLayout from "@/layouts/AppLayout";
import Bookings from "@/pages/Bookings";
import Customers from "@/pages/Customers";
import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import Login from "@/pages/Login";
import Settings from "@/pages/Settings";
import Tickets from "@/pages/Tickets";

export default function App() {
  return (
    <Routes>
      <Route element={<Login />} path="/login" />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate replace to="/dashboard" />} />
        <Route element={<Dashboard />} path="/dashboard" />
        <Route element={<Tickets />} path="/tickets" />
        <Route element={<Customers />} path="/customers" />
        <Route element={<Inventory />} path="/inventory" />
        <Route element={<Bookings />} path="/bookings" />
        <Route element={<Settings />} path="/settings" />
      </Route>
      <Route element={<Navigate replace to="/dashboard" />} path="*" />
    </Routes>
  );
}
