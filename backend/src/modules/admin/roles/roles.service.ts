import { prisma } from '../../../config/database';
import { Errors } from '../../../utils/errors';
import type { UpdatePermissionsDTO } from './roles.schema';

const VALID_ROLES = ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'] as const;
type ValidRole = typeof VALID_ROLES[number];

const DEFAULT_PERMISSIONS: Record<ValidRole, Record<string, boolean>> = {
  EMPLOYEE: { employees: false, leave: true,  attendance: true,  payslips: true,  documents: true,  expenses: true,  helpdesk: true,  feed: true,  directory: true,  recruitment: false, onboarding: false, payroll: false, analytics: false, admin: false },
  MANAGER:  { employees: true,  leave: true,  attendance: true,  payslips: true,  documents: true,  expenses: true,  helpdesk: true,  feed: true,  directory: true,  recruitment: false, onboarding: true,  payroll: false, analytics: false, admin: false },
  HR:       { employees: true,  leave: true,  attendance: true,  payslips: true,  documents: true,  expenses: true,  helpdesk: true,  feed: true,  directory: true,  recruitment: true,  onboarding: true,  payroll: true,  analytics: true,  admin: false },
  ADMIN:    { employees: true,  leave: true,  attendance: true,  payslips: true,  documents: true,  expenses: true,  helpdesk: true,  feed: true,  directory: true,  recruitment: true,  onboarding: true,  payroll: true,  analytics: true,  admin: true  },
};

export const rolesService = {
  async getMatrix() {
    const settings = await prisma.companySetting.findMany({
      where: { category: 'permissions' },
    });

    const matrix: Record<string, Record<string, boolean>> = {};
    for (const role of VALID_ROLES) {
      const setting = settings.find(s => s.key === `permissions.${role}`);
      matrix[role] = setting ? (setting.value as Record<string, boolean>) : DEFAULT_PERMISSIONS[role];
    }

    return matrix;
  },

  async updatePermissions(role: string, dto: UpdatePermissionsDTO, updatedBy: string) {
    if (!VALID_ROLES.includes(role as ValidRole)) {
      throw Errors.NOT_FOUND('Role');
    }

    return prisma.companySetting.upsert({
      where:  { key: `permissions.${role}` },
      update: { value: dto.permissions, updatedBy },
      create: { key: `permissions.${role}`, category: 'permissions', value: dto.permissions, updatedBy },
    });
  },
};
