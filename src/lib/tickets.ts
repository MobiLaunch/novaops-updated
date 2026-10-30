import { useAppStore } from "@/lib/store";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Downscale a photo to a small JPEG data URL so it fits in the tickets.photos jsonb column. */
export function fileToDataUrl(file: File, maxSize = 900, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const c = document.createElement("canvas");

      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read photo")); };
    img.src = url;
  });
}

export interface NewTicketInput {
  device: string;
  deviceModel?: string;
  issue: string;
  customerId: number;
  deviceDescription?: string;
  serialNumber?: string;
  priority?: string;
  signature?: string;
  warrantyDays?: number;
  photos?: File[];
}

/** Creates the ticket (with photos encoded) and returns the saved row. */
export async function createTicketWithPhotos(input: NewTicketInput) {
  const store = useAppStore.getState();
  const photos = await Promise.all((input.photos ?? []).map((f) => fileToDataUrl(f)));
  const { photos: _files, ...rest } = input;
  const ticket = await store.createTicket({ ...rest, photos, status: "Open", price: 0, parts: [], payments: [], notes: [], timeLog: [] });

  store.trackDevice(ticket.device);

  return ticket;
}
