import { PageHead } from "@/components/app/PageHead";
import { ShopSettings } from "@/components/app/ShopSettings";
import { SiteEditor } from "@/components/app/SiteEditor";
import { WebOrders } from "@/components/app/WebOrders";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/arc/tabs/tabs";

/** The online shop, managed from inside the POS. */
export default function Website() {
  return (
    <>
      <PageHead title="Website" subtitle="Orders and settings for the online shop" />
      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="content">Site editor</TabsTrigger>
          <TabsTrigger value="settings">Shop settings</TabsTrigger>
        </TabsList>
        <TabsContent value="orders"><WebOrders /></TabsContent>
        <TabsContent value="content"><SiteEditor /></TabsContent>
        <TabsContent value="settings"><ShopSettings /></TabsContent>
      </Tabs>
    </>
  );
}
