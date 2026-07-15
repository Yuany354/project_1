/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, ShieldCheck, HelpCircle, Coins, ArrowUpRight, ArrowDownRight, Layers, Globe, Building2, Users } from 'lucide-react';
import { Commodity } from '../types';
import { getCommodityCustomSignal, isOriginalStrongSignal, SignalConfig } from '../utils/signal';

interface SeatPositionSummaryProps {
  commodities: Commodity[];
  onSignalFilter: (filterType: 'all' | 'long' | 'short' | null) => void;
  activeFilter: 'all' | 'long' | 'short' | null;
  signalConfig: SignalConfig;
}

export default function SeatPositionSummary({
  commodities,
  onSignalFilter,
  activeFilter,
  signalConfig
}: SeatPositionSummaryProps) {
  // Filter commodities based on custom signal configuration
  const filteredCommoditiesForSummary = activeFilter
    ? commodities.filter(c => {
        const sig = getCommodityCustomSignal(c, signalConfig);
        if (activeFilter === 'long') return sig === 'long';
        if (activeFilter === 'short') return sig === 'short';
        if (activeFilter === 'all') return sig === 'long' || sig === 'short';
        return true;
      })
    : commodities;

  // Compute overall market totals (aggregated internally)
  const totalOpenInterest = filteredCommoditiesForSummary.reduce((acc, curr) => acc + curr.openInterest, 0);
  const totalFlowChange = filteredCommoditiesForSummary.reduce((acc, curr) => {
    // Net flow proxy: sum of foreign and institutional daily changes
    return acc + (curr.changes.foreign + curr.changes.institutional);
  }, 0);

  // Compute seat-specific cumulative position and daily flow values
  const netForeignPos = filteredCommoditiesForSummary.reduce((acc, curr) => acc + curr.positions.foreign, 0);
  const netForeignFlow = filteredCommoditiesForSummary.reduce((acc, curr) => acc + curr.changes.foreign, 0);

  const netInstitutionalPos = filteredCommoditiesForSummary.reduce((acc, curr) => acc + curr.positions.institutional, 0);
  const netInstitutionalFlow = filteredCommoditiesForSummary.reduce((acc, curr) => acc + curr.changes.institutional, 0);

  const netRetailPos = filteredCommoditiesForSummary.reduce((acc, curr) => acc + curr.positions.retail, 0);
  const netRetailFlow = filteredCommoditiesForSummary.reduce((acc, curr) => acc + curr.changes.retail, 0);

  // Compute custom signal counts over ALL commodities
  let customLongCount = 0;
  let customShortCount = 0;
  let signalOpenInterestSum = 0;

  commodities.forEach(c => {
    const sig = getCommodityCustomSignal(c, signalConfig);
    if (sig === 'long') {
      customLongCount++;
      signalOpenInterestSum += c.openInterest;
    } else if (sig === 'short') {
      customShortCount++;
      signalOpenInterestSum += c.openInterest;
    }
  });

  const totalCustomSignals = customLongCount + customShortCount;

  // Format currency/funds (China standard: Positive is +, Negative is -)
  const formatFund = (num: number) => {
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(1)} 亿`;
  };

  return (
    <div className="mb-8" id="section-seat-summary">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 border-b border-slate-200 pb-2 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">01</span>
          <h2 className="text-lg font-sans font-bold text-slate-900 tracking-tight">三类席位仓位摘要</h2>
          {activeFilter ? (
            <span className="text-[10px] font-sans font-bold bg-amber-500 text-white px-2 py-0.5 rounded shadow-xs animate-pulse">
              当前口径: {activeFilter === 'long' ? '偏多' : activeFilter === 'short' ? '偏空' : '全部'} 信号 ({filteredCommoditiesForSummary.length}个品种)
            </span>
          ) : (
            <span className="text-xs text-slate-500 font-normal">| 透视全市场不同属性资金的总底仓规模与单日流向</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1 md:mt-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>合规管理：已移除特定席位筛选，主力大单统计仅在内部算法中使用</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: 偏外资席位 */}
        <div className="bg-white rounded-lg p-4 border border-slate-200 border-l-4 border-l-blue-500 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold text-slate-800">偏外资席位</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">境外资金</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">持仓总额</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className={`text-xl lg:text-2xl font-mono font-black tracking-tight ${netForeignPos >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatFund(netForeignPos)}
                  </span>
                  <span className="text-[9px] text-slate-400 font-sans">
                    ({netForeignPos >= 0 ? '净多头' : '净空头'})
                  </span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-sans">今日流向金额</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-mono font-bold ${netForeignFlow >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {netForeignFlow >= 0 ? '+' : ''}{formatFund(netForeignFlow)}
                  </span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-sans font-medium ${netForeignFlow >= 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {netForeignFlow >= 0 ? '流入' : '流出'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: 偏机构席位 */}
        <div className="bg-white rounded-lg p-4 border border-slate-200 border-l-4 border-l-red-500 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-red-500" />
                <span className="text-xs font-bold text-slate-800">偏机构席位</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-bold">国内机构</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">持仓总额</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className={`text-xl lg:text-2xl font-mono font-black tracking-tight ${netInstitutionalPos >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatFund(netInstitutionalPos)}
                  </span>
                  <span className="text-[9px] text-slate-400 font-sans">
                    ({netInstitutionalPos >= 0 ? '净多头' : '净空头'})
                  </span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-sans">今日流向金额</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-mono font-bold ${netInstitutionalFlow >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {netInstitutionalFlow >= 0 ? '+' : ''}{formatFund(netInstitutionalFlow)}
                  </span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-sans font-medium ${netInstitutionalFlow >= 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {netInstitutionalFlow >= 0 ? '流入' : '流出'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: 偏零售席位 */}
        <div className="bg-white rounded-lg p-4 border border-slate-200 border-l-4 border-l-slate-400 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-800">偏零售席位</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200 font-bold">市场零售</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">持仓总额</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className={`text-xl lg:text-2xl font-mono font-black tracking-tight ${netRetailPos >= 0 ? 'text-slate-800' : 'text-slate-600'}`}>
                    {formatFund(netRetailPos)}
                  </span>
                  <span className="text-[9px] text-slate-400 font-sans">
                    ({netRetailPos >= 0 ? '净多头' : '净空头'})
                  </span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-sans">今日流向金额</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-mono font-bold ${netRetailFlow >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {netRetailFlow >= 0 ? '+' : ''}{formatFund(netRetailFlow)}
                  </span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-sans font-medium ${netRetailFlow >= 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {netRetailFlow >= 0 ? '流入' : '流出'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: 席位一致性分歧指标 */}
        <div className="p-4 rounded-lg border border-slate-200 border-l-4 border-l-amber-500 shadow-xs hover:shadow-sm transition-all duration-200 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  席位一致性分歧指标
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-pointer" title="多席位多空方向共振触发指标" />
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">DIVERGENCE CONSENSUS</span>
              </div>
              <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
            </div>

            <div className="mt-3 flex items-baseline justify-between gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block">总的指标数目</span>
                <span className="text-2xl font-mono font-black text-amber-600">
                  {totalCustomSignals} <span className="text-xs font-sans font-normal text-slate-500">个品种</span>
                </span>
              </div>
              <button 
                onClick={() => onSignalFilter(activeFilter === 'all' ? null : 'all')}
                className={`text-[10px] px-2 py-0.5 rounded border font-bold transition-all cursor-pointer ${
                  activeFilter === 'all' 
                    ? 'bg-amber-600 text-white border-amber-500 shadow-xs' 
                    : 'bg-white text-amber-800 border-amber-200 hover:bg-slate-50'
                }`}
              >
                {activeFilter === 'all' ? '取消' : '筛选'}
              </button>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-600 font-sans">
            <button 
              onClick={() => onSignalFilter(activeFilter === 'long' ? null : 'long')}
              className={`px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 ${activeFilter === 'long' ? 'bg-red-50 text-red-600 font-bold border border-red-200' : ''}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              <span>偏多</span>
              <span className="font-mono font-bold text-red-600">({customLongCount})</span>
            </button>
            <span className="text-slate-300">·</span>
            <button 
              onClick={() => onSignalFilter(activeFilter === 'short' ? null : 'short')}
              className={`px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 ${activeFilter === 'short' ? 'bg-green-50 text-green-600 font-bold border border-green-200' : ''}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              <span>偏空</span>
              <span className="font-mono font-bold text-green-600">({customShortCount})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
