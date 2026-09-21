export type Role = "employee" | "manager" | "hr" | "admin";

export const ROLE_LABEL: Record<Role, string> = {
  employee: "Employee",
  manager: "Manager",
  hr: "HR Manager",
  admin: "Super Admin",
};

export const ROLE_DESCRIPTION: Record<Role, string> = {
  employee: "Self-service portal access",
  manager: "Self-service plus team approvals",
  hr: "Full HR operations & people analytics",
  admin: "System configuration & governance",
};