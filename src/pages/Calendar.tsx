import { useEffect, useState } from "react";
import {
  Button,
  FieldError,
  InputGroup,
  Label,
  ListBox,
  Modal,
  Select,
  Tabs,
  TextField,
} from "@heroui/react";
import { CalendarDays, CalendarX, Home, MapPin, Plus } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import type { Appointment, HouseCall } from "@/types/domain";
import {
  sbCreateAppointment,
  sbCreateHouseCall,
  sbFetchAppointments,
  sbFetchHouseCalls,
  sbUpdateAppointment,
  sbUpdateHouseCall,
} from "@/lib/supabase";

const APPT_STATUSES = ["scheduled", "confirmed", "completed", "cancelled", "no-show"];
const CALL_STATUSES = ["scheduled", "completed", "cancelled"];

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const emptyAppt = { title: "", description: "", date: "", time: "", notes: "" };
const emptyCall = { description: "", address: "", date: "", time: "", notes: "" };

export default function CalendarPage() {
  const [tab, setTab] = useState<"appointments" | "house-calls">("appointments");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [houseCalls, setHouseCalls] = useState<HouseCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingAppt, setCreatingAppt] = useState<typeof emptyAppt | null>(null);
  const [creatingCall, setCreatingCall] = useState<typeof emptyCall | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [a, h] = await Promise.all([sbFetchAppointments(), sbFetchHouseCalls()]);

    setLoading(false);
    if (a.data) setAppointments(a.data);
    if (h.data) setHouseCalls(h.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateAppt = async () => {
    if (!creatingAppt?.title.trim() || !creatingAppt.date) return;
    setSaving(true);
    const { data } = await sbCreateAppointment({ ...creatingAppt, status: "scheduled" });

    setSaving(false);
    if (data) {
      setAppointments((rows) => [...rows, data].sort((a, b) => (a.date || "").localeCompare(b.date || "")));
      setCreatingAppt(null);
    }
  };

  const handleCreateCall = async () => {
    if (!creatingCall?.description.trim() || !creatingCall.date) return;
    setSaving(true);
    const { data } = await sbCreateHouseCall({ ...creatingCall, status: "scheduled" });

    setSaving(false);
    if (data) {
      setHouseCalls((rows) => [...rows, data].sort((a, b) => (a.date || "").localeCompare(b.date || "")));
      setCreatingCall(null);
    }
  };

  const handleApptStatus = async (id: number, status: string) => {
    setAppointments((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));
    await sbUpdateAppointment(id, { status });
  };

  const handleCallStatus = async (id: number, status: string) => {
    setHouseCalls((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));
    await sbUpdateHouseCall(id, { status });
  };

  return (
    <div>
      <PageHeader
        action={
          <Button variant="primary" onPress={() => (tab === "appointments" ? setCreatingAppt(emptyAppt) : setCreatingCall(emptyCall))}>
            <Plus className="size-4" />
            <span>{tab === "appointments" ? "New Appointment" : "New House Call"}</span>
          </Button>
        }
        description="Shop appointments and house-call scheduling."
        eyebrow="Schedule"
        title="Calendar"
      />

      <Tabs selectedKey={tab} variant="secondary" onSelectionChange={(key) => setTab(String(key) as typeof tab)}>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Schedule type">
            <Tabs.Tab className="flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-semibold" id="appointments">
              <CalendarDays className="size-4 shrink-0" />
              <span>Appointments</span>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab className="flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-semibold" id="house-calls">
              <Home className="size-4 shrink-0" />
              <span>House Calls</span>
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel className="pt-4" id="appointments">
          {appointments.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[28px] border border-border bg-surface-secondary p-14 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-surface-tertiary text-muted">
                <CalendarX className="size-8" />
              </span>
              <h4 className="m-0 text-lg font-bold text-foreground">{loading ? "Loading…" : "No appointments scheduled"}</h4>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {appointments.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
                  <div>
                    <strong className="block text-sm text-foreground">{a.title}</strong>
                    <span className="text-xs text-muted">
                      {a.date} {a.time} {a.description && `· ${a.description}`}
                    </span>
                  </div>
                  <Select className="w-[150px]" selectedKey={a.status} onSelectionChange={(k) => handleApptStatus(a.id, String(k))}>
                    <Select.Trigger>
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {APPT_STATUSES.map((s) => (
                          <ListBox.Item key={s} id={s}>
                            {cap(s)}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </Tabs.Panel>

        <Tabs.Panel className="pt-4" id="house-calls">
          {houseCalls.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[28px] border border-border bg-surface-secondary p-14 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-surface-tertiary text-muted">
                <CalendarX className="size-8" />
              </span>
              <h4 className="m-0 text-lg font-bold text-foreground">{loading ? "Loading…" : "No house calls scheduled"}</h4>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {houseCalls.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
                  <div>
                    <strong className="block text-sm text-foreground">{c.description}</strong>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <MapPin className="size-3" />
                      {c.address} · {c.date} {c.time}
                    </span>
                  </div>
                  <Select className="w-[150px]" selectedKey={c.status} onSelectionChange={(k) => handleCallStatus(c.id, String(k))}>
                    <Select.Trigger>
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {CALL_STATUSES.map((s) => (
                          <ListBox.Item key={s} id={s}>
                            {cap(s)}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </Tabs.Panel>
      </Tabs>

      <Modal>
        <Modal.Backdrop isOpen={!!creatingAppt} onOpenChange={(open) => !open && setCreatingAppt(null)}>
          <Modal.Container size="md">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>New Appointment</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField isRequired className="flex flex-col gap-1.5 sm:col-span-2" value={creatingAppt?.title || ""} onChange={(v) => setCreatingAppt((f) => f && { ...f, title: v })}>
                  <Label>Title *</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                  <FieldError />
                </TextField>
                <TextField isRequired className="flex flex-col gap-1.5" type="date" value={creatingAppt?.date || ""} onChange={(v) => setCreatingAppt((f) => f && { ...f, date: v })}>
                  <Label>Date *</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
                <TextField className="flex flex-col gap-1.5" value={creatingAppt?.time || ""} onChange={(v) => setCreatingAppt((f) => f && { ...f, time: v })}>
                  <Label>Time</Label>
                  <InputGroup>
                    <InputGroup.Input placeholder="2:00 PM" />
                  </InputGroup>
                </TextField>
                <TextField className="flex flex-col gap-1.5 sm:col-span-2" value={creatingAppt?.description || ""} onChange={(v) => setCreatingAppt((f) => f && { ...f, description: v })}>
                  <Label>Description</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="outline" onPress={() => setCreatingAppt(null)}>
                  Cancel
                </Button>
                <Button isDisabled={saving} variant="primary" onPress={handleCreateAppt}>
                  {saving ? "Saving…" : "Create Appointment"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal>
        <Modal.Backdrop isOpen={!!creatingCall} onOpenChange={(open) => !open && setCreatingCall(null)}>
          <Modal.Container size="md">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>New House Call</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField isRequired className="flex flex-col gap-1.5 sm:col-span-2" value={creatingCall?.description || ""} onChange={(v) => setCreatingCall((f) => f && { ...f, description: v })}>
                  <Label>Description *</Label>
                  <InputGroup>
                    <InputGroup.Input placeholder="Screen repair at customer's home" />
                  </InputGroup>
                  <FieldError />
                </TextField>
                <TextField className="flex flex-col gap-1.5 sm:col-span-2" value={creatingCall?.address || ""} onChange={(v) => setCreatingCall((f) => f && { ...f, address: v })}>
                  <Label>Address</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
                <TextField isRequired className="flex flex-col gap-1.5" type="date" value={creatingCall?.date || ""} onChange={(v) => setCreatingCall((f) => f && { ...f, date: v })}>
                  <Label>Date *</Label>
                  <InputGroup>
                    <InputGroup.Input />
                  </InputGroup>
                </TextField>
                <TextField className="flex flex-col gap-1.5" value={creatingCall?.time || ""} onChange={(v) => setCreatingCall((f) => f && { ...f, time: v })}>
                  <Label>Time</Label>
                  <InputGroup>
                    <InputGroup.Input placeholder="2:00 PM" />
                  </InputGroup>
                </TextField>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="outline" onPress={() => setCreatingCall(null)}>
                  Cancel
                </Button>
                <Button isDisabled={saving} variant="primary" onPress={handleCreateCall}>
                  {saving ? "Saving…" : "Create House Call"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
