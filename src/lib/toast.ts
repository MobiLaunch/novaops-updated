import { toast } from "@heroui/react";

// Status dropdowns across the app commit only after their write lands, so a
// rejected write (offline, RLS, a dropped connection) leaves the old value on
// screen and needs to say why nothing moved. Without this the control just
// silently snaps back and the shop assumes it saved.
export function toastWriteFailed(what: string, error?: string | null) {
  toast.danger(`Couldn't save ${what}${error ? ` — ${error}` : ""}. Nothing was changed.`);
}
