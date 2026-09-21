import { subMonths, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { prisma } from '../../config/database';

// ─── Return types ─────────────────────────────────────────────────────────────

export interface HeadcountPoint {
  month: string;
  year:  number;
  value: number;
}

export interface AttritionByDept {
  dept:       string;
  active:     number;
  terminated: number;
  rate:       number;
}

export interface KpiSummary {
  totalEmployees: number;
  newHires30Days: number;
  openPositions:  number;
  pendingLeaves:  number;
  avgAttendance:  number;
  attritionRate:  number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/** Working days (Mon–Fri) between two dates, inclusive. */
function workingDaysBetween(from: Date, to: Date): number {
  let count   = 0;
  const cursor = new Date(from);
  while (cursor <= to) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const analyticsService = {

  /**
   * Last 6 months headcount trend (oldest first → current month last).
   *
   * For each month M we count employees whose dateOfJoining ≤ end-of-M AND
   * who were still employed at that time: status is still active/probation/notice,
   * OR they were eventually terminated but their updatedAt (proxy for exit date)
   * falls AFTER end-of-M.
   */
  async getHeadcountTrend(): Promise<HeadcountPoint[]> {
    const now    = new Date();
    const points: HeadcountPoint[] = [];

    for (let offset = 5; offset >= 0; offset--) {
      const target    = subMonths(now, offset);
      const periodEnd = endOfMonth(target);

      const value = await prisma.employee.count({
        where: {
          dateOfJoining: { lte: periodEnd },
          OR: [
            { status: { in: ['ACTIVE', 'PROBATION', 'NOTICE'] } },
            {
              // Terminated/inactive employees who left AFTER this month's end
              status:    { in: ['TERMINATED', 'INACTIVE'] },
              updatedAt: { gt: periodEnd },
            },
          ],
        },
      });

      points.push({
        month: MONTH_NAMES[target.getMonth()],
        year:  target.getFullYear(),
        value,
      });
    }

    return points;
  },

  /**
   * Attrition rate per department over the last 12 months.
   *
   * Rate = terminated-in-period / avg-headcount × 100
   * avg-headcount = (headcount-at-start + headcount-at-end) / 2
   */
  async getAttritionByDept(): Promise<AttritionByDept[]> {
    const now          = new Date();
    const periodEnd    = endOfMonth(now);
    const periodStart  = startOfMonth(subMonths(now, 11));

    const departments = await prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    const results = await Promise.all(
      departments.map(async dept => {
        const terminated = await prisma.employee.count({
          where: {
            departmentId: dept.id,
            status:       { in: ['TERMINATED', 'INACTIVE'] },
            updatedAt:    { gte: periodStart, lte: periodEnd },
          },
        });

        // Headcount at the start of the 12-month window
        const headcountStart = await prisma.employee.count({
          where: {
            departmentId: dept.id,
            dateOfJoining: { lte: periodStart },
            OR: [
              { status: { in: ['ACTIVE', 'PROBATION', 'NOTICE'] } },
              {
                status:    { in: ['TERMINATED', 'INACTIVE'] },
                updatedAt: { gt: periodStart },
              },
            ],
          },
        });

        // Current headcount (end of window)
        const active = await prisma.employee.count({
          where: {
            departmentId: dept.id,
            status:       { in: ['ACTIVE', 'PROBATION', 'NOTICE'] },
          },
        });

        const avgHeadcount = (headcountStart + active) / 2;
        const rate = avgHeadcount > 0
          ? Math.round((terminated / avgHeadcount) * 100 * 10) / 10
          : 0;

        return { dept: dept.name, active, terminated, rate };
      })
    );

    return results.sort((a, b) => b.rate - a.rate);
  },

  /**
   * Key performance indicators snapshot.
   */
  async getKpis(): Promise<KpiSummary> {
    const now            = new Date();
    const thirtyDaysAgo  = subDays(now, 30);
    const twelveMonthsAgo = startOfMonth(subMonths(now, 11));
    const monthStart     = startOfMonth(now);

    const [
      totalEmployees,
      newHires30Days,
      openPositions,
      pendingLeaves,
      terminated12m,
      attendanceRows,
    ] = await Promise.all([
      // 1. Active headcount
      prisma.employee.count({
        where: { status: { in: ['ACTIVE', 'PROBATION', 'NOTICE'] } },
      }),

      // 2. Joined in last 30 days
      prisma.employee.count({
        where: { dateOfJoining: { gte: thirtyDaysAgo } },
      }),

      // 3. Open job requisitions
      prisma.jobRequisition.count({ where: { status: 'OPEN' } }),

      // 4. Pending leave requests
      prisma.leaveRequest.count({ where: { status: 'PENDING' } }),

      // 5. Employees terminated in last 12 months
      prisma.employee.count({
        where: {
          status:    { in: ['TERMINATED', 'INACTIVE'] },
          updatedAt: { gte: twelveMonthsAgo },
        },
      }),

      // 6. Attendance breakdown for this month (PRESENT / ABSENT / HALF_DAY)
      prisma.attendanceRecord.groupBy({
        by:    ['status'],
        _count: { id: true },
        where: {
          date:   { gte: monthStart, lte: now },
          status: { in: ['PRESENT', 'ABSENT', 'HALF_DAY'] },
        },
      }),
    ]);

    // avgAttendance: present records / total possible slots this month × 100
    // Fallback: use attendance log totals when employee count is unavailable mid-month
    const presentCount = attendanceRows.find(r => r.status === 'PRESENT')?._count.id ?? 0;
    const halfDayCount = attendanceRows.find(r => r.status === 'HALF_DAY')?._count.id ?? 0;
    // Weight: PRESENT = 1, HALF_DAY = 0.5
    const weightedPresent = presentCount + halfDayCount * 0.5;

    const workingDays = workingDaysBetween(monthStart, now);
    const totalPossible = totalEmployees * workingDays;
    const avgAttendance = totalPossible > 0
      ? Math.round((weightedPresent / totalPossible) * 100 * 10) / 10
      : 0;

    // attritionRate: terminated-last-12m / avg-headcount × 100
    // avg-headcount = (headcount-12m-ago + current) / 2
    const headcount12mAgo = await prisma.employee.count({
      where: {
        dateOfJoining: { lte: twelveMonthsAgo },
        OR: [
          { status: { in: ['ACTIVE', 'PROBATION', 'NOTICE'] } },
          {
            status:    { in: ['TERMINATED', 'INACTIVE'] },
            updatedAt: { gt: twelveMonthsAgo },
          },
        ],
      },
    });

    const avgHeadcount = (headcount12mAgo + totalEmployees) / 2;
    const attritionRate = avgHeadcount > 0
      ? Math.round((terminated12m / avgHeadcount) * 100 * 10) / 10
      : 0;

    return {
      totalEmployees,
      newHires30Days,
      openPositions,
      pendingLeaves,
      avgAttendance,
      attritionRate,
    };
  },
};
