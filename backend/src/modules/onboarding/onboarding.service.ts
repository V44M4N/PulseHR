import { addDays } from 'date-fns';
import { prisma } from '../../config/database';
import { Errors } from '../../utils/errors';
import { buildMeta } from '../../utils/pagination';
import type { TriggerOnboardingDTO, AddTaskDTO, ListOnboardingQuery } from './onboarding.schema';

const DEFAULT_TASKS = [
  { title: 'Send welcome email',                  owner: 'HR',      sortOrder: 1 },
  { title: 'Set up laptop and accounts',          owner: 'IT',      sortOrder: 2 },
  { title: 'Complete payroll setup',              owner: 'Finance', sortOrder: 3 },
  { title: 'Complete ID and document submission', owner: 'HR',      sortOrder: 4 },
  { title: 'Schedule 1-on-1 with manager',        owner: 'Manager', sortOrder: 5 },
  { title: 'Access badge and facilities',         owner: 'IT',      sortOrder: 6 },
  { title: 'Complete policy acknowledgement',     owner: 'HR',      sortOrder: 7 },
];

export const onboardingService = {
  async list(query: ListOnboardingQuery) {
    const page  = query.page  ?? 1;
    const limit = query.limit ?? 20;
    const skip  = (page - 1) * limit;

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where:   { onboardingTasks: { some: {} } },
        skip,
        take:    limit,
        include: {
          onboardingTasks: {
            select: { id: true, isCompleted: true },
          },
        },
      }),
      prisma.employee.count({
        where: { onboardingTasks: { some: {} } },
      }),
    ]);

    const result = employees.map(emp => {
      const tasks   = emp.onboardingTasks;
      const done    = tasks.filter(t => t.isCompleted).length;
      const percent = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
      return {
        id:           emp.id,
        name:         `${emp.firstName} ${emp.lastName}`,
        employeeCode: emp.employeeCode,
        progress:     { isCompleted: done, total: tasks.length, percent },
      };
    });

    return { data: result, meta: buildMeta(page, limit, total) };
  },

  async getEmployeeTasks(employeeId: string) {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw Errors.NOT_FOUND('Employee');

    const tasks     = await prisma.onboardingTask.findMany({
      where:   { employeeId },
      orderBy: { sortOrder: 'asc' },
    });
    const isCompleted = tasks.filter(t => t.isCompleted).length;
    const total     = tasks.length;
    const percent   = total > 0 ? Math.round((isCompleted / total) * 100) : 0;

    return {
      tasks,
      progress: { isCompleted, total, percent },
    };
  },

  async triggerOnboarding(dto: TriggerOnboardingDTO) {
    const employee = await prisma.employee.findUnique({ where: { id: dto.employeeId } });
    if (!employee) throw Errors.NOT_FOUND('Employee');

    const existing = await prisma.onboardingTask.count({ where: { employeeId: dto.employeeId } });
    if (existing > 0) {
      throw Errors.CONFLICT('Onboarding has already been triggered for this employee');
    }

    const startDate = new Date(dto.startDate);
    const dueDate   = addDays(startDate, 7);

    await prisma.onboardingTask.createMany({
      data: DEFAULT_TASKS.map(t => ({
        employeeId: dto.employeeId,
        title:      t.title,
        owner:      t.owner,
        sortOrder:  t.sortOrder,
        dueDate,
        isCompleted:  false,
      })),
    });

    return prisma.onboardingTask.findMany({
      where:   { employeeId: dto.employeeId },
      orderBy: { sortOrder: 'asc' },
    });
  },

  async completeTask(taskId: string, employeeId: string, role: string) {
    const task = await prisma.onboardingTask.findUnique({ where: { id: taskId } });
    if (!task) throw Errors.NOT_FOUND('Task');

    if (role === 'EMPLOYEE' && task.employeeId !== employeeId) {
      throw Errors.FORBIDDEN();
    }

    return prisma.onboardingTask.update({
      where: { id: taskId },
      data:  { isCompleted: true, completedAt: new Date() },
    });
  },

  async addTask(employeeId: string, dto: AddTaskDTO) {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw Errors.NOT_FOUND('Employee');

    return prisma.onboardingTask.create({
      data: {
        employeeId,
        title:       dto.title,
        description: dto.description,
        owner:       dto.owner,
        dueDate:     dto.dueDate ? new Date(dto.dueDate) : undefined,
        sortOrder:   dto.sortOrder ?? 99,
        isCompleted:   false,
      },
    });
  },
};
