import { TicketPriority, TicketStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { Errors } from '../../utils/errors';
import { buildMeta } from '../../utils/pagination';
import { nextTicketCode } from '../../utils/codeGen';
import type { CreateTicketDTO, UpdateTicketDTO, ListTicketsQuery } from './helpdesk.schema';

export const helpdeskService = {
  async list(employeeId: string, role: string, query: ListTicketsQuery) {
    const page  = query.page  ?? 1;
    const limit = query.limit ?? 20;
    const skip  = (page - 1) * limit;

    const where: {
      employeeId?: string;
      status?:     TicketStatus;
      category?:   string;
      priority?:   TicketPriority;
    } = {};

    if (role === 'EMPLOYEE') {
      where.employeeId = employeeId;
    }
    if (query.status)   where.status   = query.status   as TicketStatus;
    if (query.category) where.category = query.category;
    if (query.priority) where.priority = query.priority as TicketPriority;

    const [tickets, total] = await Promise.all([
      prisma.helpdeskTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: { select: { firstName: true, lastName: true, employeeCode: true } },
        },
      }),
      prisma.helpdeskTicket.count({ where }),
    ]);

    return { tickets, meta: buildMeta(page, limit, total) };
  },

  async getById(id: string, employeeId: string, role: string) {
    const ticket = await prisma.helpdeskTicket.findUnique({
      where: { id },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
      },
    });

    if (!ticket) throw Errors.NOT_FOUND('Ticket');
    if (role === 'EMPLOYEE' && ticket.employeeId !== employeeId) throw Errors.FORBIDDEN();

    return ticket;
  },

  async create(employeeId: string, dto: CreateTicketDTO) {
    const code = await nextTicketCode();

    return prisma.helpdeskTicket.create({
      data: {
        code,
        title:       dto.title,
        description: dto.description,
        category:    dto.category,
        priority:    dto.priority as TicketPriority,
        status:      TicketStatus.OPEN,
        employeeId,
      },
    });
  },

  async update(id: string, employeeId: string, role: string, dto: UpdateTicketDTO) {
    const ticket = await prisma.helpdeskTicket.findUnique({ where: { id } });

    if (!ticket) throw Errors.NOT_FOUND('Ticket');

    if (role === 'EMPLOYEE') {
      if (ticket.employeeId !== employeeId) throw Errors.FORBIDDEN();
      if (ticket.status !== TicketStatus.OPEN) {
        throw Errors.FORBIDDEN();
      }
    }

    const resolvedAt: Date | undefined =
      dto.status === 'RESOLVED' && ticket.resolvedAt === null
        ? new Date()
        : dto.resolvedAt;

    return prisma.helpdeskTicket.update({
      where: { id },
      data: {
        ...(dto.status     !== undefined && { status:     dto.status as TicketStatus }),
        ...(dto.assignedTo !== undefined && { assignedTo: dto.assignedTo }),
        ...(dto.priority   !== undefined && { priority:   dto.priority as TicketPriority }),
        ...(resolvedAt     !== undefined && { resolvedAt }),
      },
    });
  },
};
