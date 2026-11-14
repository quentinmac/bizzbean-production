import React from 'react';
import { BizzModelData } from '../../../types';
import { BarChart3, TrendingUp, DollarSign, Users } from 'lucide-react';

interface BizzModelPreviewProps {
  data: BizzModelData | null;
}

export default function BizzModelPreview({ data }: BizzModelPreviewProps) {
  if (!data) {
    return (
      <div className="p-8 text-center border-[0.5px] border-dashed border-[#5085b6]/30 rounded-xl bg-gray-50/50">
        <TrendingUp size={32} className="mx-auto mb-4 text-[#5085b6]/20" />
        <h4 className="text-sm font-bold lowercase text-[#5085b6]">no model data found</h4>
        <p className="text-[11px] text-[#5085b6]/50 italic mt-2 leading-relaxed">
          Launch BizzDynamics or BizzModel first to generate your financial data.
        </p>
      </div>
    );
  }

  const totalRevenue = (data.revenue?.productCategories || []).reduce(
    (acc, p) => acc + (p.baseValueSales || (p.pricePerUnit || 0) * (p.unitSales || 0)) * 12,
    0
  );
  const staffCount = (data.employment?.staff || []).reduce(
    (acc, s) => acc + ((s.count && s.count[0]) || 0),
    0
  );
  const totalCapex = (data.fixedAssets?.assets || []).reduce(
    (acc, a) => acc + (a.purchaseValue || 0),
    0
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 font-roboto">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 border-[0.5px] border-[#5085b6]/20 rounded-xl shadow-xs">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#5085b6]/50">
            <DollarSign size={12} /> est. year 1 revenue
          </div>
          <div className="text-xl font-black text-[#5085b6] mt-1 font-mono">{formatCurrency(totalRevenue)}</div>
        </div>

        <div className="bg-white p-4 border-[0.5px] border-[#5085b6]/20 rounded-xl shadow-xs">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#5085b6]/50">
            <Users size={12} /> starting headcount
          </div>
          <div className="text-xl font-black text-[#5085b6] mt-1 font-mono">{staffCount} FTE</div>
        </div>

        <div className="bg-white p-4 border-[0.5px] border-[#5085b6]/20 rounded-xl shadow-xs">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#5085b6]/50">
            <BarChart3 size={12} /> capital expenditure
          </div>
          <div className="text-xl font-black text-[#5085b6] mt-1 font-mono">{formatCurrency(totalCapex)}</div>
        </div>

        <div className="bg-white p-4 border-[0.5px] border-[#5085b6]/20 rounded-xl shadow-xs">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#5085b6]/50">
            <TrendingUp size={12} /> tax rate assumption
          </div>
          <div className="text-xl font-black text-[#5085b6] mt-1 font-mono">
            {(data.company?.assumptions?.taxRate ?? 28).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Product Categories Preview */}
      <div className="bg-white border-[0.5px] border-[#5085b6]/20 rounded-xl p-5 space-y-3">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5085b6]/60">
          revenue streams synced from financial model
        </h4>
        {(data.revenue?.productCategories || []).length > 0 ? (
          <div className="divide-y divide-[#5085b6]/10">
            {data.revenue.productCategories.map((p, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between text-xs">
                <span className="font-bold lowercase text-[#5085b6]">{p.name}</span>
                <span className="font-mono text-[#5085b6]/70">
                  {formatCurrency((p.baseValueSales || (p.pricePerUnit || 0) * (p.unitSales || 0)) * 12)} / yr
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs italic text-[#5085b6]/40 lowercase">
            no product categories defined in bizzmodel yet.
          </p>
        )}
      </div>
    </div>
  );
}
