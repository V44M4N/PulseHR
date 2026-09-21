import bcrypt from 'bcryptjs';
import { EmployeeStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError, Errors } from '../../utils/errors';
import { buildMeta } from '../../utils/pagination';
import { nextEmployeeCode } from '../../utils/codeGen';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  ListEmployeesQuery,
} from './employees.schema';

// ─── Shared selects ───────────────────────────────────────────────────────────

const listSelect = {
  id: true,
  employeeCode: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  designation: true,
  employmentType: true,
  status: true,
  avatarUrl: true,
  dateOfJoining: true,
  createdAt: true,
  department: {
    select: { id: true, name: true },
  },
  location: {
    select: { id: true, name: true, city: true, country: true },
  },
} satisfies Prisma.EmployeeSelect;

const fullSelect = {
  id: true,
  employeeCode: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  designation: true,
  employmentType: true,
  status: true,
  avatarUrl: true,
  dateOfJoining: true,
  dateOfBirth: true,
  gender: true,
  createdAt: true,
  updatedAt: true,
  department: {
    select: { id: true, name: true },
  },
  location: {
    select: { id: true, name: true, city: true, country: true, timezone: true },
  },
  manager: {
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      designation: true,
      avatarUrl: true,
    },
  },
  bankDetails: {
    select: {
      id: true,
      bankName: true,
      accountNumber: true,
      ifscCode: true,
      accountType: true,
    },
  },
  taxInfo: {
    select: {
      id: true,
      panNumber: true,
      aadhaarLast4: true,
      taxRegime: true,
      pfNumber: true,
      esiNumber: true,
    },
  },
  emergencyContacts: {
    select: {
      id: true,
      name: true,
      relationship: true,
      phone: true,
      email: true,
    },
  },
} satisfies Prisma.EmployeeSelect;

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * list — paginated employee roster with optional filters.
 */
export async function list(
  query: ListEmployeesQuery,
  page: number,
  limit: number,
  skip: number,
) {
  const where: Prisma.EmployeeWhereInput = {};

  if (query.search) {
    const term = query.search.trim();
    where.OR = [
      { firstName: { contains: term, mode: 'insensitive' } },
      { lastName: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { employeeCode: { contains: term, mode: 'insensitive' } },
    ];
  }

  if (query.departmentId) {
    where.departmentId = query.departmentId;
  }

  if (query.status) {
    where.status = query.status as EmployeeStatus;
  }

  if (query.locationId) {
    where.locationId = query.locationId;
  }

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      select: listSelect,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.employee.count({ where }),
  ]);

  return { employees, meta: buildMeta(page, limit, total) };
}

/**
 * getById — full employee record; throws 404 if not found.
 */
export async function getById(id: string) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    select: fullSelect,
  });

  if (!employee) {
    throw Errors.NOT_FOUND('Employee');
  }

  return employee;
}

/**
 * create — generates code, creates Employee + linked User in a transaction.
 */
export async function create(
  dto: CreateEmployeeDto,
  createdByUserId: string,
): Promise<ReturnType<typeof getById>> {
  // Check for email uniqueness up front for a clear conflict error
  const existing = await prisma.employee.findUnique({
    where: { email: dto.email },
    select: { id: true },
  });

  if (existing) {
    throw Errors.CONFLICT(`An employee with the email '${dto.email}' already exists`);
  }

  // Verify department exists
  const department = await prisma.department.findUnique({
    where: { id: dto.departmentId },
    select: { id: true },
  });

  if (!department) {
    throw Errors.NOT_FOUND('Department');
  }

  // Verify location if provided
  if (dto.locationId) {
    const location = await prisma.location.findUnique({
      where: { id: dto.locationId },
      select: { id: true },
    });
    if (!location) {
      throw Errors.NOT_FOUND('Location');
    }
  }

  // Verify manager if provided
  if (dto.managerId) {
    const manager = await prisma.employee.findUnique({
      where: { id: dto.managerId },
      select: { id: true },
    });
    if (!manager) {
      throw Errors.NOT_FOUND('Manager employee');
    }
  }

  const employeeCode = await nextEmployeeCode();
  const passwordHash = await bcrypt.hash(employeeCode, 12);

  const employee = await prisma.$transaction(async (tx) => {
    // Create the User account
    const user = await tx.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: 'EMPLOYEE',
      },
    });

    // Create the Employee record linked to the user
    return tx.employee.create({
      data: {
        employeeCode,
        userId: user.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone ?? null,
        designation: dto.designation,
        departmentId: dto.departmentId,
        locationId: dto.locationId ?? null,
        dateOfJoining: new Date(dto.dateOfJoining),
        employmentType: dto.employmentType ?? 'Full-time',
        managerId: dto.managerId ?? null,
        status: 'ACTIVE',
      },
      select: fullSelect,
    });
  });

  // Suppress unused variable lint; createdByUserId is kept for audit trail hooks
  void createdByUserId;

  return employee;
}

/**
 * update — partial update of employee fields.
 */
export async function update(id: string, dto: UpdateEmployeeDto) {
  // Ensure the employee exists
  const existing = await prisma.employee.findUnique({
    where: { id },
    select: { id: true, email: true },
  });

  if (!existing) {
    throw Errors.NOT_FOUND('Employee');
  }

  // Email uniqueness check if email is being changed
  if (dto.email && dto.email !== existing.email) {
    const conflict = await prisma.employee.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (conflict) {
      throw Errors.CONFLICT(`An employee with the email '${dto.email}' already exists`);
    }
  }

  // Verify department if provided
  if (dto.departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: dto.departmentId },
      select: { id: true },
    });
    if (!dept) {
      throw Errors.NOT_FOUND('Department');
    }
  }

  // Verify location if provided (null clears it; undefined means no change)
  if (dto.locationId !== undefined && dto.locationId !== null) {
    const loc = await prisma.location.findUnique({
      where: { id: dto.locationId },
      select: { id: true },
    });
    if (!loc) {
      throw Errors.NOT_FOUND('Location');
    }
  }

  // Verify manager if provided (null clears it)
  if (dto.managerId !== undefined && dto.managerId !== null) {
    if (dto.managerId === id) {
      throw new AppError('VALIDATION_ERROR', 'An employee cannot be their own manager', 400);
    }
    const mgr = await prisma.employee.findUnique({
      where: { id: dto.managerId },
      select: { id: true },
    });
    if (!mgr) {
      throw Errors.NOT_FOUND('Manager employee');
    }
  }

  const data: Prisma.EmployeeUpdateInput = {};

  if (dto.firstName !== undefined)      data.firstName      = dto.firstName;
  if (dto.lastName !== undefined)       data.lastName       = dto.lastName;
  if (dto.phone !== undefined)          data.phone          = dto.phone;
  if (dto.designation !== undefined)    data.designation    = dto.designation;
  if (dto.employmentType !== undefined) data.employmentType = dto.employmentType;
  if (dto.dateOfJoining !== undefined)  data.dateOfJoining  = new Date(dto.dateOfJoining);
  if (dto.status !== undefined)         data.status         = dto.status as EmployeeStatus;

  if (dto.email !== undefined) {
    data.email = dto.email;
    // Keep the linked User email in sync
    data.user = { update: { email: dto.email } };
  }

  if (dto.departmentId !== undefined) {
    data.department = { connect: { id: dto.departmentId } };
  }

  if (dto.locationId === null) {
    data.location = { disconnect: true };
  } else if (dto.locationId !== undefined) {
    data.location = { connect: { id: dto.locationId } };
  }

  if (dto.managerId === null) {
    data.manager = { disconnect: true };
  } else if (dto.managerId !== undefined) {
    data.manager = { connect: { id: dto.managerId } };
  }

  return prisma.employee.update({
    where: { id },
    data,
    select: fullSelect,
  });
}

/**
 * updateStatus — change only the EmployeeStatus field.
 */
export async function updateStatus(id: string, status: EmployeeStatus) {
  const existing = await prisma.employee.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw Errors.NOT_FOUND('Employee');
  }

  return prisma.employee.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      status: true,
      updatedAt: true,
    },
  });
}

/**
 * getProfile — self-service profile view for the authenticated employee.
 */
export async function getProfile(employeeId: string) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      ...fullSelect,
      // Include leave balances as a lightweight summary for the profile
      leaveBalances: {
        select: {
          id: true,
          year: true,
          total: true,
          used: true,
          leaveType: { select: { id: true, name: true, color: true } },
        },
        where: { year: new Date().getFullYear() },
      },
    },
  });

  if (!employee) {
    throw Errors.NOT_FOUND('Employee profile');
  }

  return employee;
}
