import { useSearchParams } from "react-router-dom";

import { PageHead } from "@/components/app/PageHead";
import { ShopSettings } from "@/components/app/ShopSettings";
import { SiteEditor } from "@/components/app/SiteEditor";
import { WebBookings } from "@/components/app/WebBookings";
import { WebOrders } from "@/components/app/WebOrders";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/arc/tabs/tabs";

/** The online shop, managed from inside the POS. */
export default function Website() {
  const [params, setParams] = useSearchParams();
  const tab = ["orders", "bookings", "content", "settings"].includes(params.get("tab") || "") ? (params.get("tab") as string) : "orders";

  return (
    <>
      <PageHead title="Website" subtitle="Orders, bookings and content for the online shop" />
      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="content">Site editor</TabsTrigger>
          <TabsTrigger value="settings">Shop settings</TabsTrigger>
        </TabsList>
        <TabsContent value="orders"><WebOrders /></TabsContent>
        <TabsContent value="bookings"><WebBookings /></TabsContent>
        <TabsContent value="content"><SiteEditor /></TabsContent>
        <TabsContent value="settings"><ShopSettings /></TabsContent>
      </Tabs>
    </>
  );
}
