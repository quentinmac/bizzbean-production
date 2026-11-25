import * as XLSX from 'xlsx';
import {
  EmploymentAllocation,
  EmploymentCategory,
  EmploymentItem,
  EmploymentType,
} from '../constants';

export interface ParsedHrEmployeeRow {
  rowNumber: number;
  title: string;
  categoryName: string;
  matchedCategoryId: string;
  isNewCategory: boolean;
  department: string;
  allocation: EmploymentAllocation;
  numEmployees: number;
  baseRateMonthly: number;
  employmentType: EmploymentType;
  startMonth: number;
  seasonalStartMonth?: number;
  seasonalEndMonth?: number;
  onCostPct: number;
}

export interface ParsedHrImportResult {
  fileName: string;
  sheetName: string;
  rows: ParsedHrEmployeeRow[];
  newCategoriesToCreate: EmploymentCategory[];
  warnings: string[];
  errors: string[];
  summary: {
    sourceRowCount: number;
    totalHeadcount: number;
    totalBaseMonthly: number;
    totalWithOnCostsMonthly: number;
    cosMonthly: number;
    opexMonthly: number;
  };
}

export interface HrTemplateDownloadOptions {
  entityName: string;
  categories: EmploymentCategory[];
  departments: string[];
  existingEmployees?: EmploymentItem[];
  includeExistingRoster?: boolean;
}

const slugifyFilePart = (input: string): string =>
  (input || 'entity')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'entity';

/**
 * Generates and downloads a 2-sheet Excel (.xlsx) HR Payroll Upload Template
 * tailored to the active branch/company's Category Bands and Departments.
 */
export function downloadHrEmploymentTemplate(options: HrTemplateDownloadOptions): void {
  const {
    entityName,
    categories,
    departments,
    existingEmployees = [],
    includeExistingRoster = false,
  } = options;

  const safeCategories = categories.length > 0 ? categories : [
    { id: 'cat-1', name: 'Executive / Leadership', onCostPct: 20 },
    { id: 'cat-2', name: 'Senior Management', onCostPct: 18 },
    { id: 'cat-3', name: 'Middle Management / Professional', onCostPct: 15 },
    { id: 'cat-4', name: 'Operations / Direct Plant', onCostPct: 12 },
    { id: 'cat-5', name: 'Administrative / Support', onCostPct: 10 },
  ];

  const safeDepartments = departments.length > 0
    ? departments
    : ['administration', 'operations', 'commercial & sales', 'product & engineering'];

  const categoryMap = new Map<string, EmploymentCategory>();
  safeCategories.forEach((c) => categoryMap.set(c.id, c));

  // Sheet 1: Employee Import
  const headers = [
    'Role / Employee Reference',
    'Category Band',
    'Department',
    'Allocation',
    'Headcount (FTE)',
    'Monthly Base Cost (Per FTE)',
    'Employment Schedule',
    'Start Month (1-12)',
    'Seasonal Start Month (1-12)',
    'Seasonal End Month (1-12)',
  ];

  const dataRows: (string | number)[][] = [headers];

  if (includeExistingRoster && existingEmployees.length > 0) {
    existingEmployees.forEach((emp) => {
      const cat = categoryMap.get(emp.categoryId) || safeCategories[0];
      dataRows.push([
        emp.title,
        cat?.name || 'Administrative / Support',
        emp.department || safeDepartments[0],
        emp.allocation === 'cost_of_sales' ? 'Cost of Sales' : 'Operating Expenses',
        emp.numEmployees || 1,
        emp.baseRateMonthly || 0,
        emp.employmentType === 'seasonal' ? 'Seasonal' : 'Permanent',
        emp.startMonth || 1,
        emp.employmentType === 'seasonal' ? (emp.seasonalStartMonth ?? 6) : '',
        emp.employmentType === 'seasonal' ? (emp.seasonalEndMonth ?? 9) : '',
      ]);
    });
  } else {
    // 3 clear illustrative example rows HR can overwrite directly
    const catExec = safeCategories[0];
    const catOps = safeCategories[Math.min(3, safeCategories.length - 1)];
    const catAdmin = safeCategories[safeCategories.length - 1];
    const deptAdmin = safeDepartments[0] || 'administration';
    const deptOps = safeDepartments.find((d) => d.includes('oper')) || safeDepartments[Math.min(1, safeDepartments.length - 1)] || 'operations';

    dataRows.push([
      'Example: EMP-001 (Replace or Delete Row)',
      catExec.name,
      deptAdmin,
      'Operating Expenses',
      1,
      55000,
      'Permanent',
      1,
      '',
      '',
    ]);
    dataRows.push([
      'Example: EMP-002 Direct Production Staff',
      catOps.name,
      deptOps,
      'Cost of Sales',
      4,
      16500,
      'Permanent',
      1,
      '',
      '',
    ]);
    dataRows.push([
      'Example: EMP-003 Peak Season Crew',
      catAdmin.name,
      deptOps,
      'Cost of Sales',
      2,
      11000,
      'Seasonal',
      1,
      6,
      9,
    ]);
  }

  const importSheet = XLSX.utils.aoa_to_sheet(dataRows);
  importSheet['!cols'] = [
    { wch: 36 }, // Role / Employee Reference
    { wch: 30 }, // Category Band
    { wch: 24 }, // Department
    { wch: 22 }, // Allocation
    { wch: 16 }, // Headcount
    { wch: 26 }, // Monthly Base Cost
    { wch: 20 }, // Schedule
    { wch: 18 }, // Start Month
    { wch: 26 }, // Seasonal Start
    { wch: 24 }, // Seasonal End
  ];

  // Sheet 2: HR Instructions & Reference
  const today = new Date().toISOString().slice(0, 10);
  const instructionRows: (string | number)[][] = [
    ['CONFIDENTIAL HR PAYROLL UPLOAD DOCUMENT — BIZZBEAN'],
    ['Entity / Branch:', entityName, '', 'Generated:', today],
    [],
    ['1. PURPOSE & SALARY PRIVACY'],
    ['This workbook allows the HR Department to prepare and hand over employment cost data efficiently while protecting employee earnings privacy.'],
    ['Tip: HR may use anonymous Staff Codes (e.g. EMP-001) or Job Titles in Column A instead of personal names.'],
    ['When the forecaster imports this file using "Confidential Band Roll-Up", individual rows are automatically aggregated by Category Band, Department, Allocation, and Schedule so individual earnings are never stored or visible in the budget model.'],
    [],
    ['2. COLUMN GUIDE (COMPLETE SHEET "Employee Import")'],
    ['Column', 'Required?', 'Allowed Values / Format', 'Notes'],
    ['Role / Employee Reference', 'Yes', 'Text (e.g. EMP-001 or Plant Operator)', 'Use staff codes or job titles to protect personal identity.'],
    ['Category Band', 'Yes', 'Match one of the Active Category Bands below', 'Determines the employer Benefit On-Cost % automatically. New band names will be auto-created at 15% on-cost.'],
    ['Department', 'Yes', 'Match one of the Active Departments below', 'Used for departmental reporting and payroll breakdown.'],
    ['Allocation', 'Yes', 'Cost of Sales  OR  Operating Expenses', 'Cost of Sales = direct production/delivery labour; Operating Expenses = overhead/admin staff.'],
    ['Headcount (FTE)', 'Yes', 'Whole or decimal number >= 1 (default 1)', 'Number of employees on this row (use 1 per individual employee row, or group headcount).'],
    ['Monthly Base Cost (Per FTE)', 'Yes', 'Numeric monthly gross salary (excl. employer on-costs)', 'Do NOT add employer benefit on-costs here — the Category Band applies On-Cost % automatically.'],
    ['Employment Schedule', 'Optional', 'Permanent  OR  Seasonal (default: Permanent)', 'Seasonal employees are only costed between Seasonal Start Month and Seasonal End Month.'],
    ['Start Month (1-12)', 'Optional', '1 to 12 (default: 1)', 'Budget month in which the role starts (1 = Month 1 of budget year).'],
    ['Seasonal Start Month (1-12)', 'Seasonal only', '1 to 12 (e.g. 6 for June)', 'Leave blank for Permanent staff.'],
    ['Seasonal End Month (1-12)', 'Seasonal only', '1 to 12 (e.g. 9 for September)', 'Leave blank for Permanent staff.'],
    [],
    ['3. ACTIVE CATEGORY BANDS FOR THIS ENTITY (COPY EXACT NAME INTO COLUMN B)'],
    ['Category Band Name', 'Benefit On-Cost (%)', 'Description'],
    ...safeCategories.map((c) => [c.name, c.onCostPct, c.description || '']),
    [],
    ['4. ACTIVE DEPARTMENTS FOR THIS ENTITY (COPY INTO COLUMN C)'],
    ['Department Name'],
    ...safeDepartments.map((d) => [d]),
  ];

  const refSheet = XLSX.utils.aoa_to_sheet(instructionRows);
  refSheet['!cols'] = [
    { wch: 32 },
    { wch: 24 },
    { wch: 46 },
    { wch: 62 },
    { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, importSheet, 'Employee Import');
  XLSX.utils.book_append_sheet(wb, refSheet, 'HR Instructions & Reference');

  const suffix = includeExistingRoster ? 'roster-export' : 'hr-upload-template';
  const filename = `bizzbean-${suffix}-${slugifyFilePart(entityName)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

const normalizeHeader = (raw: unknown): string =>
  String(raw ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const parseNumericCell = (raw: unknown): number => {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const cleaned = String(raw ?? '')
    .replace(/[r$€£,\s]/gi, '')
    .replace(/[^0-9.-]/g, '');
  const val = Number(cleaned);
  return Number.isFinite(val) ? val : 0;
};

const parseAllocationCell = (raw: unknown): { value: EmploymentAllocation; matched: boolean } => {
  const s = normalizeHeader(raw);
  if (
    s.includes('cost of sales') ||
    s === 'cos' ||
    s === 'cogs' ||
    s.includes('direct') ||
    s.includes('production') ||
    s.includes('cost')
  ) {
    if (!s.includes('operating') && !s.includes('opex') && !s.includes('expense') && !s.includes('overhead')) {
      return { value: 'cost_of_sales', matched: true };
    }
  }
  if (
    s.includes('operating') ||
    s.includes('opex') ||
    s.includes('expense') ||
    s.includes('overhead') ||
    s.includes('indirect') ||
    s.includes('admin')
  ) {
    return { value: 'operating_expenses', matched: true };
  }
  return { value: 'operating_expenses', matched: false };
};

const parseScheduleCell = (raw: unknown): EmploymentType => {
  const s = normalizeHeader(raw);
  if (s.includes('season') || s.includes('temp') || s.includes('contract')) {
    return 'seasonal';
  }
  return 'permanent';
};

const parseMonthCell = (raw: unknown, fallback: number, maxMonth = 60): number => {
  const num = Math.round(parseNumericCell(raw));
  if (num >= 1 && num <= maxMonth) return num;
  const s = normalizeHeader(raw);
  const monthAliases = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const idx = monthAliases.findIndex((m) => s.startsWith(m));
  if (idx >= 0) return idx + 1;
  return fallback;
};

/**
 * Parses an uploaded .xlsx, .xls, or .csv HR payroll file into validated rows.
 */
export async function parseHrSpreadsheetFile(
  file: File,
  existingCategories: EmploymentCategory[],
  availableDepartments: string[]
): Promise<ParsedHrImportResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  // Prefer "Employee Import" sheet if present, otherwise first non-instructions sheet
  const preferredSheet =
    workbook.SheetNames.find((n) => normalizeHeader(n).includes('employee') || normalizeHeader(n).includes('import') || normalizeHeader(n).includes('payroll')) ||
    workbook.SheetNames.find((n) => !normalizeHeader(n).includes('instruction') && !normalizeHeader(n).includes('reference')) ||
    workbook.SheetNames[0];

  const sheet = workbook.Sheets[preferredSheet];
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!sheet) {
    return {
      fileName: file.name,
      sheetName: preferredSheet || '',
      rows: [],
      newCategoriesToCreate: [],
      warnings,
      errors: ['No worksheet could be read from this file.'],
      summary: {
        sourceRowCount: 0,
        totalHeadcount: 0,
        totalBaseMonthly: 0,
        totalWithOnCostsMonthly: 0,
        cosMonthly: 0,
        opexMonthly: 0,
      },
    };
  }

  const rawMatrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  if (!rawMatrix || rawMatrix.length < 2) {
    return {
      fileName: file.name,
      sheetName: preferredSheet,
      rows: [],
      newCategoriesToCreate: [],
      warnings,
      errors: ['The uploaded sheet contains no employee data rows.'],
      summary: {
        sourceRowCount: 0,
        totalHeadcount: 0,
        totalBaseMonthly: 0,
        totalWithOnCostsMonthly: 0,
        cosMonthly: 0,
        opexMonthly: 0,
      },
    };
  }

  // Locate header row (within first 10 rows)
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(rawMatrix.length, 10); i++) {
    const row = rawMatrix[i] || [];
    const normalizedCells = row.map(normalizeHeader);
    const hasTitleLike = normalizedCells.some((c) =>
      c.includes('role') || c.includes('title') || c.includes('position') || c.includes('employee') || c.includes('name') || c.includes('staff')
    );
    const hasSalaryLike = normalizedCells.some((c) =>
      c.includes('salary') || c.includes('base') || c.includes('cost') || c.includes('rate') || c.includes('wage') || c.includes('pay') || c.includes('ctc')
    );
    if (hasTitleLike || hasSalaryLike) {
      headerRowIdx = i;
      break;
    }
  }

  const headerCells = (rawMatrix[headerRowIdx] || []).map(normalizeHeader);
  const findCol = (matchers: ((h: string) => boolean)[]): number => {
    for (const matcher of matchers) {
      const idx = headerCells.findIndex(matcher);
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const colTitle = findCol([
    (h) => h.includes('role') || h.includes('title') || h.includes('position'),
    (h) => h.includes('employee') && !h.includes('schedule') && !h.includes('type') && !h.includes('num') && !h.includes('count'),
    (h) => h.includes('staff') || h.includes('name') || h.includes('reference'),
  ]);
  const colCategory = findCol([
    (h) => h.includes('category') || h.includes('band') || h.includes('grade') || h.includes('level'),
  ]);
  const colDepartment = findCol([
    (h) => h.includes('department') || h.includes('dept') || h.includes('division') || h.includes('cost centre') || h.includes('cost center'),
  ]);
  const colAllocation = findCol([
    (h) => h.includes('allocation') || h.includes('cos') || h.includes('opex') || h.includes('trading') || h.includes('account'),
  ]);
  const colHeadcount = findCol([
    (h) => h.includes('headcount') || h.includes('fte') || h.includes('qty') || h.includes('quantity') || h.includes('count') || h.includes('num'),
  ]);
  const colBaseCost = findCol([
    (h) => h.includes('monthly base') || h.includes('base cost') || h.includes('base rate') || h.includes('monthly salary'),
    (h) => h.includes('salary') || h.includes('wage') || h.includes('earnings') || h.includes('remuneration') || h.includes('pay') || h.includes('cost'),
  ]);
  const colSchedule = findCol([
    (h) => h.includes('schedule') || h.includes('employment type') || h === 'type' || h.includes('permanent') || h.includes('contract'),
  ]);
  const colStartMonth = findCol([
    (h) => (h.includes('start') && !h.includes('seasonal')) || h === 'start month' || h.includes('launch'),
  ]);
  const colSeasonalStart = findCol([
    (h) => h.includes('seasonal start'),
  ]);
  const colSeasonalEnd = findCol([
    (h) => h.includes('seasonal end'),
  ]);
  const colOnCost = findCol([
    (h) => h.includes('on cost') || h.includes('oncost') || h.includes('benefit'),
  ]);

  if (colBaseCost < 0) {
    errors.push('Could not find a Monthly Base Cost / Salary column. Please use the downloadable HR Upload Template.');
    return {
      fileName: file.name,
      sheetName: preferredSheet,
      rows: [],
      newCategoriesToCreate: [],
      warnings,
      errors,
      summary: {
        sourceRowCount: 0,
        totalHeadcount: 0,
        totalBaseMonthly: 0,
        totalWithOnCostsMonthly: 0,
        cosMonthly: 0,
        opexMonthly: 0,
      },
    };
  }

  const createdCategoryByName = new Map<string, EmploymentCategory>();
  const newCategoriesToCreate: EmploymentCategory[] = [];
  const defaultCat = existingCategories[0] || {
    id: 'cat-1',
    name: 'Administrative / Support',
    onCostPct: 12,
  };
  const defaultDept = availableDepartments[0] || 'administration';

  const parsedRows: ParsedHrEmployeeRow[] = [];

  for (let r = headerRowIdx + 1; r < rawMatrix.length; r++) {
    const row = rawMatrix[r];
    if (!row || row.every((cell) => String(cell ?? '').trim() === '')) {
      continue; // Skip blank rows
    }

    const rawTitle = colTitle >= 0 ? String(row[colTitle] ?? '').trim() : '';
    const baseRateMonthly = parseNumericCell(row[colBaseCost]);
    const headcountRaw = colHeadcount >= 0 ? parseNumericCell(row[colHeadcount]) : 1;
    const numEmployees = headcountRaw > 0 ? headcountRaw : 1;

    // Skip totals or footer lines commonly left at the bottom of Excel files
    const titleLower = rawTitle.toLowerCase();
    if (titleLower === 'total' || titleLower === 'totals' || titleLower.startsWith('grand total')) {
      warnings.push(`Row ${r + 1}: Skipped summary/total row ("${rawTitle}").`);
      continue;
    }

    if (baseRateMonthly <= 0 && !rawTitle) {
      continue;
    }

    if (baseRateMonthly < 0) {
      warnings.push(`Row ${r + 1}: Skipped negative monthly cost value.`);
      continue;
    }

    const title = rawTitle || `HR Imported Role ${parsedRows.length + 1}`;

    // Match Category Band
    const rawCatName = colCategory >= 0 ? String(row[colCategory] ?? '').trim() : '';
    const rawOnCost = colOnCost >= 0 ? parseNumericCell(row[colOnCost]) : NaN;
    let matchedCat: EmploymentCategory | undefined;
    let isNewCategory = false;

    if (rawCatName) {
      const catNorm = rawCatName.toLowerCase();
      matchedCat =
        existingCategories.find((c) => c.name.toLowerCase() === catNorm) ||
        existingCategories.find((c) => c.name.toLowerCase().includes(catNorm) || catNorm.includes(c.name.toLowerCase())) ||
        createdCategoryByName.get(catNorm);

      if (!matchedCat) {
        const newCat: EmploymentCategory = {
          id: `cat-hr-${Date.now()}-${newCategoriesToCreate.length + 1}`,
          name: rawCatName,
          onCostPct: Number.isFinite(rawOnCost) && rawOnCost >= 0 && rawOnCost <= 100 ? rawOnCost : 15,
          description: 'Auto-created from HR spreadsheet import',
          monthlyAdjustmentPct: new Array(60).fill(0),
        };
        createdCategoryByName.set(catNorm, newCat);
        newCategoriesToCreate.push(newCat);
        matchedCat = newCat;
        isNewCategory = true;
      }
    } else {
      matchedCat = defaultCat;
    }

    // Match Department
    const rawDept = colDepartment >= 0 ? String(row[colDepartment] ?? '').trim().toLowerCase() : '';
    let matchedDept = defaultDept;
    if (rawDept) {
      const exactDept = availableDepartments.find((d) => d.toLowerCase() === rawDept);
      const partialDept = availableDepartments.find(
        (d) => d.toLowerCase().includes(rawDept) || rawDept.includes(d.toLowerCase())
      );
      matchedDept = exactDept || partialDept || rawDept;
    }

    // Match Allocation
    const allocResult = colAllocation >= 0
      ? parseAllocationCell(row[colAllocation])
      : { value: 'operating_expenses' as EmploymentAllocation, matched: true };
    if (colAllocation >= 0 && String(row[colAllocation] ?? '').trim() && !allocResult.matched) {
      warnings.push(`Row ${r + 1}: Unrecognised allocation "${String(row[colAllocation])}" defaulted to Operating Expenses.`);
    }

    // Schedule & Months
    const employmentType: EmploymentType = colSchedule >= 0 ? parseScheduleCell(row[colSchedule]) : 'permanent';
    const startMonth = colStartMonth >= 0 ? parseMonthCell(row[colStartMonth], 1, 60) : 1;
    const seasonalStartMonth = employmentType === 'seasonal'
      ? parseMonthCell(colSeasonalStart >= 0 ? row[colSeasonalStart] : 6, 6, 12)
      : undefined;
    const seasonalEndMonth = employmentType === 'seasonal'
      ? parseMonthCell(colSeasonalEnd >= 0 ? row[colSeasonalEnd] : 9, 9, 12)
      : undefined;

    const onCostPct = matchedCat.onCostPct;

    parsedRows.push({
      rowNumber: r + 1,
      title,
      categoryName: matchedCat.name,
      matchedCategoryId: matchedCat.id,
      isNewCategory,
      department: matchedDept,
      allocation: allocResult.value,
      numEmployees,
      baseRateMonthly,
      employmentType,
      startMonth,
      seasonalStartMonth,
      seasonalEndMonth,
      onCostPct,
    });
  }

  if (parsedRows.length === 0) {
    errors.push('No valid employee rows were found in the uploaded spreadsheet.');
  }

  let totalHeadcount = 0;
  let totalBaseMonthly = 0;
  let totalWithOnCostsMonthly = 0;
  let cosMonthly = 0;
  let opexMonthly = 0;

  parsedRows.forEach((row) => {
    const base = row.baseRateMonthly * row.numEmployees;
    const full = base * (1 + row.onCostPct / 100);
    totalHeadcount += row.numEmployees;
    totalBaseMonthly += base;
    totalWithOnCostsMonthly += full;
    if (row.allocation === 'cost_of_sales') {
      cosMonthly += full;
    } else {
      opexMonthly += full;
    }
  });

  return {
    fileName: file.name,
    sheetName: preferredSheet,
    rows: parsedRows,
    newCategoriesToCreate,
    warnings,
    errors,
    summary: {
      sourceRowCount: parsedRows.length,
      totalHeadcount,
      totalBaseMonthly,
      totalWithOnCostsMonthly,
      cosMonthly,
      opexMonthly,
    },
  };
}

/**
 * Converts parsed HR rows into EmploymentItem records using the selected privacy mode:
 * - 'aggregated': Rolls up individual employees into anonymised Category Band + Department
 *   + Allocation + Schedule summaries so individual earnings are NEVER stored in the model.
 * - 'masked': Retains role rows for detailed budgeting while screen masking conceals earnings.
 */
export function buildEmploymentItemsFromImport(
  parsed: ParsedHrImportResult,
  privacyMode: 'aggregated' | 'masked'
): EmploymentItem[] {
  const ts = Date.now();

  if (privacyMode === 'masked') {
    return parsed.rows.map((row, idx) => ({
      id: `emp-hr-${ts}-${idx + 1}`,
      title: row.title,
      categoryId: row.matchedCategoryId,
      department: row.department,
      allocation: row.allocation,
      baseRateMonthly: row.baseRateMonthly,
      startMonth: row.startMonth,
      numEmployees: row.numEmployees,
      employmentType: row.employmentType,
      seasonalStartMonth: row.seasonalStartMonth,
      seasonalEndMonth: row.seasonalEndMonth,
      onCostPct: row.onCostPct,
    }));
  }

  // Confidential Band Roll-Up: group by band + dept + allocation + schedule + active months
  interface GroupAcc {
    categoryId: string;
    categoryName: string;
    department: string;
    allocation: EmploymentAllocation;
    employmentType: EmploymentType;
    startMonth: number;
    seasonalStartMonth?: number;
    seasonalEndMonth?: number;
    onCostPct: number;
    totalHeadcount: number;
    totalBaseMonthly: number;
  }

  const groups = new Map<string, GroupAcc>();

  parsed.rows.forEach((row) => {
    const key = [
      row.matchedCategoryId,
      row.department,
      row.allocation,
      row.employmentType,
      row.startMonth,
      row.seasonalStartMonth ?? '',
      row.seasonalEndMonth ?? '',
    ].join('|');

    const existing = groups.get(key);
    if (existing) {
      existing.totalHeadcount += row.numEmployees;
      existing.totalBaseMonthly += row.baseRateMonthly * row.numEmployees;
    } else {
      groups.set(key, {
        categoryId: row.matchedCategoryId,
        categoryName: row.categoryName,
        department: row.department,
        allocation: row.allocation,
        employmentType: row.employmentType,
        startMonth: row.startMonth,
        seasonalStartMonth: row.seasonalStartMonth,
        seasonalEndMonth: row.seasonalEndMonth,
        onCostPct: row.onCostPct,
        totalHeadcount: row.numEmployees,
        totalBaseMonthly: row.baseRateMonthly * row.numEmployees,
      });
    }
  });

  let idx = 0;
  const aggregatedItems: EmploymentItem[] = [];
  groups.forEach((g) => {
    idx += 1;
    const avgBaseMonthly =
      g.totalHeadcount > 0
        ? Math.round((g.totalBaseMonthly / g.totalHeadcount) * 100) / 100
        : 0;
    const deptLabel = g.department
      .split(' ')
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
      .join(' ');
    const scheduleTag =
      g.employmentType === 'seasonal'
        ? ` [Seasonal M${g.seasonalStartMonth ?? 6}–M${g.seasonalEndMonth ?? 9}]`
        : g.startMonth > 1
        ? ` [Starts M${g.startMonth}]`
        : '';

    aggregatedItems.push({
      id: `emp-hr-band-${ts}-${idx}`,
      title: `${g.categoryName} · ${deptLabel}${scheduleTag} (Confidential Band)`,
      categoryId: g.categoryId,
      department: g.department,
      allocation: g.allocation,
      baseRateMonthly: avgBaseMonthly,
      startMonth: g.startMonth,
      numEmployees: g.totalHeadcount,
      employmentType: g.employmentType,
      seasonalStartMonth: g.seasonalStartMonth,
      seasonalEndMonth: g.seasonalEndMonth,
      onCostPct: g.onCostPct,
    });
  });

  return aggregatedItems;
}
