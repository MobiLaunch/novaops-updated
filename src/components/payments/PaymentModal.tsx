import { useState } from "react";
import { Alert, Button, InputGroup, Label, Modal, Spinner, Tabs, TextField } from "@heroui/react";
import { Banknote, CalendarClock, CircleAlert, CircleCheck, CreditCard, Tablet } from "lucide-react";

import type { Ticket, TicketPayment } from "@/types/domain";
import { afterpayCheckout, chargeCard, getSquareCredentials, getTerminalCheckoutStatus, startTerminalCheckout } from "@/lib/square";
import SquareCardForm from "./SquareCardForm";

type PaymentMethod = "cash" | "card" | "terminal" | "afterpay";

interface PaymentModalProps {
  ticket: Ticket | null;
  onClose: () => void;
  onPaid: (payment: TicketPayment) => void;
}

export default function PaymentModal({ ticket, onClose, onPaid }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [terminalStatus, setTerminalStatus] = useState<string | null>(null);

  const balanceDue = ticket ? Number(ticket.price) - (ticket.payments || []).reduce((sum, p) => sum + Number(p.amount), 0) : 0;

  const finish = (amount: number, methodLabel: string) => {
    onPaid({ amount, method: methodLabel, at: new Date().toISOString() });
    setCashAmount("");
    setTerminalStatus(null);
  };

  const handleCash = () => {
    const amount = Number(cashAmount) || balanceDue;

    if (amount <= 0) return;
    finish(amount, "cash");
  };

  const handleCardToken = async (sourceId: string) => {
    if (!ticket) return;
    setProcessing(true);
    setError(null);
    try {
      const result = await chargeCard(sourceId, Math.round(balanceDue * 100), `ticket-${ticket.id}`, `NovaOps Ticket #${ticket.id}`);

      if (result.success) finish(balanceDue, "card");
      else setError("Card payment did not complete.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Card payment failed.");
    } finally {
      setProcessing(false);
    }
  };

  const handleTerminal = async () => {
    if (!ticket) return;
    const { deviceId } = getSquareCredentials();

    if (!deviceId) {
      setError("Pair a Square Terminal device in Settings first.");

      return;
    }
    setProcessing(true);
    setError(null);
    setTerminalStatus("Sending to terminal…");
    try {
      const { checkoutId } = await startTerminalCheckout(Math.round(balanceDue * 100), deviceId, `ticket-${ticket.id}`, `NovaOps Ticket #${ticket.id}`);

      setTerminalStatus("Waiting for customer to tap/insert card…");
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const status = await getTerminalCheckoutStatus(checkoutId);

        if (status.status === "COMPLETED") {
          setTerminalStatus("Payment completed.");
          finish(balanceDue, "square-terminal");

          return;
        }
        if (status.status === "CANCELED" || status.status === "FAILED") {
          setError(`Terminal checkout ${status.status.toLowerCase()}.`);
          setTerminalStatus(null);

          return;
        }
        setTerminalStatus(`Status: ${status.status}…`);
      }
      setError("Terminal checkout timed out.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terminal request failed.");
    } finally {
      setProcessing(false);
    }
  };

  const handleAfterpay = async () => {
    setProcessing(true);
    setError(null);
    try {
      const result = await afterpayCheckout(Math.round(balanceDue * 100));

      if (result.status === "APPROVED") finish(balanceDue, "afterpay");
      else setError("Afterpay did not approve this checkout.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Afterpay checkout failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal>
      <Modal.Backdrop isOpen={!!ticket} onOpenChange={(open) => !open && onClose()}>
        <Modal.Container size="md">
          <Modal.Dialog>
            {ticket && (
              <>
                <Modal.Header>
                  <Modal.Heading>Take Payment — Ticket #{ticket.id}</Modal.Heading>
                  <Modal.CloseTrigger />
                </Modal.Header>
                <Modal.Body className="flex flex-col gap-4">
                  <div className="rounded-2xl bg-surface-secondary/60 p-4 text-center">
                    <span className="block text-micro font-bold uppercase text-muted">Balance Due</span>
                    <strong className="text-3xl font-extrabold text-foreground">${balanceDue.toFixed(2)}</strong>
                  </div>

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

                  <Tabs selectedKey={method} variant="secondary" onSelectionChange={(key) => setMethod(String(key) as PaymentMethod)}>
                    <Tabs.ListContainer>
                      <Tabs.List aria-label="Payment method">
                        <Tabs.Tab className="flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-sm font-semibold" id="cash">
                          <Banknote className="size-4 shrink-0" />
                          <span>Cash</span>
                          <Tabs.Indicator />
                        </Tabs.Tab>
                        <Tabs.Tab className="flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-sm font-semibold" id="card">
                          <CreditCard className="size-4 shrink-0" />
                          <span>Card</span>
                          <Tabs.Indicator />
                        </Tabs.Tab>
                        <Tabs.Tab className="flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-sm font-semibold" id="terminal">
                          <Tablet className="size-4 shrink-0" />
                          <span>Terminal</span>
                          <Tabs.Indicator />
                        </Tabs.Tab>
                        <Tabs.Tab className="flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-sm font-semibold" id="afterpay">
                          <CalendarClock className="size-4 shrink-0" />
                          <span>Afterpay</span>
                          <Tabs.Indicator />
                        </Tabs.Tab>
                      </Tabs.List>
                    </Tabs.ListContainer>

                    <Tabs.Panel className="pt-4" id="cash">
                      <div className="flex flex-col gap-3">
                        <TextField className="flex flex-col gap-1.5" type="number" value={cashAmount} onChange={setCashAmount}>
                          <Label>Amount received</Label>
                          <InputGroup>
                            <InputGroup.Input placeholder={balanceDue.toFixed(2)} />
                          </InputGroup>
                        </TextField>
                        <Button variant="primary" onPress={handleCash}>
                          <CircleCheck className="size-4" />
                          <span>Mark Paid (Cash)</span>
                        </Button>
                      </div>
                    </Tabs.Panel>

                    <Tabs.Panel className="pt-4" id="card">
                      <SquareCardForm disabled={processing} onToken={handleCardToken} />
                    </Tabs.Panel>

                    <Tabs.Panel className="pt-4" id="terminal">
                      <div className="flex flex-col gap-3">
                        {terminalStatus && <p className="m-0 text-sm text-muted">{terminalStatus}</p>}
                        <Button isDisabled={processing} variant="primary" onPress={handleTerminal}>
                          {processing ? <Spinner size="sm" /> : <Tablet className="size-4" />}
                          <span>Send to Terminal</span>
                        </Button>
                      </div>
                    </Tabs.Panel>

                    <Tabs.Panel className="pt-4" id="afterpay">
                      <div className="flex flex-col gap-3">
                        <p className="m-0 text-sm text-muted">Customer pays in 4 interest-free installments via Afterpay.</p>
                        <Button isDisabled={processing} variant="primary" onPress={handleAfterpay}>
                          {processing ? <Spinner size="sm" /> : <CalendarClock className="size-4" />}
                          <span>Charge with Afterpay</span>
                        </Button>
                      </div>
                    </Tabs.Panel>
                  </Tabs>
                </Modal.Body>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
