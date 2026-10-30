import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/arc/tabs/tabs";
import { PageHead } from "@/components/app/PageHead";
import { BarcodesTab } from "@/components/tools/BarcodesTab";
import { FormsTab } from "@/components/tools/FormsTab";
import { ImportTab } from "@/components/tools/ImportTab";

export default function Tools() {
  const [tab, setTab] = useState("barcodes");

  return (
    <>
      <PageHead title="Tools" subtitle="Barcodes, import and export, invoices and forms" />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="barcodes">Barcodes</TabsTrigger>
          <TabsTrigger value="import">Import and export</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
        </TabsList>
        <TabsContent value="barcodes"><BarcodesTab /></TabsContent>
        <TabsContent value="import"><ImportTab /></TabsContent>
        <TabsContent value="forms"><FormsTab /></TabsContent>
      </Tabs>
    </>
  );
}
