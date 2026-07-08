/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Commodity } from '../types';
import { SECTORS, getSectorRepSymbols } from '../data';

interface SectorDirectionQuickViewProps {
  commodities: Commodity[];
  selectedSector: string | null;
  onSelectSector: (sector: string | null) => void;
  onSelectCommodity: (commodity: Commodity) => void;
  selectedCommodityId: string | null;
}

export default function SectorDirectionQuickView({
  commodities,
  selectedSector,
  onSelectSector,
  onSelectCommodity,
  selectedCommodityId
}: SectorDirectionQuickViewProps) {
  
  // Calculate stats for each sector
  const sectorData = SECTORS.map(sectorName => {
    const sectorCommodities = commodities.filter(c => c.sector === sectorName);
    
    let totalOpenInterest = 0;
    let signalCount = 0;
    let strongestCount = 0;

    // Sum positions
    let sumForeign = 0;
    let sumInstitutional = 0;
    let sumRetail = 0;

    sectorCommodities.forEach(c => {
      totalOpenInterest += c.openInterest;
      sumForeign += c.positions.foreign;
      sumInstitutional += c.positions.institutional;
      sumRetail += c.positions.retail;

      const f = c.positions.foreign;
      const i = c.positions.institutional;
      const r = c.positions.retail;

      // Holding signal: foreign and institutional in the same direction (both positive or both negative)
      const hasSignal = (f > 0 && i > 0) || (f < 0 && i < 0);
      // Extreme consistency signal: both foreign and institutional long, retail short
      const isStrong = f > 0 && i > 0 && r < 0;

      if (hasSignal) signalCount++;
      if (isStrong) strongestCount++;
    });

    return {
      name: sectorName,
      commodities: sectorCommodities,
      totalOpenInterest,
      signalCount,
      strongestCount,
      sumForeign,
      sumInstitutional,
      sumRetail
    };
  });

  const formatFund = (num: number) => {
    const sign = num > 0 ? '+' : '';
    return `${sign}${num.toFixed(1)}`;
  };

  return (
    <div className="mb-8" id="section-sector-view">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">02</span>
          <h2 className="text-lg font-sans font-bold text-slate-900 tracking-tight">分类方向速览</h2>
          <span className="text-xs text-slate-500 font-normal">| 细分板块持仓分布，点击卡片可联动筛选</span>
        </div>
        
        {selectedSector && (
          <button 
            onClick={() => onSelectSector(null)}
            className="text-xs text-amber-800 hover:text-amber-900 font-medium flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded border border-amber-300 cursor-pointer animate-pulse"
          >
            清除板块筛选
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sectorData.map((sec, idx) => {
          if (sec.commodities.length === 0) return null;
          const isSelected = selectedSector === sec.name;
          const isAnySelected = selectedSector !== null;
          
          return (
            <div
              key={sec.name}
              id={`sector-card-${idx}`}
              onClick={() => onSelectSector(isSelected ? null : sec.name)}
              className={`cursor-pointer rounded-lg p-4 border transition-all duration-200 select-none ${
                isSelected 
                  ? 'border-amber-500 bg-amber-50/20 shadow-md ring-1 ring-amber-400/30' 
                  : isAnySelected 
                    ? 'border-slate-200 bg-white opacity-35 hover:opacity-75' 
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <span className="font-sans font-bold text-slate-800 text-sm">{sec.name}</span>
                <div className="flex items-center gap-1 text-[10px]">
                  <span className="bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-mono">
                    {sec.signalCount}持仓信号
                  </span>
                  {sec.strongestCount > 0 && (
                    <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-mono font-bold animate-pulse">
                      {sec.strongestCount}加强
                    </span>
                  )}
                </div>
              </div>

              {/* Positions Sums (China standards: >=0 Red, <0 Green) */}
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 my-2 text-[11px]">
                {/* Foreign */}
                <div>
                  <span className="text-slate-400 block mb-0.5 scale-90 origin-left">外资净额</span>
                  <span className={`font-mono font-bold ${sec.sumForeign >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatFund(sec.sumForeign)}亿
                  </span>
                </div>
                {/* Institutional */}
                <div>
                  <span className="text-slate-400 block mb-0.5 scale-90 origin-left">机构净额</span>
                  <span className={`font-mono font-bold ${sec.sumInstitutional >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatFund(sec.sumInstitutional)}亿
                  </span>
                </div>
                {/* Retail */}
                <div>
                  <span className="text-slate-400 block mb-0.5 scale-90 origin-left">散户净额</span>
                  <span className={`font-mono font-bold ${sec.sumRetail >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatFund(sec.sumRetail)}亿
                  </span>
                </div>
              </div>

              {/* Commodities list inside */}
              <div className="mt-3">
                <div className="text-[10px] text-slate-400 font-sans mb-1.5 truncate">
                  {getSectorRepSymbols(sec.name)}
                </div>
                <div className="flex flex-wrap gap-1">
                  {sec.commodities.map(c => {
                    const isCommSelected = selectedCommodityId === c.id;
                    const f = c.positions.foreign;
                    const i = c.positions.institutional;
                    const r = c.positions.retail;
                    const isStrong = f > 0 && i > 0 && r < 0;
                    
                    return (
                      <span
                        key={c.id}
                        onClick={(e) => {
                          e.stopPropagation(); // Don't trigger card selection
                          onSelectCommodity(c);
                        }}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all cursor-pointer border ${
                          isCommSelected 
                            ? 'bg-amber-500 text-white font-black border-amber-500 ring-1 ring-amber-400' 
                            : isStrong
                              ? 'bg-amber-50 text-amber-800 font-bold border-amber-200 hover:bg-amber-100'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                        }`}
                        title={`${c.name}: 外资 ${f > 0 ? '+' : ''}${f}亿 | 机构 ${i > 0 ? '+' : ''}${i}亿 | 散户 ${r > 0 ? '+' : ''}${r}亿`}
                      >
                        {c.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
