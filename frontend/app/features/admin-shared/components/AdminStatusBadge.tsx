import type { AdminStatusOption } from "../lib/admin-resource.types";

export function AdminStatusBadge({
  status,
}: {
  readonly status: AdminStatusOption;
}) {
  return (
    <span className="adm-status-badge" data-tone={status.tone}>
      {status.label}
    </span>
  );
}
