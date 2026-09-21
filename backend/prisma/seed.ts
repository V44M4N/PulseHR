import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PulseHR database...');

  // ── Departments ──────────────────────────────────────────────────────────────
  const [engineering, hr, finance, product, sales] = await Promise.all([
    prisma.department.upsert({ where: { name: 'Engineering' },  update: {}, create: { name: 'Engineering' } }),
    prisma.department.upsert({ where: { name: 'Human Resources' }, update: {}, create: { name: 'Human Resources' } }),
    prisma.department.upsert({ where: { name: 'Finance' },      update: {}, create: { name: 'Finance' } }),
    prisma.department.upsert({ where: { name: 'Product' },      update: {}, create: { name: 'Product' } }),
    prisma.department.upsert({ where: { name: 'Sales' },        update: {}, create: { name: 'Sales' } }),
  ]);
  console.log('✅ Departments');

  // ── Locations ────────────────────────────────────────────────────────────────
  const [bangalore, mumbai, remote] = await Promise.all([
    prisma.location.upsert({ where: { name: 'Bangalore HQ' }, update: {}, create: { name: 'Bangalore HQ', city: 'Bangalore', country: 'India', timezone: 'Asia/Kolkata' } }),
    prisma.location.upsert({ where: { name: 'Mumbai Office' }, update: {}, create: { name: 'Mumbai Office', city: 'Mumbai',    country: 'India', timezone: 'Asia/Kolkata' } }),
    prisma.location.upsert({ where: { name: 'Remote' },        update: {}, create: { name: 'Remote',        city: 'Remote',    country: 'India', timezone: 'Asia/Kolkata' } }),
  ]);
  console.log('✅ Locations');

  // ── Leave Types ───────────────────────────────────────────────────────────────
  const leaveTypes = await Promise.all([
    prisma.leaveType.upsert({ where: { name: 'Annual Leave' },    update: {}, create: { name: 'Annual Leave',    defaultDays: 21, color: '#4CAF50', carryForward: true,  maxCarryDays: 10 } }),
    prisma.leaveType.upsert({ where: { name: 'Sick Leave' },      update: {}, create: { name: 'Sick Leave',      defaultDays: 12, color: '#F44336', carryForward: false } }),
    prisma.leaveType.upsert({ where: { name: 'Casual Leave' },    update: {}, create: { name: 'Casual Leave',    defaultDays: 8,  color: '#2196F3', carryForward: false } }),
    prisma.leaveType.upsert({ where: { name: 'Maternity Leave' }, update: {}, create: { name: 'Maternity Leave', defaultDays: 84, color: '#E91E63', carryForward: false } }),
    prisma.leaveType.upsert({ where: { name: 'Paternity Leave' }, update: {}, create: { name: 'Paternity Leave', defaultDays: 15, color: '#9C27B0', carryForward: false } }),
  ]);
  console.log('✅ Leave types');

  // ── Helper: create user + employee ───────────────────────────────────────────
  const HASH = await bcrypt.hash('Password@123', 12);

  async function upsertEmployee(opts: {
    code:         string;
    email:        string;
    firstName:    string;
    lastName:     string;
    designation:  string;
    role:         'EMPLOYEE' | 'MANAGER' | 'HR' | 'ADMIN';
    deptId:       string;
    locId:        string;
    managerId?:   string;
    joinDate:     Date;
  }) {
    const user = await prisma.user.upsert({
      where:  { email: opts.email },
      update: {},
      create: { email: opts.email, passwordHash: HASH, role: opts.role },
    });

    const employee = await prisma.employee.upsert({
      where:  { employeeCode: opts.code },
      update: {},
      create: {
        employeeCode:  opts.code,
        userId:        user.id,
        firstName:     opts.firstName,
        lastName:      opts.lastName,
        email:         opts.email,
        designation:   opts.designation,
        departmentId:  opts.deptId,
        locationId:    opts.locId,
        managerId:     opts.managerId,
        dateOfJoining: opts.joinDate,
        status:        'ACTIVE',
        employmentType: 'Full-time',
      },
    });

    await prisma.salaryStructure.upsert({
      where: { employeeId: employee.id },
      update: {},
      create: { employeeId: employee.id, monthlyGross: 150000 },
    });

    return { user, employee };
  }

  // ── Seed employees ────────────────────────────────────────────────────────────
  const { employee: admin } = await upsertEmployee({
    code: 'PH-0001', email: 'admin@pulsehr.dev',
    firstName: 'Arjun', lastName: 'Sharma',
    designation: 'Chief Executive Officer', role: 'ADMIN',
    deptId: engineering.id, locId: bangalore.id,
    joinDate: new Date('2020-01-15'),
  });

  const { employee: hrMgr } = await upsertEmployee({
    code: 'PH-0002', email: 'hr@pulsehr.dev',
    firstName: 'Priya', lastName: 'Mehta',
    designation: 'HR Manager', role: 'HR',
    deptId: hr.id, locId: bangalore.id,
    managerId: admin.id,
    joinDate: new Date('2020-03-01'),
  });

  const { employee: engMgr } = await upsertEmployee({
    code: 'PH-0003', email: 'manager@pulsehr.dev',
    firstName: 'Rahul', lastName: 'Kumar',
    designation: 'Engineering Manager', role: 'MANAGER',
    deptId: engineering.id, locId: bangalore.id,
    managerId: admin.id,
    joinDate: new Date('2020-06-15'),
  });

  const { employee: emp1 } = await upsertEmployee({
    code: 'PH-0004', email: 'emp1@pulsehr.dev',
    firstName: 'Sneha', lastName: 'Patel',
    designation: 'Senior Software Engineer', role: 'EMPLOYEE',
    deptId: engineering.id, locId: bangalore.id,
    managerId: engMgr.id,
    joinDate: new Date('2021-04-01'),
  });

  const { employee: emp2 } = await upsertEmployee({
    code: 'PH-0005', email: 'emp2@pulsehr.dev',
    firstName: 'Vikram', lastName: 'Singh',
    designation: 'Software Engineer', role: 'EMPLOYEE',
    deptId: engineering.id, locId: remote.id,
    managerId: engMgr.id,
    joinDate: new Date('2022-01-10'),
  });

  const { employee: emp3 } = await upsertEmployee({
    code: 'PH-0006', email: 'emp3@pulsehr.dev',
    firstName: 'Anita', lastName: 'Desai',
    designation: 'Product Manager', role: 'EMPLOYEE',
    deptId: product.id, locId: mumbai.id,
    managerId: admin.id,
    joinDate: new Date('2021-09-15'),
  });

  const { employee: emp4 } = await upsertEmployee({
    code: 'PH-0007', email: 'emp4@pulsehr.dev',
    firstName: 'Rohan', lastName: 'Gupta',
    designation: 'Finance Analyst', role: 'EMPLOYEE',
    deptId: finance.id, locId: bangalore.id,
    managerId: admin.id,
    joinDate: new Date('2022-07-01'),
  });

  const { employee: emp5 } = await upsertEmployee({
    code: 'PH-0008', email: 'emp5@pulsehr.dev',
    firstName: 'Kavitha', lastName: 'Nair',
    designation: 'Sales Executive', role: 'EMPLOYEE',
    deptId: sales.id, locId: mumbai.id,
    managerId: admin.id,
    joinDate: new Date('2023-03-20'),
  });

  console.log('✅ Employees (8)');

  // Update departments with heads
  await Promise.all([
    prisma.department.update({ where: { id: engineering.id }, data: { headId: engMgr.id } }),
    prisma.department.update({ where: { id: hr.id },          data: { headId: hrMgr.id } }),
  ]);

  // ── Leave balances ────────────────────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const allEmployees = [admin, hrMgr, engMgr, emp1, emp2, emp3, emp4, emp5];

  for (const emp of allEmployees) {
    for (const lt of leaveTypes) {
      await prisma.leaveBalance.upsert({
        where:  { employeeId_leaveTypeId_year: { employeeId: emp.id, leaveTypeId: lt.id, year: currentYear } },
        update: {},
        create: {
          employeeId:  emp.id,
          leaveTypeId: lt.id,
          year:        currentYear,
          total:       lt.defaultDays,
          used:        0,
        },
      });
    }
  }
  console.log('✅ Leave balances');

  // ── Sample leave requests ─────────────────────────────────────────────────────
  const annualLeave = leaveTypes[0];
  await prisma.leaveRequest.upsert({
    where:  { code: 'L-0001' },
    update: {},
    create: {
      code:         'L-0001',
      employeeId:   emp1.id,
      leaveTypeId:  annualLeave.id,
      fromDate:     new Date('2026-07-14'),
      toDate:       new Date('2026-07-18'),
      days:         5,
      reason:       'Family vacation',
      status:       'PENDING',
    },
  });

  await prisma.leaveRequest.upsert({
    where:  { code: 'L-0002' },
    update: {},
    create: {
      code:         'L-0002',
      employeeId:   emp2.id,
      leaveTypeId:  leaveTypes[1].id,
      fromDate:     new Date('2026-06-10'),
      toDate:       new Date('2026-06-11'),
      days:         2,
      reason:       'Not feeling well',
      status:       'APPROVED',
      approvedById: hrMgr.id,
      approvedAt:   new Date('2026-06-09'),
    },
  });
  console.log('✅ Leave requests');

  // ── Sample attendance ─────────────────────────────────────────────────────────
  const today = new Date();
  await prisma.attendanceRecord.upsert({
    where:  { employeeId_date: { employeeId: emp1.id, date: today } },
    update: {},
    create: {
      employeeId:  emp1.id,
      date:        today,
      clockIn:     new Date(today.setHours(9, 5, 0, 0)),
      clockOut:    new Date(today.setHours(18, 10, 0, 0)),
      hoursWorked: 9.08,
      status:      'PRESENT',
    },
  });
  console.log('✅ Sample attendance');

  // ── Announcements ─────────────────────────────────────────────────────────────
  await prisma.announcement.upsert({
    where:  { id: 'seed-ann-1' },
    update: {},
    create: {
      id:          'seed-ann-1',
      title:       'Welcome to PulseHR!',
      body:        'We are excited to launch PulseHR, your new all-in-one HR management platform. Explore leave management, attendance tracking, payslips, and more. Reach out to HR if you need any help getting started.',
      authorId:    hrMgr.id,
      authorName:  'Priya Mehta',
      isPublished: true,
      reactions:   12,
    },
  });

  await prisma.announcement.upsert({
    where:  { id: 'seed-ann-2' },
    update: {},
    create: {
      id:          'seed-ann-2',
      title:       'Q2 All-Hands Meeting — July 1st',
      body:        'Our quarterly all-hands meeting is scheduled for July 1st at 3:00 PM IST. Dial-in link will be shared via calendar invite. Please add your questions to the shared doc in advance.',
      authorId:    admin.id,
      authorName:  'Arjun Sharma',
      isPublished: true,
      reactions:   8,
    },
  });
  console.log('✅ Announcements');

  // ── Job requisitions ──────────────────────────────────────────────────────────
  await prisma.jobRequisition.upsert({
    where:  { code: 'JR-0001' },
    update: {},
    create: {
      code:         'JR-0001',
      title:        'Senior Full Stack Engineer',
      departmentId: engineering.id,
      location:     'Bangalore, India',
      type:         'Full-time',
      status:       'OPEN',
      openedById:   admin.id,
    },
  });

  await prisma.jobRequisition.upsert({
    where:  { code: 'JR-0002' },
    update: {},
    create: {
      code:         'JR-0002',
      title:        'HR Business Partner',
      departmentId: hr.id,
      location:     'Mumbai, India',
      type:         'Full-time',
      status:       'OPEN',
      openedById:   hrMgr.id,
    },
  });
  console.log('✅ Job requisitions');

  // ── Sample candidates ─────────────────────────────────────────────────────────
  await prisma.candidate.upsert({
    where:  { code: 'C-0001' },
    update: {},
    create: {
      code:  'C-0001',
      jobId: (await prisma.jobRequisition.findUnique({ where: { code: 'JR-0001' } }))!.id,
      name:          'Aakash Verma',
      email:         'aakash.verma@example.com',
      phone:         '+91 98765 43210',
      stage:         'INTERVIEW',
      source:        'LinkedIn',
      appliedDate:   new Date('2026-06-01'),
      rating:        4,
      notes:         'Strong React skills, good cultural fit.',
    },
  });
  console.log('✅ Candidates');

  // ── Company settings (defaults) ───────────────────────────────────────────────
  const defaultSettings = [
    { key: 'auth.mfa',           category: 'auth',          value: { enabled: false, requiredForRoles: ['ADMIN'] } },
    { key: 'auth.sso',           category: 'auth',          value: { enabled: false, provider: 'google', domain: '' } },
    { key: 'auth.ipAllowlist',   category: 'auth',          value: { enabled: false, ips: [] } },
    { key: 'auth.session',       category: 'auth',          value: { maxSessions: 3, idleTimeoutMinutes: 60 } },
    { key: 'locale.timezone',    category: 'locale',        value: 'Asia/Kolkata' },
    { key: 'locale.currency',    category: 'locale',        value: 'INR' },
    { key: 'locale.dateFormat',  category: 'locale',        value: 'DD/MM/YYYY' },
    { key: 'locale.fiscalYear',  category: 'locale',        value: { startMonth: 4 } },
    { key: 'privacy.retention',  category: 'privacy',       value: { employeeDataDays: 2555, auditLogDays: 365 } },
    { key: 'notifications.leaveApproval', category: 'notifications', value: { enabled: true, emailTemplate: 'Your leave request has been {{status}}.' } },
    { key: 'workflows.leaveApproval',     category: 'workflows',     value: { type: 'direct_manager', autoApproveAfterDays: 3 } },
    { key: 'workflows.expenseApproval',   category: 'workflows',     value: { maxAmountForDirectApproval: 5000, requireFinanceAbove: 10000 } },
    { key: 'workflows.offboarding',       category: 'workflows',     value: { noticePeriodDays: 30, requireExitInterview: true } },
  ];

  for (const s of defaultSettings) {
    await prisma.companySetting.upsert({
      where:  { key: s.key },
      update: {},
      create: { key: s.key, category: s.category, value: s.value, updatedBy: 'seed' },
    });
  }
  console.log('✅ Company settings');

  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Demo accounts (all passwords: Password@123):');
  console.log('   admin@pulsehr.dev    — ADMIN');
  console.log('   hr@pulsehr.dev       — HR');
  console.log('   manager@pulsehr.dev  — MANAGER');
  console.log('   emp1@pulsehr.dev     — EMPLOYEE');
}

main()
  .catch(err => { console.error('❌ Seed failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
