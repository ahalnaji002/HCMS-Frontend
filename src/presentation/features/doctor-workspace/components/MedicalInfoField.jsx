function MedicalInfoField({ label, value }) {
  return <div className="rounded-xl border border-border bg-background p-4"><p className="text-xs font-semibold text-text-secondary">{label}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{value || "—"}</p></div>;
}

export default MedicalInfoField;
