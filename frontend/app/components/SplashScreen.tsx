'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showSubtext, setShowSubtext] = useState(false);
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowText(true), 400);
    const t2 = setTimeout(() => setShowSubtext(true), 900);
    const t3 = setTimeout(() => setShowBar(true), 1200);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    const t4 = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 600);
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearInterval(interval);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-600 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
      }}
    >
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6">

        {/* Logo */}
        <div
          className="text-8xl animate-bounce"
          style={{ animationDuration: '2s', filter: 'drop-shadow(0 0 30px rgba(59,130,246,0.8))' }}
        >
          🏛️
        </div>

        {/* Title */}
        <div
          className={`text-center transition-all duration-700 ${
            showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wide">
            Blockchain Land Registry
          </h1>
        </div>

        {/* Subtitle */}
        <div
          className={`text-center transition-all duration-700 ${
            showSubtext ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="text-blue-300 text-lg tracking-widest uppercase">
            Government of India
          </p>
          <p className="text-blue-400 text-sm mt-1">
            Powered by Hyperledger Fabric 2.5.9
          </p>
        </div>

        {/* Progress Bar */}
        <div
          className={`w-64 md:w-80 transition-all duration-500 ${
            showBar ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="w-full bg-blue-900/50 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd)',
                boxShadow: '0 0 10px rgba(59,130,246,0.8)',
              }}
            />
          </div>
          <p className="text-blue-400 text-xs text-center mt-2">
            {progress < 40 ? 'Initializing blockchain...' :
             progress < 70 ? 'Connecting to network...' :
             progress < 90 ? 'Loading smart contracts...' :
             'Ready!'}
          </p>
        </div>

        {/* Blockchain nodes animation */}
        <div className="flex gap-3 mt-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-blue-400"
              style={{
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
                boxShadow: '0 0 6px rgba(96,165,250,0.8)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom text */}
      <div
        className={`absolute bottom-8 text-blue-500 text-xs transition-all duration-700 ${
          showSubtext ? 'opacity-100' : 'opacity-0'
        }`}
      >
        Immutable • Transparent • Secure
      </div>
    </div>
  );
}