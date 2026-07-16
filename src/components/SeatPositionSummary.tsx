/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Globe, Building2, Users, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { Commodity } from '../types';
import { getCommodityCustomSignal, isOriginalStrongSignal, SignalType, SignalConfig } from '../utils/signal';

interface SeatPositionSummaryProps {
  commodities: Commodity[];
  onSignalFilter: (filterType: 'all' | 'long' | 'short' | null) => void;
  activeFilter: 'all' | 'long' | 'short' | null;
  onNavigateToFilter?: (seatType: 'foreign' | 'institutional' | 'custom1' | 'custom2' | 'custom3') => void;
  signalConfig: SignalConfig;
  selectedCompanies?: Record<string, Record<'foreign' | 'institutional' | 'custom1' | 'custom2' | 'custom3', string[]>>;
  activeVariety?: string;
  customSeatNames?: Record<'custom1' | 'custom2' | 'custom3', string>;
  selectedCustomSeatId?: 'custom1' | 'custom2' | 'custom3';
  onSelectCustomSeat?: (id: 'custom1' | 'custom2' | 'custom3') => void;
}

export default function SeatPositionSummary({
  commodities,
  onSignalFilter,
  activeFilter,
  onNavigateToFilter,
  signalConfig,
  selectedCompanies,
  activeVariety = 'global',
  customSeatNames = {
    custom1: '用户自定义席位一',
    custom2: '用户自定义席位二',
    custom3: '用户自定义席位三'
  },
  selectedCustomSeatId = 'custom1',
  onSelectCustomSeat
}: SeatPositionSummaryProps) {
  // Extract active company listings based on state or defaults
  const currentConfig = (selectedCompanies?.[activeVariety] || selectedCompanies?.global || {
    foreign: ['摩根大通期货', '乾坤期货', '瑞银证券', '高盛工银期货', '汇丰前海证券', '野村东方国际'],
    institutional: ['国泰君安期货', '中信期货', '永安期货', '东证期货', '华泰期货'],
    custom1: ['银河期货', '广发期货', '浙商期货'],
    custom2: ['申银万国期货', '东方财富期货', '中原期货'],
    custom3: ['平安证券期货', '国信期货', '徽商期货']
  }) as any;

  const foreignCompanies = currentConfig.foreign || [];
  const top5Companies = currentConfig.institutional || [];
  const activeCustomId = selectedCustomSeatId || 'custom1';
  const customCompanies = currentConfig[activeCustomId] || [];
  const activeCustomSeatName = customSeatNames[activeCustomId] || '用户自定义席位';

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

  // Compute totals based on filtered commodities
  const totalForeign = filteredCommoditiesForSummary.reduce((acc, curr) => acc + curr.positions.foreign, 0);
  const totalInstitutional = filteredCommoditiesForSummary.reduce((acc, curr) => acc + curr.positions.institutional, 0);
  const totalRetail = filteredCommoditiesForSummary.reduce((acc, curr) => acc + curr.positions.retail, 0);

  const changeForeign = filteredCommoditiesForSummary.reduce((acc, curr) => acc + curr.changes.foreign, 0);
  const changeInstitutional = filteredCommoditiesForSummary.reduce((acc, curr) => acc + curr.changes.institutional, 0);
  const changeRetail = filteredCommoditiesForSummary.reduce((acc, curr) => acc + curr.changes.retail, 0);

  // Compute custom signal counts over ALL commodities
  let customLongCount = 0;
  let customShortCount = 0;
  let originalStrongCount = 0;
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
    
    if (isOriginalStrongSignal(c)) {
      originalStrongCount++;
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
              当前口径: {activeFilter === 'long' ? '自定义偏多' : activeFilter === 'short' ? '自定义偏空' : '全部自定义'} 信号 ({filteredCommoditiesForSummary.length}个品种)
            </span>
          ) : (
            <span className="text-xs text-slate-500 font-normal">| 透视偏外资、成交量前五会员及用户自定义席位的资金流向与持仓结构</span>
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
          className="group relative bg-white rounded-lg p-4 border border-slate-200 border-l-4 border-l-sky-500 shadow-sm hover:shadow-md transition-all duration-200"
        >
          {/* Hover calculation tooltip popover */}
          <div className="absolute left-0 right-0 bottom-full mb-2 hidden group-hover:block z-50 bg-slate-900 text-slate-100 p-3 rounded shadow-xl text-[11px] leading-relaxed max-w-xs mx-auto border border-slate-700">
            <div className="font-bold text-sky-400 mb-1">偏外资席位结算口径：</div>
            <p className="text-slate-300 mb-1.5">汇总海外QFI/RQFII主要期货托管代理机构席位资金持仓与变动。</p>
            <div className="font-bold text-sky-400 mt-2 mb-1">代表公司清单:</div>
            <div className="text-slate-200 leading-normal bg-slate-850 p-1.5 rounded border border-slate-700/50 max-h-[100px] overflow-y-auto font-sans">
              {foreignCompanies.length > 0 ? foreignCompanies.join('、') : '暂无'}
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <div>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                偏外资席位
                <HelpCircle className="w-3 h-3 text-slate-400 cursor-pointer" />
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">FOREIGN SEATS (偏外资托管席位)</span>
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
                  <Globe className="w-4 h-4 text-sky-500" />
                </button>
                <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover/cfg:block bg-slate-950 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 font-sans pointer-events-none">
                  配置外资席位
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2">
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
            <div className="font-bold text-red-400 mb-1">成交量前五会员结算口径：</div>
            <p className="text-slate-300 mb-1.5">汇总全市场日成交量前5大的硬核清算会员，具有极强的产业和专业量化代表性。</p>
            <div className="font-bold text-red-400 mt-2 mb-1">具体会员名称:</div>
            <div className="text-slate-200 leading-normal bg-slate-850 p-1.5 rounded border border-slate-700/50 max-h-[100px] overflow-y-auto font-sans">
              {top5Companies.length > 0 ? top5Companies.join('、') : '暂无'}
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <div>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                成交量前五会员
                <HelpCircle className="w-3 h-3 text-slate-400 cursor-pointer" />
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">TOP 5 VOLUME MEMBERS (前五大清算会员)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative group/cfg">
                <button 
                  className="p-1 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                  title="配置成交量前五会员"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNavigateToFilter) onNavigateToFilter('institutional');
                  }}
                >
                  <Building2 className="w-4 h-4 text-red-500" />
                </button>
                <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover/cfg:block bg-slate-950 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 font-sans pointer-events-none">
                  配置成交量前五会员
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

        {/* Retail Card (Renamed to 用户自定义席位 and updated with select options) */}
        <div 
          id="summary-card-retail"
          className="group relative bg-white rounded-lg p-4 border border-slate-200 border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all duration-200"
        >
          {/* Hover calculation tooltip popover */}
          <div className="absolute left-0 right-0 bottom-full mb-2 hidden group-hover:block z-50 bg-slate-900 text-slate-100 p-3 rounded shadow-xl text-[11px] leading-relaxed max-w-xs mx-auto border border-slate-700">
            <div className="font-bold text-purple-400 mb-1">用户自定义席位结算口径：</div>
            <p className="text-slate-300 mb-1.5">用户自定义筛选指定的席位公司持仓数据。默认各分类提供3家代表公司，可任意勾选并编辑分类名称。</p>
            <div className="font-bold text-purple-400 mt-2 mb-1">当前该分类勾选公司:</div>
            <div className="text-slate-200 leading-normal bg-slate-850 p-1.5 rounded border border-slate-700/50 max-h-[100px] overflow-y-auto font-sans">
              {customCompanies.length > 0 ? customCompanies.join('、') : '暂无'}
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="truncate">用户自定义席位</span>
                <HelpCircle className="w-3 h-3 text-slate-400 cursor-pointer shrink-0" />
              </span>
              <span className="text-[10px] text-slate-400 block font-mono truncate">USER CUSTOM SEATS (用户自定义席位)</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Custom Category Dropdown selector */}
              <select
                value={activeCustomId}
                onChange={(e) => onSelectCustomSeat?.(e.target.value as 'custom1' | 'custom2' | 'custom3')}
                onClick={(e) => e.stopPropagation()}
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-black rounded px-1.5 py-0.5 border border-purple-200 focus:outline-none cursor-pointer transition-colors max-w-[120px]"
                title="选择在主页面呈现的自定义分类"
              >
                <option value="custom1">🎯 {customSeatNames.custom1}</option>
                <option value="custom2">🎯 {customSeatNames.custom2}</option>
                <option value="custom3">🎯 {customSeatNames.custom3}</option>
              </select>

              <div className="relative group/cfg shrink-0">
                <button 
                  className="p-1 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                  title="配置自定义席位公司"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNavigateToFilter) onNavigateToFilter(activeCustomId);
                  }}
                >
                  <Users className="w-4 h-4 text-purple-500" />
                </button>
                <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover/cfg:block bg-slate-950 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 font-sans pointer-events-none">
                  配置此席位
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
            <p className="text-slate-300 mb-1.5">官方持仓量 × 2 × 加权收盘价 × 合约乘数 × 保证金率。低于 10 亿元的品种不进入信号清单。反映多维度主力资金在板块品种中的持仓共识与对立程度。默认配置仅供示意，不代表公司观点。</p>
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
              {totalCustomSignals} <span className="text-xs font-sans font-normal text-slate-500">个</span>
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

          {/* Mapping for signals: Long is Red, Short is Green */}
          <div className="mt-2.5 pt-2 border-t border-slate-200 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-slate-600 font-sans">
            <button 
              onClick={() => onSignalFilter(activeFilter === 'long' ? null : 'long')}
              className={`px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap ${activeFilter === 'long' ? 'bg-red-50 text-red-600 font-bold border border-red-200' : ''}`}
            >
              偏多 <span className="font-mono font-bold text-red-600">{customLongCount}</span>
            </button>
            <span className="text-slate-300">·</span>
            <button 
              onClick={() => onSignalFilter(activeFilter === 'short' ? null : 'short')}
              className={`px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap ${activeFilter === 'short' ? 'bg-green-50 text-green-600 font-bold border border-green-200' : ''}`}
            >
              偏空 <span className="font-mono font-bold text-green-600">{customShortCount}</span>
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
