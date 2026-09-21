import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { buildMeta } from '../../utils/pagination';
import type { DirectoryQuery } from './directory.schema';

interface OrgNode {
  id:          string;
  name:        string;
  designation: string;
  department:  string | null;
  avatarUrl:   string | null;
  children:    OrgNode[];
}

export const directoryService = {
  async list(query: DirectoryQuery) {
    const page  = query.page;
    const limit = query.limit;
    const skip  = (page - 1) * limit;

    const where: Prisma.EmployeeWhereInput = { status: 'ACTIVE' };

    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (query.locationId) {
      where.locationId = query.locationId;
    }

    if (query.search) {
      where.OR = [
        { firstName:   { contains: query.search, mode: 'insensitive' } },
        { lastName:    { contains: query.search, mode: 'insensitive' } },
        { designation: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take:      limit,
        orderBy:   { firstName: 'asc' },
        select: {
          id:           true,
          employeeCode: true,
          firstName:    true,
          lastName:     true,
          designation:  true,
          email:        true,
          phone:        true,
          avatarUrl:    true,
          department:   { select: { id: true, name: true } },
          location:     { select: { id: true, name: true, city: true } },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    return { employees, meta: buildMeta(page, limit, total) };
  },

  async getOrgChart(): Promise<OrgNode[]> {
    const employees = await prisma.employee.findMany({
      where:   { status: 'ACTIVE' },
      orderBy: { firstName: 'asc' },
      select: {
        id:          true,
        firstName:   true,
        lastName:    true,
        designation: true,
        managerId:   true,
        avatarUrl:   true,
        department:  { select: { name: true } },
      },
    });

    const nodeMap = new Map<string, OrgNode>();

    for (const emp of employees) {
      nodeMap.set(emp.id, {
        id:          emp.id,
        name:        `${emp.firstName} ${emp.lastName}`,
        designation: emp.designation,
        department:  emp.department?.name ?? null,
        avatarUrl:   emp.avatarUrl,
        children:    [],
      });
    }

    const roots: OrgNode[] = [];

    for (const emp of employees) {
      const node = nodeMap.get(emp.id)!;
      if (!emp.managerId) {
        roots.push(node);
      } else {
        const parent = nodeMap.get(emp.managerId);
        if (parent) {
          parent.children.push(node);
        } else {
          // managerId references an INACTIVE or missing employee — treat as root
          roots.push(node);
        }
      }
    }

    return roots;
  },
};
