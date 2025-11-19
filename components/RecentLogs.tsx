
import React, { useMemo } from 'react';
import { LogEntry, ActivityDef, Language, BlockDef } from '../types';
import { useTranslation } from '../translations';
import { 
  Droplets, Sprout, Bug, Tractor, Scissors, Apple, Search, 
  Calendar, MapPin, Star, Wrench, Leaf, Users, Clock, Edit2,
  Fuel, Gauge, Compass, ArrowRightLeft
} from 'lucide-react';

interface RecentLogsProps {
  logs: LogEntry[];
  activityDefs: ActivityDef[];
  language: Language;
  blocks?: BlockDef[];
  onEditLog?: (log: LogEntry) => void;
}

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Droplets': return <Droplets size={20} />;
    case 'Sprout': return <Sprout size={20} />;
    case 'Bug': return <Bug size={20} />;
    case 'Tractor': return <Tractor size={20} />;
    case 'Scissors': return <Scissors size={20} />;
    case 'Apple': return <Apple size={20} />;
    case 'Search': return <Search size={20} />;
    case 'Wrench': return <Wrench size={20} />;
    case 'Leaf': return <Leaf size={20} />;
    case 'Users': return <Users size={20} />;
    case 'Fuel': return <Fuel size={20} />;
    case 'Gauge': return <Gauge size={20} />;
    default: return <Star size={20} />;
  }
};

export const RecentLogs: React.FC<RecentLogsProps> = ({ 
  logs, 
  activityDefs, 
  language, 
  blocks = [],
  onEditLog
}) => {
  const t = useTranslation(language);

  // Just sort the logs passed in, do not filter internally
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs]);

  const getActivityDetails = (typeId: string) => {
    const def = activityDefs.find(d => d.id === typeId);
    return {
      label: def ? def.label[language] : typeId,
      color: def ? def.color : '#9ca3af', // Default gray
      icon: def ? def.icon : 'Star'
    };
  };

  const getTillageLabel = (key: string) => {
      if (!key) return '';
      switch(key) {
          case 'cultivator': return t.cultivator;
          case 'disc_harrow': return t.discHarrow;
          case 'plow': return t.plow;
          case 'rotovator': return t.rotovator;
          case 'lengthwise': return t.lengthwise;
          case 'crosswise': return t.crosswise;
          case 'diagonal': return t.diagonal;
          case 'other': return t.other;
          default: return key;
      }
  };

  return (
    <div className="flex flex-col gap-3.5">
      
      {sortedLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white/50 rounded-3xl border-2 border-gray-100 border-dashed text-gray-400">
          <div className="bg-gray-50 p-4 rounded-full mb-3">
             <Calendar size={32} className="opacity-40" />
          </div>
          <p className="text-sm font-medium">{t.noLogs}</p>
        </div>
      ) : (
        sortedLogs.map((log) => {
          const { label, color, icon } = getActivityDetails(log.type);
          const blockDef = blocks.find(b => b.name === log.blockId);
          
          return (
            <div 
              key={log.id} 
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100/60 flex gap-4 relative overflow-hidden transition-transform active:scale-[0.99] group"
            >
              {/* Color Strip */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-1.5" 
                style={{ backgroundColor: color }}
              ></div>

              {/* Edit Button - Visible on group hover or always on mobile (no hover media query) */}
              {onEditLog && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditLog(log);
                  }}
                  className="absolute right-3 top-3 p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:text-emerald-600 hover:bg-emerald-50 transition-colors z-10"
                >
                  <Edit2 size={14} />
                </button>
              )}

              <div className="shrink-0 pl-1.5">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${color}15`, color: color }}
                >
                  {getIconComponent(icon)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex justify-between items-start mb-1.5 pr-8">
                  <h4 className="font-bold text-gray-800 text-sm truncate">{label}</h4>
                  <span className="text-[10px] text-gray-400 font-semibold bg-gray-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {log.date}
                  </span>
                </div>
                
                {/* Tillage Details */}
                {log.tillageImplement && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                           <Tractor size={10} /> {getTillageLabel(log.tillageImplement)}
                        </span>
                        {log.tillageDirection && (
                            <span className="text-[10px] font-bold bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Compass size={10} /> {getTillageLabel(log.tillageDirection)}
                            </span>
                        )}
                    </div>
                )}
                
                <p className="text-sm text-gray-600 font-medium mb-2 leading-tight">{log.details}</p>
                
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 max-w-full truncate">
                    <MapPin size={12} className="shrink-0" />
                    <span className="font-semibold truncate">
                        {log.blockId}
                        {blockDef && <span className="text-gray-400 ml-1 font-normal">({blockDef.size} {t.donum})</span>}
                        {log.section && <span className="font-normal text-gray-400 ml-1">- {log.section}</span>}
                    </span>
                  </div>

                  {/* Time Range Badge */}
                  {log.startTime && log.endTime && (
                    <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                        <Clock size={12} />
                        <span className="font-bold">{log.startTime} - {log.endTime}</span>
                    </div>
                  )}

                  {log.quantity && (
                    <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                      <span className="font-bold">{log.quantity} {log.unit}</span>
                    </div>
                  )}
                  
                  {log.cost && (
                    <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                      <span className="font-bold">
                        {new Intl.NumberFormat(language === 'tr' ? 'tr-TR' : 'en-US', { style: 'decimal', minimumFractionDigits: 0 }).format(log.cost)} ₺
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
