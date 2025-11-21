import React from 'react';
import { TimelinePhase } from '../types';
import { History, Zap, Sparkles } from 'lucide-react';

interface TimeNavProps {
  currentPhase: TimelinePhase;
  onPhaseChange: (phase: TimelinePhase) => void;
  enabledPhases: { [key in TimelinePhase]: boolean };
}

const TimeNav: React.FC<TimeNavProps> = ({ currentPhase, onPhaseChange, enabledPhases }) => {
  const getButtonClass = (phase: TimelinePhase, target: TimelinePhase) => {
    const isActive = phase === target;
    const isEnabled = enabledPhases[target];
    
    let base = "flex-1 flex items-center justify-center py-4 px-2 transition-all duration-300 relative overflow-hidden group ";
    
    if (isActive) {
      base += "text-white bg-purple-900/40 border-b-2 border-purple-400 ";
    } else if (isEnabled) {
      base += "text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer ";
    } else {
      base += "text-gray-700 cursor-not-allowed opacity-50 ";
    }

    return base;
  };

  const renderIcon = (target: TimelinePhase) => {
      switch(target) {
          case TimelinePhase.PAST: return <History className="w-4 h-4 mr-2" />;
          case TimelinePhase.PRESENT: return <Zap className="w-4 h-4 mr-2" />;
          case TimelinePhase.FUTURE: return <Sparkles className="w-4 h-4 mr-2" />;
          default: return null;
      }
  }

  return (
    <div className="sticky top-4 z-50 max-w-2xl mx-auto px-4 mb-8">
      <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-full p-1 flex shadow-2xl glow-box">
        
        <button
          onClick={() => enabledPhases[TimelinePhase.PAST] && onPhaseChange(TimelinePhase.PAST)}
          className={`${getButtonClass(currentPhase, TimelinePhase.PAST)} rounded-l-full`}
        >
          {renderIcon(TimelinePhase.PAST)}
          <span className="font-magic tracking-wider">过去 (Past)</span>
          {currentPhase === TimelinePhase.PAST && <span className="absolute inset-0 bg-purple-500/10 animate-pulse rounded-l-full"></span>}
        </button>

        <button
          onClick={() => enabledPhases[TimelinePhase.PRESENT] && onPhaseChange(TimelinePhase.PRESENT)}
          className={getButtonClass(currentPhase, TimelinePhase.PRESENT)}
        >
          {renderIcon(TimelinePhase.PRESENT)}
          <span className="font-magic tracking-wider">现在 (Present)</span>
          {currentPhase === TimelinePhase.PRESENT && <span className="absolute inset-0 bg-cyan-500/10 animate-pulse"></span>}
        </button>

        <button
          onClick={() => enabledPhases[TimelinePhase.FUTURE] && onPhaseChange(TimelinePhase.FUTURE)}
          className={`${getButtonClass(currentPhase, TimelinePhase.FUTURE)} rounded-r-full`}
        >
          {renderIcon(TimelinePhase.FUTURE)}
          <span className="font-magic tracking-wider">未来 (Future)</span>
          {currentPhase === TimelinePhase.FUTURE && <span className="absolute inset-0 bg-amber-500/10 animate-pulse rounded-r-full"></span>}
        </button>

      </div>
    </div>
  );
};

export default TimeNav;
