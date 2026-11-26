import { useState } from "react";
import LanguageToggle from "@/presentation/components/common/LanguageToggle";
import ThemeToggle from "@/presentation/components/common/ThemeToggle";
import {
  Alert, Badge, Button, ButtonLink, Card, ConfirmAction, DescriptionList, EmptyState, ErrorState,
  LoadingState, PageHeader, SelectableCard, SelectField, StatusBadge, Tabs, TextareaField, TextField, useToast,
} from "@/presentation/components/ui";
import { useFormatDate } from "@/presentation/hooks/useFormatDate";

// Development-only living reference for the HCMS UI components (route /dev/ui,
// not included in production builds). Browser tests use it to check behaviour.
function Section({ title, children }) {
  return (
    <Card title={title} titleLevel={2}>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </Card>
  );
}

function UiGallery() {
  const toast = useToast();
  const { date, dateTime } = useFormatDate();
  const [plan, setPlan] = useState("asthma");
  const [phone, setPhone] = useState("");
  const [confirmed, setConfirmed] = useState(0);

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-text-primary sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          eyebrow="HCMS"
          title="UI components"
          description="Every shared component in one place. Use these instead of styling buttons, cards, and fields by hand."
          actions={<><LanguageToggle /><ThemeToggle /></>}
        />

        <Section title="Button">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="danger-outline">Danger outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button size="sm" variant="secondary">Small</Button>
          <Button size="lg">Large</Button>
          <Button loading loadingText="Saving…">Save</Button>
          <Button disabled>Disabled</Button>
          <ButtonLink to="/dev/ui">Link</ButtonLink>
        </Section>

        <Card title="Buttons and badges inside a tall row" description="They keep their natural height.">
          <div data-testid="tall-row" className="grid min-h-60 grid-cols-3 gap-4">
            <p className="text-sm text-text-secondary">A tall neighbour column makes this grid row 240px high.</p>
            <Button data-testid="grid-button">Save medical record</Button>
            <StatusBadge status="PENDING_ASSIGNMENT" labelPrefix="patientWorkspace.alertStatuses" data-testid="grid-badge" />
          </div>
        </Card>

        <Section title="Badge">
          <Badge>Neutral</Badge>
          <Badge tone="info">Info</Badge>
          <Badge tone="success">Success</Badge>
          <Badge tone="warning">Warning</Badge>
          <Badge tone="danger">Danger</Badge>
          {["PENDING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CANCELLED"].map((status) => (
            <StatusBadge key={status} status={status} labelPrefix="patientWorkspace.alertStatuses" />
          ))}
        </Section>

        <Card title="Fields">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Contact phone" hint="We call this number back." required value={phone} onChange={(event) => setPhone(event.target.value)} error={phone && phone.length < 7 ? "Enter at least 7 digits." : ""} />
            <SelectField label="Role" placeholder="All roles" options={[{ value: "PATIENT", label: "Patient" }, { value: "DOCTOR", label: "Doctor" }]} defaultValue="" />
            <TextareaField label="Description" optionalLabel="optional" className="sm:col-span-2" />
          </div>
        </Card>

        <Section title="Alert">
          <Alert tone="error" title="Could not save" className="w-full">Check your connection and try again.</Alert>
          <Alert tone="info" className="w-full">Reviewing does not unlock form editing.</Alert>
          <Alert tone="warning" className="w-full">This account is waiting for approval.</Alert>
          <Alert tone="success" className="w-full">Everything is up to date.</Alert>
        </Section>

        <Section title="Toast">
          <Button variant="secondary" onClick={() => toast.success("Medical record saved.")}>Show success toast</Button>
          <Button variant="danger-outline" onClick={() => toast.error("Could not reach the server.")}>Show error toast</Button>
        </Section>

        <Card title="States">
          <div className="grid gap-4 md:grid-cols-3">
            <LoadingState />
            <EmptyState title="No reminders yet" description="Schedule one for a medication or appointment." action={<Button size="sm">Schedule reminder</Button>} />
            <ErrorState onRetry={() => toast.success("Retried")} />
          </div>
        </Card>

        <Section title="ConfirmAction">
          <ConfirmAction label="Deactivate" title="Deactivate Sara Ahmad?" description="She cannot sign in until re-activated." confirmLabel="Yes, deactivate" onConfirm={() => setConfirmed((count) => count + 1)} />
          <p data-testid="confirmed-count" className="text-sm text-text-secondary">Confirmed: {confirmed}</p>
        </Section>

        <Card title="DescriptionList">
          <DescriptionList
            columns={2}
            items={[
              { label: "Registration number", value: "NGO-1" },
              { label: "Phone", value: <a href="tel:0592222222" dir="ltr" className="underline">0592222222</a> },
              { label: "Address", value: "" },
              { label: "Notes", value: "Shown across the full width.", wide: true },
            ]}
          />
        </Card>

        <Card title="Tabs and SelectableCard">
          <Tabs
            label="Patient file"
            tabs={[
              { id: "summary", label: "Summary", content: <p>Summary panel</p> },
              { id: "record", label: "Medical record", content: <p>Record panel</p> },
              { id: "plans", label: "Treatment plans", count: 2, content: (
                <div className="grid max-w-sm gap-2">
                  <SelectableCard title="Asthma control plan" meta="Active · 5 Nov 2026" selected={plan === "asthma"} onClick={() => setPlan("asthma")} aside={<StatusBadge status="IN_PROGRESS" />} />
                  <SelectableCard title="Wound care" meta="Completed" selected={plan === "wound"} onClick={() => setPlan("wound")} />
                </div>
              ) },
            ]}
          />
        </Card>

        <Card title="Dates">
          <p data-testid="date-only">{date("2026-11-05")}</p>
          <p data-testid="date-time">{dateTime("2026-11-10T14:07:39")}</p>
        </Card>
      </div>
    </div>
  );
}

export default UiGallery;
