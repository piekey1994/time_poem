import React from 'react';

const StarryBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] bg-[#050505] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a103c] via-[#050505] to-[#000000]"></div>
      {/* Decorative glowing orbs */}
      <div className="absolute top-[-10%] left-[20%] w-96 h-96 bg-purple-900/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[20%] w-96 h-96 bg-indigo-900/20 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '2s'}}></div>
      
      {/* Grid overlay for tech feel */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
    </div>
  );
};

export default StarryBackground;
