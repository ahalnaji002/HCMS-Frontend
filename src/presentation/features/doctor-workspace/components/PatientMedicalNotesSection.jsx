import { Button, Card, DescriptionList, TextareaField } from "@/presentation/components/ui";
import { useFormatDate } from "@/presentation/hooks/useFormatDate";

function PatientMedicalNotesSection({ t, notes, value, onChange, isSaving, onSubmit }) {
  const { dateTime } = useFormatDate();
  return (
    <Card id="doctor-notes" title={t("doctorWorkspace.documentCare")}>
      <form onSubmit={onSubmit} className="space-y-4">
        <TextareaField
          label={t("doctorWorkspace.privateNote")}
          required
          rows={5}
          maxLength={10000}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <Button type="submit" disabled={!value.trim()} loading={isSaving} loadingText={t("doctorWorkspace.saving")}>
          {t("doctorWorkspace.save")}
        </Button>
      </form>
      {notes.length > 0 && (
        <div className="mt-8 border-t border-border pt-6">
          <h3 className="font-bold">{t("doctorWorkspace.myNotes")}</h3>
          <DescriptionList
            className="mt-4"
            items={notes.map((note) => ({ key: note.id, label: dateTime(note.created_at), value: note.note }))}
          />
        </div>
      )}
    </Card>
  );
}

export default PatientMedicalNotesSection;
