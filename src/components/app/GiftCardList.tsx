import { useEffect, useState } from "react";

import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { toast } from "@/hooks/useToast";
import { formatCurrency } from "@/lib/format";
import { listGiftCards, type GiftCard } from "@/lib/giftCards";
import { getSupabase } from "@/lib/supabase";

/** Issued gift cards with their remaining balance; a card can be voided if it was lost or misissued. */
export function GiftCardList({ open, onOpenChange, currency }: { open: boolean; onOpenChange: (o: boolean) => void; currency: string }) {
  const [cards, setCards] = useState<GiftCard[] | null>(null);
  const load = () => listGiftCards().then(setCards).catch((e: Error) => { setCards([]); toast.danger("Couldn't load gift cards", e.message); });

  useEffect(() => { if (open) void load(); }, [open]);

  const voidCard = async (c: GiftCard) => {
    if (!window.confirm(`Void ${c.code}? Its ${formatCurrency(c.balance, currency)} balance can no longer be used.`)) return;
    const { error } = await getSupabase()!.from("gift_cards").update({ status: "void" }).eq("id", c.id);

    if (error) toast.danger("Couldn't void", error.message);
    else await load();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Gift cards" description="Issued cards and what's left on them">
        {cards === null ? <p className="nv-muted">Loading…</p> : cards.length === 0 ? (
          <EmptyState title="No gift cards yet" description="Sell one from the register with the Gift card button." />
        ) : (
          <div style={{ maxHeight: 360, overflow: "auto" }}>
            {cards.map((c) => (
              <div key={c.id} className="nv-row">
                <div className="nv-row-main"><strong>{c.code}</strong><span>{formatCurrency(c.balance, currency)} of {formatCurrency(c.initial_amount, currency)} · {new Date(c.created_at).toLocaleDateString()}</span></div>
                {c.status === "void" ? <Badge tone="danger">Void</Badge> : c.balance <= 0 ? <Badge>Used</Badge> : <Button size="sm" variant="ghost" onClick={() => void voidCard(c)}>Void</Button>}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
