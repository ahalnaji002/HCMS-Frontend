import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";

const EMPTY_ALLOCATION = {
  resource_name: "",
  quantity: "1",
  delivery_date: "",
  notes: "",
};

const ALLOCATION_ERRORS = {
  "Resource Allocations can only be created for approved Assistance Requests": "allocationUnavailable",
  "Resource Allocations are read-only after completion": "allocationReadOnly",
  "Resource Allocation changed concurrently": "allocationConflict",
};

function getErrorKey(error) {
  const message = error.response?.data?.message;
  if (ALLOCATION_ERRORS[message]) return ALLOCATION_ERRORS[message];

  switch (error.response?.status) {
    case 400: return "allocationValidation";
    case 403: return "allocationForbidden";
    case 404: return "allocationNotFound";
    case 409: return "allocationConflict";
    default: return "allocationUpdateFailed";
  }
}

function toPayload(values, editing) {
  const payload = {
    resource_name: values.resource_name.trim(),
    quantity: Number(values.quantity),
  };

  if (editing || values.delivery_date) {
    payload.delivery_date = values.delivery_date || null;
  }
  if (editing || values.notes) {
    payload.notes = values.notes || null;
  }

  return payload;
}

function validateAllocation(values, t) {
  if (!values.resource_name.trim()) return { field: "resource_name", message: t("ngoAssistance.allocations.errors.nameRequired") };
  if (values.resource_name.trim().length > 150) return { field: "resource_name", message: t("ngoAssistance.allocations.errors.nameTooLong") };

  const quantity = Number(values.quantity);
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 4294967295) {
    return { field: "quantity", message: t("ngoAssistance.allocations.errors.quantityInvalid") };
  }

  if (new TextEncoder().encode(values.notes).length > 65535) {
    return { field: "notes", message: t("ngoAssistance.allocations.errors.notesTooLong") };
  }

  return "";
}

function AllocationForm({ allocation, saving, onCancel, onSubmit }) {
  const { t } = useTranslation();
  const [values, setValues] = useState(() => allocation ? {
    resource_name: allocation.resource_name ?? "",
    quantity: String(allocation.quantity ?? 1),
    delivery_date: allocation.delivery_date?.slice(0, 10) ?? "",
    notes: allocation.notes ?? "",
  } : EMPTY_ALLOCATION);
  const [validationError, setValidationError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (validationError) setValidationError(null);
  }

  function submit(event) {
    event.preventDefault();
    const error = validateAllocation(values, t);
    if (error) {
      setValidationError(error);
      return;
    }
    onSubmit(toPayload(values, Boolean(allocation)));
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-4 rounded-xl border border-border bg-background p-4 sm:grid-cols-2" noValidate>
      <label className="grid gap-2 text-sm font-medium sm:col-span-2">
        {t("ngoAssistance.allocations.fields.resourceName")}
        <input name="resource_name" value={values.resource_name} onChange={updateField} maxLength={150} required aria-invalid={validationError?.field === "resource_name"} className="min-h-11 rounded-lg border border-border bg-surface px-3 text-text-primary focus-visible:outline-2 focus-visible:outline-primary" />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        {t("ngoAssistance.allocations.fields.quantity")}
        <input name="quantity" type="number" value={values.quantity} onChange={updateField} min="1" max="4294967295" step="1" required aria-invalid={validationError?.field === "quantity"} className="min-h-11 rounded-lg border border-border bg-surface px-3 text-text-primary focus-visible:outline-2 focus-visible:outline-primary" />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        {t("ngoAssistance.allocations.fields.deliveryDate")}
        <input name="delivery_date" type="date" value={values.delivery_date} onChange={updateField} className="min-h-11 rounded-lg border border-border bg-surface px-3 text-text-primary focus-visible:outline-2 focus-visible:outline-primary" />
      </label>
      <label className="grid gap-2 text-sm font-medium sm:col-span-2">
        {t("ngoAssistance.allocations.fields.notes")}
        <textarea name="notes" value={values.notes} onChange={updateField} rows={3} aria-invalid={validationError?.field === "notes"} className="rounded-lg border border-border bg-surface px-3 py-2 text-text-primary focus-visible:outline-2 focus-visible:outline-primary" />
      </label>
      {validationError && <p role="alert" className="text-sm text-danger sm:col-span-2">{validationError.message}</p>}
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <button type="submit" disabled={saving} className="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? t("ngoAssistance.allocations.saving") : t(allocation ? "ngoAssistance.allocations.saveChanges" : "ngoAssistance.allocations.add")}
        </button>
        {allocation && <button type="button" disabled={saving} onClick={onCancel} className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-primary disabled:opacity-60">{t("ngoAssistance.allocations.cancelEdit")}</button>}
      </div>
    </form>
  );
}

function AllocationCard({ allocation, editable, editing, saving, onEdit, onDelete, onCancel, onSubmit }) {
  const { t, i18n } = useTranslation();

  return (
    <article className="rounded-xl border border-border bg-background p-4">
      {editing ? <AllocationForm allocation={allocation} saving={saving} onCancel={onCancel} onSubmit={onSubmit} /> : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="text-base font-semibold">{allocation.resource_name}</h3>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{t("ngoAssistance.allocations.quantityValue", { count: allocation.quantity, quantity: allocation.quantity })}</span>
          </div>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-text-secondary">{t("ngoAssistance.allocations.fields.deliveryDate")}</dt><dd className="mt-1">{allocation.delivery_date ? new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${allocation.delivery_date.slice(0, 10)}T00:00:00Z`)) : t("ngoAssistance.allocations.notProvided")}</dd></div>
            <div><dt className="text-text-secondary">{t("ngoAssistance.allocations.fields.notes")}</dt><dd className="mt-1 whitespace-pre-wrap break-words">{allocation.notes || t("ngoAssistance.allocations.notProvided")}</dd></div>
          </dl>
          {editable && <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" disabled={saving} onClick={onEdit} className="min-h-11 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary disabled:opacity-60">{t("ngoAssistance.allocations.edit")}</button>
            <button type="button" disabled={saving} onClick={onDelete} className="min-h-11 rounded-lg border border-danger/40 px-4 py-2 text-sm font-semibold text-danger disabled:opacity-60">{t("ngoAssistance.allocations.delete")}</button>
          </div>}
        </>
      )}
    </article>
  );
}

function NgoResourceAllocationsSection({ request, resources, resourceErrorKind, onRetry, onActionFeedback }) {
  const { t } = useTranslation();
  const { ngoWorkspace } = useApplicationServices();
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const canCreate = request.status === "APPROVED";
  const canEdit = request.status !== "COMPLETED";

  async function saveAllocation(payload) {
    setSaving(true);
    onActionFeedback({ error: "", notice: "" });
    try {
      if (editingId) {
        await ngoWorkspace.updateResourceAllocation(request.id, editingId, payload);
        onActionFeedback({ error: "", notice: t("ngoAssistance.allocations.updated") });
        setEditingId(null);
      } else {
        await ngoWorkspace.createResourceAllocation(request.id, payload);
        onActionFeedback({ error: "", notice: t("ngoAssistance.allocations.created") });
      }
      onRetry();
    } catch (error) {
      onActionFeedback({ error: t(`ngoAssistance.allocations.errors.${getErrorKey(error)}`), notice: "" });
      if (error.response?.status === 404 || error.response?.status === 409) onRetry();
    } finally {
      setSaving(false);
    }
  }

  async function deleteAllocation(allocationId) {
    if (!window.confirm(t("ngoAssistance.allocations.confirmDelete"))) return;
    setSaving(true);
    onActionFeedback({ error: "", notice: "" });
    try {
      await ngoWorkspace.deleteResourceAllocation(request.id, allocationId);
      onActionFeedback({ error: "", notice: t("ngoAssistance.allocations.deleted") });
      setEditingId(null);
      onRetry();
    } catch (error) {
      onActionFeedback({ error: t(`ngoAssistance.allocations.errors.${getErrorKey(error)}`), notice: "" });
      if (error.response?.status === 404 || error.response?.status === 409) onRetry();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="ngo-resource-allocations-title" className="mt-7 border-t border-border pt-6">
      <h2 id="ngo-resource-allocations-title" className="text-lg font-bold">{t("ngoAssistance.allocations.title")}</h2>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{t("ngoAssistance.allocations.description")}</p>
      {resourceErrorKind ? (
        <div className="mt-4 rounded-xl border border-danger/30 bg-danger/5 p-4">
          <p role="alert" className="text-sm text-danger">{t(`ngoAssistance.errors.${resourceErrorKind}`)}</p>
          <button type="button" onClick={onRetry} className="mt-3 min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary">{t("ngoAssistance.retry")}</button>
        </div>
      ) : (
        <>
          {resources.length === 0 ? <p role="status" className="mt-4 rounded-xl bg-background p-4 text-sm text-text-secondary">{t("ngoAssistance.allocations.empty")}</p> : (
            <ul className="mt-4 grid gap-3">
              {resources.map((allocation) => <li key={allocation.id}>
                <AllocationCard
                  allocation={allocation}
                  editable={canEdit}
                  editing={editingId === allocation.id}
                  saving={saving}
                  onEdit={() => { onActionFeedback({ error: "", notice: "" }); setEditingId(allocation.id); }}
                  onDelete={() => deleteAllocation(allocation.id)}
                  onCancel={() => setEditingId(null)}
                  onSubmit={saveAllocation}
                />
              </li>)}
            </ul>
          )}
          {canCreate && <div className="mt-5">
            <h3 className="text-base font-semibold">{t("ngoAssistance.allocations.addTitle")}</h3>
            <AllocationForm saving={saving} onSubmit={saveAllocation} />
          </div>}
        </>
      )}
    </section>
  );
}

export default NgoResourceAllocationsSection;
