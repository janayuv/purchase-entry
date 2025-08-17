export function DashboardPage() {
  // Placeholder KPIs; hook up queries to backend later
  const cards = [
    { title: "Purchase (This Month)", value: "₹0.00" },
    { title: "Purchase (This Year)", value: "₹0.00" },
    { title: "GST Summary", value: "CGST/SGST/IGST: 0" },
    { title: "Suppliers", value: "0" },
  ];
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.title} className="rounded border p-4">
            <div className="text-muted-foreground text-sm">{c.title}</div>
            <div className="mt-2 text-2xl font-semibold">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
