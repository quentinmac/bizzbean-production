export interface ExpenseCategoryDef {
  category: string;
  items: Array<{ name: string; defaultAmount: number; isFixed: boolean }>;
}

export const PREDEFINED_EXPENSES_TAXONOMY: ExpenseCategoryDef[] = [
  {
    category: 'General & Administrative',
    items: [
      { name: 'Accounting & Bookkeeping Services', defaultAmount: 4500, isFixed: true },
      { name: 'Audit & Independent Financial Review', defaultAmount: 3200, isFixed: true },
      { name: 'Bank Charges & Transaction Fees', defaultAmount: 1800, isFixed: false },
      { name: 'Legal Counsel & Regulatory Retainers', defaultAmount: 5000, isFixed: true },
      { name: 'Printing, Stationery & Postage', defaultAmount: 850, isFixed: false },
    ],
  },
  {
    category: 'Technology & Cloud Infrastructure',
    items: [
      { name: 'Cloud Server Compute (AWS / Google Cloud)', defaultAmount: 6500, isFixed: false },
      { name: 'SaaS Software Subscriptions & Tools', defaultAmount: 4800, isFixed: true },
      { name: 'Domain Registration, SSL & DNS Security', defaultAmount: 400, isFixed: true },
      { name: 'Fibre Internet & Team Connectivity', defaultAmount: 2200, isFixed: true },
    ],
  },
  {
    category: 'Facilities & Operating Space',
    items: [
      { name: 'Office Rental / Co-Working Memberships', defaultAmount: 14000, isFixed: true },
      { name: 'Electricity, Water & Municipal Rates', defaultAmount: 3500, isFixed: false },
      { name: 'Security, Access Control & Cleaning', defaultAmount: 2400, isFixed: true },
      { name: 'Office Insurance & Public Liability', defaultAmount: 1950, isFixed: true },
    ],
  },
  {
    category: 'Sales, Marketing & Commercial',
    items: [
      { name: 'Paid Search & Social Media Acquisition', defaultAmount: 12000, isFixed: false },
      { name: 'Content Production, Design & Video', defaultAmount: 7500, isFixed: false },
      { name: 'PR, Brand Events & Conferences', defaultAmount: 4000, isFixed: false },
      { name: 'Customer Gifting, Travel & Client Entertainment', defaultAmount: 3500, isFixed: false },
    ],
  },
];
