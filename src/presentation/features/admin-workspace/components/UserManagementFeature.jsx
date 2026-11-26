import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import {
  Button, Card, ConfirmAction, DescriptionList, EmptyState, ErrorState, LoadingState,
  PageHeader, SelectField, StatusBadge, TabLinks, TextField, useToast,
} from "@/presentation/components/ui";
import { useAuth } from "@/presentation/context/useAuth";

// FR-10.1 / FR-10.2. Deactivation suspends an ACTIVE account; re-activation
// only applies to SUSPENDED accounts. INACTIVE accounts are Doctor/NGO
// applicants and are handled on the Join Requests page.
const ROLES = ["PATIENT", "DOCTOR", "NGO", "ADMIN"];
const STATUSES = ["ACTIVE", "SUSPENDED", "INACTIVE"];

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

function Header({ t, description }) {
  return (
    <>
      <PageHeader title={t("roleNavigation.admin.userManagement")} description={description} />
      <TabLinks
        label={t("roleNavigation.admin.userManagement")}
        className="mb-6"
        links={[
          { to: "/admin/users", label: t("userManagement.usersTab") },
          { to: "/admin/organizations", label: t("userManagement.organizationsTab") },
        ]}
      />
    </>
  );
}

function AccountStatusActions({ t, name, status, isSelf, busy, disabled, onChange }) {
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
      <Button size="sm" loading={busy} loadingText={t("userManagement.working")} disabled={disabled} onClick={() => onChange("ACTIVE")}>
        {t("userManagement.activate")}
      </Button>
    );
  }
  return (
    <ConfirmAction
      size="sm"
      label={t("userManagement.deactivate")}
      title={t("userManagement.confirmTitle", { name })}
      description={t("userManagement.confirmDescription")}
      confirmLabel={t("userManagement.confirmDeactivate")}
      cancelLabel={t("userManagement.cancel")}
      loading={busy}
      disabled={disabled}
      onConfirm={() => onChange("SUSPENDED")}
    />
  );
}

// Shared by both pages: status change with toast feedback, then a reload on conflict.
function useStatusChange(onUpdated, reload) {
  const { admin } = useApplicationServices();
  const toast = useToast();
  const [busyUserId, setBusyUserId] = useState(null);

  async function changeStatus(userId, name, nextStatus) {
    setBusyUserId(userId);
    try {
      const response = await admin.updateUserStatus(userId, nextStatus);
      onUpdated(response.data.user);
      toast.success({ key: nextStatus === "ACTIVE" ? "userManagement.activated" : "userManagement.deactivated", values: { name } });
    } catch (requestError) {
      toast.error(requestError.response
        ? { server: requestError.response.data?.message, key: "userManagement.errors.server" }
        : { key: "userManagement.errors.network" });
      if ([404, 409].includes(requestError.response?.status)) reload();
    } finally {
      setBusyUserId(null);
    }
  }

  return { busyUserId, changeStatus };
}

function SearchForm({ t, initialValue, label, onSearch, children }) {
  const [value, setValue] = useState(initialValue);
  return (
    <Card padding="sm" className="mb-6">
      <form role="search" onSubmit={(event) => { event.preventDefault(); onSearch(value.trim()); }} className="flex flex-wrap items-end gap-3">
        <TextField label={label} type="search" value={value} maxLength={100} onChange={(event) => setValue(event.target.value)} className="min-w-56 flex-1" />
        {children}
        <Button type="submit">{t("userManagement.search")}</Button>
      </form>
    </Card>
  );
}

function ListState({ t, loading, error, empty, onRetry }) {
  if (loading) return <LoadingState label={t("userManagement.loading")} />;
  if (error) return <ErrorState message={t("userManagement.loadError")} onRetry={onRetry} retryLabel={t("userManagement.retry")} />;
  if (empty) return <EmptyState title={t("userManagement.empty")} />;
  return null;
}

const statusOptions = (t) => STATUSES.map((status) => ({ value: status, label: t(`userManagement.statuses.${status}`) }));

export function AdminUsersPage() {
  const { t } = useTranslation();
  const { admin } = useApplicationServices();
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState({ search: "", role: "", account_status: "", page: 1 });
  const [reloadCount, setReloadCount] = useState(0);
  const params = Object.fromEntries(Object.entries({ ...query, limit: 20 }).filter(([, value]) => value !== ""));
  const list = useAdminList(admin.listUsers, params, `${JSON.stringify(params)}#${reloadCount}`);
  const reload = () => setReloadCount((count) => count + 1);
  const { busyUserId, changeStatus } = useStatusChange(
    (updated) => list.replaceData((data) => ({ ...data, users: data.users.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)) })),
    reload,
  );
  const users = list.data?.users ?? [];
  const totalPages = list.data?.total_pages ?? 1;
  const setFilter = (field, value) => setQuery((current) => ({ ...current, [field]: value, page: 1 }));

  return (
    <>
      <Header t={t} description={t("userManagement.usersDescription")} />
      <SearchForm t={t} initialValue={query.search} label={t("userManagement.searchUsers")} onSearch={(search) => setFilter("search", search)}>
        <SelectField
          label={t("userManagement.role")}
          value={query.role}
          onChange={(event) => setFilter("role", event.target.value)}
          placeholder={t("userManagement.allRoles")}
          options={ROLES.map((role) => ({ value: role, label: t(`userManagement.roles.${role}`) }))}
        />
        <SelectField
          label={t("userManagement.status")}
          value={query.account_status}
          onChange={(event) => setFilter("account_status", event.target.value)}
          placeholder={t("userManagement.allStatuses")}
          options={statusOptions(t)}
        />
      </SearchForm>

      <ListState t={t} loading={list.loading && !list.data} error={list.error} empty={!list.error && list.data && users.length === 0} onRetry={reload} />
      {!list.error && users.length > 0 && (
        <>
          <p className="mb-3 text-sm text-text-secondary" aria-live="polite">{t("userManagement.total", { count: list.data.total })}</p>
          <ul className="space-y-3">
            {users.map((user) => (
              <Card
                key={user.id}
                as="li"
                padding="sm"
                title={user.full_name}
                description={<span dir="ltr" className="break-all">{user.email}{user.phone ? ` · ${user.phone}` : ""}</span>}
                actions={(
                  <AccountStatusActions
                    t={t}
                    name={user.full_name}
                    status={user.account_status}
                    isSelf={String(user.id) === String(currentUser?.id)}
                    busy={busyUserId === user.id}
                    disabled={busyUserId !== null}
                    onChange={(nextStatus) => changeStatus(user.id, user.full_name, nextStatus)}
                  />
                )}
              >
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={user.role} tone="neutral" labelPrefix="userManagement.roles" />
                  <StatusBadge status={user.account_status} labelPrefix="userManagement.statuses" />
                </div>
              </Card>
            ))}
          </ul>
          {totalPages > 1 && (
            <nav aria-label={t("userManagement.pagination")} className="mt-6 flex items-center justify-center gap-4">
              <Button variant="secondary" size="sm" disabled={query.page <= 1 || list.loading} onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))}>{t("userManagement.previous")}</Button>
              <span className="text-sm">{t("userManagement.pageOf", { page: query.page, total: totalPages })}</span>
              <Button variant="secondary" size="sm" disabled={query.page >= totalPages || list.loading} onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}>{t("userManagement.next")}</Button>
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
  const { busyUserId, changeStatus } = useStatusChange(
    (updated) => list.replaceData((data) => ({ ...data, ngos: data.ngos.map((ngo) => (ngo.user_id === updated.id ? { ...ngo, account_status: updated.account_status } : ngo)) })),
    reload,
  );
  const ngos = list.data?.ngos ?? [];

  return (
    <>
      <Header t={t} description={t("userManagement.organizationsDescription")} />
      <SearchForm t={t} initialValue={query.search} label={t("userManagement.searchOrganizations")} onSearch={(search) => setQuery((current) => ({ ...current, search }))}>
        <SelectField
          label={t("userManagement.status")}
          value={query.account_status}
          onChange={(event) => setQuery((current) => ({ ...current, account_status: event.target.value }))}
          placeholder={t("userManagement.allStatuses")}
          options={statusOptions(t)}
        />
      </SearchForm>

      <ListState t={t} loading={list.loading && !list.data} error={list.error} empty={!list.error && list.data && ngos.length === 0} onRetry={reload} />
      {!list.error && ngos.length > 0 && (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {ngos.map((ngo) => {
            const phone = ngo.contact_phone || ngo.phone;
            return (
              <Card
                key={ngo.id}
                as="article"
                padding="sm"
                title={ngo.organization_name}
                actions={<StatusBadge status={ngo.account_status} labelPrefix="userManagement.statuses" />}
              >
                <DescriptionList
                  items={[
                    { label: t("userManagement.registrationNumber"), value: ngo.registration_number && <span dir="ltr">{ngo.registration_number}</span> },
                    { label: t("userManagement.contactPerson"), value: ngo.full_name },
                    { label: t("userManagement.email"), value: <span dir="ltr" className="break-all">{ngo.email}</span> },
                    { label: t("userManagement.phone"), value: phone && <a href={`tel:${phone}`} dir="ltr" className="underline underline-offset-4">{phone}</a> },
                    { label: t("userManagement.address"), value: ngo.address },
                  ]}
                />
                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {["assigned_requests", "open_requests", "completed_requests"].map((field) => (
                    <div key={field} className="flex flex-col-reverse rounded-lg bg-background p-2">
                      <dt className="text-xs text-text-secondary">{t(`userManagement.counts.${field}`)}</dt>
                      <dd className="text-2xl font-bold">{ngo[field]}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4">
                  <AccountStatusActions
                    t={t}
                    name={ngo.organization_name}
                    status={ngo.account_status}
                    isSelf={false}
                    busy={busyUserId === ngo.user_id}
                    disabled={busyUserId !== null}
                    onChange={(nextStatus) => changeStatus(ngo.user_id, ngo.organization_name, nextStatus)}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
