/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Globe, Building2, Users, AlertTriangle, ShieldCheck, Info, HelpCircle, Sliders } from 'lucide-react';
import { Commodity } from '../types';
import { getCommodityEvaluation } from './EvaluationBadge';

interface SeatPositionSummaryProps {
  commodities: Commodity[];
  onSignalFilter: (filterType: 'all' | 'long' | 'short' | 'strong' | null) => void;
  activeFilter: 'all' | 'long' | 'short' | 'strong' | null;
  onNavigateToFilter?: (seatType: 'foreign' | 'institutional' | 'retail') => void;
}

export default function SeatPositionSummary({
  commodities,
  onSignalFilter,
  activeFilter,
  onNavigateToFilter
}: SeatPositionSummaryProps) {
  // Filter commodities based on activeFilter for summary cards
  const filteredCommoditiesForSummary = activeFilter
    ? commodities.filter(c => {
        const f = c.positions.foreign;
        const i = c.positions.institutional;
        const r = c.positions.retail;

        const fChg = c.changes.foreign;
        const iChg = c.changes.institutional;
        const rChg = c.changes.retail;

        const isLong = f > 0 && i > 0 && fChg > 0 && iChg > 0;
        const isShort = f < 0 && i < 0 && fChg < 0 && iChg < 0;
        const isStrong = (isLong && (r < 0 || rChg < 0)) || (isShort && (r > 0 || rChg > 0));

        if (activeFilter === 'strong') return isStrong;
        if (activeFilter === 'long') return isLong;
        if (activeFilter === 'short') return isShort;
        if (activeFilter === 'all') return isLong || isShort;
        return true;
      })
    : commodities;

  // Compute totals based on filtered commodities
  const totalForeign = filteredCommoditiesForSummary.reduce((acc, curr) => acc + curr.positions.foreign, 0);
  const totalInstitutional = filteredCommoditiesForSummary.reduce((acc, curr) => acc + curr.positions.institutional, 0);
  const totalRetail = filteredCommoditiesForSummary.reduce((acc, curr) => acc + curr.positions.retail, 0);

  const changeForeign = filteredCommoditiesForSummary.reduce((acc, curr) => acc + curr.changes.foreign, 0);
  const changeInstitutional = filteredCommoditiesForSummary.reduce((acc, curr) => acc + curr.changes.institutional, 0);
  const changeRetail = filteredCommoditiesForSummary.reduce((acc, curr) => acc + curr.changes.retail, 0);

  // Compute signal counts based on default (Foreign & Institutional vs Retail) over ALL commodities (for general indicators card 4)
  let biasedLongCount = 0;
  let biasedShortCount = 0;
  let strongestCount = 0;
  let signalOpenInterestSum = 0;

  commodities.forEach(c => {
    const f = c.positions.foreign;
    const i = c.positions.institutional;
    const r = c.positions.retail;

    const fChg = c.changes.foreign;
    const iChg = c.changes.institutional;
    const rChg = c.changes.retail;

    const isLong = f > 0 && i > 0 && fChg > 0 && iChg > 0;
    const isShort = f < 0 && i < 0 && fChg < 0 && iChg < 0;
    const isStrong = (isLong && (r < 0 || rChg < 0)) || (isShort && (r > 0 || rChg > 0));

    if (isLong) {
      biasedLongCount++;
      signalOpenInterestSum += c.openInterest;
    } else if (isShort) {
      biasedShortCount++;
      signalOpenInterestSum += c.openInterest;
    }

    if (isStrong) {
      strongestCount++;
    }
  });

  const totalDivergenceSignals = biasedLongCount + biasedShortCount;

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
              当前口径: {activeFilter === 'strong' ? '加强' : activeFilter === 'long' ? '偏多' : activeFilter === 'short' ? '偏空' : '全部'} 信号 ({filteredCommoditiesForSummary.length}个品种)
            </span>
          ) : (
            <span className="text-xs text-slate-500 font-normal">| 透视外资、机构及散户的资金流向与持仓结构</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1 md:mt-0">
          <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
          <span>合规管理：持仓反向指标已更新为「席位一致性分歧指标」</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Foreign Capital Card */}
        <div 
          id="summary-card-foreign"
          className="group relative bg-white rounded-lg p-4 border border-slate-200 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all duration-200"
        >
          {/* Hover calculation tooltip popover */}
          <div className="absolute left-0 right-0 bottom-full mb-2 hidden group-hover:block z-50 bg-slate-900 text-slate-100 p-3 rounded shadow-xl text-[11px] leading-relaxed max-w-xs mx-auto border border-slate-700">
            <div className="font-bold text-amber-400 mb-1">外资席位结算口径：</div>
            <p className="text-slate-300 mb-1.5">逐合约净持仓或净变动 × 当日结算价 × 合约乘数，再按品种汇总。反映主流外资代理席位的资金暴露。</p>
            <span className="text-slate-400 font-mono">正值表示净多，负值表示净空。</span>
          </div>

          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <div>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                偏外资席位
                <HelpCircle className="w-3 h-3 text-slate-400 cursor-pointer" />
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">FOREIGN AGENT (偏外资代理席位)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative group/cfg">
                <button 
                  className="p-1 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                  title="筛选外资席位"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNavigateToFilter) onNavigateToFilter('foreign');
                  }}
                >
                  <Globe className="w-4 h-4 text-amber-500" />
                </button>
                <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover/cfg:block bg-slate-950 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 font-sans pointer-events-none">
                  配置外资席位
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2">
            {/* China Standard Color: >=0 is Red, <0 is Green */}
            <span className={`text-2xl font-mono font-bold tracking-tight ${totalForeign >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatFund(totalForeign)}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] text-slate-500">单日流向</span>
              <span className={`text-xs font-mono font-medium ${changeForeign >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatFund(changeForeign)}
              </span>
            </div>
          </div>
        </div>

        {/* Institutional Card */}
        <div 
          id="summary-card-institutional"
          className="group relative bg-white rounded-lg p-4 border border-slate-200 border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-all duration-200"
        >
          {/* Hover calculation tooltip popover */}
          <div className="absolute left-0 right-0 bottom-full mb-2 hidden group-hover:block z-50 bg-slate-900 text-slate-100 p-3 rounded shadow-xl text-[11px] leading-relaxed max-w-xs mx-auto border border-slate-700">
            <div className="font-bold text-red-400 mb-1">机构席位结算口径：</div>
            <p className="text-slate-300 mb-1.5">汇总行业核心机构主力席位。逐合约净持仓或净变动 × 当日结算价 × 合约乘数，再按品种汇总。</p>
            <span className="text-slate-400 font-mono">正值(红)表示净多，负值(绿)表示净空。</span>
          </div>

          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <div>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                偏机构席位
                <HelpCircle className="w-3 h-3 text-slate-400 cursor-pointer" />
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">INSTITUTIONAL COMBINED (偏机构主力席位)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative group/cfg">
                <button 
                  className="p-1 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                  title="筛选机构席位"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNavigateToFilter) onNavigateToFilter('institutional');
                  }}
                >
                  <Building2 className="w-4 h-4 text-red-500" />
                </button>
                <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover/cfg:block bg-slate-950 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 font-sans pointer-events-none">
                  配置机构席位
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-2xl font-mono font-bold tracking-tight ${totalInstitutional >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatFund(totalInstitutional)}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] text-slate-500">单日流向</span>
              <span className={`text-xs font-mono font-medium ${changeInstitutional >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatFund(changeInstitutional)}
              </span>
            </div>
          </div>
        </div>

        {/* Retail Card */}
        <div 
          id="summary-card-retail"
          className="group relative bg-white rounded-lg p-4 border border-slate-200 border-l-4 border-l-slate-400 shadow-sm hover:shadow-md transition-all duration-200"
        >
          {/* Hover calculation tooltip popover */}
          <div className="absolute left-0 right-0 bottom-full mb-2 hidden group-hover:block z-50 bg-slate-900 text-slate-100 p-3 rounded shadow-xl text-[11px] leading-relaxed max-w-xs mx-auto border border-slate-700">
            <div className="font-bold text-slate-400 mb-1">散户席位结算口径：</div>
            <p className="text-slate-300 mb-1.5">代表偏散户大单及零售持仓分布汇总。采用逐合约净持仓 × 结算价进行拟合估算。</p>
            <span className="text-slate-400 font-mono">正值表示净多，负值表示净空。</span>
          </div>

          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <div>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                偏散户席位
                <HelpCircle className="w-3 h-3 text-slate-400 cursor-pointer" />
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">RETAIL SIGNALS (偏散户大单/零售席位)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative group/cfg">
                <button 
                  className="p-1 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                  title="筛选散户席位"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNavigateToFilter) onNavigateToFilter('retail');
                  }}
                >
                  <Users className="w-4 h-4 text-slate-500" />
                </button>
                <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover/cfg:block bg-slate-950 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 font-sans pointer-events-none">
                  配置散户席位
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-2xl font-mono font-bold tracking-tight ${totalRetail >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatFund(totalRetail)}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] text-slate-500">单日流向</span>
              <span className={`text-xs font-mono font-medium ${changeRetail >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatFund(changeRetail)}
              </span>
            </div>
          </div>
        </div>

        {/* Consistency Signals Card */}
        <div 
          id="summary-card-signals"
          className="group relative p-4 rounded-lg border shadow-sm transition-all duration-300 bg-white border-slate-200 hover:shadow-md"
        >
          {/* Hover calculation tooltip popover */}
          <div className="absolute left-0 right-0 bottom-full mb-2 hidden group-hover:block z-50 bg-slate-900 text-slate-100 p-3 rounded shadow-xl text-[11px] leading-relaxed max-w-xs mx-auto border border-slate-700">
            <div className="font-bold text-amber-400 mb-1">全市沉淀资金口径 (Daily Money Flow)：</div>
            <p className="text-slate-300 mb-1.5">官方持仓量 × 2 × 加权收盘价 × 合约乘数 × 保证金率。低于 10 亿元的品种不进入信号清单。反映多维度主力资金在板块品种中的持仓共识与对立程度。</p>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  席位一致性分歧指标
                  <HelpCircle className="w-3 h-3 text-slate-400 cursor-pointer" />
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">DIVERGENCE CONSENSUS</span>
            </div>
            <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-mono font-bold text-amber-600">
              {totalDivergenceSignals} <span className="text-xs font-sans font-normal text-slate-500">个</span>
            </span>
            <button 
              onClick={() => onSignalFilter(activeFilter === 'all' ? null : 'all')}
              className={`text-[10px] px-2 py-0.5 rounded border font-medium transition-colors cursor-pointer ${
                activeFilter === 'all' ? 'bg-amber-600 text-white border-amber-500 font-bold' : 'bg-white text-amber-800 border-amber-200 hover:bg-slate-50'
              }`}
            >
              {activeFilter === 'all' ? '取消筛选' : '点击筛选'}
            </button>
          </div>

          {/* Yellow mapping for signals: Extreme Consistency is Yellow, Long is Red, Short is Green */}
          <div className="mt-2.5 pt-2 border-t border-slate-200 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-slate-600 font-sans">
            <button 
              onClick={() => onSignalFilter(activeFilter === 'long' ? null : 'long')}
              className={`px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap ${activeFilter === 'long' ? 'bg-red-50 text-red-600 font-bold border border-red-200' : ''}`}
            >
              偏多 <span className="font-mono font-bold text-red-600">{biasedLongCount}</span>
            </button>
            <span className="text-slate-300">·</span>
            <button 
              onClick={() => onSignalFilter(activeFilter === 'short' ? null : 'short')}
              className={`px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap ${activeFilter === 'short' ? 'bg-green-50 text-green-600 font-bold border border-green-200' : ''}`}
            >
              偏空 <span className="font-mono font-bold text-green-600">{biasedShortCount}</span>
            </button>
            <span className="text-slate-300">·</span>
            <button 
              onClick={() => onSignalFilter(activeFilter === 'strong' ? null : 'strong')}
              className={`px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap ${activeFilter === 'strong' ? 'bg-amber-50 text-amber-700 font-bold border border-amber-200' : ''}`}
            >
              加强 <span className="font-mono font-bold text-amber-600">{strongestCount}</span>
            </button>
          </div>
          
          <div className="text-[10px] text-slate-500 mt-1.5 font-mono flex justify-between">
            <span>全市场沉淀资金:</span>
            <span className="text-amber-700 font-bold">{signalOpenInterestSum.toFixed(1)} 亿</span>
          </div>
        </div>
      </div>
    </div>
  );
}
