import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

// Legacy route — forwards to the order details page.
export const Route = createFileRoute("/checkout/success")({
  component: SuccessForward,
});

function SuccessForward() {
  const nav = useNavigate();
  const search = Route.useSearch() as { order?: string };
  useEffect(() => {
    if (search.order) nav({ to: "/order/$id", params: { id: search.order }, replace: true });
    else nav({ to: "/account", replace: true });
  }, [search.order, nav]);
  return (
    <div className="pt-40 pb-32 text-center">
      <p className="eyebrow text-muted-foreground">Taking you to your order…</p>
    </div>
  );
}
