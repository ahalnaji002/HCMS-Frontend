function todayDateOnly() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function PatientProfileSection({
  t, profile, loading, error, notice, form, fieldErrors, editing, saving,
  onRetry, onEdit, onCancel, onFieldChange, onSubmit,
}) {
  return (
    <section id="patient-profile" className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{t("patientWorkspace.profile")}</h2>
          <p className="mt-2 text-sm text-text-secondary">{t("patientWorkspace.profileHelp")}</p>
        </div>
        {profile && !editing && <button type="button" onClick={onEdit} className="min-h-10 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{t("patientWorkspace.editProfile")}</button>}
      </div>

      {error && <div className="mt-4 rounded-xl bg-danger/10 p-4 text-sm text-danger" role="alert"><p>{error}</p>{(!profile || !editing) && <button type="button" onClick={onRetry} disabled={loading} className="mt-3 min-h-10 rounded-lg border border-danger px-3 py-2 font-semibold disabled:opacity-60">{loading ? t("patientWorkspace.loading") : t("patientWorkspace.retry")}</button>}</div>}
      {notice && <p role="status" className="mt-4 rounded-xl bg-primary/10 p-4 text-sm text-primary">{notice}</p>}
      {loading && !profile && <p className="mt-4 text-sm text-text-secondary">{t("patientWorkspace.profileLoading")}</p>}

      {profile && !editing && <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <ReadOnlyField label={t("patientWorkspace.profileFields.full_name")} value={profile.full_name} />
        <ReadOnlyField label={t("patientWorkspace.profileFields.email")} value={profile.email} />
        <ReadOnlyField label={t("patientWorkspace.profileFields.phone")} value={profile.phone} />
        <ReadOnlyField label={t("patientWorkspace.profileFields.national_id")} value={profile.national_id} />
        <ReadOnlyField label={t("patientWorkspace.profileFields.date_of_birth")} value={profile.date_of_birth} />
        <ReadOnlyField label={t("patientWorkspace.profileFields.gender")} value={profile.gender ? t(`patientWorkspace.genderValues.${profile.gender}`) : ""} />
        <ReadOnlyField label={t("patientWorkspace.profileFields.address")} value={profile.address} />
      </div>}

      {profile && editing && <form className="mt-5" onSubmit={onSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileInput name="full_name" label={t("patientWorkspace.profileFields.full_name")} value={form.full_name} error={fieldErrors.full_name} onChange={onFieldChange} required />
          <ReadOnlyField label={t("patientWorkspace.profileFields.emailReadOnly")} value={profile.email} />
          <ProfileInput name="phone" label={t("patientWorkspace.profileFields.phone")} value={form.phone} error={fieldErrors.phone} onChange={onFieldChange} type="tel" />
          <ReadOnlyField label={t("patientWorkspace.profileFields.nationalIdReadOnly")} value={profile.national_id} />
          <ProfileInput name="date_of_birth" label={t("patientWorkspace.profileFields.date_of_birth")} value={form.date_of_birth} error={fieldErrors.date_of_birth} onChange={onFieldChange} type="date" max={todayDateOnly()} required />
          <label className="block text-sm font-semibold">{t("patientWorkspace.profileFields.gender")}
            <select name="gender" required value={form.gender} onChange={onFieldChange} aria-invalid={Boolean(fieldErrors.gender)} aria-describedby={fieldErrors.gender ? "profile-gender-error" : undefined} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-4 py-3 font-normal">
              <option value="">{t("patientWorkspace.profileFields.genderPlaceholder")}</option>
              <option value="MALE">{t("patientWorkspace.genderValues.MALE")}</option>
              <option value="FEMALE">{t("patientWorkspace.genderValues.FEMALE")}</option>
            </select>
            {fieldErrors.gender && <span id="profile-gender-error" className="mt-1 block text-xs font-normal text-danger">{fieldErrors.gender}</span>}
          </label>
          <ProfileInput name="address" label={t("patientWorkspace.profileFields.address")} value={form.address} error={fieldErrors.address} onChange={onFieldChange} />
        </div>
        {Object.keys(fieldErrors).length > 0 && <p role="alert" className="mt-4 text-sm text-danger">{t("patientWorkspace.profileValidation.summary")}</p>}
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="submit" disabled={saving || loading} className="min-h-11 rounded-xl bg-primary px-5 py-2 font-semibold text-white disabled:opacity-60">{saving ? t("patientWorkspace.saving") : t("patientWorkspace.saveProfile")}</button>
          <button type="button" onClick={onCancel} disabled={saving} className="min-h-11 rounded-xl border border-border px-5 py-2 font-semibold disabled:opacity-60">{t("patientWorkspace.cancel")}</button>
        </div>
      </form>}
    </section>
  );
}

function ReadOnlyField({ label, value }) {
  return <div className="rounded-xl border border-border bg-background p-4"><p className="text-xs font-semibold text-text-secondary">{label}</p><p className="mt-2 break-words text-sm leading-6">{value || "—"}</p></div>;
}

function ProfileInput({ name, label, value, error, onChange, ...attributes }) {
  return <label className="block text-sm font-semibold">{label}
    <input name={name} value={value} onChange={onChange} aria-invalid={Boolean(error)} aria-describedby={error ? `profile-${name}-error` : undefined} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-4 py-3 font-normal" {...attributes} />
    {error && <span id={`profile-${name}-error`} className="mt-1 block text-xs font-normal text-danger">{error}</span>}
  </label>;
}

export default PatientProfileSection;
