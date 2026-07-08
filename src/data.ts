/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Commodity } from './types';

export const DATES = [
  "2026.06.29",
  "2026.06.28",
  "2026.06.27"
];

export const COMMODITIES_BY_DATE: Record<string, Commodity[]> = {
  "2026.06.29": [
    // 国债
    {
      id: "TL",
      name: "30年国债",
      symbol: "TL",
      sector: "国债",
      openInterest: 112.5,
      positions: { foreign: -5.1, institutional: -26.5, retail: 0.0 },
      changes: { foreign: -0.8, institutional: -3.2, retail: 0.0 },
      description: "30年期国债主力合约 · 利率衍生品口径"
    },
    {
      id: "TF",
      name: "5年国债",
      symbol: "TF",
      sector: "国债",
      openInterest: 84.2,
      positions: { foreign: -10.0, institutional: -20.0, retail: 0.0 },
      changes: { foreign: -0.5, institutional: -1.8, retail: 0.0 },
      description: "5年期国债主力合约 · 利率衍生品口径"
    },
    // 贵金属
    {
      id: "AU",
      name: "黄金",
      symbol: "AU",
      sector: "贵金属",
      openInterest: 450.0,
      positions: { foreign: +54.0, institutional: +220.0, retail: -65.0 },
      changes: { foreign: +4.2, institutional: +12.5, retail: -3.8 },
      description: "沪金主力合约 · 避险配置口径"
    },
    {
      id: "AG",
      name: "白银",
      symbol: "AG",
      sector: "贵金属",
      openInterest: 185.0,
      positions: { foreign: +15.0, institutional: +82.0, retail: +35.0 },
      changes: { foreign: +1.2, institutional: +5.4, retail: +2.1 },
      description: "沪银主力合约 · 双重属性口径"
    },
    // 有色金属
    {
      id: "CU",
      name: "铜",
      symbol: "CU",
      sector: "有色金属",
      openInterest: 320.5,
      positions: { foreign: +12.0, institutional: +45.0, retail: -15.0 },
      changes: { foreign: +2.1, institutional: +8.4, retail: -2.5 },
      description: "沪铜主力合约 · 宏观风向标"
    },
    {
      id: "ZN",
      name: "锌",
      symbol: "ZN",
      sector: "有色金属",
      openInterest: 65.8,
      positions: { foreign: +7.0, institutional: +33.4, retail: 0.0 },
      changes: { foreign: -1.9, institutional: -3.5, retail: 0.0 },
      description: "沪锌主力合约 · 供需平衡口径"
    },
    {
      id: "AL",
      name: "铝",
      symbol: "AL",
      sector: "有色金属",
      openInterest: 145.2,
      positions: { foreign: -12.0, institutional: +18.0, retail: +5.0 },
      changes: { foreign: -1.1, institutional: +2.4, retail: +0.8 },
      description: "沪铝主力合约 · 产能限制口径"
    },
    {
      id: "NI",
      name: "镍",
      symbol: "NI",
      sector: "有色金属",
      openInterest: 92.4,
      positions: { foreign: -5.0, institutional: -12.0, retail: +8.2 },
      changes: { foreign: -0.4, institutional: -1.5, retail: +0.9 },
      description: "沪镍主力合约 · 新能源电池口径"
    },
    // 黑色建材
    {
      id: "RB",
      name: "螺纹钢",
      symbol: "RB",
      sector: "黑色建材",
      openInterest: 210.0,
      positions: { foreign: -28.0, institutional: -35.0, retail: +42.0 },
      changes: { foreign: -3.5, institutional: -8.2, retail: +5.1 },
      description: "螺纹钢主力合约 · 建筑终端口径"
    },
    {
      id: "HC",
      name: "热卷",
      symbol: "HC",
      sector: "黑色建材",
      openInterest: 135.0,
      positions: { foreign: -15.0, institutional: +12.0, retail: +10.5 },
      changes: { foreign: +0.8, institutional: -2.1, retail: +1.2 },
      description: "热轧卷板主力合约 · 工业制造口径"
    },
    {
      id: "I",
      name: "铁矿石",
      symbol: "I",
      sector: "黑色建材",
      openInterest: 280.4,
      positions: { foreign: -25.0, institutional: -52.0, retail: +45.0 },
      changes: { foreign: -2.1, institutional: -6.4, retail: +3.8 },
      description: "铁矿石主力合约 · 炉料端强韧性"
    },
    // 能源
    {
      id: "BU",
      name: "沥青",
      symbol: "BU",
      sector: "能源",
      openInterest: 55.4,
      positions: { foreign: +10.4, institutional: -1.5, retail: +2.8 },
      changes: { foreign: +0.6, institutional: -0.2, retail: +0.3 },
      description: "石油沥青主力合约 · 基建铺装口径"
    },
    {
      id: "PG",
      name: "液化气",
      symbol: "PG",
      sector: "能源",
      openInterest: 48.6,
      positions: { foreign: +4.2, institutional: +12.4, retail: -5.2 },
      changes: { foreign: +0.3, institutional: +1.5, retail: -0.8 },
      description: "液化石油气主力合约 · 燃烧及化工原料"
    },
    // 化工材料
    {
      id: "FG",
      name: "玻璃",
      symbol: "FG",
      sector: "化工材料",
      openInterest: 85.0,
      positions: { foreign: -22.0, institutional: -65.0, retail: +48.0 },
      changes: { foreign: -1.8, institutional: -4.5, retail: +3.1 },
      description: "玻璃主力合约 · 地产竣工链"
    },
    {
      id: "V",
      name: "PVC",
      symbol: "V",
      sector: "化工材料",
      openInterest: 94.2,
      positions: { foreign: -18.0, institutional: -45.0, retail: +32.0 },
      changes: { foreign: -1.2, institutional: -3.1, retail: +2.0 },
      description: "聚氯乙烯主力合约 · 地产建材属性"
    },
    {
      id: "TA",
      name: "PTA",
      symbol: "TA",
      sector: "化工材料",
      openInterest: 142.6,
      positions: { foreign: -42.0, institutional: -120.0, retail: +95.0 },
      changes: { foreign: -2.4, institutional: -8.5, retail: +6.2 },
      description: "PTA主力合约 · 聚酯产业链"
    },
    // 油脂油料
    {
      id: "M",
      name: "豆粕",
      symbol: "M",
      sector: "油脂油料",
      openInterest: 198.5,
      positions: { foreign: +28.0, institutional: +32.0, retail: -15.0 },
      changes: { foreign: +1.8, institutional: +4.2, retail: -2.1 },
      description: "豆粕主力合约 · 饲料养殖成本端"
    },
    {
      id: "Y",
      name: "豆油",
      symbol: "Y",
      sector: "油脂油料",
      openInterest: 112.4,
      positions: { foreign: +18.0, institutional: +22.0, retail: -12.0 },
      changes: { foreign: +1.1, institutional: +2.5, retail: -1.5 },
      description: "豆油主力合约 · 农产品消费升级"
    },
    {
      id: "P",
      name: "棕榈油",
      symbol: "P",
      sector: "油脂油料",
      openInterest: 124.6,
      positions: { foreign: +12.0, institutional: +14.0, retail: -8.0 },
      changes: { foreign: +0.9, institutional: +1.8, retail: -1.1 },
      description: "棕榈油主力合约 · 进口替代与生物柴油"
    },
    // 农副软商品
    {
      id: "LH",
      name: "生猪",
      symbol: "LH",
      sector: "农副软商品",
      openInterest: 74.5,
      positions: { foreign: -8.0, institutional: -22.0, retail: +18.0 },
      changes: { foreign: -0.6, institutional: -1.9, retail: +1.2 },
      description: "生猪主力合约 · 周期博弈与养殖利润"
    },
    {
      id: "SR",
      name: "白糖",
      symbol: "SR",
      sector: "农副软商品",
      openInterest: 95.8,
      positions: { foreign: -12.0, institutional: -15.0, retail: +10.0 },
      changes: { foreign: -0.8, institutional: -1.5, retail: +0.7 },
      description: "白糖主力合约 · 外糖走势及国内缺口"
    }
  ],
  "2026.06.28": [
    // 国债
    {
      id: "TL",
      name: "30年国债",
      symbol: "TL",
      sector: "国债",
      openInterest: 111.7,
      positions: { foreign: -4.3, institutional: -23.3, retail: 0.0 },
      changes: { foreign: +0.5, institutional: +2.1, retail: 0.0 },
      description: "30年期国债主力合约"
    },
    {
      id: "TF",
      name: "5年国债",
      symbol: "TF",
      sector: "国债",
      openInterest: 84.0,
      positions: { foreign: -9.5, institutional: -18.2, retail: 0.0 },
      changes: { foreign: +0.2, institutional: +1.1, retail: 0.0 },
      description: "5年期国债主力合约"
    },
    // 贵金属
    {
      id: "AU",
      name: "黄金",
      symbol: "AU",
      sector: "贵金属",
      openInterest: 445.8,
      positions: { foreign: +49.8, institutional: +207.5, retail: -61.2 },
      changes: { foreign: +3.5, institutional: +9.8, retail: -2.9 },
      description: "沪金主力合约"
    },
    {
      id: "AG",
      name: "白银",
      symbol: "AG",
      sector: "贵金属",
      openInterest: 183.8,
      positions: { foreign: +13.8, institutional: +76.6, retail: +32.9 },
      changes: { foreign: +0.8, institutional: +3.2, retail: +1.5 },
      description: "沪银主力合约"
    },
    // 有色金属
    {
      id: "CU",
      name: "铜",
      symbol: "CU",
      sector: "有色金属",
      openInterest: 318.4,
      positions: { foreign: +9.9, institutional: +36.6, retail: -12.5 },
      changes: { foreign: +1.5, institutional: +6.2, retail: -1.8 },
      description: "沪铜主力合约"
    },
    {
      id: "ZN",
      name: "锌",
      symbol: "ZN",
      sector: "有色金属",
      openInterest: 67.7,
      positions: { foreign: +8.9, institutional: +36.9, retail: 0.0 },
      changes: { foreign: +1.2, institutional: +2.5, retail: 0.0 },
      description: "沪锌主力合约"
    },
    {
      id: "AL",
      name: "铝",
      symbol: "AL",
      sector: "有色金属",
      openInterest: 144.1,
      positions: { foreign: -10.9, institutional: +15.6, retail: +4.2 },
      changes: { foreign: -0.8, institutional: +1.5, retail: +0.5 },
      description: "沪铝主力合约"
    },
    {
      id: "NI",
      name: "镍",
      symbol: "NI",
      sector: "有色金属",
      openInterest: 91.5,
      positions: { foreign: -4.6, institutional: -10.5, retail: +7.3 },
      changes: { foreign: -0.3, institutional: -1.1, retail: +0.6 },
      description: "沪镍主力合约"
    },
    // 黑色建材
    {
      id: "RB",
      name: "螺纹钢",
      symbol: "RB",
      sector: "黑色建材",
      openInterest: 206.5,
      positions: { foreign: -24.5, institutional: -26.8, retail: +36.9 },
      changes: { foreign: -2.1, institutional: -5.5, retail: +3.2 },
      description: "螺纹钢主力合约"
    },
    {
      id: "HC",
      name: "热卷",
      symbol: "HC",
      sector: "黑色建材",
      openInterest: 133.8,
      positions: { foreign: -15.8, institutional: +14.1, retail: +9.3 },
      changes: { foreign: +0.5, institutional: -1.2, retail: +0.8 },
      description: "热轧卷板主力合约"
    },
    {
      id: "I",
      name: "铁矿石",
      symbol: "I",
      sector: "黑色建材",
      openInterest: 278.3,
      positions: { foreign: -22.9, institutional: -45.6, retail: +41.2 },
      changes: { foreign: -1.5, institutional: -4.2, retail: +2.5 },
      description: "铁矿石主力合约"
    },
    // 能源
    {
      id: "BU",
      name: "沥青",
      symbol: "BU",
      sector: "能源",
      openInterest: 54.8,
      positions: { foreign: +9.8, institutional: -1.3, retail: +2.5 },
      changes: { foreign: +0.4, institutional: -0.1, retail: +0.2 },
      description: "石油沥青主力合约"
    },
    {
      id: "PG",
      name: "液化气",
      symbol: "PG",
      sector: "能源",
      openInterest: 47.8,
      positions: { foreign: +3.9, institutional: +10.9, retail: -4.4 },
      changes: { foreign: +0.2, institutional: +1.1, retail: -0.5 },
      description: "液化石油气主力合约"
    },
    // 化工材料
    {
      id: "FG",
      name: "玻璃",
      symbol: "FG",
      sector: "化工材料",
      openInterest: 81.9,
      positions: { foreign: -20.2, institutional: -60.5, retail: +44.9 },
      changes: { foreign: -1.2, institutional: -3.2, retail: +2.1 },
      description: "玻璃主力合约"
    },
    {
      id: "V",
      name: "PVC",
      symbol: "V",
      sector: "化工材料",
      openInterest: 92.2,
      positions: { foreign: -16.8, institutional: -41.9, retail: +30.0 },
      changes: { foreign: -0.8, institutional: -2.1, retail: +1.5 },
      description: "聚氯乙烯主力合约"
    },
    {
      id: "TA",
      name: "PTA",
      symbol: "TA",
      sector: "化工材料",
      openInterest: 140.2,
      positions: { foreign: -39.6, institutional: -111.5, retail: +88.8 },
      changes: { foreign: -1.8, institutional: -6.2, retail: +4.5 },
      description: "PTA主力合约"
    },
    // 油脂油料
    {
      id: "M",
      name: "豆粕",
      symbol: "M",
      sector: "油脂油料",
      openInterest: 196.7,
      positions: { foreign: +26.2, institutional: +27.8, retail: -12.9 },
      changes: { foreign: +1.2, institutional: +3.1, retail: -1.5 },
      description: "豆粕主力合约"
    },
    {
      id: "Y",
      name: "豆油",
      symbol: "Y",
      sector: "油脂油料",
      openInterest: 111.3,
      positions: { foreign: +16.9, institutional: +19.5, retail: -10.5 },
      changes: { foreign: +0.8, institutional: +1.8, retail: -1.1 },
      description: "豆油主力合约"
    },
    {
      id: "P",
      name: "棕榈油",
      symbol: "P",
      sector: "油脂油料",
      openInterest: 123.7,
      positions: { foreign: +11.1, institutional: +12.2, retail: -6.9 },
      changes: { foreign: +0.6, institutional: +1.2, retail: -0.8 },
      description: "棕榈油主力合约"
    },
    // 农副软商品
    {
      id: "LH",
      name: "生猪",
      symbol: "LH",
      sector: "农副软商品",
      openInterest: 73.3,
      positions: { foreign: -7.4, institutional: -20.1, retail: +16.8 },
      changes: { foreign: -0.4, institutional: -1.5, retail: +0.9 },
      description: "生猪主力合约"
    },
    {
      id: "SR",
      name: "白糖",
      symbol: "SR",
      sector: "农副软商品",
      openInterest: 95.1,
      positions: { foreign: -11.2, institutional: -13.5, retail: +9.3 },
      changes: { foreign: -0.5, institutional: -1.1, retail: +0.5 },
      description: "白糖主力合约"
    }
  ],
  "2026.06.27": [
    // 国债
    {
      id: "TL",
      name: "30年国债",
      symbol: "TL",
      sector: "国债",
      openInterest: 111.2,
      positions: { foreign: -4.8, institutional: -25.4, retail: 0.0 },
      changes: { foreign: -0.5, institutional: -1.5, retail: 0.0 },
      description: "30年期国债主力合约"
    },
    {
      id: "TF",
      name: "5年国债",
      symbol: "TF",
      sector: "国债",
      openInterest: 83.8,
      positions: { foreign: -9.7, institutional: -19.3, retail: 0.0 },
      changes: { foreign: -0.2, institutional: -0.8, retail: 0.0 },
      description: "5年期国债主力合约"
    },
    // 贵金属
    {
      id: "AU",
      name: "黄金",
      symbol: "AU",
      sector: "贵金属",
      openInterest: 442.3,
      positions: { foreign: +46.3, institutional: +197.7, retail: -58.3 },
      changes: { foreign: +2.8, institutional: +8.5, retail: -2.5 },
      description: "沪金主力合约"
    },
    {
      id: "AG",
      name: "白银",
      symbol: "AG",
      sector: "贵金属",
      openInterest: 183.0,
      positions: { foreign: +13.0, institutional: +73.4, retail: +31.4 },
      changes: { foreign: +0.5, institutional: +2.8, retail: +1.2 },
      description: "沪银主力合约"
    },
    // 有色金属
    {
      id: "CU",
      name: "铜",
      symbol: "CU",
      sector: "有色金属",
      openInterest: 316.9,
      positions: { foreign: +8.4, institutional: +30.4, retail: -10.7 },
      changes: { foreign: +1.2, institutional: +5.1, retail: -1.5 },
      description: "沪铜主力合约"
    },
    {
      id: "ZN",
      name: "锌",
      symbol: "ZN",
      sector: "有色金属",
      openInterest: 66.5,
      positions: { foreign: +7.7, institutional: +34.4, retail: 0.0 },
      changes: { foreign: +0.8, institutional: +1.8, retail: 0.0 },
      description: "沪锌主力合约"
    },
    {
      id: "AL",
      name: "铝",
      symbol: "AL",
      sector: "有色金属",
      openInterest: 143.6,
      positions: { foreign: -10.1, institutional: +14.1, retail: +3.7 },
      changes: { foreign: -0.5, institutional: +1.1, retail: +0.3 },
      description: "沪铝主力合约"
    },
    {
      id: "NI",
      name: "镍",
      symbol: "NI",
      sector: "有色金属",
      openInterest: 91.2,
      positions: { foreign: -4.3, institutional: -9.4, retail: +6.7 },
      changes: { foreign: -0.2, institutional: -0.8, retail: +0.5 },
      description: "沪镍主力合约"
    },
    // 黑色建材
    {
      id: "RB",
      name: "螺纹钢",
      symbol: "RB",
      sector: "黑色建材",
      openInterest: 204.4,
      positions: { foreign: -22.4, institutional: -21.3, retail: +33.7 },
      changes: { foreign: -1.8, institutional: -4.5, retail: +2.8 },
      description: "螺纹钢主力合约"
    },
    {
      id: "HC",
      name: "热卷",
      symbol: "HC",
      sector: "黑色建材",
      openInterest: 133.0,
      positions: { foreign: -16.3, institutional: +15.3, retail: +8.5 },
      changes: { foreign: +0.3, institutional: -0.8, retail: +0.5 },
      description: "热轧卷板主力合约"
    },
    {
      id: "I",
      name: "铁矿石",
      symbol: "I",
      sector: "黑色建材",
      openInterest: 276.8,
      positions: { foreign: -21.4, institutional: -41.4, retail: +38.7 },
      changes: { foreign: -1.2, institutional: -3.5, retail: +2.1 },
      description: "铁矿石主力合约"
    },
    // 能源
    {
      id: "BU",
      name: "沥青",
      symbol: "BU",
      sector: "能源",
      openInterest: 54.4,
      positions: { foreign: +9.4, institutional: -1.2, retail: +2.3 },
      changes: { foreign: +0.3, institutional: -0.1, retail: +0.1 },
      description: "石油沥青主力合约"
    },
    {
      id: "PG",
      name: "液化气",
      symbol: "PG",
      sector: "能源",
      openInterest: 47.6,
      positions: { foreign: +3.7, institutional: +9.8, retail: -3.9 },
      changes: { foreign: +0.1, institutional: +0.8, retail: -0.4 },
      description: "液化石油气主力合约"
    },
    // 化工材料
    {
      id: "FG",
      name: "玻璃",
      symbol: "FG",
      sector: "化工材料",
      openInterest: 80.7,
      positions: { foreign: -19.0, institutional: -57.3, retail: +42.8 },
      changes: { foreign: -1.0, institutional: -2.8, retail: +1.8 },
      description: "玻璃主力合约"
    },
    {
      id: "V",
      name: "PVC",
      symbol: "V",
      sector: "化工材料",
      openInterest: 91.4,
      positions: { foreign: -16.0, institutional: -39.8, retail: +28.5 },
      changes: { foreign: -0.6, institutional: -1.8, retail: +1.2 },
      description: "聚氯乙烯主力合约"
    },
    {
      id: "TA",
      name: "PTA",
      symbol: "TA",
      sector: "化工材料",
      openInterest: 138.4,
      positions: { foreign: -37.8, institutional: -105.3, retail: +84.3 },
      changes: { foreign: -1.5, institutional: -5.4, retail: +3.8 },
      description: "PTA主力合约"
    },
    // 油脂油料
    {
      id: "M",
      name: "豆粕",
      symbol: "M",
      sector: "油脂油料",
      openInterest: 195.5,
      positions: { foreign: +25.0, institutional: +24.7, retail: -11.4 },
      changes: { foreign: +1.0, institutional: +2.8, retail: -1.2 },
      description: "豆粕主力合约"
    },
    {
      id: "Y",
      name: "豆油",
      symbol: "Y",
      sector: "油脂油料",
      openInterest: 110.5,
      positions: { foreign: +16.1, institutional: +17.7, retail: -9.4 },
      changes: { foreign: +0.6, institutional: +1.5, retail: -0.8 },
      description: "豆油主力合约"
    },
    {
      id: "P",
      name: "棕榈油",
      symbol: "P",
      sector: "油脂油料",
      openInterest: 123.1,
      positions: { foreign: +10.5, institutional: +11.0, retail: -6.1 },
      changes: { foreign: +0.5, institutional: +1.0, retail: -0.6 },
      description: "棕榈油主力合约"
    },
    // 农副软商品
    {
      id: "LH",
      name: "生猪",
      symbol: "LH",
      sector: "农副软商品",
      openInterest: 72.4,
      positions: { foreign: -7.0, institutional: -18.6, retail: +15.9 },
      changes: { foreign: -0.3, institutional: -1.2, retail: +0.8 },
      description: "生猪主力合约"
    },
    {
      id: "SR",
      name: "白糖",
      symbol: "SR",
      sector: "农副软商品",
      openInterest: 94.6,
      positions: { foreign: -10.7, institutional: -12.4, retail: +8.8 },
      changes: { foreign: -0.4, institutional: -0.8, retail: +0.4 },
      description: "白糖主力合约"
    }
  ]
};

// Help helper for sector list
export const SECTORS = [
  "国债",
  "贵金属",
  "有色金属",
  "黑色建材",
  "能源",
  "化工材料",
  "油脂油料",
  "农副软商品"
];

export function getSectorRepSymbols(sector: string): string {
  switch (sector) {
    case "国债": return "30年国债 · 5年国债";
    case "贵金属": return "黄金 · 白银";
    case "有色金属": return "铜 · 锌 · 铝 · 镍";
    case "黑色建材": return "螺纹钢 · 热卷 · 铁矿石";
    case "能源": return "沥青 · 液化气";
    case "化工材料": return "玻璃 · PVC · PTA";
    case "油脂油料": return "豆粕 · 豆油 · 棕榈油";
    case "农副软商品": return "生猪 · 白糖";
    default: return "";
  }
}
