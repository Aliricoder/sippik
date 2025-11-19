
import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { useTranslation } from '../translations';
import { Share, X, PlusSquare } from 'lucide-react';

interface IosInstallGuideProps {
  language: Language;
}

export const IosInstallGuide: React.FC<IosInstallGuideProps> = ({ language }) => {
  const t = useTranslation(language);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    // Detect if already installed (standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    // Show if iOS, not standalone, and not dismissed previously
    const isDismissed = sessionStorage.getItem('ios_install_dismissed');

    if (isIOS && !isStandalone && !isDismissed) {
      setShow(true);
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('ios_install_dismissed', 'true');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 pb-safe">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 p-4 relative animate-in slide-in-from-bottom duration-500 mx-auto max-w-md">
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full"
        >
          <X size={16} />
        </button>

        <div className="flex gap-4">
          <div className="shrink-0 bg-gray-50 p-3 rounded-xl flex items-center justify-center h-fit">
             <Share size={24} className="text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-sm mb-1">{t.installApp}</h3>
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
              {t.installDesc}
            </p>
            
            <div className="flex flex-col gap-2">
               <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold">1</span>
                  <span>{t.shareBtn} <Share size={12} className="inline mx-1" /></span>
               </div>
               <div className="w-px h-2 bg-gray-200 ml-2.5"></div>
               <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold">2</span>
                  <span>{t.safariIos} <PlusSquare size={12} className="inline mx-1" /></span>
               </div>
            </div>
          </div>
        </div>
        
        {/* Pointer Arrow */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-white transform rotate-45 border-b border-r border-gray-200 hidden md:block"></div>
      </div>
    </div>
  );
};
