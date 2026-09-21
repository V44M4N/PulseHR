import { prisma } from '../../../config/database';
import { AppError, Errors } from '../../../utils/errors';
import type {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreateLocationDto,
  UpdateLocationDto,
} from './org.schema';

export const orgService = {
  // ─── Departments ────────────────────────────────────────────────────────────

  async listDepartments() {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count:    { select: { employees: { where: { status: 'ACTIVE' } } } },
        parent:    { select: { id: true, name: true } },
        children:  { select: { id: true, name: true }, orderBy: { name: 'asc' } },
      },
    });

    const headIds = departments.map(d => d.headId).filter(Boolean) as string[];
    const headMap = new Map<string, string>();
    if (headIds.length > 0) {
      const heads = await prisma.employee.findMany({
        where:  { id: { in: headIds } },
        select: { id: true, firstName: true, lastName: true },
      });
      for (const h of heads) headMap.set(h.id, `${h.firstName} ${h.lastName}`);
    }

    return departments.map((d) => ({
      id:            d.id,
      name:          d.name,
      parent:        d.parent ?? null,
      children:      d.children,
      head:          d.headId ? (headMap.get(d.headId) ?? null) : null,
      headId:        d.headId ?? null,
      employeeCount: d._count.employees,
    }));
  },

  async createDepartment(dto: CreateDepartmentDto) {
    const existing = await prisma.department.findFirst({ where: { name: dto.name } });
    if (existing) {
      throw new AppError('CONFLICT', `Department "${dto.name}" already exists`, 409);
    }
    return prisma.department.create({
      data: {
        name: dto.name,
        ...(dto.headId && { headId: dto.headId }),
        ...(dto.parentId && { parentId: dto.parentId }),
      },
    });
  },

  async updateDepartment(id: string, dto: UpdateDepartmentDto) {
    const dept = await prisma.department.findUnique({ where: { id } });
    if (!dept) throw Errors.NOT_FOUND('Department');

    if (dto.name && dto.name !== dept.name) {
      const duplicate = await prisma.department.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (duplicate) {
        throw new AppError('CONFLICT', `Department "${dto.name}" already exists`, 409);
      }
    }

    return prisma.department.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.headId !== undefined && { headId: dto.headId ?? null }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId ?? null }),
      },
    });
  },

  async deleteDepartment(id: string) {
    const dept = await prisma.department.findUnique({ where: { id } });
    if (!dept) throw Errors.NOT_FOUND('Department');

    const activeCount = await prisma.employee.count({
      where: { departmentId: id, status: 'ACTIVE' },
    });
    if (activeCount > 0) {
      throw new AppError(
        'CONFLICT',
        `Cannot delete department with ${activeCount} active employee(s)`,
        409,
      );
    }

    const childCount = await prisma.department.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new AppError(
        'CONFLICT',
        `Cannot delete department that has ${childCount} sub-department(s)`,
        409,
      );
    }

    return prisma.department.delete({ where: { id } });
  },

  // ─── Locations ───────────────────────────────────────────────────────────────

  async listLocations() {
    const locations = await prisma.location.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { employees: { where: { status: 'ACTIVE' } } },
        },
      },
    });

    return locations.map((l) => ({
      id: l.id,
      name: l.name,
      city: l.city,
      country: l.country ?? null,
      timezone: l.timezone ?? null,
      employeeCount: l._count.employees,
    }));
  },

  async createLocation(dto: CreateLocationDto) {
    return prisma.location.create({
      data: {
        name: dto.name,
        city: dto.city,
        ...(dto.country && { country: dto.country }),
        ...(dto.timezone && { timezone: dto.timezone }),
      },
    });
  },

  async updateLocation(id: string, dto: UpdateLocationDto) {
    const loc = await prisma.location.findUnique({ where: { id } });
    if (!loc) throw Errors.NOT_FOUND('Location');

    return prisma.location.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.city && { city: dto.city }),
        ...(dto.country !== undefined && { country: dto.country ?? null }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone ?? null }),
      },
    });
  },

  async deleteLocation(id: string) {
    const loc = await prisma.location.findUnique({ where: { id } });
    if (!loc) throw Errors.NOT_FOUND('Location');

    const activeCount = await prisma.employee.count({
      where: { locationId: id, status: 'ACTIVE' },
    });
    if (activeCount > 0) {
      throw new AppError(
        'CONFLICT',
        `Cannot delete location with ${activeCount} active employee(s)`,
        409,
      );
    }

    return prisma.location.delete({ where: { id } });
  },
};
