import { CircleCheck, Shield } from "lucide-react";
export default function UserBadge({
  role,
  size,
}: {
  role?: "admin" | "trusted";
  size?: number;
}) {
  return role === "admin" ? (
    <div title="Admin">
      <Shield size={size} />
    </div>
  ) : role === "trusted" ? (
    <div title="Geverifieerd">
      <CircleCheck size={size} />
    </div>
  ) : null;
}
