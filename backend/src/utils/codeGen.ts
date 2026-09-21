import { prisma } from '../config/database';

/**
 * Generates sequential human-readable codes like PH-2042, L-2401, EXP-1043.
 * Uses the DB count to derive the next number — not perfectly atomic under
 * high concurrency, but sufficient for HRMS volumes.
 */

export async function nextEmployeeCode(): Promise<string> {
  const count = await prisma.employee.count();
  return `PH-${2000 + count + 1}`;
}

export async function nextLeaveCode(): Promise<string> {
  const count = await prisma.leaveRequest.count();
  return `L-${2380 + count + 1}`;
}

export async function nextExpenseCode(): Promise<string> {
  const count = await prisma.expense.count();
  return `EXP-${1024 + count + 1}`;
}

export async function nextTicketCode(): Promise<string> {
  const count = await prisma.helpdeskTicket.count();
  return `HD-${860 + count + 1}`;
}

export async function nextCandidateCode(): Promise<string> {
  const count = await prisma.candidate.count();
  return `C-${470 + count + 1}`;
}

export async function nextJobCode(): Promise<string> {
  const count = await prisma.jobRequisition.count();
  return `JR-${100 + count + 1}`;
}

export async function nextPayslipCode(empCode: string, month: number, year: number): Promise<string> {
  return `PS-${empCode}-${year}${String(month).padStart(2, '0')}`;
}

export async function nextPayrollCode(month: number, year: number): Promise<string> {
  return `PR-${year}${String(month).padStart(2, '0')}`;
}
