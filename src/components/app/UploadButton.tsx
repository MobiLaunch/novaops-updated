import { useRef, useState } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/arc/button/button";
import { toast } from "@/hooks/useToast";
import { getSupabase } from "@/lib/supabase";

const LIMITS = { image: 8 * 1024 * 1024, video: 50 * 1024 * 1024 };

/** Uploads an image or video to the website's public media bucket and hands back its URL. */
export function UploadButton({ kind, onUploaded, label }: { kind: "image" | "video" | "any"; onUploaded: (url: string) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const accept = kind === "image" ? "image/*" : kind === "video" ? "video/mp4,video/webm" : "image/*,video/mp4,video/webm";

  const pick = async (file?: File) => {
    const sb = getSupabase();

    if (!file || !sb) return;
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) return void toast.warning("Unsupported file", "Choose a photo, or an mp4 or webm video.");
    if (file.size > (isVideo ? LIMITS.video : LIMITS.image)) return void toast.warning("File too large", isVideo ? "Videos can be up to 50 MB. Compress it or paste a link." : "Photos can be up to 8 MB.");
    setBusy(true);
    try {
      const ext = (file.name.split(".").pop() || (isVideo ? "mp4" : "jpg")).toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${new Date().getFullYear()}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const { error } = await sb.storage.from("site-media").upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });

      if (error) throw error;
      onUploaded(sb.storage.from("site-media").getPublicUrl(path).data.publicUrl);
      toast.success("Uploaded", "The file is ready to use.");
    } catch (e) {
      toast.danger("Upload failed", (e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <>
      <input ref={input} accept={accept} hidden type="file" onChange={(e) => void pick(e.target.files?.[0])} />
      <Button loading={busy} size="sm" variant="secondary" onClick={() => input.current?.click()}><Upload size={14} aria-hidden="true" />{label || "Upload"}</Button>
    </>
  );
}
