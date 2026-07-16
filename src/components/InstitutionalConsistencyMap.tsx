/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Commodity, DimensionType } from '../types';
import { Activity, Crosshair, HelpCircle } from 'lucide-react';
import { getCommodityCustomSignal, isOriginalStrongSignal, SignalType, SignalConfig } from '../utils/signal';

interface InstitutionalConsistencyMapProps {
  commodities: Commodity[];
  selectedCommodity: Commodity | null;
  onSelectCommodity: (commodity: Commodity) => void;
  selectedSector: string | null;
  signalConfig: SignalConfig;
  compareMode: 'single' | 'multi';
}

export default function InstitutionalConsistencyMap({
  commodities,
  selectedCommodity,
  onSelectCommodity,
  selectedSector,
  signalConfig,
  compareMode
}: InstitutionalConsistencyMapProps) {
  const [dimension, setDimension] = useState<DimensionType>('foreign-institutional');
  const [hoveredCommodity, setHoveredCommodity] = useState<Commodity | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic axis names - renamed all 散户 to 零售
  const axisNames = useMemo(() => {
    switch (dimension) {
      case 'foreign-institutional':
        return {
          x: '偏外资净持仓',
          y: '成交量前五会员净持仓',
          xKey: 'foreign' as const,
          yKey: 'institutional' as const,
          thirdKey: 'retail' as const,
          xLabel: '偏外资净持仓金额 (亿) →',
          yLabel: '← 成交量前五会员净持仓金额 (亿)',
          quadrants: {
            tr: '偏外资做多 / 前五会员做多 (共同偏多)',
            bl: '偏外资做空 / 前五会员做空 (共同偏空)',
            tl: '偏外资做空 / 前五会员做多',
            br: '偏外资做多 / 前五会员做空',
          }
        };
      case 'retail-foreign':
        return {
          x: '用户自定义净持仓',
          y: '偏外资净持仓',
          xKey: 'retail' as const,
          yKey: 'foreign' as const,
          thirdKey: 'institutional' as const,
          xLabel: '用户自定义净持仓金额 (亿) →',
          yLabel: '← 偏外资净持仓金额 (亿)',
          quadrants: {
            tr: '用户自定义做多 / 偏外资做多 (共同偏多)',
            bl: '用户自定义做空 / 偏外资做空 (共同偏空)',
            tl: '用户自定义做空 / 偏外资做多',
            br: '用户自定义做多 / 偏外资做空',
          }
        };
      case 'retail-institutional':
        return {
          x: '用户自定义净持仓',
          y: '成交量前五会员净持仓',
          xKey: 'retail' as const,
          yKey: 'institutional' as const,
          thirdKey: 'foreign' as const,
          xLabel: '用户自定义净持仓金额 (亿) →',
          yLabel: '← 成交量前五会员净持仓金额 (亿)',
          quadrants: {
            tr: '用户自定义做多 / 前五会员做多 (共同偏多)',
            bl: '用户自定义做空 / 前五会员做空 (共同偏空)',
            tl: '用户自定义做空 / 前五会员做多',
            br: '用户自定义做多 / 前五会员做空',
          }
        };
    }
  }, [dimension]);

  // Compute stats based on custom signal rules
  const stats = useMemo(() => {
    let biasedLong = 0;
    let biasedShort = 0;
    let strongest = 0;
    let maxOICommodity: Commodity | null = null;

    commodities.forEach(c => {
      const sig = getCommodityCustomSignal(c, signalConfig);
      if (sig === 'long') {
        biasedLong++;
      } else if (sig === 'short') {
        biasedShort++;
      }

      if (isOriginalStrongSignal(c)) {
        strongest++;
      }

      if (!maxOICommodity || c.openInterest > maxOICommodity.openInterest) {
        maxOICommodity = c;
      }
    });

    return {
      biasedLong,
      biasedShort,
      strongest,
      maxOI: maxOICommodity as Commodity | null
    };
  }, [commodities, signalConfig]);

  // Dimensions of the coordinate plane
  const width = 600;
  const height = 400;
  const padding = 50;

  // Find max range for mapping values
  const limits = useMemo(() => {
    let maxX = 10;
    let maxY = 10;
    commodities.forEach(c => {
      const xVal = Math.abs(c.positions[axisNames.xKey]);
      const yVal = Math.abs(c.positions[axisNames.yKey]);
      if (xVal > maxX) maxX = xVal;
      if (yVal > maxY) maxY = yVal;
    });
    // Add some padding buffer
    return {
      x: maxX * 1.15,
      y: maxY * 1.15
    };
  }, [commodities, axisNames]);

  // Scale functions (convert data coordinates to SVG pixel coordinates)
  const getCoords = (xVal: number, yVal: number) => {
    // xVal maps from [-limits.x, limits.x] to [padding, width - padding]
    const x = padding + ((xVal + limits.x) / (2 * limits.x)) * (width - 2 * padding);
    // yVal maps from [-limits.y, limits.y] to [height - padding, padding] (inverted Y axis)
    const y = height - padding - ((yVal + limits.y) / (2 * limits.y)) * (height - 2 * padding);
    return { x, y };
  };

  const handleMouseMove = (e: React.MouseEvent, c: Commodity) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      let x = e.clientX - rect.left + 15;
      let y = e.clientY - rect.top + 15;

      const tooltipW = 210;
      const tooltipH = 220;

      // Ensure tooltip doesn't bleed out right
      if (x + tooltipW > rect.width) {
        x = e.clientX - rect.left - tooltipW - 15;
      }
      // Ensure tooltip doesn't bleed out left
      if (x < 10) {
        x = 10;
      }

      // Ensure tooltip doesn't bleed out bottom
      if (y + tooltipH > rect.height) {
        y = e.clientY - rect.top - tooltipH - 15;
      }
      // Ensure tooltip doesn't bleed out top
      if (y < 10) {
        y = 10;
      }

      setTooltipPos({ x, y });
    }
  };

  return (
    <div className="mb-8" id="section-consistency-map">
      {/* Segment controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 border-b border-slate-200 pb-2 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">03</span>
          <h2 className="text-lg font-sans font-bold text-slate-900 tracking-tight">一致性象限地图</h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-sans">投影维度:</span>
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setDimension('foreign-institutional')}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                dimension === 'foreign-institutional' ? 'bg-white text-amber-900 font-bold border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              偏外资 - 成交量前五会员
            </button>
            <button
              onClick={() => setDimension('retail-foreign')}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                dimension === 'retail-foreign' ? 'bg-white text-amber-900 font-bold border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              用户自定义 - 偏外资
            </button>
            <button
              onClick={() => setDimension('retail-institutional')}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                dimension === 'retail-institutional' ? 'bg-white text-amber-900 font-bold border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              用户自定义 - 成交量前五会员
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main 2D Chart Plane */}
        <div 
          ref={containerRef}
          className="lg:col-span-3 bg-white border border-slate-200 rounded-lg p-4 relative overflow-visible flex flex-col justify-between select-none coord-grid animate-fade-in"
          style={{ minHeight: '440px' }}
        >
          {/* Header & Subtitle */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2 border-b border-slate-100 pb-2">
            <span className="flex items-center gap-1">
              <Crosshair className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              当前视图: <span className="font-bold text-slate-800 font-sans">{axisNames.x}</span> × <span className="font-bold text-slate-800 font-sans">{axisNames.y}</span> (气泡越大，资金沉淀规模越高)
            </span>
            <div className="text-slate-400 font-mono scale-95">
              坐标极限: X(±{limits.x.toFixed(0)}亿) | Y(±{limits.y.toFixed(0)}亿)
            </div>
          </div>

          {/* SVG canvas */}
          <div className="relative w-full aspect-[3/2] max-h-[400px] border border-slate-200 bg-slate-50/30 rounded-lg overflow-hidden">
            <svg 
              viewBox={`0 0 ${width} ${height}`} 
              className="w-full h-full font-mono text-[9px] text-slate-400 select-none"
            >
              {/* Grid lines */}
              <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="#cbd5e1" strokeDasharray="3,3" />
              <line x1={width/2} y1={padding} x2={width/2} y2={height-padding} stroke="#cbd5e1" strokeDasharray="3,3" />

              {/* Quadrant Titles (Faded background) */}
              <text x={width - padding - 10} y={padding + 15} textAnchor="end" className="fill-slate-400 font-sans font-bold text-[9px]">{axisNames.quadrants.tr}</text>
              <text x={padding + 10} y={padding + 15} textAnchor="start" className="fill-slate-400 font-sans font-bold text-[9px]">{axisNames.quadrants.tl}</text>
              <text x={padding + 10} y={height - padding - 15} textAnchor="start" className="fill-slate-400 font-sans font-bold text-[9px]">{axisNames.quadrants.bl}</text>
              <text x={width - padding - 10} y={height - padding - 15} textAnchor="end" className="fill-slate-400 font-sans font-bold text-[9px]">{axisNames.quadrants.br}</text>

              {/* Axis labels */}
              <text x={width - padding} y={height/2 - 8} textAnchor="end" className="fill-slate-500 font-sans font-bold">{axisNames.xLabel}</text>
              <text x={width/2 + 8} y={padding + 10} textAnchor="start" className="fill-slate-500 font-sans font-bold transform origin-left">{axisNames.yLabel}</text>

              {/* Origin zero */}
              <text x={width/2 + 6} y={height/2 + 12} textAnchor="start" className="fill-slate-400 text-[8px]">0.0 亿</text>

              {/* Plot Bubbles */}
              {commodities.map((c) => {
                const xVal = c.positions[axisNames.xKey];
                const yVal = c.positions[axisNames.yKey];
                const { x, y } = getCoords(xVal, yVal);

                // Check active state
                const isSelected = compareMode === 'multi' && selectedCommodity?.id === c.id;
                const isHovered = hoveredCommodity?.id === c.id;
                
                // Bubble radius based on log of openInterest
                const radius = Math.max(Math.sqrt(c.openInterest) * 1.5, 4);

                // Custom Signal evaluation
                const customSig = getCommodityCustomSignal(c, signalConfig);
                const isStrong = isOriginalStrongSignal(c);

                // Color mapping: Red for long custom signal, Green for short custom signal, slate otherwise
                let bubbleColor = 'rgba(148, 163, 184, 0.45)'; // Slate 400
                let strokeColor = 'rgba(100, 116, 139, 0.6)';
                
                if (customSig === 'long') {
                  bubbleColor = 'rgba(239, 68, 68, 0.45)'; // Red 500
                  strokeColor = 'rgba(220, 38, 38, 0.8)';
                } else if (customSig === 'short') {
                  bubbleColor = 'rgba(34, 197, 94, 0.45)'; // Green 500
                  strokeColor = 'rgba(22, 163, 74, 0.8)';
                }

                if (isStrong) {
                  strokeColor = 'rgba(217, 119, 6, 0.9)'; // Amber stroke for Strong 합力
                }

                return (
                  <g 
                    key={c.id}
                    className="cursor-pointer transition-all duration-300"
                    onClick={() => onSelectCommodity(c)}
                    onMouseEnter={(e) => {
                      setHoveredCommodity(c);
                      handleMouseMove(e, c);
                    }}
                    onMouseMove={(e) => handleMouseMove(e, c)}
                    onMouseLeave={() => setHoveredCommodity(null)}
                  >
                    {/* Ring selection pulse */}
                    {(isSelected || isHovered) && (
                      <circle 
                        cx={x} 
                        cy={y} 
                        r={radius + 6} 
                        fill="none" 
                        stroke={isStrong ? "#d97706" : customSig === 'long' ? "#ef4444" : customSig === 'short' ? "#22c55e" : "#475569"} 
                        strokeWidth="1.5"
                        strokeDasharray={isHovered ? "none" : "3,3"}
                        className={isHovered ? "" : "animate-spin"}
                        style={{ transformOrigin: `${x}px ${y}px`, animationDuration: '6s' }}
                      />
                    )}

                    {/* Bubble itself */}
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={radius} 
                      fill={bubbleColor}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? "2.5" : "1.2"}
                      className="transition-all duration-200"
                    />

                    {/* Short text name inside/above the bubble */}
                    <text 
                      x={x} 
                      y={y - radius - 3} 
                      textAnchor="middle" 
                      className={`font-sans font-bold text-[8.5px] select-none ${
                        isSelected 
                          ? 'fill-amber-800 font-extrabold text-[9.5px]' 
                          : isStrong 
                            ? 'fill-amber-700' 
                            : customSig === 'long' 
                              ? 'fill-red-800' 
                              : customSig === 'short' 
                                ? 'fill-green-800' 
                                : 'fill-slate-600'
                      }`}
                    >
                      {c.name}
                    </text>
                  </g>
                );
              })}
            </svg>

          </div>

          {/* Hover Tooltip Overlay in SVG */}
          <AnimatePresence>
            {hoveredCommodity && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                className="absolute bg-slate-900/95 border border-slate-700 text-white rounded p-3 shadow-xl pointer-events-none z-50 w-[200px]"
                style={{ left: tooltipPos.x, top: tooltipPos.y }}
              >
                <div className="font-sans font-black border-b border-slate-700 pb-1 mb-1.5 flex justify-between items-center">
                  <span className="text-[12px] text-amber-400">{hoveredCommodity.name}</span>
                  <span className="text-[9px] text-slate-400 font-mono bg-slate-800 px-1 py-0.2 rounded">
                    {hoveredCommodity.sector}
                  </span>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between border-b border-slate-800/40 pb-1 mb-1">
                    <span className="text-slate-400">资金沉淀:</span>
                    <span className="font-mono font-bold text-amber-300">{hoveredCommodity.openInterest.toFixed(1)} 亿</span>
                  </div>
                  
                  {/* Values for all 3 seats */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">偏外资净额:</span>
                      <span className={`font-mono font-bold ${hoveredCommodity.positions.foreign >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {hoveredCommodity.positions.foreign > 0 ? '+' : ''}{hoveredCommodity.positions.foreign.toFixed(1)} 亿
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">前五会员净额:</span>
                      <span className={`font-mono font-bold ${hoveredCommodity.positions.institutional >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {hoveredCommodity.positions.institutional > 0 ? '+' : ''}{hoveredCommodity.positions.institutional.toFixed(1)} 亿
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">自定义席位净额:</span>
                      <span className={`font-mono font-bold ${hoveredCommodity.positions.retail >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {hoveredCommodity.positions.retail > 0 ? '+' : ''}{hoveredCommodity.positions.retail.toFixed(1)} 亿
                      </span>
                    </div>
                  </div>

                  {/* Bubble explanations */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] space-y-1">
                    <div className="text-slate-400 font-bold">气泡属性及定义:</div>
                    <div className="text-slate-300">
                      • <span className="text-amber-400 font-medium">气泡大小</span>: 代表该品种资金沉淀规模。
                    </div>
                    <div className="text-slate-300">
                      • <span className="text-amber-400 font-medium">当前信号</span>: 
                      {getCommodityCustomSignal(hoveredCommodity, signalConfig) === 'long' && " 偏多"}
                      {getCommodityCustomSignal(hoveredCommodity, signalConfig) === 'short' && " 偏空"}
                      {getCommodityCustomSignal(hoveredCommodity, signalConfig) === 'none' && " 无"}
                      {isOriginalStrongSignal(hoveredCommodity) && " (重点关注)"}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom helper info */}
          <div className="text-[10px] text-slate-400 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-t border-slate-100 pt-2 font-sans">
            <span>💡 提示：点击品种气泡可直接联动底部的 04、05 精准图表。</span>
            <span>免责声明：默认席位组合仅供量化规律示意，不构成买卖观点。</span>
          </div>
        </div>

        {/* Dynamic Summary Cards on the Right */}
        <div className="flex flex-col gap-4">
          {/* Dimension Rules & Signal Stats Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between flex-1 shadow-2xs">
            <div>
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2.5 mb-3.5">
                <Activity className="w-4 h-4 text-amber-600 animate-pulse" />
                <span className="font-sans font-extrabold text-slate-800 text-sm">全景一致度多维度分析</span>
              </div>

              {/* Stacked Market Breadth Bar & Grid */}
              <div className="space-y-4">
                {/* 1. Market Breadth stacked bar */}
                {(() => {
                  const totalCount = commodities.length || 1;
                  const longPct = (stats.biasedLong / totalCount) * 100;
                  const shortPct = (stats.biasedShort / totalCount) * 100;
                  const neutralPct = Math.max(0, 100 - longPct - shortPct);
                  return (
                    <div className="space-y-2 bg-slate-50/50 border border-slate-100 p-2.5 rounded-xl">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-sans">
                        <span className="font-bold text-slate-500">博弈多空信号覆盖率</span>
                        <span className="font-mono font-medium">样本共 {totalCount} 品种</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full flex overflow-hidden bg-slate-200/60 border border-slate-200/20 shadow-3xs">
                        {stats.biasedLong > 0 && (
                          <div 
                            className="bg-red-500 h-full transition-all duration-500 hover:opacity-90" 
                            style={{ width: `${longPct}%` }}
                            title={`偏多信号: ${stats.biasedLong}个 (${longPct.toFixed(1)}%)`}
                          />
                        )}
                        {stats.biasedShort > 0 && (
                          <div 
                            className="bg-green-500 h-full transition-all duration-500 hover:opacity-90" 
                            style={{ width: `${shortPct}%` }}
                            title={`偏空信号: ${stats.biasedShort}个 (${shortPct.toFixed(1)}%)`}
                          />
                        )}
                        {neutralPct > 0 && (
                          <div 
                            className="bg-slate-300 h-full transition-all duration-500 hover:opacity-90" 
                            style={{ width: `${neutralPct}%` }}
                            title={`其它品种: ${totalCount - stats.biasedLong - stats.biasedShort}个 (${neutralPct.toFixed(1)}%)`}
                          />
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Numeric Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-red-50/50 rounded-xl border border-red-100/60 text-center shadow-3xs">
                    <div className="text-[10px] text-red-600 font-extrabold flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
                      偏多
                    </div>
                    <div className="font-mono font-black text-red-950 text-base mt-1">
                      {stats.biasedLong} <span className="text-[10px] font-normal text-red-700">个</span>
                    </div>
                  </div>

                  <div className="p-3 bg-green-50/50 rounded-xl border border-green-100/60 text-center shadow-3xs">
                    <div className="text-[10px] text-green-600 font-extrabold flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                      偏空
                    </div>
                    <div className="font-mono font-black text-green-950 text-base mt-1">
                      {stats.biasedShort} <span className="text-[10px] font-normal text-green-700">个</span>
                    </div>
                  </div>
                </div>

                {/* 3. 重点关注信号 (Compliant without description) */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 shadow-3xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block animate-pulse"></span>
                    <span className="text-amber-950 font-extrabold text-xs">重点关注多空品种数</span>
                  </div>
                  <span className="font-mono font-black text-amber-950 text-sm">
                    {stats.strongest} <span className="text-[10px] font-normal text-amber-700">个</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Max OI (Sediment) Commodity details */}
            <div className="mt-4 pt-3.5 border-t border-slate-100">
              <div className="text-[10px] text-slate-400 mb-1.5 font-sans">当前样本最高资金沉淀品种:</div>
              {stats.maxOI && (
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-all border border-slate-100 hover:border-slate-200 shadow-3xs"
                  onClick={() => onSelectCommodity(stats.maxOI!)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold bg-slate-100 text-amber-800 px-2 py-0.5 rounded border border-slate-200 text-[10px]">
                      {stats.maxOI.id}
                    </span>
                    <span className="text-xs text-slate-700 font-bold">{stats.maxOI.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-700">
                    {stats.maxOI.openInterest.toFixed(1)} 亿
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
