import MedicalInfoField from "@/presentation/features/doctor-workspace/components/MedicalInfoField";

function PatientMedicalNotesSection({ t, notes, value, onChange, isSaving, onSubmit }) {
  return (
    <section id="doctor-notes" className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <h2 className="text-xl font-bold">{t("doctorWorkspace.documentCare")}</h2>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <label className="block space-y-2 text-sm font-semibold">{t("doctorWorkspace.privateNote")}<textarea required rows={5} maxLength={10000} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 font-normal" /></label>
        <button type="submit" disabled={isSaving} className="rounded-xl bg-primary px-6 py-3 font-semibold text-white disabled:opacity-60">{isSaving ? t("doctorWorkspace.saving") : t("doctorWorkspace.save")}</button>
      </form>
      {notes.length > 0 && <div className="mt-8 border-t border-border pt-6"><h3 className="font-bold">{t("doctorWorkspace.myNotes")}</h3><div className="mt-4 space-y-3">{notes.map((note) => <MedicalInfoField key={note.id} label={new Date(note.created_at).toLocaleString()} value={note.note} />)}</div></div>}
    </section>
  );
}

export default PatientMedicalNotesSection;
