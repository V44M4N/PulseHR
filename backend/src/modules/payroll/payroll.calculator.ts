export interface SalaryBreakdown {
  grossSalary: number;
  earnings: { basic: number; hra: number; special: number };
  deductions: { pf: number; tds: number; professional_tax: number };
  netSalary: number;
}

export function computeSalary(monthlyGross: number, structure?: {
  basicPercent?: number; hraPercent?: number; pfPercent?: number;
  tdsPercent?: number; professionalTax?: number;
}): SalaryBreakdown {
  if (!Number.isFinite(monthlyGross) || monthlyGross <= 0) throw new Error('monthlyGross must be positive');
  const basic = Number((monthlyGross * ((structure?.basicPercent ?? 50) / 100)).toFixed(2));
  const hra = Number((monthlyGross * ((structure?.hraPercent ?? 20) / 100)).toFixed(2));
  const special = Number((monthlyGross - basic - hra).toFixed(2));
  const pf = Number((basic * ((structure?.pfPercent ?? 12) / 100)).toFixed(2));
  const tds = Number((monthlyGross * ((structure?.tdsPercent ?? 10) / 100)).toFixed(2));
  const professional_tax = structure?.professionalTax ?? 200;
  const netSalary = Number((monthlyGross - pf - tds - professional_tax).toFixed(2));
  return { grossSalary: monthlyGross, earnings: { basic, hra, special }, deductions: { pf, tds, professional_tax }, netSalary };
}
