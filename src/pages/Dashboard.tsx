import { useEffect, useState } from "react";
import { CalendarDays, Package, Ticket as TicketIcon, TriangleAlert, Users } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { sbFetchBookings, sbFetchCustomers, sbFetchInventory, sbFetchTickets } from "@/lib/supabase";

export default function Dashboard() {
  const [openTickets, setOpenTickets] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);

  useEffect(() => {
    sbFetchTickets().then(({ data }) => {
      if (data) setOpenTickets(data.filter((t) => t.status !== "Completed" && t.status !== "Delivered").length);
    });
    sbFetchCustomers().then(({ data }) => data && setCustomerCount(data.length));
    sbFetchInventory().then(({ data }) => data && setLowStock(data.filter((i) => i.stock <= i.low).length));
    sbFetchBookings().then(({ data }) => data && setPendingBookings(data.filter((b) => b.status === "pending").length));
  }, []);

  return (
    <div>
      <PageHeader
        description="Live overview of tickets, customers, inventory, and website bookings."
        eyebrow="Repair Shop"
        title="Dashboard"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={TicketIcon} path="/tickets">
          <strong className="text-2xl font-extrabold text-foreground">{openTickets}</strong>
          <span className="mt-1 block text-sm text-muted">Open tickets</span>
        </StatCard>
        <StatCard icon={Users} path="/customers">
          <strong className="text-2xl font-extrabold text-foreground">{customerCount}</strong>
          <span className="mt-1 block text-sm text-muted">Customers</span>
        </StatCard>
        <StatCard icon={Package} path="/inventory">
          <strong className="text-2xl font-extrabold text-foreground">{lowStock}</strong>
          <span className="mt-1 flex items-center gap-1 text-sm text-muted">
            {lowStock > 0 && <TriangleAlert className="size-3.5 text-warning" />}
            Low stock items
          </span>
        </StatCard>
        <StatCard icon={CalendarDays} path="/bookings">
          <strong className="text-2xl font-extrabold text-foreground">{pendingBookings}</strong>
          <span className="mt-1 block text-sm text-muted">Pending bookings</span>
        </StatCard>
      </div>
    </div>
  );
}
