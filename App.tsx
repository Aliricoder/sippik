
import React, { useState, useEffect, useMemo } from 'react';
import { LogEntry, ViewState, ActivityDef, Language, BlockDef } from './types';
import { LogForm } from './components/LogForm';
import { RecentLogs } from './components/RecentLogs';
import { ActivityChart } from './components/ActivityChart';
import { AIAssistant } from './components/AIAssistant';
import { SettingsModal } from './components/SettingsModal';
import { IosInstallGuide } from './components/IosInstallGuide';
import { useTranslation } from './translations';
import { 
  LayoutDashboard, 
  ClipboardList, 
  BrainCircuit, 
  Plus, 
  Sprout,
  MoreVertical,
  Settings,
  BarChart3,
  Coins,
  Filter
} from 'lucide-react';

const INITIAL_ACTIVITY_DEFS: ActivityDef[] = [
  { id: 'irrigation', label: { en: 'Irrigation', tr: 'Sulama' }, color: '#3b82f6', icon: 'Droplets' },
  { id: 'fertilization', label: { en: 'Fertilization', tr: 'Gübreleme' }, color: '#eab308', icon: 'Sprout' },
  { id: 'spraying', label: { en: 'Spraying', tr: 'İlaçlama' }, color: '#ef4444', icon: 'Bug' },
  { id: 'ripping', label: { en: 'Ripping', tr: 'Sürüm/Patlatma' }, color: '#8b5cf6', icon: 'Tractor' },
  { id: 'pruning', label: { en: 'Pruning', tr: 'Budama' }, color: '#22c55e', icon: 'Scissors' },
  { id: 'harvest', label: { en: 'Harvest', tr: 'Hasat' }, color: '#f97316', icon: 'Apple' },
  { id: 'labor', label: { en: 'Labor / Workers', tr: 'İşçilik / İşçiler' }, color: '#ec4899', icon: 'Users' },
  { id: 'diesel', label: { en: 'Diesel / Fuel', tr: 'Mazot / Yakıt' }, color: '#be123c', icon: 'Fuel' },
  { id: 'tractor_work', label: { en: 'General Tractor Work', tr: 'Genel Traktör İşleri' }, color: '#7c3aed', icon: 'Gauge' },
  { id: 'scouting', label: { en: 'Scouting', tr: 'Gözlem' }, color: '#14b8a6', icon: 'Search' },
  { id: 'maintenance', label: { en: 'Maintenance', tr: 'Bakım' }, color: '#6b7280', icon: 'Wrench' },
];

const MOCK_INITIAL_LOGS: LogEntry[] = [
  { id: '1', date: '2023-10-20', type: 'irrigation', blockId: 'BLOCK A', details: 'Drip Line Flush', quantity: 24, unit: 'hours', notes: 'Standard flush post-harvest', createdAt: 1697800000000 },
  { id: '2', date: '2023-10-22', type: 'fertilization', blockId: 'BLOCK B', details: 'Zinc Sulfate', quantity: 50, unit: 'kg', notes: 'Foliar application', cost: 1200, createdAt: 1697970000000 },
  { id: '3', date: '2023-10-25', type: 'pruning', blockId: 'BLOCK A', details: 'Structural Pruning', notes: 'Focusing on center opening', cost: 3500, createdAt: 1698230000000 },
  { id: '4', date: '2023-10-26', type: 'irrigation', blockId: 'BLOCK B', details: 'Regular Irrigation', quantity: 12, unit: 'hours', createdAt: 1698310000000 },
];

const App: React.FC = () => {
  // -- State --
  const [view, setView] = useState<ViewState>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Editing State
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);

  // Dashboard Specific State
  const [chartMode, setChartMode] = useState<'count' | 'cost'>('count');

  // Localization
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('pistachio_lang') as Language) || 'en';
  });
  
  // Activities
  const [activityDefs, setActivityDefs] = useState<ActivityDef[]>(() => {
    try {
      const saved = localStorage.getItem('pistachio_activities');
      // Merge saved activities with initial defaults to ensure new types appear for existing users
      const savedParsed = saved ? JSON.parse(saved) : [];
      
      // If we have saved data, we need to make sure diesel and tractor_work exist
      if (savedParsed.length > 0) {
        const hasDiesel = savedParsed.some((d: ActivityDef) => d.id === 'diesel');
        const hasTractor = savedParsed.some((d: ActivityDef) => d.id === 'tractor_work');
        
        let updated = [...savedParsed];
        if (!hasDiesel) updated.push(INITIAL_ACTIVITY_DEFS.find(d => d.id === 'diesel')!);
        if (!hasTractor) updated.push(INITIAL_ACTIVITY_DEFS.find(d => d.id === 'tractor_work')!);
        
        return updated;
      }
      
      return INITIAL_ACTIVITY_DEFS;
    } catch (e) {
      return INITIAL_ACTIVITY_DEFS;
    }
  });

  // Blocks
  const [blocks, setBlocks] = useState<BlockDef[]>(() => {
      try {
          const saved = localStorage.getItem('pistachio_blocks');
          return saved ? JSON.parse(saved) : [];
      } catch (e) {
          return [];
      }
  });

  // Logs
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('pistachio_logs');
      return saved ? JSON.parse(saved) : MOCK_INITIAL_LOGS;
    } catch (e) {
      return MOCK_INITIAL_LOGS;
    }
  });

  // Filters
  const [blockFilter, setBlockFilter] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState<string | null>(null);

  // -- Effects --
  useEffect(() => {
    localStorage.setItem('pistachio_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('pistachio_activities', JSON.stringify(activityDefs));
  }, [activityDefs]);

  useEffect(() => {
      localStorage.setItem('pistachio_blocks', JSON.stringify(blocks));
  }, [blocks]);

  useEffect(() => {
    localStorage.setItem('pistachio_lang', language);
  }, [language]);

  // Handle PWA Install Prompt
  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // -- Handlers --
  const handleAddLog = (newLogData: Omit<LogEntry, 'id' | 'createdAt'>) => {
    const newLog: LogEntry = {
      ...newLogData,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    setLogs(prev => [newLog, ...prev]);
    setShowAddModal(false);
  };

  const handleUpdateLog = (updatedLog: LogEntry) => {
    setLogs(prev => prev.map(log => log.id === updatedLog.id ? updatedLog : log));
    setShowAddModal(false);
    setEditingLog(null);
  };

  const handleDeleteLog = (id: string) => {
    // The confirmation is handled in LogForm, here we just execute
    setLogs(prev => prev.filter(l => l.id !== id));
    setShowAddModal(false);
    setEditingLog(null);
  };

  const handleStartEdit = (log: LogEntry) => {
    setEditingLog(log);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingLog(null); // Clear edit state when closing
  };

  const handleAddActivity = (def: ActivityDef) => {
    setActivityDefs(prev => [...prev, def]);
  };

  const handleDeleteActivity = (id: string) => {
    setActivityDefs(prev => prev.filter(d => d.id !== id));
  };

  const handleAddBlock = (def: BlockDef) => {
      setBlocks(prev => [...prev, def]);
  };

  const handleDeleteBlock = (id: string) => {
      setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const handleImportData = (data: { logs?: LogEntry[], activityDefs?: ActivityDef[], blocks?: BlockDef[] }) => {
    if (data.logs && Array.isArray(data.logs)) {
      setLogs(data.logs);
    }
    if (data.activityDefs && Array.isArray(data.activityDefs)) {
      setActivityDefs(data.activityDefs);
    }
    if (data.blocks && Array.isArray(data.blocks)) {
        setBlocks(data.blocks);
    }
  };

  const t = useTranslation(language);

  // Filter logs for dashboard metrics
  const filteredLogs = useMemo(() => {
    let res = logs;
    if (blockFilter) {
      res = res.filter(l => l.blockId === blockFilter);
    }
    if (activityFilter) {
      res = res.filter(l => l.type === activityFilter);
    }
    return res;
  }, [logs, blockFilter, activityFilter]);

  // Calculated Metrics
  const totalCost = useMemo(() => {
    return filteredLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
  }, [filteredLogs]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'tr' ? 'tr-TR' : 'en-US', { 
      style: 'decimal', 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(amount);
  };

  return (
    <div className="min-h-[100dvh] flex justify-center bg-transparent md:py-8">
      {/* iOS Installation Guide */}
      <IosInstallGuide language={language} />
      
      {/* Mobile Device Simulator Container */}
      <div className="w-full max-w-md bg-gray-50 h-[100dvh] md:h-[850px] md:rounded-[3rem] relative flex flex-col shadow-2xl overflow-hidden md:border-[8px] md:border-gray-800">
        
        {/* Status Bar Area for Mobile Look */}
        <div className="h-1 bg-emerald-900 w-full shrink-0"></div>

        {/* Top App Bar */}
        <header className="bg-gradient-orchard text-white p-5 pb-6 shadow-lg z-20 shrink-0 flex justify-between items-center rounded-b-[2rem] relative overflow-hidden">
          {/* Decorative Background Circle */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          
          <div className="flex items-center gap-3.5 z-10">
            <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl shadow-inner">
              <Sprout size={24} className="text-white drop-shadow-md" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl leading-none tracking-tight">{t.appTitle}</h1>
              <p className="text-emerald-100 text-xs font-medium mt-1 opacity-90">{t.appSubtitle}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all z-10"
          >
            <Settings size={22} className="text-white" />
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-28 scroll-smooth bg-gray-50/50">
          
          {/* Global Filters */}
          {(view === 'dashboard' || view === 'logs') && logs.length > 0 && (
             <div className="px-5 -mt-3 mb-4 z-10 relative">
                <div className="bg-white p-2 rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 flex flex-col gap-2">
                  
                  {/* Row 1: Block Filter */}
                  <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                     <div className="bg-emerald-100 p-1.5 rounded-lg">
                        <Filter size={12} className="text-emerald-700" />
                     </div>
                     <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider w-16 shrink-0">{t.blockId}:</span>
                     <select 
                        value={blockFilter || ''}
                        onChange={(e) => setBlockFilter(e.target.value || null)}
                        className="flex-1 bg-transparent text-gray-800 text-xs font-bold py-1 pr-2 border-none focus:ring-0 truncate cursor-pointer"
                     >
                        <option value="">{t.allBlocks}</option>
                        {/* Merge defined blocks with any legacy strings found in logs */}
                        {Array.from(new Set([...blocks.map(b => b.name), ...logs.map(l => l.blockId).filter(Boolean)])).sort().map(block => (
                           <option key={block} value={block}>{block}</option>
                        ))}
                     </select>
                  </div>

                  {/* Row 2: Activity Filter */}
                  <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                     <div className="bg-emerald-100 p-1.5 rounded-lg">
                        <Filter size={12} className="text-emerald-700" />
                     </div>
                     <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider w-16 shrink-0">{t.activityType}:</span>
                     <select 
                        value={activityFilter || ''}
                        onChange={(e) => setActivityFilter(e.target.value || null)}
                        className="flex-1 bg-transparent text-gray-800 text-xs font-bold py-1 pr-2 border-none focus:ring-0 truncate cursor-pointer"
                     >
                        <option value="">{t.allActivities}</option>
                        {activityDefs.map(def => (
                           <option key={def.id} value={def.id}>{def.label[language]}</option>
                        ))}
                     </select>
                  </div>

                </div>
             </div>
          )}

          {view === 'dashboard' && (
            <div className="p-5 space-y-5 pt-1">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                 {/* Entries Count */}
                 <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-3xl shadow-sm border border-blue-100/50 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ClipboardList size={60} className="text-blue-600" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-blue-100 p-2 rounded-xl text-blue-600 shadow-sm">
                        <ClipboardList size={16} />
                      </div>
                      <p className="text-[10px] text-blue-800/70 font-bold uppercase tracking-wide">{t.entries}</p>
                    </div>
                    <p className="text-3xl font-black text-slate-800 mt-2">{filteredLogs.length}</p>
                 </div>

                 {/* Total Cost */}
                 <div className="bg-gradient-to-br from-amber-50 to-white p-4 rounded-3xl shadow-sm border border-amber-100/50 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Coins size={60} className="text-amber-600" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-amber-100 p-2 rounded-xl text-amber-600 shadow-sm">
                        <Coins size={16} />
                      </div>
                      <p className="text-[10px] text-amber-800/70 font-bold uppercase tracking-wide">{t.totalCost}</p>
                    </div>
                    <p className="text-3xl font-black text-slate-800 mt-2 truncate">
                       {formatCurrency(totalCost)}
                       <span className="text-sm font-bold text-amber-600/60 ml-1">₺</span>
                    </p>
                 </div>
              </div>

              {/* Chart Section with Toggle */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100/80">
                <div className="p-5 pb-2 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                      <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                        {chartMode === 'count' ? t.distribution : t.costAnalysis}
                      </h3>
                   </div>
                   <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                      <button 
                        onClick={() => setChartMode('count')}
                        className={`p-2 rounded-lg transition-all ${chartMode === 'count' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title={t.activityCount}
                      >
                        <BarChart3 size={16} strokeWidth={2.5} />
                      </button>
                      <button 
                        onClick={() => setChartMode('cost')}
                        className={`p-2 rounded-lg transition-all ${chartMode === 'cost' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title={t.costTotal}
                      >
                        <Coins size={16} strokeWidth={2.5} />
                      </button>
                   </div>
                </div>
                <ActivityChart 
                  logs={filteredLogs} 
                  activityDefs={activityDefs} 
                  language={language} 
                  mode={chartMode}
                />
              </div>

              {/* Recent Activity Preview */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-end px-2">
                  <h3 className="font-bold text-gray-800 text-lg">{t.recentActivity}</h3>
                  <button onClick={() => setView('logs')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full transition-colors">
                    {t.viewAll}
                  </button>
                </div>
                <RecentLogs 
                  logs={filteredLogs.slice(0, 5)} 
                  activityDefs={activityDefs}
                  language={language}
                  blocks={blocks}
                  onEditLog={handleStartEdit}
                />
              </div>
            </div>
          )}

          {view === 'logs' && (
            <div className="p-5 pt-1">
              <h2 className="text-xl font-bold text-gray-800 mb-5 px-1">{t.logs}</h2>
              <RecentLogs 
                logs={filteredLogs} 
                activityDefs={activityDefs}
                language={language}
                blocks={blocks}
                onEditLog={handleStartEdit}
              />
            </div>
          )}

          {view === 'advisor' && (
            <div className="h-full flex flex-col">
              <AIAssistant logs={filteredLogs} language={language} />
            </div>
          )}
        </main>

        {/* Floating Action Button (FAB) */}
        <button 
          onClick={() => setShowAddModal(true)}
          className="absolute bottom-24 right-6 w-16 h-16 bg-emerald-600 text-white rounded-full shadow-xl shadow-emerald-600/40 flex items-center justify-center z-30 active:scale-90 hover:scale-105 transition-all duration-300 border-4 border-white/20"
          aria-label="Add Activity"
        >
          <Plus size={32} strokeWidth={2.5} />
        </button>

        {/* Bottom Navigation - Glassmorphism */}
        <nav className="absolute bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200/50 h-20 flex justify-around items-center px-4 z-30 pb-3">
          <button 
            onClick={() => setView('dashboard')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${view === 'dashboard' ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-500'}`}
          >
            <div className={`p-1.5 rounded-2xl transition-all duration-300 ${view === 'dashboard' ? 'bg-emerald-100 shadow-inner translate-y-[-2px]' : 'bg-transparent'}`}>
              <LayoutDashboard size={24} strokeWidth={view === 'dashboard' ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-bold">{t.dashboard}</span>
          </button>

          <button 
            onClick={() => setView('logs')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${view === 'logs' ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-500'}`}
          >
             <div className={`p-1.5 rounded-2xl transition-all duration-300 ${view === 'logs' ? 'bg-emerald-100 shadow-inner translate-y-[-2px]' : 'bg-transparent'}`}>
              <ClipboardList size={24} strokeWidth={view === 'logs' ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-bold">{t.logs}</span>
          </button>

          <button 
            onClick={() => setView('advisor')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${view === 'advisor' ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-500'}`}
          >
             <div className={`p-1.5 rounded-2xl transition-all duration-300 ${view === 'advisor' ? 'bg-emerald-100 shadow-inner translate-y-[-2px]' : 'bg-transparent'}`}>
              <BrainCircuit size={24} strokeWidth={view === 'advisor' ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-bold">{t.advisor}</span>
          </button>
        </nav>

        {/* Full Screen Modals */}
        {showAddModal && (
          <LogForm 
            onAddLog={handleAddLog} 
            onUpdateLog={handleUpdateLog}
            onDeleteLog={handleDeleteLog}
            initialData={editingLog || undefined}
            onCancel={handleCloseModal} 
            activityDefs={activityDefs}
            language={language}
            blocks={blocks}
          />
        )}

        {showSettings && (
          <SettingsModal 
            language={language} 
            setLanguage={setLanguage}
            activityDefs={activityDefs}
            logs={logs}
            blocks={blocks}
            onAddActivity={handleAddActivity}
            onDeleteActivity={handleDeleteActivity}
            onAddBlock={handleAddBlock}
            onDeleteBlock={handleDeleteBlock}
            onImportData={handleImportData}
            onClose={() => setShowSettings(false)}
            installPrompt={deferredPrompt}
          />
        )}

      </div>
    </div>
  );
};

export default App;
