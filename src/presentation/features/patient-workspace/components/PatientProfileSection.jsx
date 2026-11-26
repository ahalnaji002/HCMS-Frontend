import { Button, Card, DescriptionList, ErrorState, LoadingState, PageHeader, SelectField, TextField } from "@/presentation/components/ui";
import { useFormatDate } from "@/presentation/hooks/useFormatDate";

function todayDateOnly() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function PatientProfileSection({
  t, profile, loading, error, form, fieldErrors, editing, saving,
  onRetry, onEdit, onCancel, onFieldChange, onSubmit,
}) {
  const { date } = useFormatDate();

  return (
    <div id="patient-profile">
      <PageHeader
        title={t("patientWorkspace.profile")}
        description={t("patientWorkspace.profileHelp")}
        actions={profile && !editing && <Button variant="secondary" onClick={onEdit}>{t("patientWorkspace.editProfile")}</Button>}
      />

      {loading && !profile ? <LoadingState label={t("patientWorkspace.profileLoading")} />
        : error && !profile ? <ErrorState message={error} onRetry={onRetry} retrying={loading} retryLabel={t("patientWorkspace.retry")} />
          : profile && !editing ? (
            <Card>
              <DescriptionList
                columns={2}
                emptyText="—"
                items={[
                  { label: t("patientWorkspace.profileFields.full_name"), value: profile.full_name },
                  { label: t("patientWorkspace.profileFields.email"), value: <span dir="ltr">{profile.email}</span> },
                  { label: t("patientWorkspace.profileFields.phone"), value: profile.phone && <span dir="ltr">{profile.phone}</span> },
                  { label: t("patientWorkspace.profileFields.national_id"), value: profile.national_id && <span dir="ltr">{profile.national_id}</span> },
                  { label: t("patientWorkspace.profileFields.date_of_birth"), value: date(profile.date_of_birth) },
                  { label: t("patientWorkspace.profileFields.gender"), value: profile.gender ? t(`patientWorkspace.genderValues.${profile.gender}`) : "" },
                  { label: t("patientWorkspace.profileFields.address"), value: profile.address },
                ]}
              />
            </Card>
          ) : profile && (
            <Card>
              <form onSubmit={onSubmit} noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField name="full_name" label={t("patientWorkspace.profileFields.full_name")} value={form.full_name} error={fieldErrors.full_name} onChange={onFieldChange} required />
                  <DescriptionList items={[{ label: t("patientWorkspace.profileFields.emailReadOnly"), value: <span dir="ltr">{profile.email}</span> }]} />
                  <TextField name="phone" label={t("patientWorkspace.profileFields.phone")} value={form.phone} error={fieldErrors.phone} onChange={onFieldChange} type="tel" dir="ltr" />
                  <DescriptionList emptyText="—" items={[{ label: t("patientWorkspace.profileFields.nationalIdReadOnly"), value: profile.national_id && <span dir="ltr">{profile.national_id}</span> }]} />
                  <TextField name="date_of_birth" label={t("patientWorkspace.profileFields.date_of_birth")} value={form.date_of_birth} error={fieldErrors.date_of_birth} onChange={onFieldChange} type="date" max={todayDateOnly()} required />
                  <SelectField
                    name="gender"
                    label={t("patientWorkspace.profileFields.gender")}
                    required
                    value={form.gender}
                    onChange={onFieldChange}
                    error={fieldErrors.gender}
                    placeholder={t("patientWorkspace.profileFields.genderPlaceholder")}
                    options={[
                      { value: "MALE", label: t("patientWorkspace.genderValues.MALE") },
                      { value: "FEMALE", label: t("patientWorkspace.genderValues.FEMALE") },
                    ]}
                  />
                  <TextField name="address" label={t("patientWorkspace.profileFields.address")} value={form.address} error={fieldErrors.address} onChange={onFieldChange} className="sm:col-span-2" />
                </div>
                {Object.keys(fieldErrors).length > 0 && <p role="alert" className="mt-4 text-sm text-danger">{t("patientWorkspace.profileValidation.summary")}</p>}
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button type="submit" disabled={loading} loading={saving} loadingText={t("patientWorkspace.saving")}>{t("patientWorkspace.saveProfile")}</Button>
                  <Button variant="secondary" onClick={onCancel} disabled={saving}>{t("patientWorkspace.cancel")}</Button>
                </div>
              </form>
            </Card>
          )}
    </div>
  );
}

export default PatientProfileSection;
