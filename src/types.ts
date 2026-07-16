/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PositionData {
  foreign: number;       // 外资净持仓 (乾坤期货) 亿元
  institutional: number; // 机构净持仓 (ZL机构组合) 亿元
  retail: number;        // 散户净持仓 亿元
}

export interface PositionChange {
  foreign: number;       // 外资今日变化 亿元
  institutional: number; // 机构今日变化 亿元
  retail: number;        // 散户今日变化 亿元
}

export interface Commodity {
  id: string;            // 英文简写 (例如 "CU")
  name: string;          // 中文简称 (例如 "铜")
  symbol: string;        // 完整代码 (例如 "CU")
  sector: string;        // 板块 (例如 "有色金属")
  openInterest: number;  // 沉淀资金 (亿元)
  positions: PositionData;
  changes: PositionChange;
  description: string;   // 品种信息描述 (例如 "有色金属 · DMF口径")
}

export type SeatType = 'foreign' | 'institutional' | 'retail' | 'custom1' | 'custom2' | 'custom3';

export interface SectorSummary {
  name: string;
  commodities: Commodity[];
  totalOpenInterest: number;
  longSignalsCount: number;
  strongSignalsCount: number;
}

export type DimensionType = 'foreign-institutional' | 'retail-foreign' | 'retail-institutional';
