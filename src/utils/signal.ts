/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Commodity } from '../types';

export type SignalType = 'long' | 'short' | 'none';

export interface SignalConfig {
  long_foreign_stock_long: boolean;     // 偏外资存量偏多 (positions.foreign >= 0)
  long_foreign_flow_long: boolean;      // 偏外资流量流入 (changes.foreign >= 0)
  long_top5_stock_long: boolean;        // 成交量前五存量偏多 (positions.institutional >= 0)
  long_top5_flow_long: boolean;         // 成交量前五流量流入 (changes.institutional >= 0)
  long_custom_stock_long: boolean;      // 用户自定义存量偏多 (positions.retail >= 0)
  long_custom_flow_long: boolean;       // 用户自定义流量流入 (changes.retail >= 0)

  short_foreign_stock_short: boolean;   // 偏外资存量偏空 (positions.foreign <= 0)
  short_foreign_flow_short: boolean;    // 偏外资流量流出 (changes.foreign <= 0)
  short_top5_stock_short: boolean;      // 成交量前五存量偏空 (positions.institutional <= 0)
  short_top5_flow_short: boolean;       // 成交量前五流量流出 (changes.institutional <= 0)
  short_custom_stock_short: boolean;    // 用户自定义存量偏空 (positions.retail <= 0)
  short_custom_flow_short: boolean;     // 用户自定义流量流出 (changes.retail <= 0)
}

export const DEFAULT_SIGNAL_CONFIG: SignalConfig = {
  long_foreign_stock_long: true,
  long_foreign_flow_long: true,
  long_top5_stock_long: true,
  long_top5_flow_long: true,
  long_custom_stock_long: true,
  long_custom_flow_long: true,
  
  short_foreign_stock_short: true,
  short_foreign_flow_short: true,
  short_top5_stock_short: true,
  short_top5_flow_short: true,
  short_custom_stock_short: true,
  short_custom_flow_short: true,
};

export function getCommodityCustomSignal(
  c: Commodity,
  signalConfig: SignalConfig
): SignalType {
  const fStock = c.positions.foreign;
  const iStock = c.positions.institutional;
  const rStock = c.positions.retail;

  const fChg = c.changes.foreign;
  const iChg = c.changes.institutional;
  const rChg = c.changes.retail;

  // Evaluate Long (偏多) Signal
  let longTriggered = true;
  const anyLongActive = 
    signalConfig.long_foreign_stock_long || 
    signalConfig.long_foreign_flow_long || 
    signalConfig.long_top5_stock_long || 
    signalConfig.long_top5_flow_long || 
    signalConfig.long_custom_stock_long || 
    signalConfig.long_custom_flow_long;

  if (anyLongActive) {
    if (signalConfig.long_foreign_stock_long && fStock < 0) longTriggered = false;
    if (signalConfig.long_foreign_flow_long && fChg < 0) longTriggered = false;
    if (signalConfig.long_top5_stock_long && iStock < 0) longTriggered = false;
    if (signalConfig.long_top5_flow_long && iChg < 0) longTriggered = false;
    if (signalConfig.long_custom_stock_long && rStock < 0) longTriggered = false;
    if (signalConfig.long_custom_flow_long && rChg < 0) longTriggered = false;
  } else {
    longTriggered = false;
  }

  // Evaluate Short (偏空) Signal
  let shortTriggered = true;
  const anyShortActive = 
    signalConfig.short_foreign_stock_short || 
    signalConfig.short_foreign_flow_short || 
    signalConfig.short_top5_stock_short || 
    signalConfig.short_top5_flow_short || 
    signalConfig.short_custom_stock_short || 
    signalConfig.short_custom_flow_short;

  if (anyShortActive) {
    if (signalConfig.short_foreign_stock_short && fStock > 0) shortTriggered = false;
    if (signalConfig.short_foreign_flow_short && fChg > 0) shortTriggered = false;
    if (signalConfig.short_top5_stock_short && iStock > 0) shortTriggered = false;
    if (signalConfig.short_top5_flow_short && iChg > 0) shortTriggered = false;
    if (signalConfig.short_custom_stock_short && rStock > 0) shortTriggered = false;
    if (signalConfig.short_custom_flow_short && rChg > 0) shortTriggered = false;
  } else {
    shortTriggered = false;
  }

  if (longTriggered && !shortTriggered) return 'long';
  if (shortTriggered && !longTriggered) return 'short';
  return 'none';
}

// Check if original "加强" (Strong) signal conditions are met:
// We redefine this to be full-agreement across all three categories (high consistency)
export function isOriginalStrongSignal(c: Commodity): boolean {
  const f = c.positions.foreign;
  const i = c.positions.institutional;
  const r = c.positions.retail;

  const fChg = c.changes.foreign;
  const iChg = c.changes.institutional;
  const rChg = c.changes.retail;

  const isLong = f >= 0 && i >= 0 && r >= 0 && fChg >= 0 && iChg >= 0 && rChg >= 0;
  const isShort = f <= 0 && i <= 0 && r <= 0 && fChg <= 0 && iChg <= 0 && rChg <= 0;
  
  return isLong || isShort;
}
