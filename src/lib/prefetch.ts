/** Starts loading a page's code before it is clicked. Repeat calls are free: the browser caches the module. */
const LOADERS: Record<string, () => Promise<unknown>> = {
  "/dashboard": () => import("@/pages/Dashboard"),
  "/bookings": () => import("@/pages/Bookings"),
  "/customers": () => import("@/pages/Customers"),
  "/messages": () => import("@/pages/Messages"),
  "/website": () => import("@/pages/Website"),
  "/inventory": () => import("@/pages/Inventory"),
  "/pos": () => import("@/pages/Pos"),
  "/library": () => import("@/pages/Library"),
  "/analytics": () => import("@/pages/Analytics"),
  "/tools": () => import("@/pages/Tools"),
  "/settings": () => import("@/pages/Settings"),
};

export function prefetchRoute(path: string) {
  void LOADERS[path]?.().catch(() => undefined);
}
