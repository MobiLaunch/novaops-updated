import { useEffect, useRef, useState } from "react";
import { Alert, Button, Spinner } from "@heroui/react";
import { CircleAlert, CreditCard } from "lucide-react";

import { getSquareCredentials } from "@/lib/square";

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<{
        card: () => Promise<{
          attach: (selector: string) => Promise<void>;
          tokenize: () => Promise<{ status: string; token?: string; errors?: { message: string }[] }>;
          destroy: () => Promise<void>;
        }>;
      }>;
    };
  }
}

const SDK_PROD = "https://web.squarecdn.com/v1/square.js";
const SDK_SANDBOX = "https://sandbox.web.squarecdn.com/v1/square.js";

function loadSquareSdk(sandbox: boolean): Promise<void> {
  const src = sandbox ? SDK_SANDBOX : SDK_PROD;

  if (window.Square) return Promise.resolve();
  const existing = document.querySelector(`script[src="${src}"]`);

  if (existing) {
    return new Promise((resolve) => existing.addEventListener("load", () => resolve()));
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");

    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Square Web Payments SDK"));
    document.head.appendChild(script);
  });
}

interface SquareCardFormProps {
  onToken: (sourceId: string) => void;
  disabled?: boolean;
}

// Mounts Square's hosted card form (PCI scope stays with Square — card
// details never touch NovaOps) and hands back a one-time payment token.
export default function SquareCardForm({ onToken, disabled }: SquareCardFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [tokenizing, setTokenizing] = useState(false);
  const cardRef = useRef<Awaited<ReturnType<Awaited<ReturnType<NonNullable<Window["Square"]>["payments"]>>["card"]>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const { applicationId, locationId, sandbox } = getSquareCredentials();

    if (!applicationId || !locationId) {
      setError("Set your Square Application ID and Location ID in Settings first.");

      return;
    }

    loadSquareSdk(sandbox)
      .then(async () => {
        if (cancelled || !window.Square) return;
        const payments = await window.Square.payments(applicationId, locationId);
        const card = await payments.card();

        await card.attach("#square-card-container");
        if (cancelled) {
          await card.destroy();

          return;
        }
        cardRef.current = card;
        setReady(true);
      })
      .catch((e: Error) => setError(e.message));

    return () => {
      cancelled = true;
      cardRef.current?.destroy();
    };
  }, []);

  const handleTokenize = async () => {
    if (!cardRef.current) return;
    setTokenizing(true);
    setError(null);
    try {
      const result = await cardRef.current.tokenize();

      if (result.status === "OK" && result.token) {
        onToken(result.token);
      } else {
        setError(result.errors?.[0]?.message || "Card was declined.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tokenization failed.");
    } finally {
      setTokenizing(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <Alert role="alert" status="danger">
          <Alert.Indicator>
            <CircleAlert className="size-4" />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}
      <div className="min-h-[90px] rounded-xl border border-border bg-surface p-3" id="square-card-container" />
      <Button isDisabled={!ready || tokenizing || disabled} variant="primary" onPress={handleTokenize}>
        {tokenizing ? <Spinner size="sm" /> : <CreditCard className="size-4" />}
        <span>{tokenizing ? "Processing…" : "Charge Card"}</span>
      </Button>
    </div>
  );
}
