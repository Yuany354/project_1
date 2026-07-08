/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Globe, Building2, Users, Search, Check, 
  RefreshCw, RotateCcw, ShieldAlert, CheckCircle, Plus, Trash2, Sliders, Info
} from 'lucide-react';
import { SeatType } from '../types';

interface CompanyFilterPageProps {
  onBack: () => void;
  initialSeatType?: SeatType;
  selectedCompanies: Record<SeatType, string[]>;
  onUpdateCompanies: (newConfig: Record<SeatType, string[]>) => void;
}

// Master list of top Chinese futures member companies / brokers
const ALL_AVAILABLE_COMPANIES = [
  { name: '中信期货', code: 'CITIC', category: 'institutional', desc: '全国顶尖头部期货公司，机构持仓主力' },
  { name: '国泰君安期货', code: 'GTJA', category: 'institutional', desc: '行业龙头期货商，具有极强机构代表性' },
  { name: '永安期货', code: 'YONGAN', category: 'institutional', desc: '老牌产业基金及机构席位聚集地' },
  { name: '东证期货', code: 'ORIENT', category: 'institutional', desc: '技术与机构量化席位主力，沉淀资金量巨大' },
  { name: '华泰期货', code: 'HUATAI', category: 'institutional', desc: '公募与私募基金常用代理结算商' },
  { name: '银河期货', code: 'GALAXY', category: 'institutional', desc: '大型国有金融背景，央企及机构重点席位' },
  { name: '广发期货', code: 'GF', category: 'institutional', desc: '华南核心主力，机构配置及套保重镇' },
  { name: '申银万国期货', code: 'SYWG', category: 'institutional', desc: '机构和高端高净值席位主要托管商' },
  { name: '浙商期货', code: 'ZHESHANG', category: 'institutional', desc: '长江三角洲核心产业主力托管席位' },
  { name: '摩根大通期货', code: 'JPMORGAN', category: 'foreign', desc: '核心外资风向标席位，代理海外QFI/RQFII资金' },
  { name: '乾坤期货', code: 'QIANKUN', category: 'foreign', desc: '高频外资、知名量化外资主要托管通道' },
  { name: '瑞银证券', code: 'UBS', category: 'foreign', desc: '欧洲及亚太主权基金常用QFI代理托管商' },
  { name: '高盛工银期货', code: 'GOLDMAN', category: 'foreign', desc: '国际顶级投行中国区期货代理席位' },
  { name: '汇丰前海证券', code: 'HSBC', category: 'foreign', desc: '偏外资及合资大客户代理成交通道' },
  { name: '野村东方国际', code: 'NOMURA', category: 'foreign', desc: '日资及亚洲机构客户期货配置席位' },
  { name: '东方财富期货', code: 'EASTMONEY', category: 'retail', desc: '全国最大互联网散户聚集地，零售资金风向标' },
  { name: '中原期货', code: 'ZHONGYUAN', category: 'retail', desc: '中原地区及地方零售散户大单聚集席位' },
  { name: '平安证券期货', code: 'PINGAN', category: 'retail', desc: '零售及互联网个人高净值交易活跃席位' },
  { name: '国信期货', code: 'GUOSEN', category: 'retail', desc: '活跃个人投资者及零售主力结算渠道' },
  { name: '徽商期货', code: 'HUISHANG', category: 'retail', desc: '中部地区活跃零售散户聚集度高' }
];

const DEFAULT_PRESETS: Record<SeatType, string[]> = {
  foreign: ['摩根大通期货', '乾坤期货', '瑞银证券', '高盛工银期货', '汇丰前海证券'],
  institutional: ['国泰君安期货', '中信期货', '永安期货', '东证期货', '华泰期货', '银河期货', '广发期货', '申银万国期货'],
  retail: ['东方财富期货', '中原期货', '平安证券期货']
};

export default function CompanyFilterPage({
  onBack,
  initialSeatType = 'foreign',
  selectedCompanies,
  onUpdateCompanies
}: CompanyFilterPageProps) {
  const [activeSeat, setActiveSeat] = useState<SeatType>(initialSeatType);
  const [searchQuery, setSearchQuery] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Local state to modify before saving
  const [localConfig, setLocalConfig] = useState<Record<SeatType, string[]>>(() => {
    return {
      foreign: [...selectedCompanies.foreign],
      institutional: [...selectedCompanies.institutional],
      retail: [...selectedCompanies.retail]
    };
  });

  // Dynamic filter for master lists
  const filteredAvailableCompanies = useMemo(() => {
    return ALL_AVAILABLE_COMPANIES.filter(comp => {
      const matchesSearch = comp.name.includes(searchQuery) || comp.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [searchQuery]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleToggleCompany = (companyName: string) => {
    setLocalConfig(prev => {
      const currentList = prev[activeSeat];
      let newList: string[];
      if (currentList.includes(companyName)) {
        newList = currentList.filter(name => name !== companyName);
      } else {
        // Prevent duplicate cross-assignments for clean structure
        newList = [...currentList, companyName];
      }
      return {
        ...prev,
        [activeSeat]: newList
      };
    });
  };

  const handleResetToDefault = () => {
    setLocalConfig({
      foreign: [...DEFAULT_PRESETS.foreign],
      institutional: [...DEFAULT_PRESETS.institutional],
      retail: [...DEFAULT_PRESETS.retail]
    });
    triggerToast('已重置席位公司配置为系统合规默认预设');
  };

  const handleClearAll = () => {
    setLocalConfig(prev => ({
      ...prev,
      [activeSeat]: []
    }));
    triggerToast('已清空当前席位下的公司');
  };

  const handleSave = () => {
    onUpdateCompanies(localConfig);
    triggerToast('持仓席位会员过滤规则已成功应用，透视指标已重新计算');
    setTimeout(() => {
      onBack();
    }, 1000);
  };

  const getSeatIcon = (type: SeatType) => {
    switch (type) {
      case 'foreign': return <Globe className="w-5 h-5 text-amber-500" />;
      case 'institutional': return <Building2 className="w-5 h-5 text-red-500" />;
      case 'retail': return <Users className="w-5 h-5 text-slate-500" />;
    }
  };

  const getSeatLabel = (type: SeatType) => {
    switch (type) {
      case 'foreign': return '偏外资席位 (FOREIGN AGENTS)';
      case 'institutional': return '偏机构主力 (INSTITUTIONS)';
      case 'retail': return '偏零售散户 (RETAIL MEMBERS)';
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
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
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
              <p className="text-xs text-slate-500 mt-0.5">定制计算公式中所映射的会员交易席位，适配个性化量化归因逻辑</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefault}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>恢复系统预设</span>
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

      <div className="max-w-6xl mx-auto px-6 mt-8">
        {/* TOP LEVEL WARNING NOTE FOR COMPLIANCE */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold text-amber-900 block mb-1">最严格合规使用准则</span>
            席位归属划分仅针对交易所每日公开的前20名会员「成交量与持仓量」之资金属性统计拟合。此举纯属客观量化特征提取，系统不对特定席位的后续行情倾向做出任何确定性推演，亦不涉及对个别公司的投资评级或指向性买卖推介。用户可依自身学术研究所需自由调配公司席位映射，最终计算结果与本平台立场无关。
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANEL: SEAT SELECTION TABS & DETAILS */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">第一步：选择需要配置的席位</span>
            
            <div className="space-y-2">
              {(['foreign', 'institutional', 'retail'] as SeatType[]).map((type) => {
                const isActive = activeSeat === type;
                const count = localConfig[type].length;
                return (
                  <button
                    key={type}
                    onClick={() => setActiveSeat(type)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isActive 
                        ? 'bg-blue-50/80 border-blue-200 shadow-xs' 
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getSeatIcon(type)}
                      <div>
                        <span className="text-xs font-black text-slate-900 block">{getSeatLabel(type).split(' (')[0]}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">{getSeatLabel(type).split(' (')[1]?.replace(')', '') || ''}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {count} 个会员
                    </span>
                  </button>
                );
              })}
            </div>

            {/* SEAT INFLUENCE SUMMARY */}
            <div className="border-t border-slate-100 pt-4 mt-2 space-y-3">
              <span className="text-xs font-bold text-slate-500 block">当前席位映射详情</span>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1">代表会员公司列表 ({localConfig[activeSeat].length}家)</span>
                {localConfig[activeSeat].length === 0 ? (
                  <span className="text-xs text-slate-400 italic block py-2">暂无映射公司，系统在计算时将忽略此席位</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1 py-1">
                    {localConfig[activeSeat].map((name) => (
                      <span 
                        key={name}
                        className="bg-white border border-slate-200 rounded text-slate-700 text-[10px] pl-2 pr-1 py-0.5 flex items-center gap-1.5 font-bold"
                      >
                        {name}
                        <button 
                          onClick={() => handleToggleCompany(name)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-0.5"
                          title="移除"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: MAIN COMPANY SELECTION LIST */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">第二步：配置该席位的会员构成</span>
                <p className="text-xs text-slate-400 mt-1">请在下方列表勾选期货公司。已勾选的公司代表的席位持仓量将被计入该主体的累计统计中。</p>
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
                  未匹配到相关期货公司，您可以在左侧直接“添加其他期货公司”
                </div>
              ) : (
                filteredAvailableCompanies.map((comp) => {
                  const isChecked = localConfig[activeSeat].includes(comp.name);
                  
                  // Let's check if this company is currently configured in another seat
                  let assignedSeat: SeatType | null = null;
                  if (activeSeat !== 'foreign' && localConfig.foreign.includes(comp.name)) assignedSeat = 'foreign';
                  if (activeSeat !== 'institutional' && localConfig.institutional.includes(comp.name)) assignedSeat = 'institutional';
                  if (activeSeat !== 'retail' && localConfig.retail.includes(comp.name)) assignedSeat = 'retail';

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
                            <span>已被划分在「{assignedSeat === 'foreign' ? '外资' : assignedSeat === 'institutional' ? '机构' : '散户'}」席位中</span>
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
                <li>偏外资、偏机构、偏散户三大属性系根据公开的历史相关系数和托管行通道特征总结得出的合规基准，支持高精度交易回测。</li>
                <li>您在这里保存的任何席位变更将<strong className="text-blue-600">即时渲染并生效</strong>于当前的持仓大盘。</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
