function CorrectionRequestsSection({ t, requests, responses, onResponseChange, busyId, onResolve }) {
  return (
    <section id="admin-support" className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <h2 className="text-xl font-bold">{t("adminIntakes.correctionsTitle")}</h2>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{t("adminIntakes.correctionsDescription")}</p>
      {requests.length === 0 ? <p className="mt-5 text-sm text-text-secondary">{t("adminIntakes.noCorrections")}</p> : <div className="mt-5 space-y-4">
        {requests.map((request) => <article key={request.id} className="rounded-xl border border-border bg-background p-5">
          <div className="flex flex-wrap justify-between gap-2"><div><p className="font-bold">{request.patient_name}</p><p className="text-sm text-text-secondary">{request.patient_email}</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold">{t(`adminIntakes.correctionStatus.${request.status}`)}</span></div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{request.message}</p>
          {request.admin_response && <p className="mt-3 text-sm leading-6"><span className="font-semibold">{t("adminIntakes.adminResponse")}: </span>{request.admin_response}</p>}
          {request.status === "OPEN" && <div className="mt-4 space-y-3">
            <textarea rows={3} maxLength={10000} placeholder={t("adminIntakes.responsePlaceholder")} value={responses[request.id] || ""} onChange={(event) => onResponseChange(request.id, event.target.value)} className="w-full rounded-xl border border-border bg-surface px-4 py-3" />
            <button type="button" disabled={busyId === `correction-${request.id}`} onClick={() => onResolve(request)} className="rounded-xl bg-primary px-5 py-3 font-semibold text-white disabled:opacity-60">{busyId === `correction-${request.id}` ? t("adminIntakes.working") : t("adminIntakes.resolveCorrection")}</button>
          </div>}
        </article>)}
      </div>}
    </section>
  );
}

export default CorrectionRequestsSection;
