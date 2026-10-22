import { useCallback, useRef } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
const scriptFor = (sandbox: boolean) => (sandbox ? "https://sandbox.web.squarecdn.com/v1/square.js" : "https://web.squarecdn.com/v1/square.js");

function loadScript(src: string): Promise<boolean> {
  if ((window as any).Square) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    const el = existing ?? Object.assign(document.createElement("script"), { src, async: true });

    el.addEventListener("load", () => resolve(true), { once: true });
    el.addEventListener("error", () => resolve(false), { once: true });
    if (!existing) document.head.appendChild(el);
    else if ((window as any).Square) resolve(true);
  });
}

/** Lazy Square Web Payments SDK: card and Afterpay instances with safe teardown. */
export function useSquarePayments(appId: string, locationId: string, sandbox: boolean) {
  const payments = useRef<any>(null);
  const card = useRef<any>(null);
  const afterpay = useRef<any>(null);

  const init = useCallback(async () => {
    if (payments.current) return true;
    if (!appId || !locationId) return false;
    if (!(await loadScript(scriptFor(sandbox)))) return false;
    try {
      payments.current = await (window as any).Square.payments(appId, locationId);

      return true;
    } catch (e) {
      console.error("[Square] init failed", e);

      return false;
    }
  }, [appId, locationId, sandbox]);

  const destroy = async (ref: { current: any }) => {
    if (!ref.current) return;
    try { await ref.current.destroy(); } catch { /* already gone */ }
    ref.current = null;
  };

  const attachCard = useCallback(async (selector: string) => {
    if (!(await init())) throw new Error("Square SDK failed to load. Check the Application ID, location and sandbox mode.");
    await destroy(card);
    card.current = await payments.current.card();
    await card.current.attach(selector);
  }, [init]);

  const attachAfterpay = useCallback(async (selector: string, amount: number) => {
    if (!(await init())) return false;
    await destroy(afterpay);

    const req = payments.current.paymentRequest({ countryCode: "US", currencyCode: "USD", total: { amount: amount.toFixed(2), label: "Total" } });

    afterpay.current = await payments.current.afterpayClearpay(req);
    await afterpay.current.attach(selector);

    return true;
  }, [init]);

  return {
    attachCard,
    attachAfterpay,
    tokenizeCard: async (): Promise<string> => {
      const r = await card.current.tokenize();

      if (r.status !== "OK") throw new Error(r.errors?.[0]?.message || "Card tokenization failed");

      return r.token;
    },
    tokenizeAfterpay: async (): Promise<string> => {
      const r = await afterpay.current.tokenize();

      if (r.status !== "OK") throw new Error(r.errors?.[0]?.message || "Afterpay tokenization failed");

      return r.token;
    },
    hasCard: () => !!card.current,
    hasAfterpay: () => !!afterpay.current,
    destroyCard: () => destroy(card),
    destroyAfterpay: () => destroy(afterpay),
    destroyAll: async () => { await destroy(card); await destroy(afterpay); },
  };
}
