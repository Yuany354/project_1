/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Commodity, DimensionType } from '../types';
import { Activity, Crosshair, HelpCircle } from 'lucide-react';

interface InstitutionalConsistencyMapProps {
  commodities: Commodity[];
  selectedCommodity: Commodity | null;
  onSelectCommodity: (commodity: Commodity) => void;
  selectedSector: string | null;
}

export default function InstitutionalConsistencyMap({
  commodities,
  selectedCommodity,
  onSelectCommodity,
  selectedSector
}: InstitutionalConsistencyMapProps) {
  const [dimension, setDimension] = useState<DimensionType>('foreign-institutional');
  const [hoveredCommodity, setHoveredCommodity] = useState<Commodity | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic axis names
  const axisNames = useMemo(() => {
    switch (dimension) {
      case 'foreign-institutional':
        return {
          x: '偏外资净持仓',
          y: '偏机构净持仓',
          xKey: 'foreign' as const,
          yKey: 'institutional' as const,
          thirdKey: 'retail' as const,
          xLabel: '偏外资净持仓金额 (亿) →',
          yLabel: '← 偏机构净持仓金额 (亿)',
          quadrants: {
            tr: '偏外资做多 / 偏机构做多 (共同偏多)',
            bl: '偏外资做空 / 偏机构做空 (共同偏空)',
            tl: '偏外资做空 / 偏机构做多',
            br: '偏外资做多 / 偏机构做空',
          }
        };
      case 'retail-foreign':
        return {
          x: '偏散户净持仓',
          y: '偏外资净持仓',
          xKey: 'retail' as const,
          yKey: 'foreign' as const,
          thirdKey: 'institutional' as const,
          xLabel: '偏散户净持仓金额 (亿) →',
          yLabel: '← 偏外资净持仓金额 (亿)',
          quadrants: {
            tr: '偏散户做多 / 偏外资做多 (共同偏多)',
            bl: '偏散户做空 / 偏外资做空 (共同偏空)',
            tl: '偏散户做空 / 偏外资做多',
            br: '偏散户做多 / 偏外资做空',
          }
        };
      case 'retail-institutional':
        return {
          x: '偏散户净持仓',
          y: '偏机构净持仓',
          xKey: 'retail' as const,
          yKey: 'institutional' as const,
          thirdKey: 'foreign' as const,
          xLabel: '偏散户净持仓金额 (亿) →',
          yLabel: '← 偏机构净持仓金额 (亿)',
          quadrants: {
            tr: '偏散户做多 / 偏机构做多 (共同偏多)',
            bl: '偏散户做空 / 偏机构做空 (共同偏空)',
            tl: '偏散户做空 / 偏机构做多',
            br: '偏散户做多 / 偏机构做空',
          }
        };
    }
  }, [dimension]);

  // Compute stats based on active dimensions
  const stats = useMemo(() => {
    let biasedLong = 0;
    let biasedShort = 0;
    let strongest = 0;
    let maxOICommodity: Commodity | null = null;

    commodities.forEach(c => {
      const xVal = c.positions[axisNames.xKey];
      const yVal = c.positions[axisNames.yKey];
      const thirdVal = c.positions[axisNames.thirdKey];

      // Biased Long: Both active dimensions are positive
      const isLong = xVal > 0 && yVal > 0;
      // Biased Short: Both active dimensions are negative
      const isShort = xVal < 0 && yVal < 0;
      // Extreme Consistency: Active dimensions are long, third (unselected) dimension is short
      const isStrong = xVal > 0 && yVal > 0 && thirdVal < 0;

      if (isStrong) {
        strongest++;
      } else if (isLong) {
        biasedLong++;
      } else if (isShort) {
        biasedShort++;
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
  }, [commodities, axisNames]);

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

  // Map categories of signals
  const getSignalCategory = (c: Commodity) => {
    const xVal = c.positions[axisNames.xKey];
    const yVal = c.positions[axisNames.yKey];
    const thirdVal = c.positions[axisNames.thirdKey];

    if (xVal > 0 && yVal > 0) {
      if (thirdVal < 0) return 'strong'; // Extreme consistency: Selected dimensions long, third is short
      return 'long'; // Joint Long
    }
    if (xVal < 0 && yVal < 0) {
      return 'short'; // Joint Short
    }
    return 'mixed'; // Mixed opinions
  };

  const handleMouseMove = (e: React.MouseEvent, c: Commodity) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      let x = e.clientX - rect.left + 15;
      let y = e.clientY - rect.top + 15;

      // Adjust X boundary (width of tooltip is 256px)
      if (x + 270 > rect.width) {
        x = e.clientX - rect.left - 275; // Flip to left of mouse
      }
      
      // Adjust Y boundary (height of tooltip is approx 240px)
      if (y + 250 > rect.height) {
        y = rect.height - 255;
      }
      if (y < 10) y = 10;
      if (x < 10) x = 10;

      setTooltipPos({ x, y });
    }
    setHoveredCommodity(c);
  };

  return (
    <div className="mb-8" id="section-consistency-map">
      {/* Sector Sub-header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">03</span>
          <h2 className="text-lg font-sans font-bold text-slate-900 tracking-tight">一致性象限地图</h2>
          <span className="text-xs text-slate-500 font-normal">| 呈现多维度主力资金的偏好、共识与博弈深度</span>
        </div>
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          <span className="text-xs text-slate-500 font-sans">分析维度:</span>
          <div className="inline-flex rounded p-0.5 bg-slate-100 border border-slate-200 text-xs">
            <button
              onClick={() => setDimension('foreign-institutional')}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                dimension === 'foreign-institutional' ? 'bg-white text-amber-900 font-bold border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              偏外资 - 偏机构
            </button>
            <button
              onClick={() => setDimension('retail-foreign')}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                dimension === 'retail-foreign' ? 'bg-white text-amber-900 font-bold border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              偏散户 - 偏外资
            </button>
            <button
              onClick={() => setDimension('retail-institutional')}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                dimension === 'retail-institutional' ? 'bg-white text-amber-900 font-bold border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              偏散户 - 偏机构
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
              <span>横轴：<strong className="text-slate-800">{axisNames.x}</strong> | 纵轴：<strong className="text-slate-800">{axisNames.y}</strong></span>
            </span>
          </div>

          {/* Coordinate Plot with SVG */}
          <div className="relative flex-1 w-full flex items-center justify-center">
            <svg 
              viewBox={`0 0 ${width} ${height}`} 
              className="w-full h-full max-h-[380px] overflow-visible"
            >
              {/* Grid Background Quadrant Labels - Standard China colors: Long represents Red, Short represents Green */}
              <g className="text-[10px] font-sans select-none pointer-events-none">
                {/* TR: Top Right */}
                <text x={width - padding - 10} y={padding + 15} textAnchor="end" className="fill-red-600 font-bold">
                  共同偏多 (双向做多) →
                </text>
                {/* BL: Bottom Left */}
                <text x={padding + 10} y={height - padding - 15} textAnchor="start" className="fill-green-600 font-bold">
                  ← 共同偏空 (双向做空)
                </text>
                {/* TL: Top Left */}
                <text x={padding + 10} y={padding + 15} textAnchor="start" className="fill-slate-400">
                  {axisNames.quadrants.tl}
                </text>
                {/* BR: Bottom Right */}
                <text x={width - padding - 10} y={height - padding - 15} textAnchor="end" className="fill-slate-400">
                  {axisNames.quadrants.br}
                </text>
              </g>

              {/* Zero Lines (X & Y Axes) */}
              <line 
                x1={padding} 
                y1={height / 2} 
                x2={width - padding} 
                y2={height / 2} 
                stroke="rgba(15, 23, 42, 0.12)" 
                strokeWidth="1.5" 
                strokeDasharray="4 4" 
              />
              <line 
                x1={width / 2} 
                y1={padding} 
                x2={width / 2} 
                y2={height - padding} 
                stroke="rgba(15, 23, 42, 0.12)" 
                strokeWidth="1.5" 
                strokeDasharray="4 4" 
              />

              {/* Central Origin Label */}
              <circle cx={width / 2} cy={height / 2} r="3" fill="#64748b" />

              {/* X and Y Axis physical labels */}
              <text 
                x={width - padding + 5} 
                y={height / 2 + 15} 
                textAnchor="end" 
                className="text-[10px] font-bold fill-slate-450 font-sans"
              >
                {axisNames.xLabel}
              </text>
              <text 
                x={width / 2 - 10} 
                y={padding - 10} 
                textAnchor="middle" 
                className="text-[10px] font-bold fill-slate-450 font-sans"
                style={{ transform: 'rotate(-90deg)', transformOrigin: `${width / 2 - 10}px ${padding - 10}px` }}
              >
                {axisNames.yLabel}
              </text>

              {/* Bubbles representing Commodities */}
              <g>
                {commodities.map((c) => {
                  const xVal = c.positions[axisNames.xKey];
                  const yVal = c.positions[axisNames.yKey];
                  const { x, y } = getCoords(xVal, yVal);
                  
                  // Filter out if sector is selected and does not match
                  const isFilteredOut = selectedSector && c.sector !== selectedSector;
                  const isSelected = selectedCommodity?.id === c.id;
                  
                  const signalCat = getSignalCategory(c);
                  
                  // Size mapping: open interest from [40, 500] maps to radius [11, 25]
                  const r = 11 + (c.openInterest / 500) * 14;

                  // Define color style based on signal (Compliance Yellow and Mainland Red/Green standards)
                  let fill = 'rgba(148, 163, 184, 0.15)'; // Neutral Default
                  let stroke = '#64748b';
                  let strokeWidth = '1';

                  if (signalCat === 'strong') {
                    // Extreme consistency: Selected dimensions long, third is short -> Yellow
                    fill = 'rgba(245, 158, 11, 0.2)'; 
                    stroke = '#d97706'; 
                    strokeWidth = '2.5';
                  } else if (signalCat === 'long') {
                    // Joint Long -> China Red
                    fill = 'rgba(239, 68, 68, 0.12)'; 
                    stroke = '#dc2626';
                    strokeWidth = '2';
                  } else if (signalCat === 'short') {
                    // Joint Short -> China Green
                    fill = 'rgba(16, 185, 129, 0.15)'; 
                    stroke = '#16a34a';
                    strokeWidth = '2';
                  } else {
                    // Mixed
                    fill = 'rgba(148, 163, 184, 0.08)';
                    stroke = '#94a3b8';
                    strokeWidth = '1';
                  }

                  if (isSelected) {
                    stroke = '#0f172a';
                    strokeWidth = '3.5';
                  }

                  return (
                    <g 
                      key={c.id}
                      className={`cursor-pointer transition-opacity duration-300 ${isFilteredOut ? 'opacity-10' : 'opacity-100'}`}
                      onClick={() => onSelectCommodity(c)}
                      onMouseMove={(e) => handleMouseMove(e, c)}
                      onMouseLeave={() => setHoveredCommodity(null)}
                    >
                      {/* Highlight Outer Pulse Ring for Extreme consistency Signals */}
                      {signalCat === 'strong' && (
                        <circle 
                           cx={x} 
                           cy={y} 
                           r={r + 5} 
                           fill="none" 
                           stroke="#d97706" 
                           strokeWidth="1" 
                           className="animate-ping opacity-40" 
                           style={{ animationDuration: '3.5s' }}
                        />
                      )}

                      {/* Commodity Bubble */}
                      <circle
                        cx={x}
                        cy={y}
                        r={r}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        className="transition-all duration-300 hover:scale-110"
                      />

                      {/* Commodity Symbol Text */}
                      <text
                        x={x}
                        y={y + 3.5}
                        textAnchor="middle"
                        className={`text-[9px] font-mono font-bold select-none pointer-events-none ${
                          isSelected ? 'fill-slate-900' : 'fill-slate-700'
                        }`}
                      >
                        {c.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Interactive Tooltip Container with Expanded Definitions */}
          <AnimatePresence>
            {hoveredCommodity && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                style={{ 
                  position: 'absolute', 
                  left: `${tooltipPos.x}px`, 
                  top: `${tooltipPos.y}px`,
                  zIndex: 100
                }}
                className="bg-slate-900 text-slate-100 p-3.5 rounded-lg shadow-2xl text-[11px] font-sans w-64 pointer-events-none leading-relaxed border border-slate-700 backdrop-blur-md"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                  <span className="font-bold text-amber-400">{hoveredCommodity.name}</span>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
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
                      <span className="text-slate-400">偏机构净额:</span>
                      <span className={`font-mono font-bold ${hoveredCommodity.positions.institutional >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {hoveredCommodity.positions.institutional > 0 ? '+' : ''}{hoveredCommodity.positions.institutional.toFixed(1)} 亿
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">偏散户净额:</span>
                      <span className={`font-mono font-bold ${hoveredCommodity.positions.retail >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {hoveredCommodity.positions.retail > 0 ? '+' : ''}{hoveredCommodity.positions.retail.toFixed(1)} 亿
                      </span>
                    </div>
                  </div>

                  {/* Bubble explanations */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] space-y-1">
                    <div className="text-slate-400 font-bold">气泡属性及定义:</div>
                    <div className="text-slate-300">
                      • <span className="text-amber-400 font-medium">气泡大小</span>: 代表该品种全市场资金沉淀规模 (以亿元为单位)。
                    </div>
                    <div className="text-slate-300">
                      • <span className="text-amber-400 font-medium">当前信号</span>: 
                      {getSignalCategory(hoveredCommodity) === 'strong' && " 加强 (外资/机构共同做多，散户做空)"}
                      {getSignalCategory(hoveredCommodity) === 'long' && " 共同偏多 (主力一致多头)"}
                      {getSignalCategory(hoveredCommodity) === 'short' && " 共同偏空 (主力一致空头)"}
                      {getSignalCategory(hoveredCommodity) === 'mixed' && " 席位分歧 (资金博弈无共识)"}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic Summary Cards on the Right */}
        <div className="flex flex-col gap-4">
          {/* Dimension Rules & Signal Stats Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 mb-3">
                <Activity className="w-4 h-4 text-amber-600 animate-pulse" />
                <span className="font-sans font-bold text-slate-800 text-sm">全景一致度分析</span>
              </div>

              {/* Signals Count Meters - China Mainland Colors (Red=Long, Green=Short) */}
              <div className="space-y-4">
                {/* Long */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                      偏多信号数 (双向做多)
                    </span>
                    <span className="font-mono font-bold text-slate-800">{stats.biasedLong} 个</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-red-500 h-full transition-all duration-500" 
                      style={{ width: `${(stats.biasedLong / commodities.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    外资与机构均为多头，反映主力看涨
                  </span>
                </div>

                {/* Short */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                      偏空信号数 (双向做空)
                    </span>
                    <span className="font-mono font-bold text-slate-800">{stats.biasedShort} 个</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-green-500 h-full transition-all duration-500" 
                      style={{ width: `${(stats.biasedShort / commodities.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    外资与机构均为空头，反映主力看跌
                  </span>
                </div>

                {/* Extreme Consistency */}
                <div className="p-2.5 bg-amber-50 rounded border border-amber-200">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-amber-800 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-ping"></span>
                      加强信号数 
                    </span>
                    <span className="font-mono font-bold text-amber-800">{stats.strongest} 个</span>
                  </div>
                  <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-600 h-full transition-all duration-500" 
                      style={{ width: `${(stats.strongest / commodities.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Max OI (Sediment) Commodity details */}
            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="text-[10px] text-slate-400 mb-1">当前样本最大资金沉淀品种:</div>
              {stats.maxOI && (
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1.5 rounded transition-all border border-transparent hover:border-slate-200"
                  onClick={() => onSelectCommodity(stats.maxOI!)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold bg-slate-100 text-amber-800 px-2 py-0.5 rounded border border-slate-200 text-xs">
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
