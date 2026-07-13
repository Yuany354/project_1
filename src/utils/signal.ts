/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Commodity } from '../types';

export type SignalType = 'long' | 'short' | 'none';

export interface SignalConfig {
  long_stock_long: boolean;      // 主力持仓偏多
  long_stock_short: boolean;     // 主力持仓偏空
  long_flow_long: boolean;       // 主力流量流入
  long_flow_short: boolean;      // 主力流量流出
  long_retail_same: boolean;     // 零售同向
  long_retail_opposite: boolean; // 零售反向

  short_stock_long: boolean;     // 主力持仓偏多
  short_stock_short: boolean;    // 主力持仓偏空
  short_flow_long: boolean;      // 主力流量流入
  short_flow_short: boolean;     // 主力流量流出
  short_retail_same: boolean;    // 零售同向
  short_retail_opposite: boolean;// 零售反向
}

export const DEFAULT_SIGNAL_CONFIG: SignalConfig = {
  long_stock_long: true,
  long_stock_short: false,
  long_flow_long: true,
  long_flow_short: false,
  long_retail_same: true,
  long_retail_opposite: false,
  
  short_stock_long: false,
  short_stock_short: true,
  short_flow_long: false,
  short_flow_short: true,
  short_retail_same: false,
  short_retail_opposite: true,
};

export function getCommodityCustomSignal(
  c: Commodity,
  signalConfig: SignalConfig
): SignalType {
  const instFlowVal = c.changes.foreign + c.changes.institutional;
  const instStockVal = c.positions.foreign + c.positions.institutional;
  const retailFlowVal = c.changes.retail;
  
  const isStockLong = instStockVal >= 0;
  const isFlowLong = instFlowVal >= 0;
  
  const instFlowDir = instFlowVal >= 0 ? 1 : -1;
  const retailFlowDir = retailFlowVal >= 0 ? 1 : -1;
  const isRetailOpposite = instFlowDir !== retailFlowDir;
  const isRetailSame = instFlowDir === retailFlowDir;

  // Evaluate Long (偏多) Signal
  let longTriggered = false;
  const anyLongActive = 
    signalConfig.long_stock_long || 
    signalConfig.long_stock_short || 
    signalConfig.long_flow_long || 
    signalConfig.long_flow_short || 
    signalConfig.long_retail_same || 
    signalConfig.long_retail_opposite;

  if (anyLongActive) {
    let match = true;
    
    // Stock layer
    if (signalConfig.long_stock_long || signalConfig.long_stock_short) {
      const matchStock = 
        (signalConfig.long_stock_long && isStockLong) || 
        (signalConfig.long_stock_short && !isStockLong);
      if (!matchStock) match = false;
    }
    
    // Flow layer
    if (signalConfig.long_flow_long || signalConfig.long_flow_short) {
      const matchFlow = 
        (signalConfig.long_flow_long && isFlowLong) || 
        (signalConfig.long_flow_short && !isFlowLong);
      if (!matchFlow) match = false;
    }
    
    // Retail layer
    if (signalConfig.long_retail_same || signalConfig.long_retail_opposite) {
      const matchRetail = 
        (signalConfig.long_retail_same && isRetailSame) || 
        (signalConfig.long_retail_opposite && isRetailOpposite);
      if (!matchRetail) match = false;
    }
    
    longTriggered = match;
  }

  // Evaluate Short (偏空) Signal
  let shortTriggered = false;
  const anyShortActive = 
    signalConfig.short_stock_long || 
    signalConfig.short_stock_short || 
    signalConfig.short_flow_long || 
    signalConfig.short_flow_short || 
    signalConfig.short_retail_same || 
    signalConfig.short_retail_opposite;

  if (anyShortActive) {
    let match = true;
    
    // Stock layer
    if (signalConfig.short_stock_long || signalConfig.short_stock_short) {
      const matchStock = 
        (signalConfig.short_stock_long && isStockLong) || 
        (signalConfig.short_stock_short && !isStockLong);
      if (!matchStock) match = false;
    }
    
    // Flow layer
    if (signalConfig.short_flow_long || signalConfig.short_flow_short) {
      const matchFlow = 
        (signalConfig.short_flow_long && isFlowLong) || 
        (signalConfig.short_flow_short && !isFlowLong);
      if (!matchFlow) match = false;
    }
    
    // Retail layer
    if (signalConfig.short_retail_same || signalConfig.short_retail_opposite) {
      const matchRetail = 
        (signalConfig.short_retail_same && isRetailSame) || 
        (signalConfig.short_retail_opposite && isRetailOpposite);
      if (!matchRetail) match = false;
    }
    
    shortTriggered = match;
  }

  if (longTriggered && !shortTriggered) return 'long';
  if (shortTriggered && !longTriggered) return 'short';
  return 'none';
}

// Check if original "加强" (Strong) signal conditions are met:
// "加强代表着机构外资一致同向，而散户与他们的方向刚好相反"
export function isOriginalStrongSignal(c: Commodity): boolean {
  const f = c.positions.foreign;
  const i = c.positions.institutional;
  const r = c.positions.retail;

  const fChg = c.changes.foreign;
  const iChg = c.changes.institutional;
  const rChg = c.changes.retail;

  const isLong = f > 0 && i > 0 && fChg > 0 && iChg > 0;
  const isShort = f < 0 && i < 0 && fChg < 0 && iChg < 0;
  
  return (isLong && (r < 0 || rChg < 0)) || (isShort && (r > 0 || rChg > 0));
}
