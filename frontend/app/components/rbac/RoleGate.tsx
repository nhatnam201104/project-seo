import type { ReactNode } from "react";
import type { RoleCode } from "~/core/domain/enums";
import { useAuthStore } from "~/stores";

type RoleGateProps = {
  role: RoleCode;
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * Ẩn/hiện UI theo ROLE. CHỈ cải thiện UX — không phải cơ chế bảo mật.
 * Backend luôn kiểm tra quyền lại cho mọi request; route nhạy cảm còn được
 * chặn ở loader qua `requireRole`/`requireAdmin`.
 */
export function RoleGate({ role, children, fallback = null }: RoleGateProps) {
  const allowed = useAuthStore((s) => s.hasRole(role));
  return <>{allowed ? children : fallback}</>;
}
