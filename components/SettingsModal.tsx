
import React, { useState, useRef } from 'react';
import { Language, ActivityDef, LogEntry, BlockDef } from '../types';
import { useTranslation } from '../translations';
import { ArrowLeft, Plus, Trash2, Globe, List, Database, Download, Upload, CheckCircle, AlertCircle, FileSpreadsheet, Share2, HardDrive, ShieldCheck, CloudUpload, Map, Smartphone, DownloadCloud } from 'lucide-react';

interface SettingsModalProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  activityDefs: ActivityDef[];
  logs: LogEntry[];
  blocks?: BlockDef[];
  onAddActivity: (def: ActivityDef) => void;
  onDeleteActivity: (id: string) => void;
  onAddBlock?: (def: BlockDef) => void;
  onDeleteBlock?: (id: string) => void;
  onImportData: (data: { logs?: LogEntry[], activityDefs?: ActivityDef[], blocks?: BlockDef[] }) => void;
  onClose: () => void;
  installPrompt?: any;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  language,
  setLanguage,
  activityDefs,
  logs,
  blocks = [],
  onAddActivity,
  onDeleteActivity,
  onAddBlock,
  onDeleteBlock,
  onImportData,
  onClose,
  installPrompt
}) => {
  const t = useTranslation(language);
  const [newEn, setNewEn] = useState('');
  const [newTr, setNewTr] = useState('');
  
  // Block State
  const [newBlockName, setNewBlockName] = useState('');
  const [newBlockSize, setNewBlockSize] = useState('');

  const [restoreStatus, setRestoreStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (!newEn || !newTr) return;
    
    const id = newEn.toLowerCase().replace(/\s+/g, '_');
    const newDef: ActivityDef = {
      id,
      label: { en: newEn, tr: newTr },
      color: '#64748b', // Default gray
      icon: 'Star' // Default icon
    };
    
    onAddActivity(newDef);
    setNewEn('');
    setNewTr('');
  };

  const handleAddBlock = () => {
      if (!newBlockName || !newBlockSize || !onAddBlock) return;
      
      const newBlock: BlockDef = {
          id: newBlockName.trim(), // Use name as ID for simplicity
          name: newBlockName,
          size: parseFloat(newBlockSize)
      };

      onAddBlock(newBlock);
      setNewBlockName('');
      setNewBlockSize('');
  };

  const handleDownloadBackup = () => {
    const data = {
      version: 1,
      timestamp: Date.now(),
      logs,
      activityDefs,
      blocks
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pistachiolog_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCloudBackup = async () => {
    const data = {
      version: 1,
      timestamp: Date.now(),
      logs,
      activityDefs,
      blocks
    };
    
    const fileName = `pistachiolog_backup_${new Date().toISOString().split('T')[0]}.json`;
    const file = new File([JSON.stringify(data, null, 2)], fileName, { type: 'application/json' });

    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'PistachioLog Backup',
          text: 'Backup of my orchard data'
        });
      } else {
        // If browser reports it can't share files, fallback to download
        handleDownloadBackup();
      }
    } catch (err) {
      console.warn("Share failed or cancelled, falling back to download", err);
      // CRITICAL FIX: If native sharing fails (e.g. due to blob URL restrictions), 
      // fallback gracefully to standard download
      handleDownloadBackup();
    }
  };

  const handleExportExcel = () => {
    // CSV Header
    const headers = [t.date, t.activityType, t.blockId, t.details, t.quantity, t.unit, t.cost, t.notes];
    
    // CSV Rows
    const rows = logs.map(log => {
        const clean = (text: string) => `"${(text || '').replace(/"/g, '""')}"`;
        
        // Get readable type
        const def = activityDefs.find(d => d.id === log.type);
        const typeLabel = def ? def.label[language] : log.type;

        return [
            clean(log.date),
            clean(typeLabel),
            clean(log.blockId),
            clean(log.details),
            log.quantity || '',
            clean(log.unit || ''),
            log.cost || '',
            clean(log.notes || '')
        ].join(',');
    });

    // BOM \uFEFF is important for Excel to read UTF-8 characters like 'İ', 'ş', 'ğ' correctly
    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `pistachiolog_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestoreClick = () => {
    if (window.confirm(t.confirmRestore)) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Basic validation
        if (parsed.logs || parsed.activityDefs) {
          onImportData(parsed);
          setRestoreStatus({ type: 'success', msg: t.restoreSuccess });
        } else {
          throw new Error('Invalid format');
        }
      } catch (err) {
        console.error(err);
        setRestoreStatus({ type: 'error', msg: t.restoreError });
      }
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleShare = async () => {
    // Validate URL: Ensure we don't try to share a 'blob:' URL (common in preview environments)
    let url = window.location.href;
    if (url.startsWith('blob:') || !url.startsWith('http')) {
       // Fallback or omit URL if invalid
       url = ''; 
    }

    const shareData: any = {
        title: t.appTitle,
        text: t.appSubtitle,
    };
    
    // Only add URL if it is valid
    if (url) {
      shareData.url = url;
    }

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.error('Share failed:', err);
        }
    } else {
        // Fallback to mailto
        window.location.href = `mailto:?subject=${encodeURIComponent(t.appTitle)}&body=${encodeURIComponent(url)}`;
    }
  };

  const handleInstall = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
      });
    }
  };

  return (
    <div className="absolute inset-0 bg-gray-50 z-50 flex flex-col animate-in slide-in-from-right-full duration-300">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4 flex items-center gap-4 shrink-0 safe-top">
        <button 
          onClick={onClose}
          className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-bold text-gray-800">{t.settings}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-safe">
        
        {/* Language Selection */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4 text-green-700 font-bold">
            <Globe size={18} />
            <h3>{t.language}</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage('en')}
              className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${
                language === 'en' 
                  ? 'bg-green-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('tr')}
              className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${
                language === 'tr' 
                  ? 'bg-green-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Türkçe
            </button>
          </div>
        </div>

        {/* App Install Section */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 shadow-lg shadow-emerald-200 text-white">
            <div className="flex items-center gap-2 mb-2 font-bold text-white">
                <Smartphone size={20} />
                <h3>{t.installApp}</h3>
            </div>
            <p className="text-xs text-emerald-100 mb-4 leading-relaxed">{t.installDesc}</p>
            
            {installPrompt ? (
                <button 
                    onClick={handleInstall}
                    className="w-full bg-white text-emerald-600 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform"
                >
                    <DownloadCloud size={18} />
                    {t.installBtn}
                </button>
            ) : (
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/20">
                    <h4 className="text-xs font-bold text-white mb-2 border-b border-white/20 pb-1">{t.installGuide}</h4>
                    <ul className="space-y-1.5">
                        <li className="text-[10px] flex items-center gap-2">
                           <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span> {t.firefoxAndroid}
                        </li>
                        <li className="text-[10px] flex items-center gap-2">
                           <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span> {t.chromeAndroid}
                        </li>
                         <li className="text-[10px] flex items-center gap-2">
                           <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span> {t.safariIos}
                        </li>
                    </ul>
                </div>
            )}
        </div>

        {/* Block Management */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-indigo-700 font-bold">
                <Map size={18} />
                <h3>{t.manageBlocks}</h3>
            </div>

            {/* List Existing Blocks */}
            <div className="space-y-2 mb-6">
                {blocks.length === 0 && <p className="text-xs text-gray-400 italic text-center py-2">{t.noData}</p>}
                {blocks.map(block => (
                <div key={block.id} className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <div>
                        <span className="text-sm font-bold text-gray-800 block">{block.name}</span>
                        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                             {block.size} {t.donum}
                        </span>
                    </div>
                    <button 
                        onClick={() => onDeleteBlock && onDeleteBlock(block.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                    >
                    <Trash2 size={16} />
                    </button>
                </div>
                ))}
            </div>

            {/* Add New Block */}
            <div className="pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">{t.addBlock}</h4>
                <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                        <label className="text-xs text-gray-400 mb-1 block">{t.blockName}</label>
                        <input 
                            type="text" 
                            value={newBlockName}
                            onChange={e => setNewBlockName(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-indigo-500"
                            placeholder="e.g. Block A"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">{t.blockSize}</label>
                        <input 
                            type="number" 
                            value={newBlockSize}
                            onChange={e => setNewBlockSize(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-indigo-500"
                            placeholder="20"
                        />
                    </div>
                </div>
                <button 
                    onClick={handleAddBlock}
                    disabled={!newBlockName || !newBlockSize}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm mt-3 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <Plus size={16} />
                    {t.add}
                </button>
            </div>
        </div>

        {/* Data Management (Backup/Restore) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4 text-blue-600 font-bold">
            <Database size={18} />
            <h3>{t.dataManagement}</h3>
          </div>
          
          <div className="space-y-4">
            {/* Backup */}
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <h4 className="text-sm font-bold text-blue-900 mb-1">{t.backupData}</h4>
              <p className="text-xs text-blue-700 mb-3">{t.backupDesc}</p>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleCloudBackup}
                  className="col-span-2 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform shadow-md shadow-blue-600/20"
                >
                  <CloudUpload size={18} />
                  {t.saveToCloud}
                </button>
                <button 
                  onClick={handleDownloadBackup}
                  className="flex items-center justify-center gap-2 bg-white text-blue-600 border-2 border-blue-100 px-4 py-2.5 rounded-lg text-xs font-bold active:scale-95 transition-transform"
                >
                  <Download size={14} />
                  {t.download}
                </button>
                 <button 
                  onClick={handleExportExcel}
                  className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border-2 border-emerald-100 px-4 py-2.5 rounded-lg text-xs font-bold active:scale-95 transition-transform"
                >
                  <FileSpreadsheet size={14} />
                  CSV
                </button>
              </div>
            </div>

            {/* Restore */}
            <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
              <h4 className="text-sm font-bold text-orange-900 mb-1">{t.restoreData}</h4>
              <p className="text-xs text-orange-700 mb-3">{t.restoreDesc}</p>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
              <button 
                onClick={handleRestoreClick}
                className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium active:scale-95 transition-transform shadow-sm"
              >
                <Upload size={16} />
                {t.upload}
              </button>
              
              {restoreStatus && (
                <div className={`mt-3 flex items-center gap-2 text-xs font-bold ${restoreStatus.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                  {restoreStatus.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {restoreStatus.msg}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Storage Info */}
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100/60">
             <div className="flex items-center gap-2 mb-2 text-emerald-800 font-bold">
                <ShieldCheck size={18} />
                <h3>{t.storageInfo}</h3>
            </div>
            <div className="flex items-start gap-3">
                <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 mt-1">
                    <HardDrive size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-emerald-900">{t.storageLocal}</h4>
                    <p className="text-xs text-emerald-700/80 mt-1 leading-relaxed">{t.storageDesc}</p>
                </div>
            </div>
        </div>

        {/* Share App */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2 text-violet-600 font-bold">
                <Share2 size={18} />
                <h3>{t.shareApp}</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">{t.shareDesc}</p>
            <button 
                onClick={handleShare}
                className="w-full bg-violet-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform"
            >
                <Share2 size={16} />
                {t.shareBtn}
            </button>
        </div>

        {/* Activity Management */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4 text-green-700 font-bold">
            <List size={18} />
            <h3>{t.manageActivities}</h3>
          </div>

          {/* List Existing */}
          <div className="space-y-2 mb-6">
            {activityDefs.map(def => (
              <div key={def.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                 <span className="text-sm font-medium text-gray-700">{def.label[language]}</span>
                 <button 
                    onClick={() => onDeleteActivity(def.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                 >
                   <Trash2 size={16} />
                 </button>
              </div>
            ))}
          </div>

          {/* Add New */}
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">{t.addActivity}</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{t.nameEn}</label>
                <input 
                  type="text" 
                  value={newEn}
                  onChange={e => setNewEn(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-green-500"
                  placeholder="e.g. Grafting"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{t.nameTr}</label>
                <input 
                  type="text" 
                  value={newTr}
                  onChange={e => setNewTr(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-green-500"
                  placeholder="e.g. Aşılama"
                />
              </div>
              <button 
                onClick={handleAdd}
                disabled={!newEn || !newTr}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-sm mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                {t.add}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
