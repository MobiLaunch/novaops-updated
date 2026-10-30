import { useCallback, useMemo, useState } from "react";

import { authedFetch } from "@/lib/api";
import { useAppStore } from "@/lib/store";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Kind = "payments" | "orders" | "payouts" | "customers";

// Fetches Square data through our /api/square/* functions; credentials travel as headers.
export function useSquareData() {
  const accessToken = useAppStore((s) => s.settings.squareAccessToken);
  const locationId = useAppStore((s) => s.settings.squareLocationId);
  const [data, setData] = useState<Record<Kind, any[]>>({ payments: [], orders: [], payouts: [], customers: [] });
  const [loading, setLoading] = useState<Record<Kind, boolean>>({ payments: false, orders: false, payouts: false, customers: false });
  const [error, setError] = useState<Record<Kind, string>>({ payments: "", orders: "", payouts: "", customers: "" });
  const isConfigured = !!(accessToken && locationId);

  const load = useCallback(async (kind: Kind, query = "") => {
    if (!isConfigured) return;
    setLoading((l) => ({ ...l, [kind]: true }));
    setError((e) => ({ ...e, [kind]: "" }));
    try {
      const res = await authedFetch(`/api/square/${kind}${query}`, { headers: { "x-square-access-token": accessToken, "x-square-location-id": locationId } });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json?.message || json?.statusMessage || `Request failed (${res.status})`);
      setData((d) => ({ ...d, [kind]: json[kind] || [] }));
    } catch (e) {
      setError((er) => ({ ...er, [kind]: (e as Error).message || "Failed" }));
    } finally {
      setLoading((l) => ({ ...l, [kind]: false }));
    }
  }, [accessToken, locationId, isConfigured]);

  const fetchPayments = useCallback((days = 30) => load("payments", `?days=${days}`), [load]);
  const fetchOrders = useCallback((days = 30) => load("orders", `?days=${days}`), [load]);
  const fetchPayouts = useCallback((days = 90) => load("payouts", `?days=${days}`), [load]);
  const fetchCustomers = useCallback(() => load("customers"), [load]);
  const fetchAll = useCallback(async (days = 30) => {
    await Promise.allSettled([fetchPayments(days), fetchOrders(days), fetchPayouts(days > 90 ? days : 90), fetchCustomers()]);
  }, [fetchPayments, fetchOrders, fetchPayouts, fetchCustomers]);

  const totals = useMemo(() => {
    const done = data.payments.filter((p) => p.status === "COMPLETED");
    const totalRevenue = done.reduce((a, p) => a + p.amount, 0);
    const totalFees = done.reduce((a, p) => a + Math.abs(p.fee), 0);

    return {
      totalRevenue,
      totalTips: done.reduce((a, p) => a + p.tip, 0),
      totalFees,
      netRevenue: totalRevenue - totalFees,
      totalPayouts: data.payouts.filter((p) => p.status === "PAID").reduce((a, p) => a + p.amount, 0),
    };
  }, [data]);

  return {
    payments: data.payments, orders: data.orders, payouts: data.payouts, sqCustomers: data.customers,
    loading, error, isLoading: Object.values(loading).some(Boolean), isConfigured,
    fetchPayments, fetchOrders, fetchPayouts, fetchCustomers, fetchAll,
    ...totals,
  };
}
