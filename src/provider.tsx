import type { ReactNode } from "react";

import { useHref, useNavigate } from "react-router-dom";
import { RouterProvider } from "react-aria-components";
import { Toast } from "@heroui/react";

import { AuthProvider } from "@/lib/AuthContext";
import { ThemeProvider } from "@/lib/ThemeContext";

function useAppHref(href: string) {
  const routerHref = useHref(href);

  return /^(https?:|mailto:|tel:)/.test(href) ? href : routerHref;
}

// HeroUI v3 needs no provider of its own. RouterProvider (from
// react-aria-components, which HeroUI's Link/Menu/Tabs/etc. are built on)
// hands React Router's navigate() to every React-Aria-based link in the app
// so <Link href="/tickets"> does a client-side route change instead of a
// full page reload. Must render inside <BrowserRouter> (see main.tsx).
export function Provider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  return (
    <RouterProvider navigate={navigate} useHref={useAppHref}>
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
        {/* Lets any handler report a failed write (see lib/toast) without
            every page owning its own error-banner state. */}
        <Toast.Provider placement="bottom end" />
      </ThemeProvider>
    </RouterProvider>
  );
}
