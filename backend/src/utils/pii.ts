/** Keep sensitive identifiers out of normal API responses. */
export function maskIdentifier(value: string | null | undefined, visible = 4): string | null {
  if (!value) return null;
  if (value.length <= visible) return '*'.repeat(value.length);
  return `${'*'.repeat(Math.max(0, value.length - visible))}${value.slice(-visible)}`;
}

export function maskEmployeePii<T extends { bankDetails?: any; taxInfo?: any }>(employee: T): T {
  if (employee.bankDetails) employee.bankDetails = { ...employee.bankDetails, accountNumber: maskIdentifier(employee.bankDetails.accountNumber) };
  if (employee.taxInfo) employee.taxInfo = { ...employee.taxInfo, panNumber: maskIdentifier(employee.taxInfo.panNumber, 3) };
  return employee;
}
