import { describe, expect, it } from 'vitest';
import { computeSalary } from '../src/modules/payroll/payroll.calculator';

describe('payroll calculation', () => {
  it('calculates regular gross, PF, TDS and net salary from the stored structure', () => {
    const salary = computeSalary(100000);
    expect(salary.earnings).toEqual({ basic: 50000, hra: 20000, special: 30000 });
    expect(salary.deductions).toEqual({ pf: 6000, tds: 10000, professional_tax: 200 });
    expect(salary.netSalary).toBe(83800);
  });

  it('honours custom percentages and professional tax', () => {
    const salary = computeSalary(80000, { basicPercent: 60, hraPercent: 15, pfPercent: 12, tdsPercent: 5, professionalTax: 150 });
    expect(salary.earnings).toEqual({ basic: 48000, hra: 12000, special: 20000 });
    expect(salary.deductions).toEqual({ pf: 5760, tds: 4000, professional_tax: 150 });
    expect(salary.netSalary).toBe(70090);
  });

  it('rejects missing or invalid salary inputs', () => {
    expect(() => computeSalary(0)).toThrow('monthlyGross must be positive');
    expect(() => computeSalary(Number.NaN)).toThrow('monthlyGross must be positive');
  });
});
