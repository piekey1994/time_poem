import React, { useState } from 'react';
import { NewsItem } from '../types';
import { ExternalLink, Languages, Globe } from 'lucide-react';
import { translateContent } from '../services/geminiService';

interface NewsCardProps {
  item: NewsItem;
  index: number;
}

const NewsCard: React.FC<NewsCardProps> = ({ item, index }) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translatedSummary, setTranslatedSummary] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  
  // Generate deterministic gradient based on Title + ID hash
  // This ensures the same news item always gets the same color
  const hash = (item.title + item.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Elegant dark gradient palette
  const gradients = [
    'from-purple-900 via-indigo-950 to-black',
    'from-blue-900 via-slate-900 to-black',
    'from-emerald-900 via-teal-950 to-black',
    'from-rose-900 via-red-950 to-black',
    'from-amber-900 via-orange-950 to-black',
    'from-fuchsia-900 via-purple-950 to-black',
    'from-cyan-900 via-blue-950 to-black',
  ];
  const gradientClass = gradients[hash % gradients.length];

  // Helper to extract cleaner domain name for display
  const getDomain = (url: string) => {
    try {
        const domain = new URL(url).hostname;
        return domain.replace('www.', '');
    } catch {
        return 'news.google.com';
    }
  };

  const domain = getDomain(item.url);
  // Use Google's S2 service to fetch high-res favicons
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

  const handleTranslate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (translatedTitle) return;

    setIsTranslating(true);
    try {
        const [tTitle, tSummary] = await Promise.all([
            translateContent(item.title),
            translateContent(item.summary)
        ]);
        setTranslatedTitle(tTitle);
        setTranslatedSummary(tSummary);
    } catch (error) {
        console.error("Translation failed", error);
    } finally {
        setIsTranslating(false);
    }
  };

  const displayTitle = translatedTitle || item.title;
  const displaySummary = translatedSummary || item.summary;
  const showTranslateBtn = !translatedTitle;

  return (
    <div 
        className="group relative bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] flex flex-col h-full"
        style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header: Abstract Gradient + Source Identity */}
      <div className={`h-32 relative overflow-hidden bg-gradient-to-br ${gradientClass} p-5 flex flex-col justify-between`}>
        
        {/* Decorative Noise Texture */}
        <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
        
        {/* Decorative Glow Effect */}
        <div className="absolute -right-4 -top-10 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>

        {/* Top Row: Source Logo & Info */}
        <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 p-2 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                    {imgError ? (
                        <Globe className="w-5 h-5 text-gray-400" />
                    ) : (
                        <img 
                            src={faviconUrl} 
                            alt={item.source} 
                            className="w-full h-full object-contain opacity-90" 
                            onError={() => setImgError(true)} 
                        />
                    )}
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-white/90 uppercase tracking-wider drop-shadow-md">
                        {item.source}
                    </span>
                    <span className="text-[10px] text-white/60 font-mono truncate max-w-[140px]">
                        {domain}
                    </span>
                </div>
            </div>
            
            {item.date && (
                 <span className="text-[10px] text-white/80 font-medium bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm border border-white/5">
                    {item.date}
                 </span>
            )}
        </div>
      </div>

      {/* Content Body */}
      <div className="p-6 flex-1 flex flex-col relative bg-black/40">
         {/* Subtle gradient bleed line from top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

        <h3 className="text-lg font-bold text-gray-100 mb-3 leading-snug group-hover:text-purple-200 transition-colors font-poetic">
            {displayTitle}
        </h3>
        
        <p className="text-sm text-gray-400 mb-6 flex-1 line-clamp-4 leading-relaxed">
            {displaySummary}
        </p>
        
        {/* Footer: Actions */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
            <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-wide group/link"
            >
                Read Source <ExternalLink className="w-3 h-3 ml-1 group-hover/link:translate-x-0.5 transition-transform" />
            </a>

            {showTranslateBtn && (
                <button 
                    onClick={handleTranslate}
                    disabled={isTranslating}
                    className="inline-flex items-center text-xs text-gray-500 hover:text-white transition-colors disabled:opacity-50"
                >
                    <Languages className="w-3 h-3 mr-1" />
                    {isTranslating ? 'Translating...' : 'Translate'}
                </button>
            )}
            {translatedTitle && (
                <span className="text-[10px] text-green-400/70 flex items-center">
                    <Languages className="w-3 h-3 mr-1" /> Translated
                </span>
            )}
        </div>
      </div>
    </div>
  );
};

export default NewsCard;