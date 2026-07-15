/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  COMMODITIES_BY_DATE, 
  DATES 
} from './data';
import { Commodity } from './types';
import SeatPositionSummary from './components/SeatPositionSummary';
import SectorDirectionQuickView from './components/SectorDirectionQuickView';
import InstitutionalConsistencyMap from './components/InstitutionalConsistencyMap';
import EvaluationBadge from './components/EvaluationBadge';
import { 
  getCommodityCustomSignal, 
  isOriginalStrongSignal, 
  DEFAULT_SIGNAL_CONFIG,
  SignalConfig
} from './utils/signal';
import { 
  Calendar, 
  Search,
  Star,
  Layers,
  HelpCircle,
  FileText,
  TrendingUp,
  Sliders,
  ChevronLeft,
  ChevronRight,
  BookmarkCheck,
  RotateCcw,
  Check,
  Info,
  Bell,
  User,
  Sun,
  Activity,
  ChevronDown,
  Database,
  Cpu,
  BookOpen,
  Trophy,
  ListOrdered,
  Globe,
  Building2,
  Users,
  X,
  ThumbsUp,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  SlidersHorizontal
} from 'lucide-react';

export default function App() {
  // States
  const [viewMode, setViewMode] = useState<'main' | 'companyFilter'>('main');
  const [focusedSeatType, setFocusedSeatType] = useState<'foreign' | 'institutional' | 'retail'>('foreign');
  const [selectedCompanies, setSelectedCompanies] = useState<Record<string, Record<'foreign' | 'institutional' | 'retail', string[]>>>({
    global: {
      foreign: ['摩根大通期货', '乾坤期货', '瑞银证券', '高盛工银期货', '汇丰前海证券'],
      institutional: ['国泰君安期货', '中信期货', '永安期货', '东证期货', '华泰期货', '银河期货', '广发期货', '申银万国期货'],
      retail: ['东方财富期货', '中原期货', '平安证券期货']
    }
  });

  const [signalConfig, setSignalConfig] = useState<SignalConfig>(DEFAULT_SIGNAL_CONFIG);
  const [signalConfigTab, setSignalConfigTab] = useState<'long' | 'short'>('long');
  const [isSignalConfigOpen, setIsSignalConfigOpen] = useState<boolean>(false);

  const [activePortalTab, setActivePortalTab] = useState<string>('持仓透视');
  const [activePortalSubmenu, setActivePortalSubmenu] = useState<string>('机构持仓全景');
  const [isCompareDrawerOpen, setIsCompareDrawerOpen] = useState<boolean>(true);
  const [drawerSearchQuery, setDrawerSearchQuery] = useState<string>('');
  const [hoveringStrong, setHoveringStrong] = useState<boolean>(false);

  const [selectedDate, setSelectedDate] = useState<string>("2026.06.29");

  // Since we only have static data for 2026.06.27, 28, 29, let's map any other selected date to one of these three
  // so that the dashboard is fully populated for any date they select in the calendar!
  const effectiveDate = useMemo(() => {
    if (COMMODITIES_BY_DATE[selectedDate]) {
      return selectedDate;
    }
    // Try to parse the day of the selected date.
    const parts = selectedDate.split('.');
    const dayNum = parts[2] ? parseInt(parts[2], 10) : 29;
    if (isNaN(dayNum)) return '2026.06.29';
    
    // map even days to 06.28, odd days divisible by 3 to 06.27, others to 06.29
    if (dayNum % 2 === 0) {
      return '2026.06.28';
    } else if (dayNum % 3 === 0) {
      return '2026.06.27';
    } else {
      return '2026.06.29';
    }
  }, [selectedDate]);

  // Convert a YYYY.MM.DD date to YYYY-MM-DD for the input value
  const dateInputValue = useMemo(() => {
    return selectedDate.replace(/\./g, '-');
  }, [selectedDate]);

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // "YYYY-MM-DD"
    if (!val) return;
    const formatted = val.replace(/-/g, '.');
    setSelectedDate(formatted);
  };

  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'long' | 'short' | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyShowFavorites, setOnlyShowFavorites] = useState<boolean>(false);
  const [compareMode, setCompareMode] = useState<'single' | 'multi'>('single');

  // Sorting states for Section 04 Core Variety Panorama
  const [sortField, setSortField] = useState<'openInterest' | 'flow' | 'foreign' | 'institutional' | 'retail' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Hover state for Section 04 table rows to show exact position breakdown
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Favorites state loaded from/saved to localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('qd_futures_favorites');
    return saved ? JSON.parse(saved) : ['ZN', 'AU', 'CU']; // Standard defaults
  });

  useEffect(() => {
    localStorage.setItem('qd_futures_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Get raw commodities for selected date (internal seat configuration calculations applied)
  const rawCommodities = useMemo(() => {
    return COMMODITIES_BY_DATE[effectiveDate] || COMMODITIES_BY_DATE["2026.06.29"];
  }, [effectiveDate]);

  // Selected commodities for view/compare (single vs multiple)
  const [selectedCommodityIds, setSelectedCommodityIds] = useState<string[]>(['ZN']);

  // Dynamic single selected commodity for deep view
  const selectedCommodity = useMemo(() => {
    const activeId = selectedCommodityIds[0] || 'ZN';
    return rawCommodities.find(c => c.id === activeId) || rawCommodities[0] || null;
  }, [selectedCommodityIds, rawCommodities]);

  // Selected multiple commodities details
  const selectedCommoditiesList = useMemo(() => {
    return rawCommodities.filter(c => selectedCommodityIds.includes(c.id));
  }, [selectedCommodityIds, rawCommodities]);

  // Toggle favorite helper
  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  // Filtered commodities based on top signals, sector, favorites, search query and signal filter
  const filteredCommodities = useMemo(() => {
    let result = [...rawCommodities];

    // Filter by favorites
    if (onlyShowFavorites) {
      result = result.filter(c => favorites.includes(c.id));
    }

    // Filter by sector
    if (selectedSector) {
      result = result.filter(c => c.sector === selectedSector);
    }

    // Filter by search query (id or name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.id.toLowerCase().includes(q) || 
        c.name.toLowerCase().includes(q)
      );
    }

    // Filter by signal type
    if (activeFilter) {
      result = result.filter(c => {
        const sig = getCommodityCustomSignal(c, signalConfig);
        if (activeFilter === 'long') return sig === 'long'; 
        if (activeFilter === 'short') return sig === 'short';
        if (activeFilter === 'all') return sig === 'long' || sig === 'short';
        return true;
      });
    }

    return result;
  }, [rawCommodities, selectedSector, searchQuery, onlyShowFavorites, favorites, activeFilter, signalConfig]);

  const currentSectionsDataset = useMemo(() => {
    if (compareMode === 'multi') {
      return selectedCommoditiesList;
    }
    return rawCommodities;
  }, [compareMode, selectedCommoditiesList, rawCommodities]);

  const currentFilteredDataset = useMemo(() => {
    if (compareMode === 'multi') {
      let result = [...selectedCommoditiesList];
      if (activeFilter) {
        result = result.filter(c => {
          const sig = getCommodityCustomSignal(c, signalConfig);
          if (activeFilter === 'long') return sig === 'long';
          if (activeFilter === 'short') return sig === 'short';
          if (activeFilter === 'all') return sig === 'long' || sig === 'short';
          return true;
        });
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        result = result.filter(c => c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
      }
      return result;
    }
    return filteredCommodities;
  }, [compareMode, selectedCommoditiesList, filteredCommodities, activeFilter, searchQuery, signalConfig]);

  // Sorting data logic for Section 04 Core Variety Panorama
  const sortedTableData = useMemo(() => {
    const baseData = compareMode === 'multi' ? selectedCommoditiesList : filteredCommodities;
    if (!sortField) return baseData;
    
    return [...baseData].sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortField === 'openInterest') {
        valA = a.openInterest;
        valB = b.openInterest;
      } else if (sortField === 'flow') {
        valA = a.changes.foreign + a.changes.institutional;
        valB = b.changes.foreign + b.changes.institutional;
      } else if (sortField === 'foreign') {
        valA = a.positions.foreign;
        valB = b.positions.foreign;
      } else if (sortField === 'institutional') {
        valA = a.positions.institutional;
        valB = b.positions.institutional;
      } else if (sortField === 'retail') {
        valA = a.positions.retail;
        valB = b.positions.retail;
      }
      
      if (sortDirection === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    });
  }, [compareMode, selectedCommoditiesList, filteredCommodities, sortField, sortDirection]);

  const handleSort = (field: 'openInterest' | 'flow' | 'foreign' | 'institutional' | 'retail') => {
    if (sortField === field) {
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else {
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Top movers logic for merged Section 04 and 05 (Today's Key Changes)
  const topMovers = useMemo(() => {
    const list = compareMode === 'multi' ? selectedCommoditiesList : filteredCommodities;
    return [...list]
      .sort((a, b) => {
        const aSumChg = Math.abs(a.changes.foreign) + Math.abs(a.changes.institutional) + Math.abs(a.changes.retail);
        const bSumChg = Math.abs(b.changes.foreign) + Math.abs(b.changes.institutional) + Math.abs(b.changes.retail);
        return bSumChg - aSumChg;
      })
      .slice(0, 4);
  }, [compareMode, selectedCommoditiesList, filteredCommodities]);

  // Handle selecting a commodity (click on map or table)
  const handleSelectCommodity = (commodity: Commodity) => {
    if (compareMode === 'single') {
      setSelectedCommodityIds([commodity.id]);
    } else {
      setSelectedCommodityIds(prev => 
        prev.includes(commodity.id) 
          ? prev.filter(id => id !== commodity.id) 
          : [...prev, commodity.id]
      );
    }
  };

  // Helper: Get behavior and direction action description (Mainland China Standard)
  // Positive is RED (+), Negative is GREEN (-)
  const getBehavior = (position: number, change: number) => {
    if (position >= 0) {
      if (change > 0) return { label: '加多', bg: 'bg-red-50 text-red-700 border-red-200', isBullish: true };
      if (change < 0) return { label: '减多', bg: 'bg-green-50 text-green-700 border-green-200', isBullish: false };
    } else {
      if (change < 0) return { label: '加空', bg: 'bg-green-50 text-green-700 border-green-200', isBullish: false };
      if (change > 0) return { label: '减空', bg: 'bg-red-50 text-red-700 border-red-200', isBullish: true };
    }
    return { label: '持平', bg: 'bg-slate-100 text-slate-600 border-slate-200', isBullish: null };
  };

  const getCommoditySignalDesc = (c: Commodity) => {
    const sig = getCommodityCustomSignal(c, signalConfig);
    if (sig === 'long') {
      return {
        label: '偏多',
        color: 'bg-red-50 text-red-700 border-red-200 font-extrabold',
        tier: '用户自定义：偏多信号'
      };
    } else if (sig === 'short') {
      return {
        label: '偏空',
        color: 'bg-green-50 text-green-700 border-green-200 font-extrabold',
        tier: '用户自定义：偏空信号'
      };
    } else {
      return {
        label: '—',
        color: 'bg-slate-50 text-slate-400 border-slate-200',
        tier: '用户自定义：无信号'
      };
    }
  };

  const getBehaviorConclusion = (c: Commodity) => {
    const sig = getCommodityCustomSignal(c, signalConfig);
    if (sig === 'long') {
      return {
        label: '偏多',
        color: 'bg-red-50 text-red-700 border-red-200 font-extrabold'
      };
    } else if (sig === 'short') {
      return {
        label: '偏空',
        color: 'bg-green-50 text-green-700 border-green-200 font-extrabold'
      };
    } else {
      return {
        label: '—',
        color: 'bg-slate-50 text-slate-400 border-slate-200'
      };
    }
  };

  const formatFund = (num: number) => {
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(1)} 亿`;
  };

  const getChgBehaviorLabelAndStyle = (pos: number, chg: number) => {
    if (pos >= 0) {
      if (chg >= 0) {
        return { label: '加多', style: 'bg-red-50 text-red-700 border border-red-200/50' };
      } else {
        return { label: '减多', style: 'bg-green-50 text-green-700 border border-green-200/50' };
      }
    } else {
      if (chg < 0) {
        return { label: '加空', style: 'bg-green-50 text-green-700 border border-green-200/50' };
      } else {
        return { label: '减空', style: 'bg-red-50 text-red-700 border border-red-200/50' };
      }
    }
  };

  const getContractCode = (id: string) => {
    const codes: Record<string, string> = {
      CU: 'CU2608',
      ZN: 'ZN2608',
      AL: 'AL2608',
      NI: 'NI2608',
      RB: 'RB2610',
      HC: 'HC2610',
      I: 'I2609',
      JM: 'JM2609',
      J: 'J2609',
      FG: 'FG2609',
      TA: 'TA2609',
      MA: 'MA2609',
      SR: 'SR2609',
      CF: 'CF2609',
      RU: 'RU2609',
      Y: 'Y2609'
    };
    return codes[id.toUpperCase()] || `${id}2609`;
  };

  // Limit value for progress bar normalizing
  const maxPositionLimit = useMemo(() => {
    let maxVal = 20;
    rawCommodities.forEach(c => {
      const f = Math.abs(c.positions.foreign);
      const i = Math.abs(c.positions.institutional);
      const r = Math.abs(c.positions.retail);
      if (f > maxVal) maxVal = f;
      if (i > maxVal) maxVal = i;
      if (r > maxVal) maxVal = r;
    });
    return maxVal;
  }, [rawCommodities]);

  const maxChangeLimit = useMemo(() => {
    let maxVal = 5;
    rawCommodities.forEach(c => {
      const f = Math.abs(c.changes.foreign);
      const i = Math.abs(c.changes.institutional);
      const r = Math.abs(c.changes.retail);
      if (f > maxVal) maxVal = f;
      if (i > maxVal) maxVal = i;
      if (r > maxVal) maxVal = r;
    });
    return maxVal;
  }, [rawCommodities]);

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* LEVEL 1: CORPORATE TOP BAR (Guotai Junan Futures style - Light Theme) */}
      <header className="bg-white text-slate-800 border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="w-full max-w-[1750px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo & Corporate Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <div className="relative w-8 h-8 flex items-center justify-center">
                {/* Blue outer circle */}
                <div className="absolute inset-0 rounded-full border-[2.5px] border-blue-600"></div>
                {/* Red inner overlapping circle */}
                <div className="absolute w-4.5 h-4.5 rounded-full bg-red-500 -right-0.5 -bottom-0.5 border-2 border-white"></div>
                {/* Center mark */}
                <span className="font-sans font-black text-[12px] text-blue-700 z-10">G</span>
              </div>
              <div className="ml-3 flex flex-col">
                <span className="text-base font-black tracking-tight text-slate-900 font-sans leading-none flex items-center gap-1.5">
                  国泰君安期货 
                  <span className="text-xs font-normal text-slate-500">| 机构一站式服务平台</span>
                </span>
                <span className="text-[9px] text-slate-400 font-mono tracking-widest leading-none mt-1">GUOTAI JUNAN FUTURES CO., LTD.</span>
              </div>
            </div>
          </div>

          {/* Central Portal Navigation Links */}
          <nav className="hidden xl:flex items-center gap-6 text-sm font-sans font-medium text-slate-600">
            <button className="hover:text-blue-600 transition-colors cursor-pointer">首页</button>
            <button className="hover:text-blue-600 transition-colors cursor-pointer">研究服务</button>
            <div className="relative py-1 text-blue-600 border-b-2 border-blue-600 font-bold cursor-pointer">
              市场洞察
            </div>
            <button className="hover:text-blue-600 transition-colors cursor-pointer">API云市场</button>
            <button className="hover:text-blue-600 transition-colors cursor-pointer">场外衍生品</button>
            <button className="hover:text-blue-600 transition-colors cursor-pointer">业务办理</button>
            <button className="hover:text-blue-600 transition-colors cursor-pointer">行情交易</button>
          </nav>

          {/* Right Action Icons & Profile Info */}
          <div className="flex items-center gap-4 text-slate-500">
            <button className="p-1.5 hover:bg-slate-100 rounded transition-colors cursor-pointer" title="检索">
              <Search className="w-4 h-4" />
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="p-1.5 hover:bg-slate-100 rounded transition-colors cursor-pointer" 
              title="刷新数据"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-slate-100 rounded transition-colors cursor-pointer" title="切换模式">
              <Sun className="w-4 h-4 text-amber-500" />
            </button>
            <div className="relative">
              <button className="p-1.5 hover:bg-slate-100 rounded transition-colors cursor-pointer" title="消息通知">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] px-1 rounded-full font-bold">4</span>
              </button>
            </div>
            
            {/* User Profile */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-blue-600 border border-blue-400 flex items-center justify-center font-bold text-xs text-white">
                YY
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs text-slate-800 font-bold max-w-[120px] truncate leading-none">yiyuanzhang</span>
                <span className="text-[9px] text-slate-400 font-mono mt-0.5">机构交易员</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
            </div>
          </div>
        </div>
      </header>

      {/* LEVEL 2: SECONDARY PLATFORM TAB MENU (Subheaders as seen in screenshot) */}
      <div className="bg-white border-b border-slate-200 py-2.5 shadow-sm px-4">
        <div className="w-full max-w-[1750px] mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Interactive Tab Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 font-medium">
            <button className="px-3 py-1.5 rounded-md hover:bg-slate-50 flex items-center gap-1 cursor-not-allowed text-slate-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>期货市场</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            
            <button className="px-3 py-1.5 rounded-md hover:bg-slate-50 flex items-center gap-1 cursor-not-allowed text-slate-400">
              <Activity className="w-3.5 h-3.5" />
              <span>市场全景</span>
            </button>

            <button className="px-3 py-1.5 rounded-md hover:bg-slate-50 flex items-center gap-1 cursor-not-allowed text-slate-400">
              <Search className="w-3.5 h-3.5" />
              <span>行情扫描</span>
            </button>

            <button className="px-3 py-1.5 rounded-md hover:bg-slate-50 flex items-center gap-1 cursor-not-allowed text-slate-400">
              <Database className="w-3.5 h-3.5" />
              <span>市场结构</span>
            </button>

            {/* ACTIVE TAB: 持仓透视 (With exact styled highlights as shown in screenshot) */}
            <div className="bg-blue-50 border border-blue-200/80 rounded-md px-3 py-1.5 text-blue-700 font-bold flex items-center gap-1.5 shadow-xs">
              <BookmarkCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>持仓透视</span>
            </div>

            <button className="px-3 py-1.5 rounded-md hover:bg-slate-50 flex items-center gap-1 cursor-not-allowed text-slate-400">
              <Cpu className="w-3.5 h-3.5" />
              <span>量化工具</span>
            </button>

            <button className="px-3 py-1.5 rounded-md hover:bg-slate-50 flex items-center gap-1 cursor-not-allowed text-slate-400">
              <Bell className="w-3.5 h-3.5" />
              <span>我的订阅/告警</span>
            </button>

            <button className="px-3 py-1.5 rounded-md hover:bg-slate-50 flex items-center gap-1 cursor-not-allowed text-slate-400">
              <BookOpen className="w-3.5 h-3.5" />
              <span>重大事件分析</span>
              <span className="bg-red-500 text-white text-[8px] px-1 rounded-full scale-90">最新</span>
            </button>
          </div>

        </div>
      </div>

      {/* OLD TOP CONTROL CONSOLE REMOVED */}


      <div className="w-full max-w-[1750px] mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* SIDEBAR 1: 持仓透视 MENU (Width-64, sticky, elegant light theme matching the red boxed region in user image) */}
          <div className="w-full lg:w-64 shrink-0 bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col gap-4 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto self-start">
            <div className="border-b border-slate-100 pb-2.5">
              <span className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <BookmarkCheck className="w-4 h-4 text-blue-600" />
                <span>持仓透视</span>
              </span>
              <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                监控本期前20主力会员博弈、累计净成交量及席位大单变化轨迹。
              </p>
            </div>

            {/* Menu Items */}
            <div className="flex flex-col gap-1 text-xs">
              {[
                { id: '机构持仓全景', label: '机构持仓全景', icon: Layers, desc: '大类资产与主力席位透视' },
                { id: '品种持仓联动', label: '品种持仓联动', icon: Activity, desc: '多客群席位联动与逆向博弈' },
                { id: '合约龙虎榜单', label: '合约龙虎榜单', icon: Trophy, desc: '前20会员买卖建仓实况表' },
                { id: '现货仓单日报', label: '现货仓单日报', icon: FileText, desc: '最新交易所注册仓单数据' },
                { id: '主力多空排位', label: '主力多空排位', icon: ListOrdered, desc: '席位多空净头寸龙虎看板' }
              ].map((item) => {
                const isActive = activePortalSubmenu === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePortalSubmenu(item.id)}
                    className={`w-full text-left p-2.5 rounded-lg transition-all flex items-start gap-2.5 cursor-pointer relative ${
                      isActive 
                        ? 'bg-blue-50/80 text-blue-700 font-bold border border-blue-100/50 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 rounded-r"></div>
                    )}
                    <IconComponent className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div className="flex flex-col min-w-0">
                      <span className="leading-tight">{item.label}</span>
                      <span className={`text-[9px] font-normal truncate mt-0.5 ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>
                        {item.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Regulatory compliance quick tag */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 leading-normal font-sans">
              <span className="font-bold text-slate-500 block mb-0.5">机构风险提示</span>
              数据基于交易所结算，不构成特定推荐。市场行为瞬息万变，请合理控制仓位。
            </div>
          </div>

          {/* RIGHT MAIN WORKSPACE */}
          <div className="flex-1 min-w-0 flex flex-col gap-1">

            {/* SLEEK, TWO-ROW CONTROL PANEL & SIGNAL FILTER BAR (Ensuring zero overlapping and perfect spacing in all screen sizes) */}
            <div className="w-full bg-white border border-slate-200/90 shadow-sm rounded-xl p-4 mb-6 flex flex-col gap-4" id="section-control-panel-bar">
              {/* Row 1: Mode Switch & Favorites / Search */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                {/* Left: Mode Selection */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-slate-500 font-bold font-sans flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    <span>分析模式:</span>
                  </span>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/60 shrink-0">
                    <button
                      onClick={() => {
                        setCompareMode('single');
                        setSelectedCommodityIds([selectedCommodity?.id || 'ZN']);
                      }}
                      className={`px-5 py-1.5 text-xs rounded-md font-bold cursor-pointer transition-all whitespace-nowrap ${
                        compareMode === 'single'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      全品种全景
                    </button>
                    <button
                      onClick={() => {
                        setCompareMode('multi');
                        setIsCompareDrawerOpen(true);
                      }}
                      className={`px-5 py-1.5 text-xs rounded-md font-bold cursor-pointer transition-all whitespace-nowrap ${
                        compareMode === 'multi'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      自选品种透视
                    </button>
                  </div>
                  {compareMode === 'multi' && (
                    <button
                      onClick={() => setIsCompareDrawerOpen(true)}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 duration-150"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>配置筛选品种 ({selectedCommodityIds.length})</span>
                    </button>
                  )}
                </div>

                {/* Right: Favorites Toggle & Search bar */}
                <div className="flex items-center gap-3">
                  {/* Favorites Checkbox with whitespace-nowrap and solid spacing */}
                  <label className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 px-3.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer transition-colors text-xs text-slate-700 font-bold whitespace-nowrap shrink-0">
                    <input 
                      type="checkbox"
                      checked={onlyShowFavorites}
                      onChange={(e) => setOnlyShowFavorites(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white h-3.5 w-3.5 cursor-pointer shrink-0"
                    />
                    <Star className={`w-3.5 h-3.5 shrink-0 ${onlyShowFavorites ? 'fill-yellow-500 text-yellow-500' : 'text-slate-400'}`} />
                    <span className="whitespace-nowrap">仅自选</span>
                  </label>

                  {/* Search box with solid width */}
                  <div className="relative shrink-0">
                    <input 
                      type="text" 
                      placeholder="检索代码/简称..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-40 md:w-56 lg:w-64 text-xs bg-white border border-slate-300 text-slate-800 rounded-lg pl-7 pr-2.5 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-mono transition-all"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Row 1.5: Trading Date Selector (Fulfilling Request #2 with Calendar Input) */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-xs text-slate-500 font-bold font-sans flex items-center gap-1 shrink-0 whitespace-nowrap">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>报告交易日:</span>
                </span>
                <div className="flex items-center bg-white border border-slate-300 rounded-lg px-3 py-1 text-xs text-slate-800 shadow-xs focus-within:ring-1 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all gap-1.5 cursor-pointer max-w-xs shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={dateInputValue}
                    onChange={handleDateInputChange}
                    className="bg-transparent border-0 font-mono font-bold text-slate-900 focus:outline-none focus:ring-0 cursor-pointer p-0 h-6 text-xs w-[110px]"
                    min="2026-06-01"
                    max="2026-07-31"
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-sans">
                  提示：当前整个数据大屏的数据呈现均基于该选定交易日进行多维度套利与一致性穿透。支持跨月任意选择，系统将自适应匹配最契合的主力持仓底盘。
                </span>
              </div>

              {/* Row 2: Signal Feature Selectors */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="text-xs text-slate-500 font-bold font-sans flex items-center gap-1 shrink-0 whitespace-nowrap">
                      <Activity className="w-3.5 h-3.5 text-blue-600" />
                      <span>信号筛选:</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/60 relative w-full sm:w-auto">
                      {[
                        { value: null, label: '全部' },
                        { value: 'long', label: '偏多' },
                        { value: 'short', label: '偏空' }
                      ].map(opt => {
                        return (
                          <button
                            key={opt.label}
                            onClick={() => setActiveFilter(opt.value as any)}
                            className={`px-5 py-1.5 text-xs rounded-md font-bold transition-all cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
                              activeFilter === opt.value
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                            }`}
                          >
                            <span className="whitespace-nowrap">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Signal Config Button on the right */}
                  <button
                    onClick={() => setIsSignalConfigOpen(!isSignalConfigOpen)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSignalConfigOpen
                        ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>信号配置</span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isSignalConfigOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Dropdown Signal Configuration Panel */}
                <AnimatePresence>
                  {isSignalConfigOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-4 text-xs mt-1 shadow-2xs">
                        {/* Header Panel */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/60 pb-3 gap-2">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                              <span>⚙️ 信号配置</span>
                            </h4>
                            {/* Toggle switcher between bullish and bearish configuration */}
                            <div className="flex bg-slate-200/80 p-0.5 rounded-lg border border-slate-300 text-xs self-start">
                              <button
                                onClick={() => setSignalConfigTab('long')}
                                className={`px-3 py-1 rounded transition-all cursor-pointer flex items-center gap-1 font-bold ${
                                  signalConfigTab === 'long' 
                                    ? 'bg-white text-red-700 border border-slate-200 shadow-xs' 
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                <span>偏多信号配置</span>
                              </button>
                              <button
                                onClick={() => setSignalConfigTab('short')}
                                className={`px-3 py-1 rounded transition-all cursor-pointer flex items-center gap-1 font-bold ${
                                  signalConfigTab === 'short' 
                                    ? 'bg-white text-green-700 border border-slate-200 shadow-xs' 
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                <span>偏空信号配置</span>
                              </button>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => setSignalConfig(DEFAULT_SIGNAL_CONFIG)}
                            className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-3xs self-start sm:self-center shrink-0"
                          >
                            <RotateCcw className="w-3 h-3 text-slate-500" />
                            <span>恢复系统默认配置</span>
                          </button>
                        </div>

                        {/* Precise 2-Column 3-Row Grid Layout for Selected Signal */}
                        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-3xs">
                          {/* Grid Header */}
                          <div className="grid grid-cols-12 bg-slate-50/50 border-b border-slate-200 font-bold text-slate-700 p-2.5 text-xs text-center">
                            <div className="col-span-4 text-left pl-2">监控维度 & 业务含义说明</div>
                            <div className="col-span-8 text-left pl-4">筛选条件组合（勾选即启用为该信号的必要触发条件，不勾选即不设置）</div>
                          </div>

                          {/* Row 1: 持仓存量 */}
                          <div className="grid grid-cols-12 border-b border-slate-200 items-center">
                            <div className="col-span-4 bg-slate-50/20 p-3 font-bold text-slate-700 border-r border-slate-200 pl-4.5">
                              <div>持仓存量 (Stock)</div>
                              <p className="text-[10px] text-slate-500 font-normal mt-0.5 leading-normal">
                                存量指核心主力机构与偏外资的底仓持仓累积状态（如：存量“多头”表示机构和外资都是多头）。针对偏多和偏空信号，系统均提供了偏多与偏空两个独立选项供自由配置，二者非唯一绑定。
                              </p>
                            </div>
                            <div className="col-span-8 p-3 pl-6 grid grid-cols-2 gap-4">
                              <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-850">
                                <input 
                                  type="checkbox" 
                                  checked={signalConfigTab === 'long' ? signalConfig.long_stock_long : signalConfig.short_stock_long}
                                  onChange={() => setSignalConfig(prev => ({
                                    ...prev,
                                    [signalConfigTab === 'long' ? 'long_stock_long' : 'short_stock_long']: !prev[signalConfigTab === 'long' ? 'long_stock_long' : 'short_stock_long']
                                  }))}
                                  className={`rounded border-slate-300 h-4 w-4 cursor-pointer ${signalConfigTab === 'long' ? 'text-red-600 focus:ring-red-500/20' : 'text-green-600 focus:ring-green-500/20'}`}
                                />
                                <span>主力持仓偏多</span>
                              </label>
                              <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-850">
                                <input 
                                  type="checkbox" 
                                  checked={signalConfigTab === 'long' ? signalConfig.long_stock_short : signalConfig.short_stock_short}
                                  onChange={() => setSignalConfig(prev => ({
                                    ...prev,
                                    [signalConfigTab === 'long' ? 'long_stock_short' : 'short_stock_short']: !prev[signalConfigTab === 'long' ? 'long_stock_short' : 'short_stock_short']
                                  }))}
                                  className={`rounded border-slate-300 h-4 w-4 cursor-pointer ${signalConfigTab === 'long' ? 'text-red-600 focus:ring-red-500/20' : 'text-green-600 focus:ring-green-500/20'}`}
                                />
                                <span>主力持仓偏空</span>
                              </label>
                            </div>
                          </div>

                          {/* Row 2: 资金流量 */}
                          <div className="grid grid-cols-12 border-b border-slate-200 items-center">
                            <div className="col-span-4 bg-slate-50/20 p-3 font-bold text-slate-700 border-r border-slate-200 pl-4.5">
                              <div>资金流量 (Flow)</div>
                              <p className="text-[10px] text-slate-500 font-normal mt-0.5 leading-normal">
                                流量指今日主力会员的净加减仓方向（如：流量“流入”代表今日主力一致做多加仓）。偏多与偏空信号中均提供了流入和流出两个备选项，支持自定义配置多种强弱博弈组合。
                              </p>
                            </div>
                            <div className="col-span-8 p-3 pl-6 grid grid-cols-2 gap-4">
                              <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-850">
                                <input 
                                  type="checkbox" 
                                  checked={signalConfigTab === 'long' ? signalConfig.long_flow_long : signalConfig.short_flow_long}
                                  onChange={() => setSignalConfig(prev => ({
                                    ...prev,
                                    [signalConfigTab === 'long' ? 'long_flow_long' : 'short_flow_long']: !prev[signalConfigTab === 'long' ? 'long_flow_long' : 'short_flow_long']
                                  }))}
                                  className={`rounded border-slate-300 h-4 w-4 cursor-pointer ${signalConfigTab === 'long' ? 'text-red-600 focus:ring-red-500/20' : 'text-green-600 focus:ring-green-500/20'}`}
                                />
                                <span>主力流量流入</span>
                              </label>
                              <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-850">
                                <input 
                                  type="checkbox" 
                                  checked={signalConfigTab === 'long' ? signalConfig.long_flow_short : signalConfig.short_flow_short}
                                  onChange={() => setSignalConfig(prev => ({
                                    ...prev,
                                    [signalConfigTab === 'long' ? 'long_flow_short' : 'short_flow_short']: !prev[signalConfigTab === 'long' ? 'long_flow_short' : 'short_flow_short']
                                  }))}
                                  className={`rounded border-slate-300 h-4 w-4 cursor-pointer ${signalConfigTab === 'long' ? 'text-red-600 focus:ring-red-500/20' : 'text-green-600 focus:ring-green-500/20'}`}
                                />
                                <span>主力流量流出</span>
                              </label>
                            </div>
                          </div>

                          {/* Row 3: 零售方向 */}
                          <div className="grid grid-cols-12 items-center">
                            <div className="col-span-4 bg-slate-50/20 p-3 font-bold text-slate-700 border-r border-slate-200 pl-4.5">
                              <div>零售方向 (Retail)</div>
                              <p className="text-[10px] text-slate-500 font-normal mt-0.5 leading-normal">
                                零售方向指普通零售散户日内的持仓变动方向。同向指散户跟风买卖（与主力方向相同），反向指散户逆势做对立（与主力方向相反）。
                              </p>
                            </div>
                            <div className="col-span-8 p-3 pl-6 grid grid-cols-2 gap-4">
                              <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-850">
                                <input 
                                  type="checkbox" 
                                  checked={signalConfigTab === 'long' ? signalConfig.long_retail_same : signalConfig.short_retail_same}
                                  onChange={() => setSignalConfig(prev => ({
                                    ...prev,
                                    [signalConfigTab === 'long' ? 'long_retail_same' : 'short_retail_same']: !prev[signalConfigTab === 'long' ? 'long_retail_same' : 'short_retail_same']
                                  }))}
                                  className={`rounded border-slate-300 h-4 w-4 cursor-pointer ${signalConfigTab === 'long' ? 'text-red-600 focus:ring-red-500/20' : 'text-green-600 focus:ring-green-500/20'}`}
                                />
                                <span>零售同向</span>
                              </label>
                              <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-850">
                                <input 
                                  type="checkbox" 
                                  checked={signalConfigTab === 'long' ? signalConfig.long_retail_opposite : signalConfig.short_retail_opposite}
                                  onChange={() => setSignalConfig(prev => ({
                                    ...prev,
                                    [signalConfigTab === 'long' ? 'long_retail_opposite' : 'short_retail_opposite']: !prev[signalConfigTab === 'long' ? 'long_retail_opposite' : 'short_retail_opposite']
                                  }))}
                                  className={`rounded border-slate-300 h-4 w-4 cursor-pointer ${signalConfigTab === 'long' ? 'text-red-600 focus:ring-red-500/20' : 'text-green-600 focus:ring-green-500/20'}`}
                                />
                                <span>零售反向</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Default Rules Explanations (Satisfying User's request to clarify default configurations) */}
                        <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-3 text-[11px] space-y-1.5 leading-relaxed text-slate-700">
                          <div className="font-extrabold text-blue-900 flex items-center gap-1">
                            <Lightbulb className="w-3.5 h-3.5 text-blue-600" />
                            <span>💡 信号配置默认规则参考说明</span>
                          </div>
                          <div className="pt-0.5">
                            {signalConfigTab === 'long' ? (
                              <div>
                                <span className="font-bold text-red-700">■ 偏多默认推荐配置</span>: <b>存量偏多 + 流量流入 + 零售同向。</b>
                                <p className="text-[10.5px] text-slate-500 mt-0.5">当主力持仓底仓偏多、日内资金净流入，且零售资金同向跟风买入时触发，指示极佳的突破趋势向上共识形态。</p>
                              </div>
                            ) : (
                              <div>
                                <span className="font-bold text-green-700">■ 偏空默认推荐配置</span>: <b>存量偏空 + 流量流出 + 零售同向。</b>
                                <p className="text-[10.5px] text-slate-500 mt-0.5">当主力持仓底仓偏空、日内资金净流出，且零售资金同向跟风卖出时触发，指示顺势的突破趋势向下共识形态。</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Disclaimer - Polished and Written professionally (Satisfying User's request) */}
                        <div className="flex items-start gap-1.5 bg-amber-50 text-amber-800 px-3.5 py-2.5 rounded-lg border border-amber-100/80 leading-normal text-[10px] mt-2">
                          <span className="font-extrabold shrink-0 bg-amber-100 px-1 py-0.2 rounded text-[9.5px]">法律声明</span>
                          <span className="text-slate-600 font-sans font-medium">
                            【免责声明】本信号配置功能中展示的系统默认选项与推荐组合仅作为量化博弈特征研究的设置示例参考，不代表我司对任何市场走势的预测或实质性投资建议，最终信号判别以用户自主选定并启用的实际规则为准。期货市场具有高杠杆及高风险特征，请自主、审慎进行交易配置，投资风险自担。
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* SINGLE VARIETY TOP STICKY BANNER (Satisfying Request #3 & #4: Frozen at top-0 as user scrolls) */}
            {compareMode === 'multi' && selectedCommodityIds.length === 1 && selectedCommodity && (
              <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-md rounded-xl p-3.5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-200">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Pulse Status indicator */}
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans font-black text-slate-950 text-base">
                      {selectedCommodity.name}
                    </span>
                    <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1 shrink-0" title="当前交易日">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>{selectedDate}</span>
                    </span>
                    <button 
                      onClick={() => toggleFavorite(selectedCommodity.id)}
                      className="cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors"
                      title="收藏/自选"
                    >
                      <Star className={`w-4 h-4 ${favorites.includes(selectedCommodity.id) ? 'fill-amber-400 text-amber-500' : 'text-slate-300 hover:text-amber-500'}`} />
                    </button>
                  </div>

                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/60 font-medium font-sans">
                    {selectedCommodity.sector}
                  </span>

                  <EvaluationBadge commodity={selectedCommodity} showTooltipBelow={true} />
                </div>

                {/* Horizontal positions stats */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs border-t md:border-t-0 border-slate-100 pt-2.5 md:pt-0">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">沉淀资金:</span>
                    <span className="font-mono font-black text-slate-800 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{selectedCommodity.openInterest.toFixed(1)} 亿</span>
                  </div>

                  {/* Foreign */}
                  <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
                    <span className="text-slate-400 flex items-center gap-0.5">
                      <span>外资:</span>
                      <Globe className="w-3.5 h-3.5 text-blue-500" />
                    </span>
                    <span className={`font-mono font-bold ${selectedCommodity.positions.foreign >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatFund(selectedCommodity.positions.foreign)}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                      <span className={`px-1 rounded-xs text-[9px] font-bold ${getBehavior(selectedCommodity.positions.foreign, selectedCommodity.changes.foreign).bg}`}>
                        {getBehavior(selectedCommodity.positions.foreign, selectedCommodity.changes.foreign).label}
                      </span>
                      <strong className={selectedCommodity.changes.foreign >= 0 ? 'text-red-600' : 'text-green-600'}>
                        {selectedCommodity.changes.foreign >= 0 ? '+' : ''}{selectedCommodity.changes.foreign.toFixed(1)}亿
                      </strong>
                    </span>
                  </div>

                  {/* Institutional */}
                  <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
                    <span className="text-slate-400 flex items-center gap-0.5">
                      <span>机构:</span>
                      <Building2 className="w-3.5 h-3.5 text-red-600" />
                    </span>
                    <span className={`font-mono font-bold ${selectedCommodity.positions.institutional >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatFund(selectedCommodity.positions.institutional)}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                      <span className={`px-1 rounded-xs text-[9px] font-bold ${getBehavior(selectedCommodity.positions.institutional, selectedCommodity.changes.institutional).bg}`}>
                        {getBehavior(selectedCommodity.positions.institutional, selectedCommodity.changes.institutional).label}
                      </span>
                      <strong className={selectedCommodity.changes.institutional >= 0 ? 'text-red-600' : 'text-green-600'}>
                        {selectedCommodity.changes.institutional >= 0 ? '+' : ''}{selectedCommodity.changes.institutional.toFixed(1)}亿
                      </strong>
                    </span>
                  </div>

                  {/* Retail */}
                  <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
                    <span className="text-slate-400 flex items-center gap-0.5">
                      <span>散户:</span>
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                    </span>
                    <span className={`font-mono font-bold ${selectedCommodity.positions.retail >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatFund(selectedCommodity.positions.retail)}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                      <span className={`px-1 rounded-xs text-[9px] font-bold ${getBehavior(selectedCommodity.positions.retail, selectedCommodity.changes.retail).bg}`}>
                        {getBehavior(selectedCommodity.positions.retail, selectedCommodity.changes.retail).label}
                      </span>
                      <strong className={selectedCommodity.changes.retail >= 0 ? 'text-red-600' : 'text-green-600'}>
                        {selectedCommodity.changes.retail >= 0 ? '+' : ''}{selectedCommodity.changes.retail.toFixed(1)}亿
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activePortalSubmenu === '机构持仓全景' && (
              <>
                {/* 01. SEAT POSITION SUMMARY (Full span, placed directly below control/indicators bar) */}
                <div className="mb-8" id="section-01-container">
                  <SeatPositionSummary 
                    commodities={compareMode === 'multi' ? selectedCommoditiesList : rawCommodities} 
                    onSignalFilter={setActiveFilter}
                    activeFilter={activeFilter}
                    signalConfig={signalConfig}
                  />
                </div>

                {/* 02. SECTOR DIRECTION QUICK VIEW (Show only selected in multi mode) */}
                <SectorDirectionQuickView 
                  commodities={compareMode === 'multi' ? selectedCommoditiesList : rawCommodities}
                  selectedSector={selectedSector}
                  onSelectSector={setSelectedSector}
                  onSelectCommodity={handleSelectCommodity}
                  selectedCommodityId={selectedCommodity?.id || null}
                  signalConfig={signalConfig}
                />

                {/* 03. INSTITUTIONAL CONSISTENCY MAP (Show only selected in multi mode) */}
                <InstitutionalConsistencyMap 
                  commodities={compareMode === 'multi' ? selectedCommoditiesList : filteredCommodities}
                  selectedCommodity={selectedCommodity}
                  onSelectCommodity={handleSelectCommodity}
                  selectedSector={selectedSector}
                  signalConfig={signalConfig}
                  compareMode={compareMode}
                />

            {/* 04. CORE VARIETY PANORAMA (Satisfies Request #3: Only keep core variety panorama table, remove top mover cards) */}
            <div className="mb-8" id="section-core-panorama">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">04</span>
                  <h2 className="text-lg font-sans font-bold text-slate-900 tracking-tight">核心品种全景</h2>
                  <span className="text-xs text-slate-500 font-normal">| 分门别类，一目了然，多维度穿透全市场持仓大单与博弈合力</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 mt-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>⚠️ 合规声明：</strong>此「核心品种全景」展示的多空预警信号及强力关注状态由席位历史持仓变动与流量拟合而来。
                    <span className="text-blue-700 font-bold">以用户实际选择为准，默认配置仅供示意，不代表公司任何投资观点，不作为交易决策。</span>
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg overflow-visible shadow-sm mt-4">
                <div className="overflow-x-auto overflow-visible">
                                  <table className="w-full text-left border-collapse text-xs table-fixed min-w-[1300px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium font-sans text-[11px]">
                        <th className="p-3 pl-4 w-12 text-center sticky left-0 bg-slate-50 z-40 border-r border-slate-200">自选</th>
                        <th className="p-3 w-24 sticky left-12 bg-slate-50 z-40 border-r border-slate-200">品种名称</th>
                        <th className="p-3 w-24 sticky left-36 bg-slate-50 z-40 border-r-2 border-slate-300">主力合约</th>
                        <th className="p-3 w-40 text-center relative">
                          <span>机构一致性</span>
                          <span className="text-[9px] text-slate-400 block font-normal">鼠标悬停透视详细头寸</span>
                        </th>
                        <th 
                          onClick={() => handleSort('foreign')}
                          className="p-3 w-36 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                          title="点击按外资持仓量排序"
                        >
                          <div className="flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>偏外资持仓</span>
                            <span className="flex flex-col text-[8px] leading-[6px] text-slate-400">
                              <span className={sortField === 'foreign' && sortDirection === 'asc' ? 'text-blue-600' : ''}>▲</span>
                              <span className={sortField === 'foreign' && sortDirection === 'desc' ? 'text-blue-600' : ''}>▼</span>
                            </span>
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('institutional')}
                          className="p-3 w-36 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                          title="点击按机构持仓量排序"
                        >
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <span>偏机构持仓</span>
                            <span className="flex flex-col text-[8px] leading-[6px] text-slate-400">
                              <span className={sortField === 'institutional' && sortDirection === 'asc' ? 'text-blue-600' : ''}>▲</span>
                              <span className={sortField === 'institutional' && sortDirection === 'desc' ? 'text-blue-600' : ''}>▼</span>
                            </span>
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('retail')}
                          className="p-3 w-36 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                          title="点击按零售持仓量排序"
                        >
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>偏零售持仓</span>
                            <span className="flex flex-col text-[8px] leading-[6px] text-slate-400">
                              <span className={sortField === 'retail' && sortDirection === 'asc' ? 'text-blue-600' : ''}>▲</span>
                              <span className={sortField === 'retail' && sortDirection === 'desc' ? 'text-blue-600' : ''}>▼</span>
                            </span>
                          </div>
                        </th>
                        <th className="p-3 w-[170px]">三类席位今日变化 (单位: 亿)</th>
                        <th className="p-3 w-24 text-center font-bold text-slate-700">重点关注</th>
                        <th className="p-3 w-24 text-center font-bold text-slate-800">一致性状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 overflow-visible">
                      {sortedTableData.map((c, idx) => {
                        const isSelected = selectedCommodityIds.includes(c.id);
                        const isFavorited = favorites.includes(c.id);
                        const showTooltipBelow = idx < 2;

                        const fVal = c.positions.foreign;
                        const iVal = c.positions.institutional;
                        const rVal = c.positions.retail;

                        const fChg = c.changes.foreign;
                        const iChg = c.changes.institutional;
                        const rChg = c.changes.retail;

                        const consensusSum = fVal + iVal;
                        const hasSameDirection = (fVal > 0 && iVal > 0) || (fVal < 0 && iVal < 0);

                        return (
                          <tr 
                            key={c.id}
                            onMouseEnter={() => setHoveredRowId(c.id)}
                            onMouseLeave={() => setHoveredRowId(null)}
                            className={`group hover:bg-slate-50/80 transition-colors relative overflow-visible z-10 hover:z-40 ${isSelected ? 'bg-blue-50/10 font-medium' : ''}`}
                          >
                            {/* Star Selection */}
                            <td className={`p-3 pl-4 text-center sticky left-0 z-30 border-r border-slate-100 transition-colors ${isSelected ? 'bg-[#f1f6fe] group-hover:bg-[#e5effe]' : 'bg-white group-hover:bg-slate-50'}`}>
                              <button
                                onClick={() => toggleFavorite(c.id)}
                                className="cursor-pointer text-slate-300 hover:text-amber-500 transition-colors"
                              >
                                <Star className={`w-4 h-4 ${isFavorited ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} />
                              </button>
                            </td>

                            {/* Commodity Name */}
                            <td className={`p-3 sticky left-12 z-30 border-r border-slate-100 transition-colors ${isSelected ? 'bg-[#f1f6fe] group-hover:bg-[#e5effe]' : 'bg-white group-hover:bg-slate-50'}`}>
                              <div onClick={() => handleSelectCommodity(c)} className="cursor-pointer truncate">
                                <span className="text-slate-950 font-sans font-black hover:underline block truncate leading-tight">{c.name}</span>
                                <span className="text-[9px] text-slate-400 font-mono block">{c.sector}</span>
                              </div>
                            </td>

                            {/* Contract Code */}
                            <td className={`p-3 sticky left-36 z-30 border-r-2 border-slate-200 transition-colors ${isSelected ? 'bg-[#f1f6fe] group-hover:bg-[#e5effe]' : 'bg-white group-hover:bg-slate-50'}`}>
                              <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                                {getContractCode(c.id)}
                              </span>
                            </td>

                            {/* Visual Consistency Multi-Axis Axis Indicator */}
                            <td className="p-3 text-center relative overflow-visible bg-slate-50/20">
                              <div className="w-full flex items-center justify-center h-6 relative">
                                {/* Thin background axis track */}
                                <div className="absolute left-2 right-2 h-0.5 bg-slate-200 top-1/2 -translate-y-1/2 rounded-full" />
                                
                                {/* Center 0 marker line */}
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-3 bg-slate-400" />

                                {/* Thin consensus color bar */}
                                <div className="absolute left-2 right-2 h-1 top-1/2 -translate-y-1/2 relative overflow-visible">
                                  {consensusSum < 0 ? (
                                    <div 
                                      className={`absolute right-1/2 h-1 rounded-l-full bg-gradient-to-l ${
                                        hasSameDirection ? 'from-green-500 to-green-300' : 'from-slate-400 to-slate-300'
                                      }`}
                                      style={{ width: `${Math.min((Math.abs(consensusSum) / (maxPositionLimit || 50)) * 50, 50)}%` }}
                                    />
                                  ) : (
                                    <div 
                                      className={`absolute left-1/2 h-1 rounded-r-full bg-gradient-to-r ${
                                        hasSameDirection ? 'from-red-500 to-red-300' : 'from-slate-400 to-slate-300'
                                      }`}
                                      style={{ width: `${Math.min((consensusSum / (maxPositionLimit || 50)) * 50, 50)}%` }}
                                    />
                                  )}
                                </div>

                                {/* Foreign Dot (Blue) */}
                                <div 
                                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 border border-white shadow-xs cursor-help transition-all duration-150 hover:scale-125 z-20"
                                  style={{ left: `${50 + (fVal / (maxPositionLimit || 50)) * 50}%` }}
                                  title={`偏外资持仓: ${formatFund(fVal)}`}
                                />

                                {/* Institutional Dot (Red) */}
                                <div 
                                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500 border border-white shadow-xs cursor-help transition-all duration-150 hover:scale-125 z-20"
                                  style={{ left: `${50 + (iVal / (maxPositionLimit || 50)) * 50}%` }}
                                  title={`偏机构持仓: ${formatFund(iVal)}`}
                                />
                              </div>

                              {hoveredRowId === c.id && (
                                <div className={`absolute z-50 ${showTooltipBelow ? 'top-full mt-1' : 'bottom-full mb-1'} left-1/2 -translate-x-1/2 w-56 bg-slate-900 text-white rounded-lg p-3 shadow-xl border border-slate-700 font-sans`}>
                                  <span className="text-[10px] text-slate-400 font-bold block mb-1 border-b border-slate-800 pb-1 font-sans">{c.name} ({c.id}) 席位大单明细</span>
                                  <div className="space-y-1.5 text-[10px] font-mono">
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">偏外资累计净持:</span>
                                      <span className={fVal >= 0 ? 'text-red-400' : 'text-green-400'}>{formatFund(fVal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">偏机构累计净持:</span>
                                      <span className={iVal >= 0 ? 'text-red-400' : 'text-green-400'}>{formatFund(iVal)}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-slate-800 pt-1">
                                      <span className="text-slate-400">合计两类机构仓:</span>
                                      <span className={consensusSum >= 0 ? 'text-red-400' : 'text-green-400'}>{formatFund(consensusSum)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">散户逆向持仓:</span>
                                      <span className={rVal >= 0 ? 'text-red-400' : 'text-green-400'}>{formatFund(rVal)}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* 偏外资持仓 */}
                            <td className="p-3 font-mono font-bold">
                              <div className="flex flex-col">
                                <span className={fVal >= 0 ? 'text-red-600' : 'text-green-600'}>
                                  {formatFund(fVal)}
                                </span>
                                <span className="text-[9px] text-slate-400 font-normal">
                                  今日变动: <strong className={fChg >= 0 ? 'text-red-600' : 'text-green-600'}>{fChg >= 0 ? '+' : ''}{fChg.toFixed(1)}亿</strong>
                                </span>
                              </div>
                            </td>

                            {/* 偏机构持仓 */}
                            <td className="p-3 font-mono font-bold">
                              <div className="flex flex-col">
                                <span className={iVal >= 0 ? 'text-red-600' : 'text-green-600'}>
                                  {formatFund(iVal)}
                                </span>
                                <span className="text-[9px] text-slate-400 font-normal">
                                  今日变动: <strong className={iChg >= 0 ? 'text-red-600' : 'text-green-600'}>{iChg >= 0 ? '+' : ''}{iChg.toFixed(1)}亿</strong>
                                </span>
                              </div>
                            </td>

                            {/* 偏零售持仓 */}
                            <td className="p-3 font-mono">
                              <div className="flex flex-col">
                                <span className={rVal >= 0 ? 'text-slate-800 font-bold' : 'text-slate-600'}>
                                  {formatFund(rVal)}
                                </span>
                                <span className="text-[9px] text-slate-400 font-normal">
                                  今日变动: <strong className={rChg >= 0 ? 'text-red-600' : 'text-green-600'}>{rChg >= 0 ? '+' : ''}{rChg.toFixed(1)}亿</strong>
                                </span>
                              </div>
                            </td>

                            {/* 三类席位今日变化 */}
                            <td className="p-2 w-[180px] text-[10px] font-sans">
                              <div className="space-y-1 flex flex-col justify-center h-full">
                                {/* 外资 flow axis */}
                                <div className="flex items-center gap-1">
                                  <span className="w-8 flex items-center gap-0.5 shrink-0 text-slate-500 font-bold" title="偏外资席位"><span>外</span><Globe className="w-3 h-3 text-blue-500" /></span>
                                  <div className="flex-1 bg-slate-100 h-2 rounded-sm relative overflow-hidden border border-slate-200">
                                    <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-300" />
                                    {fChg >= 0 ? (
                                      <div 
                                        className="absolute left-1/2 top-0 bottom-0 bg-red-500 rounded-r-xs"
                                        style={{ width: `${Math.min((fChg / 10) * 50, 50)}%` }}
                                      />
                                    ) : (
                                      <div 
                                        className="absolute right-1/2 top-0 bottom-0 bg-green-500 rounded-l-xs"
                                        style={{ width: `${Math.min((Math.abs(fChg) / 10) * 50, 50)}%` }}
                                      />
                                    )}
                                  </div>
                                  <span className={`w-11 text-right font-mono font-bold shrink-0 text-[10px] ${fChg >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {fChg >= 0 ? '+' : ''}{fChg.toFixed(1)}
                                  </span>
                                </div>

                                {/* 机构 flow axis */}
                                <div className="flex items-center gap-1">
                                  <span className="w-8 flex items-center gap-0.5 shrink-0 text-slate-500 font-bold" title="偏机构席位"><span>机</span><Building2 className="w-3 h-3 text-red-500" /></span>
                                  <div className="flex-1 bg-slate-100 h-2 rounded-sm relative overflow-hidden border border-slate-200">
                                    <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-300" />
                                    {iChg >= 0 ? (
                                      <div 
                                        className="absolute left-1/2 top-0 bottom-0 bg-red-500 rounded-r-xs"
                                        style={{ width: `${Math.min((iChg / 10) * 50, 50)}%` }}
                                      />
                                    ) : (
                                      <div 
                                        className="absolute right-1/2 top-0 bottom-0 bg-green-500 rounded-l-xs"
                                        style={{ width: `${Math.min((Math.abs(iChg) / 10) * 50, 50)}%` }}
                                      />
                                    )}
                                  </div>
                                  <span className={`w-11 text-right font-mono font-bold shrink-0 text-[10px] ${iChg >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {iChg >= 0 ? '+' : ''}{iChg.toFixed(1)}
                                  </span>
                                </div>

                                {/* 零售 flow axis */}
                                <div className="flex items-center gap-1">
                                  <span className="w-8 flex items-center gap-0.5 shrink-0 text-slate-500 font-bold" title="偏零售席位"><span>散</span><Users className="w-3 h-3 text-slate-500" /></span>
                                  <div className="flex-1 bg-slate-100 h-2 rounded-sm relative overflow-hidden border border-slate-200">
                                    <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-300" />
                                    {rChg >= 0 ? (
                                      <div 
                                        className="absolute left-1/2 top-0 bottom-0 bg-red-500 rounded-r-xs"
                                        style={{ width: `${Math.min((rChg / 10) * 50, 50)}%` }}
                                      />
                                    ) : (
                                      <div 
                                        className="absolute right-1/2 top-0 bottom-0 bg-green-500 rounded-l-xs"
                                        style={{ width: `${Math.min((Math.abs(rChg) / 10) * 50, 50)}%` }}
                                      />
                                    )}
                                  </div>
                                  <span className={`w-11 text-right font-mono font-bold shrink-0 text-[10px] ${rChg >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {rChg >= 0 ? '+' : ''}{rChg.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* 重点关注 */}
                            <td className="p-3 text-center">
                              {isOriginalStrongSignal(c) ? (
                                <div className="inline-flex items-center justify-center gap-1 relative">
                                  <span className="absolute -inset-1 bg-amber-400/20 blur-md rounded-full animate-ping"></span>
                                  <span className="p-1 bg-amber-100 rounded-full text-amber-600 relative border border-amber-300 shadow-sm hover:scale-110 transition-transform cursor-help" title="双主力一致方向且零售持仓相反，触发重点关注！">
                                    <Lightbulb className="w-3.5 h-3.5 fill-amber-500 animate-pulse text-amber-600" />
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-300 font-mono text-[10px]">—</span>
                              )}
                            </td>

                            {/* 一致性状态 */}
                            <td className="p-3 text-center overflow-visible">
                              <EvaluationBadge commodity={c} signalConfig={signalConfig} align="right" />
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>



              </>
            )}

            {/* SUBMENU 2: 品种持仓联动 */}
            {activePortalSubmenu === '品种持仓联动' && (
              <div className="space-y-8">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3.5">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-700 shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">品种持仓联动与逆向博弈</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      本模块专注交叉对比商品及金属板块间的席位偏向性联动，揭示外资/机构/散户主力资金持仓偏好及逆向博弈情绪。
                    </p>
                  </div>
                </div>

                <SectorDirectionQuickView 
                  commodities={compareMode === 'multi' ? selectedCommoditiesList : rawCommodities}
                  selectedSector={selectedSector}
                  onSelectSector={setSelectedSector}
                  onSelectCommodity={handleSelectCommodity}
                  selectedCommodityId={selectedCommodity?.id || null}
                  signalConfig={signalConfig}
                />

                <InstitutionalConsistencyMap 
                  commodities={compareMode === 'multi' ? selectedCommoditiesList : filteredCommodities}
                  selectedCommodity={selectedCommodity}
                  onSelectCommodity={handleSelectCommodity}
                  selectedSector={selectedSector}
                  signalConfig={signalConfig}
                  compareMode={compareMode}
                />
              </div>
            )}

            {/* SUBMENU 3: 合约龙虎榜单 */}
            {activePortalSubmenu === '合约龙虎榜单' && (
              <div className="space-y-8">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 mb-2">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-700 shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">合约持仓龙虎榜</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      汇总主力前20名会员在多、空头持仓的详细建仓量和今日变化轨迹，帮您快速锁定大单异动。
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg overflow-visible shadow-sm">
                  <div className="overflow-x-auto overflow-visible">
                    <table className="w-full text-left border-collapse text-xs table-fixed min-w-[1000px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium font-sans text-[11px]">
                          <th className="p-3 pl-4 w-12 text-center sticky left-0 bg-slate-50 z-40 border-r border-slate-200">自选</th>
                          <th className="p-3 w-24 sticky left-12 bg-slate-50 z-40 border-r border-slate-200">品种名称</th>
                          <th className="p-3 w-24 sticky left-36 bg-slate-50 z-40 border-r-2 border-slate-300">主力合约</th>
                          <th className="p-3 w-40 text-center relative">
                            <span>机构一致性</span>
                            <span className="text-[9px] text-slate-400 block font-normal">鼠标悬停透视详细头寸</span>
                          </th>
                          <th className="p-3 w-36">
                            <div className="flex items-center gap-1">
                              <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span>偏外资持仓头寸</span>
                            </div>
                          </th>
                          <th className="p-3 w-36">
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                              <span>偏机构持仓头寸</span>
                            </div>
                          </th>
                          <th className="p-3 w-36">
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>偏零售持仓头寸</span>
                            </div>
                          </th>
                          <th className="p-3 w-[180px]">三类席位今日变化</th>
                          <th className="p-3 w-24 text-center">一致性状态</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 overflow-visible">
                        {(compareMode === 'multi' ? selectedCommoditiesList : filteredCommodities).map((c, idx) => {
                          const isSelected = selectedCommodityIds.includes(c.id);
                          const isFavorited = favorites.includes(c.id);
                          const signal = getCommoditySignalDesc(c);
                          const showTooltipBelow = idx < 2;

                          // Position details
                          const fVal = c.positions.foreign;
                          const iVal = c.positions.institutional;
                          const rVal = c.positions.retail;

                          // Changes details
                          const fChg = c.changes.foreign;
                          const iChg = c.changes.institutional;
                          const rChg = c.changes.retail;

                          // Consensus value of Foreign & Institutional
                          const consensusSum = fVal + iVal;
                          const hasSameDirection = (fVal > 0 && iVal > 0) || (fVal < 0 && iVal < 0);

                          return (
                            <tr 
                              key={c.id} 
                              onMouseEnter={() => setHoveredRowId(c.id)}
                              onMouseLeave={() => setHoveredRowId(null)}
                              className={`hover:bg-slate-50 transition-colors relative overflow-visible ${
                                selectedCommodity?.id === c.id ? 'bg-amber-50/25 border-l-2 border-l-amber-500' : ''
                              }`}
                            >
                              {/* Star/Favorite check */}
                              <td className="p-3 text-center sticky left-0 bg-white group-hover:bg-slate-50 z-35 border-r border-slate-200">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(c.id);
                                  }}
                                  className="p-1 rounded text-slate-300 hover:text-amber-500 transition-colors cursor-pointer"
                                >
                                  <Star className={`w-3.5 h-3.5 ${isFavorited ? 'fill-amber-400 text-amber-500' : ''}`} />
                                </button>
                              </td>

                              {/* Commodity Name */}
                              <td 
                                className="p-3 font-bold text-slate-900 cursor-pointer sticky left-12 bg-white group-hover:bg-slate-50 z-35 border-r border-slate-200"
                                onClick={() => handleSelectCommodity(c)}
                              >
                                <div className="flex flex-col">
                                  <span className="truncate">{c.name}</span>
                                  <span className="font-mono text-[9px] text-slate-400 font-bold">{c.id}</span>
                                </div>
                              </td>

                              {/* Contract Code */}
                              <td className="p-3 font-mono text-slate-500 font-bold sticky left-36 bg-white group-hover:bg-slate-50 z-35 border-r-2 border-slate-300">
                                {c.contract}
                              </td>

                              {/* Visual Consistency Multi-Axis Axis Indicator */}
                              <td className="p-3 text-center relative overflow-visible bg-slate-50/20">
                                <div className="w-full flex items-center justify-center h-6 relative">
                                  {/* Thin background axis track */}
                                  <div className="absolute left-2 right-2 h-0.5 bg-slate-200 top-1/2 -translate-y-1/2 rounded-full" />
                                  
                                  {/* Center 0 marker line */}
                                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-3 bg-slate-400" />

                                  {/* Thin consensus color bar */}
                                  <div className="absolute left-2 right-2 h-1 top-1/2 -translate-y-1/2 relative overflow-visible">
                                    {consensusSum < 0 ? (
                                      <div 
                                        className={`absolute right-1/2 h-1 rounded-l-full bg-gradient-to-l ${
                                          hasSameDirection ? 'from-green-500 to-green-300' : 'from-slate-400 to-slate-300'
                                        }`}
                                        style={{ width: `${Math.min((Math.abs(consensusSum) / (maxPositionLimit || 50)) * 50, 50)}%` }}
                                      />
                                    ) : (
                                      <div 
                                        className={`absolute left-1/2 h-1 rounded-r-full bg-gradient-to-r ${
                                          hasSameDirection ? 'from-red-500 to-red-300' : 'from-slate-400 to-slate-300'
                                        }`}
                                        style={{ width: `${Math.min((consensusSum / (maxPositionLimit || 50)) * 50, 50)}%` }}
                                      />
                                    )}
                                  </div>

                                  {/* Foreign Dot (Blue) */}
                                  <div 
                                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 border border-white shadow-xs cursor-help transition-all duration-150 hover:scale-125 z-20"
                                    style={{ left: `${50 + (fVal / (maxPositionLimit || 50)) * 50}%` }}
                                    title={`偏外资持仓: ${formatFund(fVal)}`}
                                  />

                                  {/* Institutional Dot (Red) */}
                                  <div 
                                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500 border border-white shadow-xs cursor-help transition-all duration-150 hover:scale-125 z-20"
                                    style={{ left: `${50 + (iVal / (maxPositionLimit || 50)) * 50}%` }}
                                    title={`偏机构持仓: ${formatFund(iVal)}`}
                                  />
                                </div>

                                {hoveredRowId === c.id && (
                                  <div className={`absolute z-50 ${showTooltipBelow ? 'top-full mt-1' : 'bottom-full mb-1'} left-1/2 -translate-x-1/2 w-56 bg-slate-900 text-white rounded-lg p-3 shadow-xl border border-slate-700 font-sans`}>
                                    <span className="text-[10px] text-slate-400 font-bold block mb-1 border-b border-slate-800 pb-1 font-sans">{c.name} ({c.id}) 席位大单明细</span>
                                    <div className="space-y-1.5 text-[10px] font-mono">
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">偏外资累计净持:</span>
                                        <span className={fVal >= 0 ? 'text-red-400' : 'text-green-400'}>{formatFund(fVal)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">偏机构累计净持:</span>
                                        <span className={iVal >= 0 ? 'text-red-400' : 'text-green-400'}>{formatFund(iVal)}</span>
                                      </div>
                                      <div className="flex justify-between border-t border-slate-800 pt-1">
                                        <span className="text-slate-400">合计两类机构仓:</span>
                                        <span className={consensusSum >= 0 ? 'text-red-400' : 'text-green-400'}>{formatFund(consensusSum)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">散户逆向持仓:</span>
                                        <span className={rVal >= 0 ? 'text-red-400' : 'text-green-400'}>{formatFund(rVal)}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </td>

                              <td className="p-3 font-mono font-bold">
                                <div className="flex flex-col">
                                  <span className={fVal >= 0 ? 'text-red-600' : 'text-green-600'}>
                                    {formatFund(fVal)}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-normal">
                                    今日变动: <strong className={fChg >= 0 ? 'text-red-600' : 'text-green-600'}>{fChg >= 0 ? '+' : ''}{fChg.toFixed(1)}亿</strong>
                                  </span>
                                </div>
                              </td>

                              <td className="p-3 font-mono font-bold">
                                <div className="flex flex-col">
                                  <span className={iVal >= 0 ? 'text-red-600' : 'text-green-600'}>
                                    {formatFund(iVal)}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-normal">
                                    今日变动: <strong className={iChg >= 0 ? 'text-red-600' : 'text-green-600'}>{iChg >= 0 ? '+' : ''}{iChg.toFixed(1)}亿</strong>
                                  </span>
                                </div>
                              </td>

                              <td className="p-3 font-mono">
                                <div className="flex flex-col">
                                  <span className={rVal >= 0 ? 'text-slate-800 font-bold' : 'text-slate-600'}>
                                    {formatFund(rVal)}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-normal">
                                    今日变动: <strong className={rChg >= 0 ? 'text-red-600' : 'text-green-600'}>{rChg >= 0 ? '+' : ''}{rChg.toFixed(1)}亿</strong>
                                  </span>
                                </div>
                              </td>

                              {/* 三类席位今日变化 */}
                              <td className="p-2 w-[180px] text-[10px] font-sans">
                                <div className="space-y-1 flex flex-col justify-center h-full">
                                  {/* 外资 flow axis */}
                                  <div className="flex items-center gap-1">
                                    <span className="w-8 flex items-center gap-0.5 shrink-0 text-slate-500 font-bold" title="偏外资席位"><span>外</span><Globe className="w-3 h-3 text-blue-500" /></span>
                                    <div className="flex-1 bg-slate-100 h-2 rounded-sm relative overflow-hidden border border-slate-200">
                                      <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-300" />
                                      {fChg >= 0 ? (
                                        <div 
                                          className="absolute left-1/2 top-0 bottom-0 bg-red-500 rounded-r-xs"
                                          style={{ width: `${Math.min((fChg / 10) * 50, 50)}%` }}
                                        />
                                      ) : (
                                        <div 
                                          className="absolute right-1/2 top-0 bottom-0 bg-green-500 rounded-l-xs"
                                          style={{ width: `${Math.min((Math.abs(fChg) / 10) * 50, 50)}%` }}
                                        />
                                      )}
                                    </div>
                                    <span className={`w-11 text-right font-mono font-bold shrink-0 text-[10px] ${fChg >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      {fChg >= 0 ? '+' : ''}{fChg.toFixed(1)}
                                    </span>
                                  </div>

                                  {/* 机构 flow axis */}
                                  <div className="flex items-center gap-1">
                                    <span className="w-8 flex items-center gap-0.5 shrink-0 text-slate-500 font-bold" title="偏机构席位"><span>机</span><Building2 className="w-3 h-3 text-red-500" /></span>
                                    <div className="flex-1 bg-slate-100 h-2 rounded-sm relative overflow-hidden border border-slate-200">
                                      <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-300" />
                                      {iChg >= 0 ? (
                                        <div 
                                          className="absolute left-1/2 top-0 bottom-0 bg-red-500 rounded-r-xs"
                                          style={{ width: `${Math.min((iChg / 10) * 50, 50)}%` }}
                                        />
                                      ) : (
                                        <div 
                                          className="absolute right-1/2 top-0 bottom-0 bg-green-500 rounded-l-xs"
                                          style={{ width: `${Math.min((Math.abs(iChg) / 10) * 50, 50)}%` }}
                                        />
                                      )}
                                    </div>
                                    <span className={`w-11 text-right font-mono font-bold shrink-0 text-[10px] ${iChg >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      {iChg >= 0 ? '+' : ''}{iChg.toFixed(1)}
                                    </span>
                                  </div>

                                  {/* 零售 flow axis */}
                                  <div className="flex items-center gap-1">
                                    <span className="w-8 flex items-center gap-0.5 shrink-0 text-slate-500 font-bold" title="偏零售席位"><span>散</span><Users className="w-3 h-3 text-slate-500" /></span>
                                    <div className="flex-1 bg-slate-100 h-2 rounded-sm relative overflow-hidden border border-slate-200">
                                      <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-300" />
                                      {rChg >= 0 ? (
                                        <div 
                                          className="absolute left-1/2 top-0 bottom-0 bg-red-500 rounded-r-xs"
                                          style={{ width: `${Math.min((rChg / 10) * 50, 50)}%` }}
                                        />
                                      ) : (
                                        <div 
                                          className="absolute right-1/2 top-0 bottom-0 bg-green-500 rounded-l-xs"
                                          style={{ width: `${Math.min((Math.abs(rChg) / 10) * 50, 50)}%` }}
                                        />
                                      )}
                                    </div>
                                    <span className={`w-11 text-right font-mono font-bold shrink-0 text-[10px] ${rChg >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      {rChg >= 0 ? '+' : ''}{rChg.toFixed(1)}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="p-3 text-center">
                                <EvaluationBadge commodity={c} showTooltipBelow={false} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SUBMENU 4: 主力多空排位 */}
            {activePortalSubmenu === '主力多空排位' && (
              <div className="space-y-8">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3.5">
                  <div className="p-2 bg-rose-100 rounded-lg text-rose-700 shrink-0">
                    <ListOrdered className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">主力多空净头寸排位看板</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      基于偏外资、偏中资核心机构主力的持仓结存量算法加总，展现当前市场上主力资金抱团多空强度的龙虎榜单。
                    </p>
                  </div>
                </div>

                <SeatPositionSummary 
                  commodities={compareMode === 'multi' ? selectedCommoditiesList : rawCommodities} 
                  onSignalFilter={setActiveFilter}
                  activeFilter={activeFilter}
                  signalConfig={signalConfig}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top Long Power */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                      <div className="w-5 h-5 rounded bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">▲</div>
                      <h3 className="font-bold text-slate-900 text-sm">偏机构与外资主力做多排行</h3>
                    </div>
                    <div className="space-y-3">
                      {[...rawCommodities]
                        .sort((a, b) => (b.positions.foreign + b.positions.institutional) - (a.positions.foreign + a.positions.institutional))
                        .slice(0, 5)
                        .map((c, idx) => {
                          const val = c.positions.foreign + c.positions.institutional;
                          return (
                            <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors">
                              <div className="flex items-center gap-2.5">
                                <span className="font-mono font-black text-xs text-slate-400 w-4">{idx + 1}</span>
                                <span className="font-mono bg-slate-200 text-slate-800 font-bold px-1.5 py-0.2 rounded text-[10px]">{c.id}</span>
                                <span className="text-slate-800 font-bold text-xs">{c.name}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-mono text-xs font-bold text-red-600">+{val.toFixed(1)} 亿</span>
                                <span className="block text-[9px] text-slate-400">综合一致性: {getCommoditySignalDesc(c).label}</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Top Short Power */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                      <div className="w-5 h-5 rounded bg-green-50 text-green-600 flex items-center justify-center font-bold text-xs">▼</div>
                      <h3 className="font-bold text-slate-900 text-sm">偏机构与外资主力做空排行</h3>
                    </div>
                    <div className="space-y-3">
                      {[...rawCommodities]
                        .sort((a, b) => (a.positions.foreign + a.positions.institutional) - (b.positions.foreign + b.positions.institutional))
                        .slice(0, 5)
                        .map((c, idx) => {
                          const val = c.positions.foreign + c.positions.institutional;
                          return (
                            <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors">
                              <div className="flex items-center gap-2.5">
                                <span className="font-mono font-black text-xs text-slate-400 w-4">{idx + 1}</span>
                                <span className="font-mono bg-slate-200 text-slate-800 font-bold px-1.5 py-0.2 rounded text-[10px]">{c.id}</span>
                                <span className="text-slate-800 font-bold text-xs">{c.name}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-mono text-xs font-bold text-green-600">{val.toFixed(1)} 亿</span>
                                <span className="block text-[9px] text-slate-400">综合一致性: {getCommoditySignalDesc(c).label}</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUBMENU 5: 现货仓单日报 */}
            {activePortalSubmenu === '现货仓单日报' && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" id="section-warehouse-receipts">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h2 className="text-base font-bold text-slate-900">交易所注册现货仓单日报</h2>
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-mono font-bold">
                    数据生成时间: {selectedDate} 16:30 结算
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-sans font-bold text-[11px]">
                        <th className="p-3">品种代号</th>
                        <th className="p-3">品种名称</th>
                        <th className="p-3">注册仓库</th>
                        <th className="p-3 text-right">今日仓单数量 (手)</th>
                        <th className="p-3 text-right">日增减 (手)</th>
                        <th className="p-3 text-center">状态评级</th>
                        <th className="p-3">备注说明</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rawCommodities.map(c => {
                        const warehouses = {
                          'ZN': '上海临港、无锡库',
                          'AU': '上海金交所指定中金库',
                          'CU': '常州百叶、宁波裕人库',
                          'AG': '深圳金茂、上海鑫茂库',
                          'AL': '南海中储、常州化建库',
                          'NI': '上海全储、无锡中储库',
                          'HC': '中储天津、上海宝山库',
                          'RB': '中储常州、张家港惠平库',
                        };
                        const warehouse = warehouses[c.id as keyof typeof warehouses] || '大连/郑州指定交割库';
                        const receiptVol = Math.abs(Math.round(c.openInterest * 123 + 450));
                        const receiptChg = Math.round(c.changes.institutional * 45);
                        
                        return (
                          <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-mono font-bold text-blue-600">{c.id}</td>
                            <td className="p-3 font-bold text-slate-800">{c.name}</td>
                            <td className="p-3 text-slate-600">{warehouse}</td>
                            <td className="p-3 text-right font-mono text-slate-900 font-bold">{receiptVol.toLocaleString()}</td>
                            <td className={`p-3 text-right font-mono font-bold ${receiptChg >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {receiptChg >= 0 ? `+${receiptChg}` : receiptChg}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                receiptChg > 100 ? 'bg-red-50 text-red-700 border border-red-200' :
                                receiptChg < -100 ? 'bg-green-50 text-green-700 border border-green-200' :
                                'bg-slate-50 text-slate-600 border border-slate-200'
                              }`}>
                                {receiptChg > 100 ? '注销仓单增加' : receiptChg < -100 ? '仓单大幅减少' : '仓单库存平稳'}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500">
                              交割仓库库容充裕，当前仓单流向平缓，主要承接国内龙头机构套保。
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT SIDEBAR: 多品种对比配置 */}
          {compareMode === 'multi' && (
            <div className="sticky top-4 max-h-[calc(100vh-2rem)] flex items-stretch shrink-0 z-50 overflow-visible" id="section-compare-config-card-wrapper">
              {/* Toggle handle button directly integrated on the left edge of the panel */}
              <button
                onClick={() => setIsCompareDrawerOpen(!isCompareDrawerOpen)}
                className="self-center bg-blue-600 hover:bg-blue-700 text-white rounded-l-xl py-4 px-1.5 cursor-pointer shadow-lg flex flex-col items-center justify-center w-6 h-24 transition-all hover:scale-105 border border-blue-500 z-50 shrink-0"
                title={isCompareDrawerOpen ? "收起配置面板" : "展开配置面板"}
              >
                {isCompareDrawerOpen ? (
                  <>
                    <ChevronRight className="w-4 h-4 text-white font-black" />
                    <span className="text-[9px] font-black [writing-mode:vertical-lr] tracking-widest text-white mt-1">
                      收起面板
                    </span>
                  </>
                ) : (
                  <>
                    <ChevronLeft className="w-4 h-4 text-white font-black" />
                    <span className="text-[9px] font-black [writing-mode:vertical-lr] tracking-widest text-white mt-1">
                      展开面板
                    </span>
                  </>
                )}
              </button>

              {isCompareDrawerOpen && (
                <div className="w-full lg:w-80 bg-white border border-slate-200 border-l-0 rounded-r-xl p-4 shadow-sm overflow-y-auto flex flex-col gap-4 animate-in slide-in-from-right-4 duration-200" id="section-compare-config-card">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-black text-slate-900">筛选品种透视配置</span>
                    </div>
                  </div>

                  {/* Status and Summary */}
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-500 font-medium">筛选组合池:</span>
                      <span className="font-mono font-bold text-blue-600">已选 {selectedCommodityIds.length} 个品种（全套 {rawCommodities.length} 品种）</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      在筛选品种模式下，图表及龙虎表将同步穿透展示已选品种。
                    </p>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        const allIds = rawCommodities.map(c => c.id);
                        setSelectedCommodityIds(allIds);
                      }}
                      className="flex-1 py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold transition-all cursor-pointer text-center border border-slate-200/50"
                    >
                      全部选择
                    </button>
                    <button
                      onClick={() => {
                        // Always keep at least 1 commodity selected
                        setSelectedCommodityIds([rawCommodities[0]?.id || 'ZN']);
                      }}
                      className="flex-1 py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold transition-all cursor-pointer text-center border border-slate-200/50"
                    >
                      重置单个
                    </button>
                  </div>

                  {/* Sector Quick Select Filters */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold block">按板块快速圈选:</span>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(new Set(rawCommodities.map(c => c.sector))).map(sector => {
                        const sectorComms = rawCommodities.filter(c => c.sector === sector);
                        const sectorIds = sectorComms.map(c => c.id);
                        const isAllSelected = sectorIds.every(id => selectedCommodityIds.includes(id));
                        
                        return (
                          <button
                            key={sector}
                            onClick={() => {
                              if (isAllSelected) {
                                // Uncheck all in sector, but keep at least 1 overall selection
                                const remaining = selectedCommodityIds.filter(id => !sectorIds.includes(id));
                                setSelectedCommodityIds(remaining.length > 0 ? remaining : [rawCommodities[0]?.id || 'ZN']);
                              } else {
                                // Check all in sector
                                setSelectedCommodityIds(prev => Array.from(new Set([...prev, ...sectorIds])));
                              }
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-all cursor-pointer ${
                              isAllSelected 
                                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {sector}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Checklist list of all commodities */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 max-h-[380px] lg:max-h-none border-t border-b border-slate-100 py-3">
                    {rawCommodities.map(c => {
                      const isChecked = selectedCommodityIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-blue-50/50 border-blue-200 text-blue-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  if (selectedCommodityIds.length <= 1) return; // at least 1 must remain checked
                                  setSelectedCommodityIds(prev => prev.filter(id => id !== c.id));
                                } else {
                                  setSelectedCommodityIds(prev => [...prev, c.id]);
                                }
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs truncate">{c.name}</span>
                              <span className="text-[9px] font-sans font-normal text-slate-400">{c.sector}</span>
                            </div>
                          </div>
                          <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                            (c.positions.foreign + c.positions.institutional) >= 0
                              ? 'bg-red-50 text-red-600'
                              : 'bg-green-50 text-green-600'
                          }`}>
                            {(c.positions.foreign + c.positions.institutional) >= 0 ? '+' : ''}
                            {(c.positions.foreign + c.positions.institutional).toFixed(1)}亿
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* PLATFORM FOOTER & LEGAL DISCLAIMER */}
      <footer className="border-t border-slate-200 bg-white mt-12 py-8 text-xs text-slate-500 font-sans leading-relaxed">
        <div className="w-full max-w-[1750px] mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="font-bold text-slate-700 mb-1">国泰君安期货机构服务说明</p>
            <p>
              本系统是专为期货机构及高端专业投资者打造的多维持仓量穿透式分析终端。数据对全市场前20名主力持仓结算单进行算法脱敏与权重配比计算，涵盖偏外资席位、偏中资核心机构主力席位组合、偏散户大单流向等多维主体。
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-700 mb-1">免责声明与风险提示</p>
            <p>
              期货及衍生品交易具有极高杠杆与特定风险，本系统所计算之“持仓一致性”、“持仓加强”、“信号加强”、“筹码分歧”等均为基于公开持仓结存量所做之多主体博弈特征模型拟合，并非真实买卖建议，亦不能作为入市唯一决策标准。
            </p>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400 font-mono">
          © 2026 国泰君安期货有限公司 Guotai Junan Futures Co., Ltd. All Rights Reserved.
        </div>
      </footer>

    </div>
  );
}
