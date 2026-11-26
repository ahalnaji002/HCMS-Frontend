import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import { Badge, Button, ConfirmAction, DescriptionList, EmptyState, ErrorState, TextareaField, TextField, useToast } from "@/presentation/components/ui";
import { useFormatDate } from "@/presentation/hooks/useFormatDate";

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
  const [validationError, setValidationError] = useState(null);

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

  const errorFor = (field) => (validationError?.field === field ? validationError.message : undefined);

  return (
    <form onSubmit={submit} className="mt-4 grid gap-4 rounded-xl border border-border bg-background p-4 sm:grid-cols-2" noValidate>
      <TextField className="sm:col-span-2" label={t("ngoAssistance.allocations.fields.resourceName")} name="resource_name" value={values.resource_name} onChange={updateField} maxLength={150} required error={errorFor("resource_name")} />
      <TextField label={t("ngoAssistance.allocations.fields.quantity")} name="quantity" type="number" value={values.quantity} onChange={updateField} min="1" max="4294967295" step="1" required error={errorFor("quantity")} />
      <TextField label={t("ngoAssistance.allocations.fields.deliveryDate")} name="delivery_date" type="date" value={values.delivery_date} onChange={updateField} />
      <TextareaField className="sm:col-span-2" label={t("ngoAssistance.allocations.fields.notes")} name="notes" value={values.notes} onChange={updateField} rows={3} error={errorFor("notes")} />
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <Button type="submit" loading={saving} loadingText={t("ngoAssistance.allocations.saving")}>
          {t(allocation ? "ngoAssistance.allocations.saveChanges" : "ngoAssistance.allocations.add")}
        </Button>
        {allocation && <Button variant="secondary" disabled={saving} onClick={onCancel}>{t("ngoAssistance.allocations.cancelEdit")}</Button>}
      </div>
    </form>
  );
}

function AllocationCard({ allocation, editable, editing, saving, onEdit, onDelete, onCancel, onSubmit }) {
  const { t } = useTranslation();
  const { date } = useFormatDate();

  return (
    <article className="rounded-xl border border-border bg-background p-4">
      {editing ? <AllocationForm allocation={allocation} saving={saving} onCancel={onCancel} onSubmit={onSubmit} /> : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="text-base font-semibold">{allocation.resource_name}</h3>
            <Badge tone="info">{t("ngoAssistance.allocations.quantityValue", { count: allocation.quantity, quantity: allocation.quantity })}</Badge>
          </div>
          <DescriptionList
            className="mt-3"
            columns={2}
            emptyText={t("ngoAssistance.allocations.notProvided")}
            items={[
              { label: t("ngoAssistance.allocations.fields.deliveryDate"), value: allocation.delivery_date ? date(allocation.delivery_date.slice(0, 10)) : "" },
              { label: t("ngoAssistance.allocations.fields.notes"), value: allocation.notes },
            ]}
          />
          {editable && (
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="secondary" size="sm" disabled={saving} onClick={onEdit}>{t("ngoAssistance.allocations.edit")}</Button>
              <ConfirmAction
                size="sm"
                label={t("ngoAssistance.allocations.delete")}
                title={t("ngoAssistance.allocations.confirmDelete")}
                confirmLabel={t("ui.confirm")}
                disabled={saving}
                onConfirm={onDelete}
              />
            </div>
          )}
        </>
      )}
    </article>
  );
}

function NgoResourceAllocationsSection({ request, resources, resourceErrorKind, onRetry }) {
  const { t } = useTranslation();
  const { ngoWorkspace } = useApplicationServices();
  const toast = useToast();
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const canCreate = request.status === "APPROVED";
  const canEdit = request.status !== "COMPLETED";

  function fail(error) {
    toast.error({ key: `ngoAssistance.allocations.errors.${getErrorKey(error)}` });
    if (error.response?.status === 404 || error.response?.status === 409) onRetry();
  }

  async function saveAllocation(payload) {
    setSaving(true);
    try {
      if (editingId) {
        await ngoWorkspace.updateResourceAllocation(request.id, editingId, payload);
        toast.success({ key: "ngoAssistance.allocations.updated" });
        setEditingId(null);
      } else {
        await ngoWorkspace.createResourceAllocation(request.id, payload);
        toast.success({ key: "ngoAssistance.allocations.created" });
      }
      onRetry();
    } catch (error) {
      fail(error);
    } finally {
      setSaving(false);
    }
  }

  async function deleteAllocation(allocationId) {
    setSaving(true);
    try {
      await ngoWorkspace.deleteResourceAllocation(request.id, allocationId);
      toast.success({ key: "ngoAssistance.allocations.deleted" });
      setEditingId(null);
      onRetry();
    } catch (error) {
      fail(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="ngo-resource-allocations-title" className="mt-7 border-t border-border pt-6">
      <h2 id="ngo-resource-allocations-title" className="text-lg font-bold">{t("ngoAssistance.allocations.title")}</h2>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{t("ngoAssistance.allocations.description")}</p>
      <div className="mt-4">
        {resourceErrorKind ? <ErrorState message={t(`ngoAssistance.errors.${resourceErrorKind}`)} onRetry={onRetry} retryLabel={t("ngoAssistance.retry")} />
          : (
            <>
              {resources.length === 0 ? <EmptyState title={t("ngoAssistance.allocations.empty")} /> : (
                <ul className="grid gap-3">
                  {resources.map((allocation) => (
                    <li key={allocation.id}>
                      <AllocationCard
                        allocation={allocation}
                        editable={canEdit}
                        editing={editingId === allocation.id}
                        saving={saving}
                        onEdit={() => setEditingId(allocation.id)}
                        onDelete={() => deleteAllocation(allocation.id)}
                        onCancel={() => setEditingId(null)}
                        onSubmit={saveAllocation}
                      />
                    </li>
                  ))}
                </ul>
              )}
              {canCreate && (
                <div className="mt-5">
                  <h3 className="text-base font-semibold">{t("ngoAssistance.allocations.addTitle")}</h3>
                  <AllocationForm saving={saving} onSubmit={saveAllocation} />
                </div>
              )}
            </>
          )}
      </div>
    </section>
  );
}

export default NgoResourceAllocationsSection;
