function DashboardMetricCard({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <dt className="text-sm leading-6 text-text-secondary">{label}</dt>
      <dd className="mt-2 text-3xl font-bold tabular-nums" dir="ltr">
        {value}
      </dd>
    </div>
  );
}

export default DashboardMetricCard;
