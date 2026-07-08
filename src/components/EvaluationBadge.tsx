/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Activity, ShieldCheck } from 'lucide-react';
import { Commodity } from '../types';

export interface EvaluationResult {
  label: '加强' | '分歧' | '分化' | '观察' | '削弱';
  tierIndex: number;
  itemIndex: number;
  trigger: string;
  explanation: string;
  badgeStyle: string;
}

export const EVALUATION_TIERS = [
  {
    title: '第一分类：合力状态（存量与流量形成共振）',
    items: [
      {
        label: '加强' as const,
        trigger: '【存量同向】+【流量双双加仓】',
        explanation: '主力底仓方向相同，且今日外资/机构席位同向加仓，合力最显著加强（最关注的）。',
        badgeStyle: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100/50'
      }
    ]
  },
  {
    title: '第二分类：结构演变（底仓相同但流量分化/减仓）',
    items: [
      {
        label: '分化' as const,
        trigger: '【存量同向】+【流量一增一减】',
        explanation: '主力底仓方向一致，但今日日内席位变动出现一增一减的分化迹象。',
        badgeStyle: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100/50'
      },
      {
        label: '削弱' as const,
        trigger: '【存量同向】+【流量双双减仓或大幅反做】',
        explanation: '主力底仓方向相同，但今日两类席位同步减仓，或日内出现双双大幅反向操作。',
        badgeStyle: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100/50'
      }
    ]
  },
  {
    title: '第三分类：博弈分歧与低活跃观察',
    items: [
      {
        label: '分歧' as const,
        trigger: '【存量相反】+【主力多空对峙】',
        explanation: '外资与机构底仓方向相反（一多一空），主力博弈未形成一致持仓结构。',
        badgeStyle: 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200/50'
      },
      {
        label: '观察' as const,
        trigger: '【规模不足】或【变动微弱】',
        explanation: '品种持仓规模低于统计阈值，或日内席位变动极小，列为观察样本。',
        badgeStyle: 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200/30'
      }
    ]
  }
];

export function getCommodityEvaluation(c: Commodity): EvaluationResult {
  const fStock = c.positions.foreign;
  const iStock = c.positions.institutional;
  const rStock = c.positions.retail;

  const fChg = c.changes.foreign;
  const iChg = c.changes.institutional;
  const rChg = c.changes.retail;

  // 1. 观察池: 沉淀资金不足10亿阈值，或者变动金额极小
  const isVerySmallChange = Math.abs(fChg) <= 0.1 && Math.abs(iChg) <= 0.1;
  if (c.openInterest < 10 || isVerySmallChange) {
    return {
      label: '观察',
      tierIndex: 2,
      itemIndex: 1,
      trigger: '【规模不足】或【变动微弱】',
      explanation: '品种持仓规模低于统计阈值，或日内席位变动极小，列为观察样本。',
      badgeStyle: 'bg-slate-100 text-slate-400 border-slate-200'
    };
  }

  // 存量方向同向判断
  const fDir = fStock > 0 ? 1 : (fStock < 0 ? -1 : 0);
  const iDir = iStock > 0 ? 1 : (iStock < 0 ? -1 : 0);
  const stockSameDirection = fDir !== 0 && iDir !== 0 && fDir === iDir;
  const mainDir = fDir;

  if (!stockSameDirection) {
    // 4. 分歧
    return {
      label: '分歧',
      tierIndex: 2,
      itemIndex: 0,
      trigger: '【存量相反】+【主力多空对峙】',
      explanation: '外资与机构底仓方向相反（一多一空），主力博弈未形成一致持仓结构。',
      badgeStyle: 'bg-zinc-100 text-zinc-600 border-zinc-300'
    };
  }

  // 主力变动流量方向
  const fIsAdding = fChg * mainDir > 0;
  const iIsAdding = iChg * mainDir > 0;

  const fIsReducing = fChg * mainDir < 0;
  const iIsReducing = iChg * mainDir < 0;

  // 分化: 一增一减
  const isOneAddOneReduce = (fIsAdding && iIsReducing) || (fIsReducing && iIsAdding);

  if (isOneAddOneReduce) {
    return {
      label: '分化',
      tierIndex: 1,
      itemIndex: 0,
      trigger: '【存量同向】+【流量一增一减】',
      explanation: '主力底仓方向一致，但今日日内席位变动出现一增一减的分化迹象。',
      badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200'
    };
  }

  if (fIsReducing && iIsReducing) {
    // 削弱: 同向减仓（或者背离反做）
    return {
      label: '削弱',
      tierIndex: 1,
      itemIndex: 1,
      trigger: '【存量同向】+【流量双双减仓或大幅反做】',
      explanation: '主力底仓方向相同，但今日两类席位同步减仓，或日内出现双双大幅反向操作。',
      badgeStyle: 'bg-green-50 text-green-700 border-green-200'
    };
  }

  if (fIsAdding && iIsAdding) {
    // 加强: 同向加仓
    return {
      label: '加强',
      tierIndex: 0,
      itemIndex: 0,
      trigger: '【存量同向】+【流量双双加仓】',
      explanation: '主力底仓方向相同，且今日外资/机构席位同向加仓，合力最显著加强（最关注的）。',
      badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm'
    };
  }

  // Fallback
  return {
    label: '观察',
    tierIndex: 2,
    itemIndex: 1,
    trigger: '【规模不足】或【变动微弱】',
    explanation: '品种持仓规模低于统计阈值，或日内席位变动极小，列为观察样本。',
    badgeStyle: 'bg-slate-100 text-slate-400 border-slate-200'
  };
}

interface EvaluationBadgeProps {
  commodity: Commodity;
  className?: string;
  showTooltipBelow?: boolean;
  align?: 'left' | 'right' | 'center';
}

export default function EvaluationBadge({
  commodity,
  className = '',
  showTooltipBelow = false,
  align = 'center'
}: EvaluationBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const currentEval = getCommodityEvaluation(commodity);

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

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Interactive Badge */}
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border block text-center truncate cursor-help select-none shadow-xs transition-all duration-150 ${currentEval.badgeStyle}`}>
        {currentEval.label}
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
            } z-[9999] bg-slate-900 border border-slate-800 text-slate-100 p-3.5 rounded-xl shadow-2xl w-[350px] text-left leading-relaxed font-sans`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
              <div>
                <h4 className="font-sans font-black text-[11px] text-amber-400 tracking-tight flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>主力席位多维统计体系</span>
                  <span className="font-mono text-[8px] bg-amber-950/60 text-amber-400 border border-amber-800/50 px-1.5 py-0.2 rounded font-normal">
                    {commodity.name}
                  </span>
                </h4>
                <p className="text-[9px] text-slate-400 mt-0.5">外资与国内机构「持仓存量」与「日内流量」交叉统计特征</p>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>

            {/* Matrix Standard List */}
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {EVALUATION_TIERS.map((tier, tIdx) => (
                <div key={tier.title} className="border border-slate-800/40 rounded-lg p-2 bg-slate-950/40">
                  <span className="text-[9px] font-bold text-slate-400 block mb-1.5 tracking-wide font-sans">
                    {tier.title}
                  </span>
                  
                  <div className="space-y-1.5">
                    {tier.items.map((item, iIdx) => {
                      const isActive = currentEval.tierIndex === tIdx && currentEval.itemIndex === iIdx;
                      return (
                        <div 
                          key={item.label}
                          className={`p-1.5 rounded transition-all border duration-100 flex items-start gap-2 relative ${
                            isActive 
                              ? 'bg-amber-950/20 border-amber-500/80 shadow-xs' 
                              : 'bg-slate-900/20 border-slate-800/40 opacity-60'
                          }`}
                        >
                          {isActive && (
                            <div className="absolute right-1.5 top-1.5 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow">
                              <Check className="w-2 h-2 stroke-[3.5]" />
                            </div>
                          )}

                          {/* Badge Tag */}
                          <span className={`px-1 rounded text-[8px] font-black tracking-tight shrink-0 text-center w-8 border ${
                            isActive 
                              ? 'bg-amber-400 text-slate-950 border-amber-300' 
                              : item.badgeStyle
                          }`}>
                            {item.label}
                          </span>

                          <div className="flex-1 min-w-0 leading-tight">
                            {/* Trigger logic */}
                            <span className={`text-[9px] font-mono block font-bold ${
                              isActive ? 'text-amber-300' : 'text-slate-200'
                            }`}>
                              {item.trigger}
                            </span>
                            {/* Explanation */}
                            <span className="text-[9px] text-slate-400 block mt-0.5 font-sans leading-snug">
                              {item.explanation}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Compliance disclaimer */}
            <div className="mt-2 pt-2 border-t border-slate-800 text-[8px] text-slate-500 leading-normal font-sans">
              合规提示：以上多维特征属性基于历史公开持仓数据变动进行客观归纳，所得指标结果不作为行情预测或交易买卖决策的依据。期货市场具有高杠杆与高风险特征，投资者需独立进行投资分析。
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
