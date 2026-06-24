export type RoleCode =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "HR_MANAGER"
  | "SALES_MANAGER"
  | "PURCHASE_MANAGER"
  | "INVENTORY_MANAGER"
  | "APPROVER"
  | "EMPLOYEE"
  | "VIEWER";

export type PermissionGroup =
  | "dashboard"
  | "user"
  | "role"
  | "employee"
  | "attendance"
  | "customer"
  | "supplier"
  | "item"
  | "inventory"
  | "purchase"
  | "sales"
  | "approval"
  | "statistics";

type RoleMeta = {
  label: string;
  description: string;
  scope: string;
};

type PermissionMeta = {
  label: string;
  description: string;
  group: PermissionGroup;
};

export const roleMeta: Record<RoleCode, RoleMeta> = {
  SUPER_ADMIN: {
    label: "최고 관리자",
    description: "시스템 전체 설정, 권한, 모든 업무 데이터를 관리합니다.",
    scope: "전체 시스템"
  },
  ADMIN: {
    label: "운영 관리자",
    description: "회사 운영 기준 데이터와 사용자, 직원 정보를 관리합니다.",
    scope: "회사 운영"
  },
  HR_MANAGER: {
    label: "인사 관리자",
    description: "직원 정보와 전체 근태 기록을 관리합니다.",
    scope: "인사/근태"
  },
  SALES_MANAGER: {
    label: "영업 관리자",
    description: "고객사와 판매 업무를 관리합니다.",
    scope: "판매"
  },
  PURCHASE_MANAGER: {
    label: "구매 관리자",
    description: "공급사와 구매 요청, 발주 업무를 관리합니다.",
    scope: "구매"
  },
  INVENTORY_MANAGER: {
    label: "재고 관리자",
    description: "품목, 창고, 입출고와 재고 조정을 관리합니다.",
    scope: "품목/재고"
  },
  APPROVER: {
    label: "승인 담당자",
    description: "승인 요청을 검토하고 승인 또는 반려합니다.",
    scope: "승인"
  },
  EMPLOYEE: {
    label: "일반 직원",
    description: "본인 출퇴근, 개인 정보, 본인 요청 내역을 확인합니다.",
    scope: "개인 업무"
  },
  VIEWER: {
    label: "조회 전용",
    description: "허용된 범위의 데이터를 읽기 전용으로 확인합니다.",
    scope: "조회"
  }
};

export const permissionGroupMeta: Record<PermissionGroup, { label: string; description: string }> = {
  dashboard: { label: "대시보드", description: "운영 현황과 요약 지표 조회" },
  user: { label: "사용자", description: "로그인 계정 관리" },
  role: { label: "역할/권한", description: "역할과 권한 설정" },
  employee: { label: "직원", description: "직원 마스터 관리" },
  attendance: { label: "근태", description: "출퇴근과 근태 기록 관리" },
  customer: { label: "고객사", description: "고객 거래처 관리" },
  supplier: { label: "공급사", description: "공급 거래처 관리" },
  item: { label: "품목", description: "품목 마스터 관리" },
  inventory: { label: "재고", description: "재고 이동과 조정" },
  purchase: { label: "구매", description: "구매 요청과 발주" },
  sales: { label: "판매", description: "판매 주문 관리" },
  approval: { label: "승인", description: "승인 요청 처리" },
  statistics: { label: "통계", description: "업무 통계 조회" }
};

export const permissionMeta: Record<string, PermissionMeta> = {
  DASHBOARD_VIEW: { label: "대시보드 조회", description: "운영 대시보드를 확인합니다.", group: "dashboard" },
  USER_READ: { label: "사용자 조회", description: "로그인 사용자 현황과 상세 정보를 봅니다.", group: "user" },
  USER_CREATE: { label: "사용자 생성", description: "새 로그인 사용자를 만듭니다.", group: "user" },
  USER_UPDATE: { label: "사용자 수정", description: "로그인 사용자 정보를 수정합니다.", group: "user" },
  USER_DELETE: { label: "사용자 삭제", description: "로그인 사용자를 삭제하거나 비활성화합니다.", group: "user" },
  ROLE_READ: { label: "역할 조회", description: "역할과 권한 구성을 확인합니다.", group: "role" },
  ROLE_UPDATE: { label: "역할 수정", description: "역할별 권한을 수정합니다.", group: "role" },
  EMPLOYEE_READ: { label: "직원 조회", description: "직원 정보를 조회합니다.", group: "employee" },
  EMPLOYEE_CREATE: { label: "직원 등록", description: "신규 직원을 등록합니다.", group: "employee" },
  EMPLOYEE_UPDATE: { label: "직원 수정", description: "직원 기본 정보를 수정합니다.", group: "employee" },
  EMPLOYEE_DELETE: { label: "직원 삭제", description: "직원 정보를 삭제하거나 퇴사 처리합니다.", group: "employee" },
  ATTENDANCE_CHECK_IN: { label: "출근 처리", description: "본인 출근 시간을 기록합니다.", group: "attendance" },
  ATTENDANCE_CHECK_OUT: { label: "퇴근 처리", description: "본인 퇴근 시간을 기록합니다.", group: "attendance" },
  ATTENDANCE_READ_SELF: { label: "본인 근태 조회", description: "본인 근태 기록을 확인합니다.", group: "attendance" },
  ATTENDANCE_READ_DEPARTMENT: { label: "부서 근태 조회", description: "담당 부서 근태 기록을 확인합니다.", group: "attendance" },
  ATTENDANCE_READ_ALL: { label: "전체 근태 조회", description: "회사 전체 근태 기록을 확인합니다.", group: "attendance" },
  ATTENDANCE_UPDATE: { label: "근태 수정", description: "근태 기록을 수정합니다.", group: "attendance" },
  ATTENDANCE_APPROVE: { label: "근태 승인", description: "근태 수정 요청을 승인 또는 반려합니다.", group: "attendance" },
  CUSTOMER_READ: { label: "고객사 조회", description: "고객사 정보를 조회합니다.", group: "customer" },
  CUSTOMER_CREATE: { label: "고객사 등록", description: "고객사를 등록합니다.", group: "customer" },
  CUSTOMER_UPDATE: { label: "고객사 수정", description: "고객사 정보를 수정합니다.", group: "customer" },
  CUSTOMER_DELETE: { label: "고객사 삭제", description: "고객사를 삭제하거나 비활성화합니다.", group: "customer" },
  SUPPLIER_READ: { label: "공급사 조회", description: "공급사 정보를 조회합니다.", group: "supplier" },
  SUPPLIER_CREATE: { label: "공급사 등록", description: "공급사를 등록합니다.", group: "supplier" },
  SUPPLIER_UPDATE: { label: "공급사 수정", description: "공급사 정보를 수정합니다.", group: "supplier" },
  SUPPLIER_DELETE: { label: "공급사 삭제", description: "공급사를 삭제하거나 비활성화합니다.", group: "supplier" },
  ITEM_READ: { label: "품목 조회", description: "품목 정보를 조회합니다.", group: "item" },
  ITEM_CREATE: { label: "품목 등록", description: "품목을 등록합니다.", group: "item" },
  ITEM_UPDATE: { label: "품목 수정", description: "품목 정보를 수정합니다.", group: "item" },
  ITEM_DELETE: { label: "품목 삭제", description: "품목을 삭제하거나 비활성화합니다.", group: "item" },
  INVENTORY_READ: { label: "재고 조회", description: "현재 재고와 재고 이력을 확인합니다.", group: "inventory" },
  INVENTORY_MOVE: { label: "재고 이동", description: "입고, 출고, 창고 이동을 처리합니다.", group: "inventory" },
  INVENTORY_ADJUST: { label: "재고 조정", description: "실사 차이 등 재고 수량을 조정합니다.", group: "inventory" },
  PURCHASE_READ: { label: "구매 조회", description: "구매 요청과 발주 정보를 조회합니다.", group: "purchase" },
  PURCHASE_CREATE: { label: "구매 생성", description: "구매 요청 또는 발주를 생성합니다.", group: "purchase" },
  PURCHASE_UPDATE: { label: "구매 수정", description: "구매 정보를 수정합니다.", group: "purchase" },
  PURCHASE_APPROVE: { label: "구매 승인", description: "구매 요청을 승인 또는 반려합니다.", group: "purchase" },
  SALES_READ: { label: "판매 조회", description: "판매 주문 정보를 조회합니다.", group: "sales" },
  SALES_CREATE: { label: "판매 생성", description: "판매 주문을 생성합니다.", group: "sales" },
  SALES_UPDATE: { label: "판매 수정", description: "판매 주문 정보를 수정합니다.", group: "sales" },
  APPROVAL_READ: { label: "승인 조회", description: "승인 요청과 처리 이력을 확인합니다.", group: "approval" },
  APPROVAL_PROCESS: { label: "승인 처리", description: "승인 요청을 승인 또는 반려합니다.", group: "approval" },
  STATISTICS_VIEW: { label: "통계 조회", description: "업무 통계를 확인합니다.", group: "statistics" }
};

export function getRoleMeta(role: string) {
  return roleMeta[role as RoleCode] ?? { label: role, description: "정의되지 않은 역할입니다.", scope: "기타" };
}

export function getPermissionMeta(permission: string) {
  return (
    permissionMeta[permission] ?? {
      label: permission,
      description: "정의되지 않은 권한입니다.",
      group: "dashboard" as PermissionGroup
    }
  );
}

export function groupPermissions(permissions: string[]) {
  return permissions.reduce<Array<{ group: PermissionGroup; permissions: string[] }>>((groups, permission) => {
    const group = getPermissionMeta(permission).group;
    const target = groups.find((item) => item.group === group);
    if (target) {
      target.permissions.push(permission);
    } else {
      groups.push({ group, permissions: [permission] });
    }
    return groups;
  }, []);
}
