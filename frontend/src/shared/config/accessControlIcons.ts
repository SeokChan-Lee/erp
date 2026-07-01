import {
  BarChart3,
  Building2,
  CheckCheck,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  LockKeyhole,
  Package,
  PencilLine,
  Plus,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Truck,
  UserCog,
  UserRound,
  Users,
  Warehouse
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { PermissionGroup, RoleCode } from "./accessControlMeta";

export const roleIcons: Record<RoleCode, LucideIcon> = {
  SUPER_ADMIN: ShieldCheck,
  ADMIN: Settings,
  HR_MANAGER: Users,
  SALES_MANAGER: ReceiptText,
  PURCHASE_MANAGER: ShoppingCart,
  INVENTORY_MANAGER: Warehouse,
  APPROVER: FileCheck2,
  EMPLOYEE: UserRound,
  VIEWER: Eye
};

export const permissionGroupIcons: Record<PermissionGroup, LucideIcon> = {
  dashboard: BarChart3,
  user: UserCog,
  role: ShieldCheck,
  employee: Users,
  attendance: Clock3,
  customer: Building2,
  supplier: Truck,
  item: Package,
  inventory: Warehouse,
  purchase: ShoppingCart,
  sales: ReceiptText,
  approval: FileCheck2,
  statistics: BarChart3
};

export const getPermissionActionIcon = (permission: string): LucideIcon => {
  if (permission.includes("READ") || permission.includes("VIEW")) return Eye;
  if (permission.includes("CREATE")) return Plus;
  if (permission.includes("SETTINGS")) return Settings;
  if (permission.includes("UPDATE") || permission.includes("ADJUST") || permission.includes("MOVE")) return PencilLine;
  if (permission.includes("DELETE")) return Trash2;
  if (permission.includes("APPROVE") || permission.includes("PROCESS")) return CheckCheck;
  if (permission.includes("CHECK_IN") || permission.includes("CHECK_OUT")) return CheckCircle2;
  return LockKeyhole;
};
