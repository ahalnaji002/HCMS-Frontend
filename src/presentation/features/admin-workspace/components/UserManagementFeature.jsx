import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import StatusToast from "@/presentation/components/common/StatusToast";
import { useAuth } from "@/presentation/context/useAuth";
import { translateServerMessage } from "@/presentation/utils/serverMessages";

// FR-10.1 / FR-10.2. Deactivation suspends an ACTIVE account; re-activation
// only applies to SUSPENDED accounts. INACTIVE accounts are Doctor/NGO
// applicants and are handled on the Join Requests page.
const ROLES = ["PATIENT", "DOCTOR", "NGO", "ADMIN"];
const STATUSES = ["ACTIVE", "SUSPENDED", "INACTIVE"];
const STATUS_TONES = {
  ACTIVE: "bg-primary/10 text-primary",
  SUSPENDED: "bg-danger/10 text-danger",
  INACTIVE: "bg-amber-500/10 text-amber-600",
};
const fieldClass = "min-h-11 rounded-lg border border-border bg-surface px-3 py-2 text-sm";

function actionErrorMessage(error, t) {
  if (!error.response) return t("userManagement.errors.network");
  return translateServerMessage(t, error.response.data?.message, "userManagement.errors.server");
}

// Loads `fetcher(query)` whenever `queryKey` changes. Loading is derived from
// the key of the last settled result, so no state is set synchronously in the effect.
function useAdminList(fetcher, query, queryKey) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    fetcher(query)
      .then((response) => { if (active) setResult({ key: queryKey, data: response.data, error: false }); })
      .catch(() => { if (active) setResult({ key: queryKey, data: null, error: true }); });
    return () => { active = false; };
    // `query` is represented by `queryKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, queryKey]);

  const settled = result && result.key === queryKey ? result : null;
  return {
    loading: !settled,
    error: Boolean(settled?.error),
    data: settled?.data ?? result?.data ?? null,
    replaceData: (updater) => setResult((current) => (current ? { ...current, data: updater(current.data) } : current)),
  };
}

function ManagementTabs({ t }) {
  const tabClass = ({ isActive }) => `rounded-lg px-4 py-2 text-sm font-semibold ${isActive ? "bg-primary text-white" : "border border-border hover:bg-background"}`;
  return (
    <nav aria-label={t("roleNavigation.admin.userManagement")} className="mb-6 flex flex-wrap gap-2">
      <NavLink to="/admin/users" className={tabClass}>{t("userManagement.usersTab")}</NavLink>
      <NavLink to="/admin/organizations" className={tabClass}>{t("userManagement.organizationsTab")}</NavLink>
    </nav>
  );
}

function StatusBadge({ t, status }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_TONES[status] || STATUS_TONES.INACTIVE}`}>
      {t(`userManagement.statuses.${status}`, { defaultValue: status })}
    </span>
  );
}

function AccountStatusActions({ t, name, status, isSelf, busy, disabled, onChange }) {
  const [confirming, setConfirming] = useState(false);

  if (isSelf) return <p className="text-sm text-text-secondary">{t("userManagement.ownAccount")}</p>;
  if (status === "INACTIVE") {
    return (
      <Link to="/admin/join-requests" className="text-sm font-semibold text-primary underline underline-offset-4">
        {t("userManagement.awaitingApproval")}
      </Link>
    );
  }
  if (status === "SUSPENDED") {
    return (
      <button type="button" disabled={disabled} onClick={() => onChange("ACTIVE")} className="min-h-10 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {busy ? t("userManagement.working") : t("userManagement.activate")}
      </button>
    );
  }
  if (!confirming) {
    return (
      <button type="button" disabled={disabled} onClick={() => setConfirming(true)} className="min-h-10 rounded-lg border border-danger px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/5 disabled:opacity-60">
        {busy ? t("userManagement.working") : t("userManagement.deactivate")}
      </button>
    );
  }
  return (
    <div role="group" aria-label={t("userManagement.confirmTitle", { name })} className="w-full rounded-lg border border-danger/30 bg-danger/5 p-4">
      <p className="font-semibold">{t("userManagement.confirmTitle", { name })}</p>
      <p className="mt-1 text-sm text-text-secondary">{t("userManagement.confirmDescription")}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" disabled={disabled} onClick={() => { setConfirming(false); onChange("SUSPENDED"); }} className="min-h-10 rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {t("userManagement.confirmDeactivate")}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="min-h-10 rounded-lg border border-border px-4 py-2 text-sm font-semibold">
          {t("userManagement.cancel")}
        </button>
      </div>
    </div>
  );
}

// Shared by both pages: status change with toast feedback, then a reload on conflict.
function useStatusChange(onUpdated, reload) {
  const { t } = useTranslation();
  const { admin } = useApplicationServices();
  const [busyUserId, setBusyUserId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function changeStatus(userId, name, nextStatus) {
    setBusyUserId(userId);
    setError("");
    setNotice("");
    try {
      const response = await admin.updateUserStatus(userId, nextStatus);
      onUpdated(response.data.user);
      setNotice(t(nextStatus === "ACTIVE" ? "userManagement.activated" : "userManagement.deactivated", { name }));
    } catch (requestError) {
      setError(actionErrorMessage(requestError, t));
      if ([404, 409].includes(requestError.response?.status)) reload();
    } finally {
      setBusyUserId(null);
    }
  }

  const toast = (
    <StatusToast error={error} notice={notice} onDismiss={() => { setError(""); setNotice(""); }} dismissLabel={t("roleHome.dismissMessage")} />
  );
  return { busyUserId, changeStatus, toast };
}

function SearchForm({ t, initialValue, label, onSearch, children }) {
  const [value, setValue] = useState(initialValue);
  return (
    <form
      role="search"
      onSubmit={(event) => { event.preventDefault(); onSearch(value.trim()); }}
      className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4"
    >
      <label className="flex min-w-56 flex-1 flex-col gap-1 text-sm font-semibold">
        {label}
        <input type="search" value={value} maxLength={100} onChange={(event) => setValue(event.target.value)} className={fieldClass} />
      </label>
      {children}
      <button type="submit" className="min-h-11 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white">{t("userManagement.search")}</button>
    </form>
  );
}

function ListState({ t, loading, error, empty, onRetry }) {
  if (loading) return <p role="status" className="py-12 text-center text-text-secondary">{t("userManagement.loading")}</p>;
  if (error) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4">
        <p role="alert" className="text-sm text-danger">{t("userManagement.loadError")}</p>
        <button type="button" onClick={onRetry} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">{t("userManagement.retry")}</button>
      </div>
    );
  }
  if (empty) return <p className="rounded-xl border border-border bg-surface p-6 text-text-secondary">{t("userManagement.empty")}</p>;
  return null;
}

export function AdminUsersPage() {
  const { t } = useTranslation();
  const { admin } = useApplicationServices();
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState({ search: "", role: "", account_status: "", page: 1 });
  const [reloadCount, setReloadCount] = useState(0);
  const params = Object.fromEntries(Object.entries({ ...query, limit: 20 }).filter(([, value]) => value !== ""));
  const list = useAdminList(admin.listUsers, params, `${JSON.stringify(params)}#${reloadCount}`);
  const reload = () => setReloadCount((count) => count + 1);
  const { busyUserId, changeStatus, toast } = useStatusChange(
    (updated) => list.replaceData((data) => ({ ...data, users: data.users.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)) })),
    reload,
  );
  const users = list.data?.users ?? [];
  const totalPages = list.data?.total_pages ?? 1;
  const setFilter = (field, value) => setQuery((current) => ({ ...current, [field]: value, page: 1 }));

  return (
    <>
      {toast}
      <h1 id="admin-users" className="mb-2 text-3xl font-bold">{t("roleNavigation.admin.userManagement")}</h1>
      <p className="mb-6 max-w-2xl text-sm leading-6 text-text-secondary">{t("userManagement.usersDescription")}</p>
      <ManagementTabs t={t} />
      <SearchForm t={t} initialValue={query.search} label={t("userManagement.searchUsers")} onSearch={(search) => setFilter("search", search)}>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          {t("userManagement.role")}
          <select value={query.role} onChange={(event) => setFilter("role", event.target.value)} className={fieldClass}>
            <option value="">{t("userManagement.allRoles")}</option>
            {ROLES.map((role) => <option key={role} value={role}>{t(`userManagement.roles.${role}`)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          {t("userManagement.status")}
          <select value={query.account_status} onChange={(event) => setFilter("account_status", event.target.value)} className={fieldClass}>
            <option value="">{t("userManagement.allStatuses")}</option>
            {STATUSES.map((status) => <option key={status} value={status}>{t(`userManagement.statuses.${status}`)}</option>)}
          </select>
        </label>
      </SearchForm>

      <ListState t={t} loading={list.loading && !list.data} error={list.error} empty={!list.error && list.data && users.length === 0} onRetry={reload} />
      {!list.error && users.length > 0 && (
        <>
          <p className="mb-3 text-sm text-text-secondary" aria-live="polite">{t("userManagement.total", { count: list.data.total })}</p>
          <ul className="space-y-3">
            {users.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5">
                <div className="min-w-0">
                  <p className="font-bold">{user.full_name}</p>
                  <p className="break-all text-sm text-text-secondary" dir="ltr">{user.email}{user.phone ? ` · ${user.phone}` : ""}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold">{t(`userManagement.roles.${user.role}`)}</span>
                    <StatusBadge t={t} status={user.account_status} />
                  </div>
                </div>
                <AccountStatusActions
                  t={t}
                  name={user.full_name}
                  status={user.account_status}
                  isSelf={String(user.id) === String(currentUser?.id)}
                  busy={busyUserId === user.id}
                  disabled={busyUserId !== null}
                  onChange={(nextStatus) => changeStatus(user.id, user.full_name, nextStatus)}
                />
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <nav aria-label={t("userManagement.pagination")} className="mt-6 flex items-center justify-center gap-4">
              <button type="button" disabled={query.page <= 1 || list.loading} onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))} className="min-h-10 rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50">{t("userManagement.previous")}</button>
              <span className="text-sm">{t("userManagement.pageOf", { page: query.page, total: totalPages })}</span>
              <button type="button" disabled={query.page >= totalPages || list.loading} onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))} className="min-h-10 rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50">{t("userManagement.next")}</button>
            </nav>
          )}
        </>
      )}
    </>
  );
}

export function AdminOrganizationsPage() {
  const { t } = useTranslation();
  const { admin } = useApplicationServices();
  const [query, setQuery] = useState({ search: "", account_status: "" });
  const [reloadCount, setReloadCount] = useState(0);
  const params = Object.fromEntries(Object.entries(query).filter(([, value]) => value !== ""));
  const list = useAdminList(admin.listNgos, params, `${JSON.stringify(params)}#${reloadCount}`);
  const reload = () => setReloadCount((count) => count + 1);
  const { busyUserId, changeStatus, toast } = useStatusChange(
    (updated) => list.replaceData((data) => ({ ...data, ngos: data.ngos.map((ngo) => (ngo.user_id === updated.id ? { ...ngo, account_status: updated.account_status } : ngo)) })),
    reload,
  );
  const ngos = list.data?.ngos ?? [];

  return (
    <>
      {toast}
      <h1 id="admin-organizations" className="mb-2 text-3xl font-bold">{t("roleNavigation.admin.userManagement")}</h1>
      <p className="mb-6 max-w-2xl text-sm leading-6 text-text-secondary">{t("userManagement.organizationsDescription")}</p>
      <ManagementTabs t={t} />
      <SearchForm t={t} initialValue={query.search} label={t("userManagement.searchOrganizations")} onSearch={(search) => setQuery((current) => ({ ...current, search }))}>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          {t("userManagement.status")}
          <select value={query.account_status} onChange={(event) => setQuery((current) => ({ ...current, account_status: event.target.value }))} className={fieldClass}>
            <option value="">{t("userManagement.allStatuses")}</option>
            {STATUSES.map((status) => <option key={status} value={status}>{t(`userManagement.statuses.${status}`)}</option>)}
          </select>
        </label>
      </SearchForm>

      <ListState t={t} loading={list.loading && !list.data} error={list.error} empty={!list.error && list.data && ngos.length === 0} onRetry={reload} />
      {!list.error && ngos.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {ngos.map((ngo) => (
            <article key={ngo.id} aria-labelledby={`ngo-${ngo.id}-name`} className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-surface p-5">
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 id={`ngo-${ngo.id}-name`} className="text-lg font-bold">{ngo.organization_name}</h2>
                  <StatusBadge t={t} status={ngo.account_status} />
                </div>
                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex gap-2"><dt className="text-text-secondary">{t("userManagement.registrationNumber")}:</dt><dd dir="ltr">{ngo.registration_number || "—"}</dd></div>
                  <div className="flex gap-2"><dt className="text-text-secondary">{t("userManagement.contactPerson")}:</dt><dd>{ngo.full_name}</dd></div>
                  <div className="flex flex-wrap gap-2"><dt className="text-text-secondary">{t("userManagement.email")}:</dt><dd dir="ltr" className="break-all">{ngo.email}</dd></div>
                  <div className="flex gap-2"><dt className="text-text-secondary">{t("userManagement.phone")}:</dt><dd>{ngo.contact_phone || ngo.phone ? <a href={`tel:${ngo.contact_phone || ngo.phone}`} dir="ltr" className="underline underline-offset-4">{ngo.contact_phone || ngo.phone}</a> : "—"}</dd></div>
                  <div className="flex gap-2"><dt className="text-text-secondary">{t("userManagement.address")}:</dt><dd>{ngo.address || "—"}</dd></div>
                </dl>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {["assigned_requests", "open_requests", "completed_requests"].map((field) => (
                    <div key={field} className="flex flex-col-reverse rounded-lg bg-background p-2">
                      <dt className="text-xs text-text-secondary">{t(`userManagement.counts.${field}`)}</dt>
                      <dd className="text-2xl font-bold">{ngo[field]}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <AccountStatusActions
                t={t}
                name={ngo.organization_name}
                status={ngo.account_status}
                isSelf={false}
                busy={busyUserId === ngo.user_id}
                disabled={busyUserId !== null}
                onChange={(nextStatus) => changeStatus(ngo.user_id, ngo.organization_name, nextStatus)}
              />
            </article>
          ))}
        </div>
      )}
    </>
  );
}
