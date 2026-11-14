import coaData from '../../../data/coaData.json';

export interface CoaExpenseOption {
  code: string;
  name: string;
  subCategory: string;
  categoryName: string;
  defaultType: 'fixed' | 'variable';
  defaultDepartment: string;
}

/**
 * Filtered list of Operating Expenses directly from COA master lines.
 * Excludes depreciation (handled in Fixed Assets) and employment (handled in Employment step).
 */
export const COA_OPERATING_EXPENSES: CoaExpenseOption[] = (coaData.masterLines || [])
  .filter((m: any) =>
    (m.categoryName === 'expenses - fixed' || m.categoryName === 'expenses - variable') &&
    !m.glDescription?.toLowerCase().startsWith('depreciation') &&
    !m.glDescription?.toLowerCase().startsWith('employment')
  )
  .map((m: any) => {
    let dept = 'administration';
    const sub = (m.subCategoryName || '').toLowerCase();
    const name = (m.glDescription || '').toLowerCase();

    if (
      sub.includes('selling') ||
      sub.includes('distribution') ||
      name.includes('advertising') ||
      name.includes('promotions') ||
      name.includes('incentives')
    ) {
      dept = 'commercial & sales';
    } else if (
      sub.includes('occupancy') ||
      name.includes('maintenance') ||
      name.includes('equipment') ||
      name.includes('water') ||
      name.includes('electricity') ||
      name.includes('cleaning') ||
      name.includes('waste')
    ) {
      dept = 'operations';
    } else if (
      sub.includes('data processing') ||
      name.includes('hosting') ||
      name.includes('software') ||
      name.includes('product development') ||
      name.includes('internet')
    ) {
      dept = 'product & engineering';
    }

    return {
      code: m.baseCode,
      name: m.glDescription,
      subCategory: m.subCategoryName,
      categoryName: m.categoryName,
      defaultType: m.categoryName === 'expenses - variable' ? 'variable' : 'fixed',
      defaultDepartment: dept,
    };
  });
