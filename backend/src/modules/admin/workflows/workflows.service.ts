import { prisma } from '../../../config/database';
import { cacheDel } from '../../../config/redis';
import { Errors } from '../../../utils/errors';
import type { UpdateWorkflowDTO } from './workflows.schema';

const WORKFLOW_DEFAULTS: Record<string, unknown> = {
  'workflows.leaveApproval':   { type: 'direct_manager', autoApproveAfterDays: 3 },
  'workflows.expenseApproval': { maxAmountForDirectApproval: 5000, requireFinanceAbove: 10000 },
  'workflows.offboarding':     { noticePeriodDays: 30, requireExitInterview: true },
};

export const workflowsService = {
  async list() {
    const settings = await prisma.companySetting.findMany({
      where:   { category: 'workflows' },
      orderBy: { key: 'asc' },
    });

    // Seed defaults for any key not yet in DB, then overlay DB values
    const result: Record<string, unknown> = { ...WORKFLOW_DEFAULTS };
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  },

  async update(key: string, dto: UpdateWorkflowDTO, updatedBy: string) {
    const fullKey = key.startsWith('workflows.') ? key : `workflows.${key}`;

    if (!Object.prototype.hasOwnProperty.call(WORKFLOW_DEFAULTS, fullKey)) {
      throw Errors.NOT_FOUND('Workflow');
    }

    const result = await prisma.companySetting.upsert({
      where:  { key: fullKey },
      update: { value: dto.value, updatedBy },
      create: { key: fullKey, category: 'workflows', value: dto.value, updatedBy },
    });

    await cacheDel(`settings:${fullKey}`);
    return result;
  },
};
