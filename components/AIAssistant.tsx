
import React, { useState, useEffect, useRef } from 'react';
import { LogEntry, ChatMessage, Language } from '../types';
import { useTranslation } from '../translations';
import { getOrchardInsights, chatWithOrchardData } from '../services/geminiService';
import { Sparkles, Send, Loader2, Bot, RefreshCw, MessageSquare, FileText } from 'lucide-react';

interface AIAssistantProps {
  logs: LogEntry[];
  language: Language;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ logs, language }) => {
  const t = useTranslation(language);
  const [activeTab, setActiveTab] = useState<'insights' | 'chat'>('insights');
  const [insight, setInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Re-fetch insights if language changes
  useEffect(() => {
    const fetchInsight = async () => {
      if (logs.length > 0) {
        setLoadingInsight(true);
        const result = await getOrchardInsights(logs, language);
        setInsight(result);
        setLoadingInsight(false);
      } else {
        setInsight(t.noLogs);
      }
    };
    if (activeTab === 'insights') {
        fetchInsight();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, activeTab, language]);

  const refreshInsights = async () => {
    setLoadingInsight(true);
    const result = await getOrchardInsights(logs, language);
    setInsight(result);
    setLoadingInsight(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setChatHistory(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    const responseText = await chatWithOrchardData(logs, input, language);

    const modelMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setChatHistory(prev => [...prev, modelMsg]);
    setSending(false);
  };

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Tab Switcher */}
      <div className="flex p-2 bg-white shrink-0 shadow-sm z-10 m-4 rounded-2xl border border-gray-100">
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide rounded-xl transition-all ${
            activeTab === 'insights' 
              ? 'bg-emerald-50 text-emerald-800 shadow-sm' 
              : 'text-gray-400 hover:bg-gray-50'
          }`}
        >
          <Sparkles size={14} />
          {t.weeklyInsights}
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide rounded-xl transition-all ${
            activeTab === 'chat' 
              ? 'bg-emerald-50 text-emerald-800 shadow-sm' 
              : 'text-gray-400 hover:bg-gray-50'
          }`}
        >
          <MessageSquare size={14} />
          {t.chatAdvisor}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative px-4 pb-4">
        {activeTab === 'insights' ? (
          <div className="h-full overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 min-h-[50%]">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                   <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                    <Sparkles size={20} />
                   </div>
                   <h2 className="text-lg font-bold text-gray-800">{t.orchardAnalysis}</h2>
                </div>
                <button 
                  onClick={refreshInsights} 
                  className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw size={16} className={`text-gray-500 ${loadingInsight ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              {loadingInsight ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 text-gray-300">
                  <Loader2 className="animate-spin text-emerald-500" size={40} />
                  <p className="text-sm font-medium text-gray-400 animate-pulse">{t.analyzing}</p>
                </div>
              ) : (
                <div className="prose prose-sm prose-emerald max-w-none text-gray-600 leading-relaxed">
                   <div dangerouslySetInnerHTML={{ 
                      __html: insight
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 font-bold">$1</strong>')
                        .replace(/\n/g, '<br/>')
                    }} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
              {chatHistory.length === 0 && (
                 <div className="flex flex-col items-center justify-center h-full text-gray-300 space-y-4 opacity-60">
                    <div className="bg-gray-50 p-6 rounded-full">
                        <Bot size={48} strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-medium text-center max-w-[200px]">{t.askPlaceholder}</p>
                 </div>
              )}
              {chatHistory.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-5 py-3.5 text-sm shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-emerald-600 text-white rounded-2xl rounded-tr-sm' 
                      : 'bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm'
                  }`}>
                    <div dangerouslySetInnerHTML={{ 
                        __html: msg.text
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n/g, '<br/>')
                      }} />
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            
            {/* Chat Input Area */}
            <div className="p-3 bg-gray-50/50 border-t border-gray-100 shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.askPlaceholder}
                  className="flex-1 pl-5 pr-12 py-3.5 rounded-2xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-white shadow-sm"
                  disabled={sending}
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || sending}
                  className="absolute right-2 top-2 p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:bg-gray-300 transition-all shadow-md"
                >
                  {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
