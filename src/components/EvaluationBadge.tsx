/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, ShieldCheck, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Commodity } from '../types';
import { getCommodityCustomSignal, DEFAULT_SIGNAL_CONFIG, SignalConfig } from '../utils/signal';

interface EvaluationBadgeProps {
  commodity: Commodity;
  className?: string;
  showTooltipBelow?: boolean;
  align?: 'left' | 'right' | 'center';
  signalConfig?: SignalConfig;
}

export default function EvaluationBadge({
  commodity,
  className = '',
  showTooltipBelow = false,
  align = 'center',
  signalConfig = DEFAULT_SIGNAL_CONFIG
}: EvaluationBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Get custom signal value
  const signalValue = getCommodityCustomSignal(commodity, signalConfig);

  // Smart styling for positioning
  let positionClasses = 'left-1/2 -translate-x-1/2';
  let arrowClasses = 'left-1/2 -translate-x-1/2';

  if (align === 'right') {
    positionClasses = 'right-[-8px] md:right-[-20px]';
    arrowClasses = 'right-4 md:right-8';
  } else if (align === 'left') {
    positionClasses = 'left-[-8px] md:left-[-20px]';
    arrowClasses = 'left-4 md:left-8';
  }

  // Get styles and text for current custom signal
  let labelText = '—';
  let badgeStyle = 'bg-slate-50 text-slate-400 border-slate-200';
  let explanation = '当前主力资金变动分布较为分歧，未触发自定义偏多或偏空信号阈值。';
  let icon = <Minus className="w-3 h-3 text-slate-400" />;

  if (signalValue === 'long') {
    labelText = '偏多';
    badgeStyle = 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100/50 font-extrabold';
    explanation = '主力持仓存量与日内资金流向形成共振共识。根据您的自定义信号规则，当前品种多头优势较强，资金呈净流入。';
    icon = <ArrowUpRight className="w-3 h-3 text-red-600" />;
  } else if (signalValue === 'short') {
    labelText = '偏空';
    badgeStyle = 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100/50 font-extrabold';
    explanation = '主力持仓存量与日内资金流向形成共振共识。根据您的自定义信号规则，当前品种空头优势较强，资金呈净流出。';
    icon = <ArrowDownRight className="w-3 h-3 text-green-600" />;
  }

  const oiRating = commodity.openInterest > 50 
    ? { text: '活跃 (高沉淀)', style: 'bg-blue-50 text-blue-700 border-blue-200' }
    : commodity.openInterest > 20 
    ? { text: '稳健 (中沉淀)', style: 'bg-slate-50 text-slate-600 border-slate-200' }
    : { text: '观察 (低沉淀)', style: 'bg-zinc-50 text-zinc-500 border-zinc-200' };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Interactive Badge */}
      <span className={`px-2.5 py-0.5 rounded text-[10px] border flex items-center justify-center gap-1 text-center truncate cursor-help select-none shadow-3xs transition-all duration-150 ${badgeStyle}`}>
        {icon}
        <span>{labelText}</span>
      </span>

      {/* Floating Detailed standard matrix hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: showTooltipBelow ? 6 : -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: showTooltipBelow ? 6 : -6, scale: 0.95 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className={`absolute ${positionClasses} ${
              showTooltipBelow ? 'top-full mt-2' : 'bottom-full mb-2'
            } z-[9999] bg-slate-900 border border-slate-800 text-slate-100 p-3.5 rounded-xl shadow-2xl w-[320px] text-left leading-relaxed font-sans`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
              <div>
                <h4 className="font-sans font-black text-[11px] text-amber-400 tracking-tight flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>自定义多空博弈量化信号</span>
                  <span className="font-mono text-[8px] bg-amber-950/60 text-amber-400 border border-amber-800/50 px-1.5 py-0.2 rounded font-normal">
                    {commodity.name}
                  </span>
                </h4>
                <p className="text-[9px] text-slate-400 mt-0.5">根据用户自定义的持仓存量及资金流量规则实时穿透</p>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>

            {/* Content Details */}
            <div className="space-y-3 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[9px] font-bold mb-1">信号评价结果:</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${badgeStyle}`}>
                    {labelText}
                  </span>
                  <span className="text-slate-300 font-sans leading-relaxed text-[11px]">
                    {explanation}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-800/60 pt-2.5 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[9px]">资金沉淀规模:</span>
                  <strong className="text-slate-200 font-mono text-xs">{commodity.openInterest.toFixed(1)} 亿元</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">活跃度评级:</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded border font-bold ${oiRating.style}`}>
                    {oiRating.text}
                  </span>
                </div>
              </div>
            </div>

            {/* Compliance disclaimer */}
            <div className="mt-3 pt-2.5 border-t border-slate-800 text-[8px] text-slate-500 leading-normal font-sans">
              合规提示：所得指标结果完全由您自定义的规则控制，不代表本公司任何特定推荐或交易买卖意见。期货衍生品市场波动剧烈，请合理分配风险敞口。
            </div>

            {/* Popover Arrow */}
            {showTooltipBelow ? (
              <div className={`absolute bottom-full ${arrowClasses} -mb-1 border-[6px] border-transparent border-b-slate-900`}></div>
            ) : (
              <div className={`absolute top-full ${arrowClasses} -mt-1 border-[6px] border-transparent border-t-slate-900`}></div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
