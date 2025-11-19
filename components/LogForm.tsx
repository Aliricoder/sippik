
import React, { useState, useEffect } from 'react';
import { LogEntry, ActivityDef, Language, BlockDef } from '../types';
import { useTranslation } from '../translations';
import { Save, ArrowLeft, Calendar, MapPin, Ruler, Beaker, FileText, Coins, Clock, Layers, Timer, Edit3, Fuel, Gauge, Tractor, Compass, Trash2, ChevronDown } from 'lucide-react';

interface LogFormProps {
  onAddLog: (log: Omit<LogEntry, 'id' | 'createdAt'>) => void;
  onUpdateLog?: (log: LogEntry) => void;
  onDeleteLog?: (id: string) => void;
  initialData?: LogEntry;
  onCancel: () => void;
  activityDefs: ActivityDef[];
  language: Language;
  blocks?: BlockDef[];
}

export const LogForm: React.FC<LogFormProps> = ({ 
  onAddLog, 
  onUpdateLog,
  onDeleteLog,
  initialData, 
  onCancel, 
  activityDefs, 
  language,
  blocks = []
}) => {
  const t = useTranslation(language);
  
  // Initialize state from initialData if it exists (Edit Mode)
  const [type, setType] = useState<string>(initialData?.type || activityDefs[0]?.id || 'irrigation');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [blockId, setBlockId] = useState(initialData?.blockId || '');
  const [section, setSection] = useState(initialData?.section || '');
  const [startTime, setStartTime] = useState(initialData?.startTime || '');
  const [endTime, setEndTime] = useState(initialData?.endTime || '');
  const [details, setDetails] = useState(initialData?.details || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [quantity, setQuantity] = useState<number | ''>(initialData?.quantity ?? '');
  const [unit, setUnit] = useState(initialData?.unit || '');
  const [cost, setCost] = useState<number | ''>(initialData?.cost ?? '');
  
  // Tillage specific
  const [tillageImplement, setTillageImplement] = useState<any>(initialData?.tillageImplement || 'cultivator');
  const [tillageDirection, setTillageDirection] = useState<any>(initialData?.tillageDirection || 'lengthwise');

  const [durationDisplay, setDurationDisplay] = useState<string | null>(null);

  // Helpers to detect activity category
  const isFuel = type === 'diesel' || type === 'fuel';
  const isMachineWork = type === 'ripping' || type === 'tractor' || type === 'tractor_work' || type === 'spraying' || type === 'harvest';
  const isTillage = type === 'ripping' || type === 'tractor_work';

  // Logic when Type Changes
  useEffect(() => {
    if (type !== initialData?.type) {
       // Reset time fields if switching away from irrigation
      if (type !== 'irrigation') {
        setStartTime('');
        setEndTime('');
        setDurationDisplay(null);
      }
      
      // Auto-set units based on type
      if (isFuel) {
        setUnit(language === 'tr' ? 'Lt' : 'Liters');
      } else if (isMachineWork) {
        setUnit(language === 'tr' ? 'Saat' : 'Hours');
      } else if (type === 'fertilization') {
        setUnit('kg');
      }
    }
    // If editing and type is same, don't override existing unit unless empty
    if (type === initialData?.type && !initialData?.unit) {
         if (isFuel) setUnit(language === 'tr' ? 'Lt' : 'Liters');
    }
  }, [type, initialData, isFuel, isMachineWork, language]);

  // Auto-calculate duration if times are set
  useEffect(() => {
    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      let diff = (end.getTime() - start.getTime()) / 1000 / 3600; // hours
      
      if (diff < 0) diff += 24; // Handle overnight
      
      if (diff > 0) {
        const hours = parseFloat(diff.toFixed(1));
        setDurationDisplay(`${hours} ${language === 'tr' ? 'Saat' : 'Hours'}`);
        
        if ((!quantity || quantity === 0) && (!initialData || initialData.startTime !== startTime || initialData.endTime !== endTime)) {
             setQuantity(hours);
             if (!unit || unit === 'hours' || unit === 'Saat') setUnit(language === 'tr' ? 'Saat' : 'Hours');
        }
      }
    } else {
      setDurationDisplay(null);
    }
  }, [startTime, endTime, unit, quantity, initialData, language]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const logData: any = {
      type,
      date,
      blockId: blockId.toUpperCase(), 
      section: section || undefined,
      startTime: (type === 'irrigation' && startTime) ? startTime : undefined,
      endTime: (type === 'irrigation' && endTime) ? endTime : undefined,
      details,
      notes,
      quantity: quantity === '' ? undefined : Number(quantity),
      unit: unit || undefined,
      cost: cost === '' ? undefined : Number(cost),
    };

    // Add tillage specific data if applicable
    if (isTillage) {
      logData.tillageImplement = tillageImplement;
      logData.tillageDirection = tillageDirection;
    }

    if (initialData && onUpdateLog) {
      onUpdateLog({
        ...initialData,
        ...logData,
      });
    } else {
      onAddLog(logData);
    }
  };

  const handleDelete = () => {
    if (initialData && onDeleteLog) {
      if (window.confirm(t.confirmDelete)) {
        onDeleteLog(initialData.id);
      }
    }
  };

  const isEditMode = !!initialData;

  // Find selected block size if any
  const selectedBlockDef = blocks.find(b => b.name === blockId);

  return (
    <div className="absolute inset-0 bg-gray-50 z-50 flex flex-col animate-in slide-in-from-bottom-full duration-300">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-100 p-4 flex items-center gap-4 shrink-0 safe-top">
        <button 
          onClick={onCancel}
          className="p-2 -ml-2 text-gray-500 hover:bg-gray-50 hover:text-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-extrabold text-gray-800 tracking-tight">
            {isEditMode ? t.editActivity : t.newActivity}
        </h2>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-32">
        <form id="logForm" onSubmit={handleSubmit} className="space-y-6">
          
          {/* Activity Type Selection */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block pl-1">{t.activityType}</label>
            <div className="grid grid-cols-2 gap-3">
              {activityDefs.map((def) => (
                <button
                  type="button"
                  key={def.id}
                  onClick={() => setType(def.id)}
                  className={`p-4 rounded-2xl text-sm font-bold transition-all text-left relative overflow-hidden ${
                    type === def.id 
                      ? 'bg-white text-gray-800 shadow-md ring-2 ring-emerald-500' 
                      : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                   <span className={`absolute right-2 top-2 w-2 h-2 rounded-full ${type === def.id ? 'bg-emerald-500' : 'bg-gray-200'}`} style={{ backgroundColor: type === def.id ? def.color : undefined }}></span>
                   {def.label[language]}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 focus-within:ring-2 focus-within:ring-emerald-100 focus-within:border-emerald-300 transition-all">
              <div className="space-y-4">
                {/* Date Row */}
                <div className="flex items-center gap-3">
                   <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                     <Calendar size={20} />
                   </div>
                   <div className="flex-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t.date}</label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-transparent text-gray-800 font-bold outline-none text-base"
                      />
                   </div>
                </div>
                
                {/* Time Range Row - Only for Irrigation */}
                {type === 'irrigation' && (
                  <div className="flex flex-col gap-3 pt-2 border-t border-gray-50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                        <Clock size={20} />
                      </div>
                      <div className="flex-1 flex gap-4">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t.startTime}</label>
                            <input
                              type="time"
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                              className="w-full bg-transparent text-gray-800 font-bold outline-none text-sm"
                            />
                          </div>
                          <div className="w-px bg-gray-100"></div>
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t.endTime}</label>
                            <input
                              type="time"
                              value={endTime}
                              onChange={(e) => setEndTime(e.target.value)}
                              className="w-full bg-transparent text-gray-800 font-bold outline-none text-sm"
                            />
                          </div>
                      </div>
                    </div>
                    
                    {/* Duration Calculated Badge */}
                    {durationDisplay && (
                      <div className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-1.5 rounded-lg text-xs font-bold shadow-sm mx-1">
                        <Timer size={14} />
                        <span>{durationDisplay}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tillage / Tractor Details (Only for Ripping/Tractor) */}
            {isTillage && (
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 focus-within:ring-2 focus-within:ring-emerald-100 focus-within:border-emerald-300 transition-all animate-in fade-in slide-in-from-top-2">
                 <label className="text-[10px] font-bold text-gray-400 uppercase mb-3 block flex items-center gap-1">
                   <Tractor size={12} /> {t.tillageInfo}
                 </label>
                 
                 <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                        <Gauge size={20} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t.implement}</label>
                        <select 
                          value={tillageImplement} 
                          onChange={(e) => setTillageImplement(e.target.value)}
                          className="w-full bg-transparent text-gray-800 font-bold outline-none text-sm py-1"
                        >
                          <option value="cultivator">{t.cultivator}</option>
                          <option value="disc_harrow">{t.discHarrow}</option>
                          <option value="plow">{t.plow}</option>
                          <option value="rotovator">{t.rotovator}</option>
                          <option value="other">{t.other}</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                      <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
                        <Compass size={20} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t.direction}</label>
                        <select 
                          value={tillageDirection} 
                          onChange={(e) => setTillageDirection(e.target.value)}
                          className="w-full bg-transparent text-gray-800 font-bold outline-none text-sm py-1"
                        >
                          <option value="lengthwise">{t.lengthwise}</option>
                          <option value="crosswise">{t.crosswise}</option>
                          <option value="diagonal">{t.diagonal}</option>
                        </select>
                      </div>
                    </div>
                 </div>
               </div>
            )}

            {/* Block & Section */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 focus-within:ring-2 focus-within:ring-emerald-100 focus-within:border-emerald-300 transition-all">
              <div className="flex items-start gap-3">
                 <div className="bg-blue-50 p-2 rounded-lg text-blue-600 mt-1">
                   <MapPin size={20} />
                 </div>
                 <div className="flex-1 flex flex-col gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex justify-between">
                          {t.blockId}
                          {selectedBlockDef && (
                              <span className="text-blue-600 bg-blue-50 px-1.5 rounded text-[9px]">{selectedBlockDef.size} {t.donum}</span>
                          )}
                      </label>
                      
                      {blocks.length > 0 ? (
                        <div className="relative">
                            <select 
                                value={blockId}
                                onChange={(e) => setBlockId(e.target.value)}
                                className="w-full bg-transparent text-gray-800 font-bold outline-none text-base appearance-none py-1"
                                required
                            >
                                <option value="" disabled>{t.selectBlock}</option>
                                {blocks.map(b => (
                                    <option key={b.id} value={b.name}>{b.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-0 top-2 text-gray-400 pointer-events-none" />
                        </div>
                      ) : (
                        <input
                            type="text"
                            required
                            placeholder="e.g. Block A"
                            value={blockId}
                            onChange={(e) => setBlockId(e.target.value)}
                            className="w-full bg-transparent text-gray-800 font-bold outline-none text-base placeholder-gray-300"
                        />
                      )}
                    </div>
                    
                    <div className="pt-2 border-t border-gray-50">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                         <Layers size={10} /> {t.section}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Zone 1"
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        className="w-full bg-transparent text-gray-800 font-medium outline-none text-sm placeholder-gray-300"
                      />
                    </div>
                 </div>
              </div>
            </div>

            {/* Details */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 focus-within:ring-2 focus-within:ring-emerald-100 focus-within:border-emerald-300 transition-all">
              <div className="flex items-center gap-3">
                 <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                   <Beaker size={20} />
                 </div>
                 <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t.details}</label>
                    <input
                      type="text"
                      required={!isTillage} // If tillage, details can be optional or prefilled by implement
                      placeholder={isFuel ? "e.g. Shell Station" : "What was done?"}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      className="w-full bg-transparent text-gray-800 font-bold outline-none text-base placeholder-gray-300"
                    />
                 </div>
              </div>
            </div>

            {/* Quantity & Unit */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 focus-within:ring-2 focus-within:ring-emerald-100 focus-within:border-emerald-300 transition-all">
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg mt-1 ${isFuel ? 'bg-rose-50 text-rose-600' : 'bg-orange-50 text-orange-600'}`}>
                   {isFuel ? <Fuel size={20} /> : isMachineWork ? <Gauge size={20} /> : <Ruler size={20} />}
                 </div>
                 <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      {isFuel ? t.quantityLiter : isMachineWork ? t.quantityHour : t.quantity}
                    </label>
                    <div className="flex gap-4">
                      <input
                        type="number"
                        placeholder="0"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value ? parseFloat(e.target.value) : '')}
                        className="w-1/2 bg-transparent text-gray-800 font-bold outline-none text-base placeholder-gray-300"
                      />
                      <input
                        type="text"
                        placeholder="Unit"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-1/2 bg-transparent text-gray-500 font-medium outline-none text-sm text-right placeholder-gray-300"
                      />
                    </div>
                 </div>
              </div>
            </div>

             {/* Cost */}
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 focus-within:ring-2 focus-within:ring-emerald-100 focus-within:border-emerald-300 transition-all">
              <div className="flex items-center gap-3">
                 <div className="bg-amber-50 p-2 rounded-lg text-amber-600">
                   <Coins size={20} />
                 </div>
                 <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t.cost}</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={cost}
                      onChange={(e) => setCost(e.target.value ? parseFloat(e.target.value) : '')}
                      className="w-full bg-transparent text-gray-800 font-bold outline-none text-base placeholder-gray-300"
                    />
                 </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 focus-within:ring-2 focus-within:ring-emerald-100 focus-within:border-emerald-300 transition-all">
               <div className="flex items-start gap-3">
                 <div className="bg-gray-50 p-2 rounded-lg text-gray-500 mt-1">
                   <FileText size={20} />
                 </div>
                 <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t.notes}</label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-transparent text-gray-800 font-medium outline-none text-sm placeholder-gray-300 resize-none"
                      placeholder="Additional notes..."
                    />
                 </div>
               </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex gap-3 z-50 safe-bottom max-w-md mx-auto">
            
            {/* Delete Button (Only in Edit Mode) */}
            {isEditMode && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-4 rounded-xl font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center justify-center"
                title={t.deleteEntry}
              >
                <Trash2 size={18} />
              </button>
            )}

            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-4 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex-[2] py-4 rounded-xl font-bold text-white bg-emerald-600 shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all text-sm flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {isEditMode ? t.update : t.save}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
