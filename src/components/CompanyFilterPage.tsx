/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Globe, Building2, Users, Search, Check, 
  RotateCcw, ShieldAlert, CheckCircle, Trash2, Sliders, Info
} from 'lucide-react';
import { SeatType } from '../types';

interface CompanyFilterPageProps {
  onBack: () => void;
  initialSeatType?: 'foreign' | 'institutional' | 'custom1' | 'custom2' | 'custom3';
  selectedCompanies: Record<string, Record<'foreign' | 'institutional' | 'custom1' | 'custom2' | 'custom3', string[]>>;
  onUpdateCompanies: (newConfig: Record<string, Record<'foreign' | 'institutional' | 'custom1' | 'custom2' | 'custom3', string[]>>) => void;
  commodities: { id: string; name: string }[];
  customSeatNames: Record<'custom1' | 'custom2' | 'custom3', string>;
  onUpdateSeatNames: (newNames: Record<'custom1' | 'custom2' | 'custom3', string>) => void;
  selectedCustomSeatId?: 'custom1' | 'custom2' | 'custom3';
  onSelectCustomSeat?: (id: 'custom1' | 'custom2' | 'custom3') => void;
}

// Master list of top Chinese futures member companies / brokers
const ALL_AVAILABLE_COMPANIES = [
  // 偏外资 (foreign) - 6 items
  { name: '摩根大通期货', code: 'JPMORGAN', category: 'foreign', desc: '核心外资风向标席位，代理海外QFI/RQFII资金' },
  { name: '乾坤期货', code: 'QIANKUN', category: 'foreign', desc: '高频外资、知名量化外资主要托管通道' },
  { name: '瑞银证券', code: 'UBS', category: 'foreign', desc: '欧洲及亚太主权基金常用QFI代理托管商' },
  { name: '高盛工银期货', code: 'GOLDMAN', category: 'foreign', desc: '国际顶级投行中国区期货代理席位' },
  { name: '汇丰前海证券', code: 'HSBC', category: 'foreign', desc: '偏外资及合资大客户代理成交通道' },
  { name: '野村东方国际', code: 'NOMURA', category: 'foreign', desc: '日资及亚洲机构客户期货配置席位' },

  // 成交量前五会员 (institutional) - 5 items
  { name: '中信期货', code: 'CITIC', category: 'institutional', desc: '成交量前五大核心会员，具有极强机构及量化代表性' },
  { name: '国泰君安期货', code: 'GTJA', category: 'institutional', desc: '成交量前五大核心会员，行业龙头期货结算通道' },
  { name: '永安期货', code: 'YONGAN', category: 'institutional', desc: '成交量前五大核心会员，产业资本及主力资金聚集地' },
  { name: '东证期货', code: 'ORIENT', category: 'institutional', desc: '成交量前五大核心会员，量化与程序化席位主力，资金规模庞大' },
  { name: '华泰期货', code: 'HUATAI', category: 'institutional', desc: '成交量前五大核心会员，核心机构及私募套保重镇' },

  // 用户自定义 (retail) - 候选列表 (with no overlap!)
  { name: '银河期货', code: 'GALAXY', category: 'retail', desc: '大型国有金融背景，央企及机构重点席位' },
  { name: '广发期货', code: 'GF', category: 'retail', desc: '华南核心主力，机构配置及套保重镇' },
  { name: '浙商期货', code: 'ZHESHANG', category: 'retail', desc: '长江三角洲核心产业主力托管席位' },
  { name: '申银万国期货', code: 'SYWG', category: 'retail', desc: '机构和高端高净值席位主要托管商' },
  { name: '东方财富期货', code: 'EASTMONEY', category: 'retail', desc: '全国最大互联网零售聚集地，零售资金风向标' },
  { name: '中原期货', code: 'ZHONGYUAN', category: 'retail', desc: '中原地区及地方零售大单聚集席位' },
  { name: '平安证券期货', code: 'PINGAN', category: 'retail', desc: '零售及互联网个人高净值交易活跃席位' },
  { name: '国信期货', code: 'GUOSEN', category: 'retail', desc: '活跃个人投资者及零售主力结算渠道' },
  { name: '徽商期货', code: 'HUISHANG', category: 'retail', desc: '中部地区活跃零售大单聚集席位' }
];

const DEFAULT_PRESETS: Record<'foreign' | 'institutional' | 'custom1' | 'custom2' | 'custom3', string[]> = {
  foreign: ['摩根大通期货', '乾坤期货', '瑞银证券', '高盛工银期货', '汇丰前海证券', '野村东方国际'],
  institutional: ['国泰君安期货', '中信期货', '永安期货', '东证期货', '华泰期货'],
  custom1: ['银河期货', '广发期货', '浙商期货'],
  custom2: ['申银万国期货', '东方财富期货', '中原期货'],
  custom3: ['平安证券期货', '国信期货', '徽商期货']
};

export default function CompanyFilterPage({
  onBack,
  initialSeatType = 'custom1',
  selectedCompanies,
  onUpdateCompanies,
  commodities,
  customSeatNames,
  onUpdateSeatNames,
  selectedCustomSeatId = 'custom1',
  onSelectCustomSeat
}: CompanyFilterPageProps) {
  // Always lock active edit seat to one of the custom seats
  const [activeSeat, setActiveSeat] = useState<'custom1' | 'custom2' | 'custom3'>(() => {
    if (initialSeatType && ['custom1', 'custom2', 'custom3'].includes(initialSeatType)) {
      return initialSeatType as 'custom1' | 'custom2' | 'custom3';
    }
    return 'custom1';
  });
  
  const [activeVariety, setActiveVariety] = useState<string>('global'); // 'global' or commodityId
  const [searchQuery, setSearchQuery] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Local state to modify before saving
  const [localConfig, setLocalConfig] = useState<Record<string, Record<'foreign' | 'institutional' | 'custom1' | 'custom2' | 'custom3', string[]>>>(() => {
    const copy: Record<string, Record<'foreign' | 'institutional' | 'custom1' | 'custom2' | 'custom3', string[]>> = {};
    Object.keys(selectedCompanies).forEach(key => {
      copy[key] = {
        foreign: [...selectedCompanies[key].foreign],
        institutional: [...selectedCompanies[key].institutional],
        custom1: [...(selectedCompanies[key].custom1 || [])],
        custom2: [...(selectedCompanies[key].custom2 || [])],
        custom3: [...(selectedCompanies[key].custom3 || [])]
      };
    });
    return copy;
  });

  const [localSeatNames, setLocalSeatNames] = useState<Record<'custom1' | 'custom2' | 'custom3', string>>(() => ({
    ...customSeatNames
  }));

  // Active config resolved for the active variety (fallback to global on edit)
  const activeVarietyConfig = useMemo(() => {
    if (!localConfig[activeVariety]) {
      return {
        foreign: [...localConfig.global.foreign],
        institutional: [...localConfig.global.institutional],
        custom1: [...localConfig.global.custom1],
        custom2: [...localConfig.global.custom2],
        custom3: [...localConfig.global.custom3]
      };
    }
    return localConfig[activeVariety];
  }, [localConfig, activeVariety]);

  // Filter for master list: strictly only show 'retail' candidates and exclude any that are part of system-determined foreign/institutional presets
  const filteredAvailableCompanies = useMemo(() => {
    const foreignSet = new Set(DEFAULT_PRESETS.foreign);
    const institutionalSet = new Set(DEFAULT_PRESETS.institutional);
    return ALL_AVAILABLE_COMPANIES.filter(comp => {
      if (comp.category !== 'retail') return false;
      if (foreignSet.has(comp.name) || institutionalSet.has(comp.name)) return false;
      return comp.name.includes(searchQuery) || comp.code.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [searchQuery]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleToggleCompany = (companyName: string) => {
    setLocalConfig(prev => {
      const varietyConfig = prev[activeVariety] ? { ...prev[activeVariety] } : {
        foreign: [...prev.global.foreign],
        institutional: [...prev.global.institutional],
        custom1: [...prev.global.custom1],
        custom2: [...prev.global.custom2],
        custom3: [...prev.global.custom3]
      };
      
      const currentList = varietyConfig[activeSeat] || [];
      let newList: string[];
      if (currentList.includes(companyName)) {
        // Enforce at least 1 checked company constraint for custom seat
        if (currentList.length <= 1) {
          triggerToast('自定义席位请至少保留 1 家代表公司');
          return prev;
        }
        newList = currentList.filter(name => name !== companyName);
      } else {
        newList = [...currentList, companyName];
      }
      
      return {
        ...prev,
        [activeVariety]: {
          ...varietyConfig,
          [activeSeat]: newList
        }
      };
    });
  };

  const handleResetToDefault = () => {
    if (activeVariety === 'global') {
      setLocalConfig(prev => ({
        ...prev,
        global: {
          foreign: [...DEFAULT_PRESETS.foreign],
          institutional: [...DEFAULT_PRESETS.institutional],
          custom1: [...DEFAULT_PRESETS.custom1],
          custom2: [...DEFAULT_PRESETS.custom2],
          custom3: [...DEFAULT_PRESETS.custom3]
        }
      }));
      setLocalSeatNames({
        custom1: '用户自定义席位一',
        custom2: '用户自定义席位二',
        custom3: '用户自定义席位三'
      });
      triggerToast('已重置全局席位公司配置及名称为默认预设');
    } else {
      setLocalConfig(prev => {
        const next = { ...prev };
        delete next[activeVariety];
        return next;
      });
      const commName = commodities.find(com => com.id === activeVariety)?.name || activeVariety;
      triggerToast(`已清除 ${commName} 的差异配置，回归全局默认配置`);
    }
  };

  const handleClearAll = () => {
    setLocalConfig(prev => {
      const varietyConfig = prev[activeVariety] ? { ...prev[activeVariety] } : {
        foreign: [...prev.global.foreign],
        institutional: [...prev.global.institutional],
        custom1: [...prev.global.custom1],
        custom2: [...prev.global.custom2],
        custom3: [...prev.global.custom3]
      };
      
      return {
        ...prev,
        [activeVariety]: {
          ...varietyConfig,
          [activeSeat]: []
        }
      };
    });
    triggerToast('已清空当前席位下的公司');
  };

  const handleSave = () => {
    onUpdateCompanies(localConfig);
    onUpdateSeatNames(localSeatNames);
    triggerToast('持仓席位会员过滤规则及分类名称已成功应用，透视指标已重新计算');
    setTimeout(() => {
      onBack();
    }, 1000);
  };

  const getSeatIcon = (type: string) => {
    switch (type) {
      case 'foreign': return <Globe className="w-5 h-5 text-amber-500" />;
      case 'institutional': return <Building2 className="w-5 h-5 text-red-500" />;
      default: return <Users className="w-5 h-5 text-purple-600" />;
    }
  };

  const getSeatLabel = (type: string) => {
    switch (type) {
      case 'foreign': return '偏外资席位 (FOREIGN SEATS)';
      case 'institutional': return '成交量前五会员 (TOP 5 VOLUME)';
      case 'custom1': return localSeatNames.custom1;
      case 'custom2': return localSeatNames.custom2;
      case 'custom3': return localSeatNames.custom3;
      default: return '用户自定义席位';
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800 font-sans pb-12">
      {/* HEADER BAR */}
      <div className="bg-white border-b border-slate-200 py-4 px-6 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">返回持仓透视</span>
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                <span>席位会员代表公司筛选配置</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">以用户实际选择为准，默认配置仅供示意，不代表公司观点。</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefault}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{activeVariety === 'global' ? '恢复系统预设' : '回归全局默认'}</span>
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>保存并应用过滤规则</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOAST ALERT */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-800 flex items-center gap-2 text-sm font-sans"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        {/* COMPLIANCE DISCLAIMER CARD */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold text-amber-900 block mb-1">合规声明与使用规则说明</span>
            席位归属划分仅针对交易所每日公开的前20名会员「成交量与持仓量」之资金属性统计拟合。此举纯属客观量化特征提取，以用户实际选择为准，默认配置及系统模型划分仅供示意，不代表公司观点与任何确定性买卖推介。用户可依自身分析需要自由调配，市场有风险，决策需谨慎。
          </div>
        </div>

        {/* VARIETY SELECTOR (设置按具体品种筛选席位) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <span>🎯 配置对象及具体品种筛选</span>
              <span className="text-[10px] bg-blue-100 text-blue-700 font-normal px-2 py-0.5 rounded-full">NEW</span>
            </span>
            <p className="text-[11px] text-slate-400 mt-1">您可以针对具体品种（如沪铜/沪银）进行特定的差异席位配置。默认共享全局默认配置。</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={activeVariety}
              onChange={(e) => setActiveVariety(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="global">🌐 全局默认配置 (通用)</option>
              {commodities.map((c) => {
                const hasCustom = !!localConfig[c.id];
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id}) {hasCustom ? '✨ [专属差异配置已启用]' : ''}
                  </option>
                );
              })}
            </select>
            
            {activeVariety !== 'global' && (
              <button
                onClick={() => {
                  if (!localConfig[activeVariety]) {
                    setLocalConfig(prev => ({
                      ...prev,
                      [activeVariety]: {
                        foreign: [...prev.global.foreign],
                        institutional: [...prev.global.institutional],
                        retail: [...prev.global.retail]
                      }
                    }));
                    const name = commodities.find(com => com.id === activeVariety)?.name || activeVariety;
                    triggerToast(`已为 ${name} 品种开启专属差异配置`);
                  } else {
                    setLocalConfig(prev => {
                      const next = { ...prev };
                      delete next[activeVariety];
                      return next;
                    });
                    const name = commodities.find(com => com.id === activeVariety)?.name || activeVariety;
                    triggerToast(`已清除 ${name} 专属专属配置，恢复至全局配置`);
                  }
                }}
                className={`px-3 py-2 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                  localConfig[activeVariety]
                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100/50'
                    : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100/50'
                }`}
              >
                {localConfig[activeVariety] ? '恢复通用全局' : '启用专属差异'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANEL: SEAT SELECTION TABS */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">第一步：席位代表公司构成概览</span>
            
            <div className="space-y-3">
              {/* Readonly Foreign Card */}
              <div className="p-3 bg-slate-50/70 border border-slate-200/50 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-sky-500" />
                    <span className="text-xs font-bold text-slate-800">偏外资席位</span>
                  </div>
                  <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-mono font-bold">🔒 系统默认固化</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {activeVarietyConfig.foreign.map(name => (
                    <span key={name} className="bg-white border border-slate-200/60 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-medium">
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Readonly Institutional Card */}
              <div className="p-3 bg-slate-50/70 border border-slate-200/50 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-bold text-slate-800">成交量前五会员</span>
                  </div>
                  <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-mono font-bold">🔒 系统默认固化</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {activeVarietyConfig.institutional.map(name => (
                    <span key={name} className="bg-white border border-slate-200/60 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-medium">
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Editable Custom Retail Card - Replaced with three customizable categories */}
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">点击切换配置目标 (可编辑名称)：</span>
                {(['custom1', 'custom2', 'custom3'] as const).map(seatId => {
                  const isActive = activeSeat === seatId;
                  const seatName = localSeatNames[seatId];
                  const seatComps = activeVarietyConfig[seatId] || [];

                  return (
                    <div
                      key={seatId}
                      onClick={() => setActiveSeat(seatId)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                        isActive
                          ? 'bg-purple-50/50 border-purple-300 shadow-3xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <Users className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                          <input
                            type="text"
                            value={seatName}
                            onClick={(e) => e.stopPropagation()} // prevent switching tab on input click
                            onChange={(e) => {
                              setLocalSeatNames(prev => ({
                                ...prev,
                                [seatId]: e.target.value
                              }));
                            }}
                            className="bg-transparent border-b border-dashed border-slate-300 focus:border-purple-500 focus:outline-none text-xs font-bold text-slate-800 py-0.5 px-0.5 min-w-0 flex-1 font-sans"
                            placeholder="自定义分类名称"
                            title="点击可直接编辑分类名称"
                          />
                        </div>
                        {isActive ? (
                          <span className="text-[8px] bg-purple-600 text-white px-1.5 py-0.2 rounded font-sans font-bold shrink-0">
                            正在配置
                          </span>
                        ) : (
                          <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-sans font-medium shrink-0">
                            点击配置
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5 max-h-24 overflow-y-auto pr-0.5">
                        {seatComps.length === 0 ? (
                          <span className="text-[9px] text-slate-400 italic py-0.5">未选代表公司 (在右侧勾选)</span>
                        ) : (
                          seatComps.map(name => (
                            <span
                              key={name}
                              className={`text-[9px] px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5 border ${
                                isActive
                                  ? 'bg-white border-purple-200 text-purple-700'
                                  : 'bg-slate-50 border-slate-100 text-slate-500'
                              }`}
                            >
                              {name}
                              {isActive && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleCompany(name);
                                  }}
                                  className="text-purple-400 hover:text-red-500 transition-colors p-0.5 cursor-pointer"
                                  title="点击快速移除"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </span>
                          ))
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-dashed border-slate-150">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCustomSeat?.(seatId);
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-sans font-bold transition-all ${
                            selectedCustomSeatId === seatId
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-slate-200'
                          }`}
                          title="选择该席位分类展示在主界面的「用户自定义席位」摘要卡片中"
                        >
                          {selectedCustomSeatId === seatId ? '★ 当前主页呈现' : '☆ 设为呈现席位'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* RIGHT PANEL: MAIN COMPANY SELECTION LIST */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">第二步：配置该席位的会员构成</span>
                <p className="text-xs text-slate-400 mt-1">请勾选需要计入本席位持仓汇总数据的期货公司：</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="输入公司名称/首字母"
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 transition-all"
                  />
                </div>
                
                <button
                  onClick={handleClearAll}
                  className="px-2.5 py-1.5 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600 rounded-lg text-xs font-medium transition-all cursor-pointer"
                >
                  清空当前席位
                </button>
              </div>
            </div>

            {/* SELECTION GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
              {filteredAvailableCompanies.length === 0 ? (
                <div className="col-span-2 py-8 text-center text-slate-400 italic text-xs">
                  没有搜索结果
                </div>
              ) : (
                filteredAvailableCompanies.map((comp) => {
                  const isChecked = activeVarietyConfig[activeSeat]?.includes(comp.name) || false;
                  
                  // Check if this company is currently configured in another seat
                  let assignedSeat: string | null = null;
                  if (activeVarietyConfig.foreign?.includes(comp.name)) assignedSeat = 'foreign';
                  else if (activeVarietyConfig.institutional?.includes(comp.name)) assignedSeat = 'institutional';
                  else {
                    const otherCustoms = (['custom1', 'custom2', 'custom3'] as const).filter(id => id !== activeSeat);
                    for (const id of otherCustoms) {
                      if (activeVarietyConfig[id]?.includes(comp.name)) {
                        assignedSeat = id;
                        break;
                      }
                    }
                  }

                  return (
                    <div
                      key={comp.name}
                      onClick={() => handleToggleCompany(comp.name)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 relative select-none ${
                        isChecked 
                          ? 'bg-blue-50/40 border-blue-400 shadow-2xs' 
                          : 'bg-white border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      {/* Checkbox circle */}
                      <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        isChecked 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'border-slate-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900 truncate">{comp.name}</span>
                          <span className="font-mono text-[8px] bg-slate-100 border border-slate-200 px-1 py-0.1 rounded text-slate-400 font-normal">
                            {comp.code}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{comp.desc}</p>
                        
                        {/* Conflict warning badge */}
                        {assignedSeat && (
                          <span className="inline-flex items-center gap-1 text-[8px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 mt-1.5">
                            <Info className="w-2.5 h-2.5" />
                            <span>已被划分在「{
                              assignedSeat === 'foreign' 
                                ? '偏外资' 
                                : assignedSeat === 'institutional' 
                                  ? '成交量前五会员' 
                                  : localSeatNames[assignedSeat as 'custom1' | 'custom2' | 'custom3']
                            }」席位中</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* PRESET INFORMATION EXPLANATION */}
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-[11px] leading-relaxed text-slate-500 mt-4">
              <span className="font-bold text-slate-700 block mb-1">💡 席位划分与量化归因子系统说明:</span>
              <ul className="list-disc pl-4 space-y-1">
                <li>系统根据交易所每日公开的「前20会员买卖单、净持仓」进行数据归并计算。</li>
                <li>偏外资、偏机构、偏零售三大属性系根据公开的历史相关系数和托管行通道特征总结得出的合规基准。</li>
                <li>您在这里保存的任何席位变更将<strong className="text-blue-600">即时渲染并生效</strong>于当前的持仓大盘。</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
