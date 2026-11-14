import { BusinessDetails } from '../constants';

export interface MonthlyWorkingCalendarItem {
  monthIndex: number; // 1 to 60
  yearIndex: number;  // 1 to 5
  relativeMonth: number; // 1 to 12
  monthLabel: string; // e.g. "Sep '26"
  year: number;
  month: number;      // 1 to 12
  calendarDays: number;
  daysNotWorked: number;
  daysWorked: number;
}

/**
 * Computes the 60-Month Working Calendar based on the business details setup.
 * Accurately accounts for:
 * 1. Calendar days in each month
 * 2. Weekly scheduled working days (Mon-Fri default, or custom)
 * 3. Statutory public holidays falling on working days
 * 4. Annual operational shutdown period falling on working days
 */
export function calculate60MonthWorkingCalendar(details?: Partial<BusinessDetails>): MonthlyWorkingCalendarItem[] {
  const startYear = details?.startDateYear || 2026;
  const monthMap: Record<string, number> = {
    January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
    July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
  };

  const startMonthNum =
    details?.startDateFormatted
      ? parseInt(details.startDateFormatted.split('-')[1] || '9', 10)
      : (details?.startDateMonth ? monthMap[details.startDateMonth] || 9 : 9);

  const activeWorkingDays = details?.workingDays || {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  };

  const deductHolidays = details?.deductHolidays ?? true;
  const holidays = details?.holidaysDeducted || [];
  const annualShutdown = details?.annualShutdown || {
    enabled: false,
    fromDate: '12-20',
    toDate: '01-05',
    daysCount: 11,
  };

  const list: MonthlyWorkingCalendarItem[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  for (let m = 0; m < 60; m++) {
    const absMonth = m + 1;
    const curYear = startYear + Math.floor((startMonthNum - 1 + m) / 12);
    const curMonthIdx = (startMonthNum - 1 + m) % 12; // 0-11
    const curMonthNum = curMonthIdx + 1;
    const daysInMonth = new Date(curYear, curMonthNum, 0).getDate();

    let workingDaysCount = 0;
    let holidaysOnWorkingDays = 0;
    let shutdownOnWorkingDays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(curYear, curMonthIdx, d);
      const dayOfWeekStr = dayNames[dateObj.getDay()];
      const isScheduledWorkDay = !!activeWorkingDays[dayOfWeekStr];

      if (isScheduledWorkDay) {
        workingDaysCount++;

        // Check statutory holiday deduction
        if (deductHolidays) {
          const mm = String(curMonthNum).padStart(2, '0');
          const dd = String(d).padStart(2, '0');
          const dateStr = `${curYear}-${mm}-${dd}`;
          const isHoliday = holidays.some((h) => {
            if (h.from && h.from.length === 10) return h.from === dateStr;
            return false;
          });
          if (isHoliday) {
            holidaysOnWorkingDays++;
          }
        }

        // Check annual shutdown deduction
        if (annualShutdown.enabled && annualShutdown.fromDate && annualShutdown.toDate) {
          const [fromM, fromD] = annualShutdown.fromDate.split('-').map(Number);
          const [toM, toD] = annualShutdown.toDate.split('-').map(Number);

          let inShutdown = false;
          if (fromM <= toM) {
            // Same year window (e.g. 07-01 to 07-15)
            if (
              (curMonthNum > fromM || (curMonthNum === fromM && d >= fromD)) &&
              (curMonthNum < toM || (curMonthNum === toM && d <= toD))
            ) {
              inShutdown = true;
            }
          } else {
            // Year-crossing window (e.g. 12-20 to 01-05)
            if (
              (curMonthNum === fromM && d >= fromD) ||
              curMonthNum > fromM ||
              (curMonthNum === toM && d <= toD) ||
              curMonthNum < toM
            ) {
              inShutdown = true;
            }
          }
          if (inShutdown) {
            shutdownOnWorkingDays++;
          }
        }
      }
    }

    const totalDeductions = (daysInMonth - workingDaysCount) + holidaysOnWorkingDays + shutdownOnWorkingDays;
    const daysWorked = Math.max(0, daysInMonth - totalDeductions);
    const monthShort = monthNames[curMonthIdx];
    const monthLabel = `${monthShort} '${String(curYear).slice(2)}`;

    list.push({
      monthIndex: absMonth,
      yearIndex: Math.floor(m / 12) + 1,
      relativeMonth: (m % 12) + 1,
      monthLabel,
      year: curYear,
      month: curMonthNum,
      calendarDays: daysInMonth,
      daysNotWorked: totalDeductions,
      daysWorked,
    });
  }

  return list;
}
