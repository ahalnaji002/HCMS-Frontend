import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import PatientEmergencyDialog, { PatientEmergencyButton } from "@/presentation/features/patient-workspace/components/PatientEmergencyDialog";

const EMPTY_FORM = { phone: "", location: "", description: "" };

// A callback number the administration can actually dial: digits with
// optional +, spaces, dashes, or parentheses, and 7 to 15 digits in total.
function isDialablePhone(value) {
  const digits = value.replace(/\D/g, "");
  return /^\+?[\d\s()-]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
}

function submitErrorKey(error) {
  if (!error.response) return "publicEmergency.errors.network";
  if (error.response.status === 429) return "publicEmergency.errors.rateLimited";
  if (error.response.status === 400) return "publicEmergency.errors.validation";
  return "publicEmergency.errors.server";
}

// Visitor emergency alert (FR-6.1): a floating button on every landing
// section plus `open`/`onOpen` for the hero call to action.
function PublicEmergencyAlert({ open, onOpen, onClose }) {
  const { t } = useTranslation();
  const { publicEmergency } = useApplicationServices();
  const [form, setForm] = useState(EMPTY_FORM);
  const [phoneError, setPhoneError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function close() {
    // After a successful alert the next one starts from a clean form.
    if (notice) {
      setForm(EMPTY_FORM);
      setNotice("");
    }
    setError("");
    setPhoneError("");
    onClose();
  }

  async function submit(event) {
    event.preventDefault();
    const phone = form.phone.trim();
    setError("");
    if (!isDialablePhone(phone)) {
      setPhoneError(t("publicEmergency.errors.phoneInvalid"));
      return;
    }
    setPhoneError("");
    setIsSubmitting(true);
    try {
      await publicEmergency.createAlert({
        phone,
        location: form.location.trim() || null,
        description: form.description.trim() || null,
      });
      setNotice(t("publicEmergency.sent"));
    } catch (requestError) {
      setError(t(submitErrorKey(requestError)));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {!open && <PatientEmergencyButton t={t} onClick={onOpen} />}
      <PatientEmergencyDialog
        t={t}
        open={open}
        onClose={close}
        form={form}
        setForm={(updater) => { setPhoneError(""); setForm(updater); }}
        error={error}
        notice={notice}
        isSubmitting={isSubmitting}
        onSubmit={submit}
        hint={t("publicEmergency.hint")}
        phoneError={phoneError}
        footer={<p className="text-center text-xs leading-5 text-text-secondary">{t("publicEmergency.accountHint")}</p>}
      />
    </>
  );
}

export default PublicEmergencyAlert;
