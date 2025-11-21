
import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, ArrowRight, Telescope, Calendar, Share2, Feather } from 'lucide-react';
import { TimelinePhase, NewsItem, PresentAnalysis, FuturePrediction, LoadingState } from './types';
import * as GeminiService from './services/geminiService';
import StarryBackground from './components/StarryBackground';
import NewsCard from './components/NewsCard';
import TimeNav from './components/TimeNav';
import ShareCard from './components/ShareCard';

// Simple Chart component
const SentimentGauge = ({ score }: { score: number }) => (
  <div className="relative w-32 h-32 mx-auto my-4">
    <svg className="w-full h-full" viewBox="0 0 36 36">
      <path
        className="text-gray-800"
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className={`${score > 70 ? 'text-green-500' : score > 40 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000 ease-out`}
        strokeDasharray={`${score}, 100`}
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
    </svg>
    <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-2xl font-bold text-white">{score}</span>
        <span className="text-[10px] text-gray-400 uppercase">Sentiment</span>
    </div>
  </div>
);

export default function App() {
  const [phase, setPhase] = useState<TimelinePhase>(TimelinePhase.INPUT);
  const [keyword, setKeyword] = useState('');
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [presentReport, setPresentReport] = useState<PresentAnalysis | null>(null);
  const [futureReport, setFutureReport] = useState<FuturePrediction | null>(null);
  
  // Share Card State
  const [showShareCard, setShowShareCard] = useState(false);
  const [shareImage, setShareImage] = useState('');
  const [sharePoem, setSharePoem] = useState('');
  const [isGeneratingPoem, setIsGeneratingPoem] = useState(false);

  const [loading, setLoading] = useState<LoadingState>({
    isSearching: false,
    isAnalyzing: false,
    isPredicting: false,
    isTranslating: false,
  });

  const [enabledPhases, setEnabledPhases] = useState({
    [TimelinePhase.INPUT]: true,
    [TimelinePhase.PAST]: false,
    [TimelinePhase.PRESENT]: false,
    [TimelinePhase.FUTURE]: false,
  });

  // Handlers
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    // Reset all state
    setNewsItems([]);
    setPresentReport(null);
    setFutureReport(null);
    setShareImage('');
    setSharePoem('');
    
    setEnabledPhases({
        [TimelinePhase.INPUT]: true,
        [TimelinePhase.PAST]: true,
        [TimelinePhase.PRESENT]: false,
        [TimelinePhase.FUTURE]: false,
    });

    setLoading(prev => ({ ...prev, isSearching: true }));
    setPhase(TimelinePhase.PAST);

    try {
      const items = await GeminiService.searchPastNews(keyword);
      setNewsItems(items);
      
      setEnabledPhases(prev => ({ 
          ...prev, 
          [TimelinePhase.INPUT]: true,
          [TimelinePhase.PAST]: true,
          [TimelinePhase.PRESENT]: true 
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to retrieve timeline. Please try again.");
      setPhase(TimelinePhase.INPUT);
    } finally {
        setLoading(prev => ({ ...prev, isSearching: false }));
    }
  };

  const handlePhaseChange = async (newPhase: TimelinePhase) => {
    setPhase(newPhase);

    if (newPhase === TimelinePhase.PRESENT && !presentReport && !loading.isAnalyzing) {
        setLoading(prev => ({ ...prev, isAnalyzing: true }));
        try {
            const analysis = await GeminiService.analyzePresent(keyword, newsItems);
            setPresentReport(analysis);
            setEnabledPhases(prev => ({ ...prev, [TimelinePhase.FUTURE]: true }));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(prev => ({ ...prev, isAnalyzing: false }));
        }
    }

    if (newPhase === TimelinePhase.FUTURE && !futureReport && !loading.isPredicting && presentReport) {
        setLoading(prev => ({ ...prev, isPredicting: true }));
        try {
            const prediction = await GeminiService.predictFuture(keyword, presentReport);
            setFutureReport(prediction);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(prev => ({ ...prev, isPredicting: false }));
        }
    }
  };

  const handleGeneratePoem = async () => {
      if (!futureReport) return;
      if (shareImage && sharePoem) {
          setShowShareCard(true);
          return;
      }

      setIsGeneratingPoem(true);
      try {
          const { imageUrl, poem } = await GeminiService.generatePoeticContent(keyword, futureReport);
          setShareImage(imageUrl);
          setSharePoem(poem);
          setShowShareCard(true);
      } catch (err) {
          console.error("Error generating poem:", err);
      } finally {
          setIsGeneratingPoem(false);
      }
  };

  // Renderers
  const renderInput = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-float">
      <h1 className="font-magic text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-b from-purple-100 to-purple-500 mb-6 glow-text text-center">
        TIME POEM
      </h1>
      
      <p className="text-purple-200/70 font-poetic italic text-lg md:text-xl mb-12 tracking-wide text-center max-w-2xl animate-fade-in leading-relaxed">
        输入一个关键词，展示它过去、现在与未来的时间之诗
      </p>
      
      <form onSubmit={handleSearch} className="w-full max-w-md relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Enter a keyword (e.g., AI, Tesla)..."
          className="relative w-full bg-black text-white border border-white/20 rounded-lg py-4 px-6 text-lg focus:outline-none focus:border-purple-500 transition-all font-poetic"
        />
        <button 
          type="submit"
          className="absolute right-2 top-2 bottom-2 bg-white/10 hover:bg-purple-600 text-white px-4 rounded-md transition-colors flex items-center"
        >
          <Search className="w-5 h-5" />
        </button>
      </form>
    </div>
  );

  const renderPast = () => (
    <div className="max-w-6xl mx-auto px-4 pb-20">
      <div className="text-center mb-12">
         <h2 className="text-3xl font-magic text-purple-200 mb-4">The Past 30 Days</h2>
         <p className="text-gray-400 max-w-2xl mx-auto font-poetic">
            Echoes from the immediate past regarding <span className="text-white font-bold not-italic">"{keyword}"</span>.
         </p>
      </div>

      {loading.isSearching ? (
        <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
            <p className="text-purple-300 animate-pulse font-poetic">Gathering echoes...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsItems.map((item, idx) => (
                <NewsCard key={item.id} item={item} index={idx} />
            ))}
        </div>
      )}
    </div>
  );

  const renderPresent = () => (
    <div className="max-w-4xl mx-auto px-4 pb-20">
      {loading.isAnalyzing ? (
         <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
            <p className="text-cyan-300 animate-pulse font-poetic">Weaving the present tapestry...</p>
        </div>
      ) : presentReport ? (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-black/50 border border-cyan-500/30 rounded-2xl p-8 glow-box">
                <h2 className="text-3xl font-bold text-cyan-100 mb-6 flex items-center font-poetic">
                    <span className="mr-3 text-4xl">⚡</span> {presentReport.summaryTitle}
                </h2>
                
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-1 space-y-6">
                        <div>
                            <h4 className="text-cyan-400 uppercase text-xs font-bold tracking-wider mb-2">Monthly Summary</h4>
                            <p className="text-gray-300 leading-relaxed text-lg font-poetic">
                                {presentReport.overview}
                            </p>
                        </div>
                        <div className="bg-cyan-900/20 p-4 rounded-lg border-l-2 border-cyan-500">
                            <h4 className="text-cyan-400 uppercase text-xs font-bold tracking-wider mb-2">Deep Insight</h4>
                            <p className="text-gray-200 italic leading-relaxed font-poetic">
                                "{presentReport.detailedAnalysis}"
                            </p>
                        </div>
                    </div>
                    <div className="w-full md:w-48 bg-white/5 rounded-xl p-4 flex flex-col items-center self-center md:self-start">
                        <SentimentGauge score={presentReport.sentimentScore} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {presentReport.keyThemes.map((theme, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors">
                        <div className="text-4xl mb-4">{theme.icon}</div>
                        <h3 className="text-xl font-bold text-white mb-2">{theme.title}</h3>
                        <p className="text-gray-400 text-sm">{theme.description}</p>
                    </div>
                ))}
            </div>
        </div>
      ) : null}
    </div>
  );

  const renderFuture = () => (
    <div className="max-w-4xl mx-auto px-4 pb-20">
       {loading.isPredicting ? (
         <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
            <p className="text-amber-300 animate-pulse font-poetic">Divining the unseen path...</p>
        </div>
      ) : futureReport ? (
        <div className="space-y-16 animate-fade-in">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-black/60">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-900/20 to-transparent"></div>
                <div className="relative p-8 md:p-12">
                    <div className="flex items-center gap-4 mb-4">
                         <div className="inline-block px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-sm font-mono border border-amber-500/20">
                            Probability: {futureReport.probability}
                        </div>
                    </div>
                   
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-poetic">
                        {futureReport.scenarioTitle}
                    </h2>
                    <p className="text-xl text-gray-300 leading-relaxed font-poetic">
                        {futureReport.description}
                    </p>
                </div>
            </div>

            {/* Near Term (1 Year) */}
            <div>
                <h3 className="flex items-center text-2xl font-bold text-amber-200 mb-8 font-magic">
                    <Calendar className="mr-3 w-6 h-6" /> The Coming Year
                </h3>
                <div className="relative border-l-2 border-amber-500/20 ml-4 md:ml-8 space-y-8 pl-8 md:pl-12 py-2">
                    {futureReport.nearTermEvents.map((event, idx) => (
                        <div key={idx} className="relative group">
                             {/* Dot */}
                             <div className="absolute -left-[2.4rem] md:-left-[3.4rem] top-1 w-4 h-4 bg-amber-900 border border-amber-500 rounded-full group-hover:bg-amber-500 transition-colors"></div>
                             
                             <div className="bg-white/5 border border-white/10 p-5 rounded-xl hover:border-amber-500/40 transition-all">
                                 <span className="text-amber-400 font-mono text-sm font-bold uppercase tracking-wide block mb-1">
                                     {event.timeframe}
                                 </span>
                                 <p className="text-gray-200 text-lg font-poetic">{event.event}</p>
                             </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Distant Future */}
            <div className="pt-8 border-t border-white/10">
                <h3 className="flex items-center text-2xl font-bold text-purple-200 mb-8 font-magic">
                    <Telescope className="mr-3 w-6 h-6" /> Distant Horizon
                </h3>
                <div className="bg-gradient-to-br from-purple-900/20 to-black border border-purple-500/30 p-8 rounded-2xl relative overflow-hidden group">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/20 rounded-full blur-[50px] group-hover:bg-purple-500/30 transition-all"></div>
                    <h4 className="text-xl font-bold text-white mb-3 relative z-10 font-poetic">
                        {futureReport.distantVision.title}
                    </h4>
                    <p className="text-gray-300 leading-relaxed relative z-10 font-poetic">
                        {futureReport.distantVision.description}
                    </p>
                </div>
            </div>

            {/* Share Action */}
            <div className="flex justify-center pt-10 pb-10">
                <button 
                    onClick={handleGeneratePoem}
                    disabled={isGeneratingPoem}
                    className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full text-white font-bold text-lg shadow-[0_0_20px_rgba(147,51,234,0.5)] hover:shadow-[0_0_35px_rgba(147,51,234,0.8)] transition-all duration-300 disabled:opacity-70 disabled:cursor-wait overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 group-hover:opacity-0 transition-opacity duration-300"></div>
                    <span className="flex items-center relative z-10 font-magic tracking-wider">
                        {isGeneratingPoem ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Composing Poem...
                            </>
                        ) : (
                            <>
                                <Feather className="w-5 h-5 mr-2" />
                                Generate Time Poem
                            </>
                        )}
                    </span>
                </button>
            </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="min-h-screen text-white relative">
      <StarryBackground />

      <ShareCard 
        isOpen={showShareCard} 
        onClose={() => setShowShareCard(false)}
        imageUrl={shareImage}
        poem={sharePoem}
        keyword={keyword}
      />

      {phase === TimelinePhase.INPUT ? (
        renderInput()
      ) : (
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="p-6 text-center border-b border-white/5 bg-black/20 backdrop-blur-sm">
             <div className="inline-flex items-center space-x-3 text-purple-300 cursor-pointer transition-opacity hover:opacity-80" onClick={() => setPhase(TimelinePhase.INPUT)}>
                <span className="font-magic text-xl">Time Poem</span>
                <ArrowRight className="w-4 h-4" />
                <span className="text-white font-bold uppercase tracking-widest">{keyword}</span>
             </div>
          </header>

          <main className="flex-1 py-8">
            <TimeNav 
                currentPhase={phase} 
                onPhaseChange={handlePhaseChange} 
                enabledPhases={enabledPhases}
            />
            
            <div className="transition-opacity duration-500">
                {phase === TimelinePhase.PAST && renderPast()}
                {phase === TimelinePhase.PRESENT && renderPresent()}
                {phase === TimelinePhase.FUTURE && renderFuture()}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
