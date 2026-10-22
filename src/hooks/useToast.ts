import type { ToastStackApi } from "@/components/arc/toast-stack/toast-stack";

// Bridge so non-React code (store actions, utils) can raise toasts through the Arc stack.
let api: ToastStackApi | null = null;

export function registerToastApi(next: ToastStackApi | null) {
  api = next;
}

type Opts = { duration?: number };

export const toast = {
  success: (title: string, description?: string, o?: Opts) => api?.toast({ type: "success", title, description, ...o }),
  danger: (title: string, description?: string, o?: Opts) => api?.toast({ type: "error", title, description, ...o }),
  warning: (title: string, description?: string, o?: Opts) => api?.toast({ type: "warning", title, description, ...o }),
  info: (title: string, description?: string, o?: Opts) => api?.toast({ type: "info", title, description, ...o }),
  loading: (title: string, description?: string) => api?.toast({ type: "loading", title, description }),
  update: (id: string, patch: Parameters<ToastStackApi["update"]>[1]) => api?.update(id, patch),
  dismiss: (id?: string) => api?.dismiss(id),
};

export const useToast = () => ({ toast });
