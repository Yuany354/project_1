/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Commodity } from '../types';
import { SECTORS, getSectorRepSymbols } from '../data';
import { getCommodityCustomSignal, isOriginalStrongSignal, SignalType, SignalConfig } from '../utils/signal';

interface SectorDirectionQuickViewProps {
  commodities: Commodity[];
  selectedSector: string | null;
  onSelectSector: (sector: string | null) => void;
  onSelectCommodity: (commodity: Commodity) => void;
  selectedCommodityId: string | null;
  signalConfig: SignalConfig;
}

export default function SectorDirectionQuickView({
  commodities,
  selectedSector,
  onSelectSector,
  onSelectCommodity,
  selectedCommodityId,
  signalConfig
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

      const sig = getCommodityCustomSignal(c, signalConfig);
      if (sig !== 'none') {
        signalCount++;
      }
      if (isOriginalStrongSignal(c)) {
        strongestCount++;
      }
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
        {sectorData.map(sec => {
          const isSelected = selectedSector === sec.name;
          return (
            <div
              key={sec.name}
              onClick={() => onSelectSector(isSelected ? null : sec.name)}
              className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                isSelected 
                  ? 'bg-blue-50/50 border-blue-400 shadow-sm' 
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-sans font-black text-slate-900 text-sm">{sec.name}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    资金规模 {sec.totalOpenInterest.toFixed(1)} 亿
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono">
                    信号: {sec.signalCount} 个
                  </span>
                </div>
              </div>

              {/* Grid of details */}
              <div className="grid grid-cols-3 gap-1 border-t border-b border-slate-100 py-2 text-[10px] text-slate-500 font-sans">
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
                  <span className="text-slate-400 block mb-0.5 scale-90 origin-left">零售净额</span>
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
                    const isStrong = isOriginalStrongSignal(c);
                    
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
                        title={`${c.name}: 外资 ${f > 0 ? '+' : ''}${f}亿 | 机构 ${i > 0 ? '+' : ''}${i}亿 | 零售 ${r > 0 ? '+' : ''}${r}亿`}
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
