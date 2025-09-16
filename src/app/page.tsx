'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleStart = () => {
    router.push('/search');
  };

  // Pre-defined but varied candle data
  const candles = [
    { x: 100, high: 250, low: 140, open: 440, close: 180 },
    { x: 160, high: 420, low: 210, open: 220, close: 380 },
    { x: 220, high: 500, low: 250, open: 300, close: 450 },
    { x: 280, high: 450, low: 190, open: 390, close: 220 },
    { x: 340, high: 470, low: 220, open: 230, close: 430 },
    { x: 400, high: 430, low: 180, open: 370, close: 210 },
    { x: 460, high: 490, low: 240, open: 320, close: 460 },
    { x: 520, high: 460, low: 200, open: 420, close: 250 },
    { x: 580, high: 480, low: 220, open: 240, close: 400 },
    { x: 640, high: 420, low: 180, open: 390, close: 200 },
    { x: 700, high: 500, low: 250, open: 300, close: 470 },
    { x: 760, high: 450, low: 200, open: 420, close: 230 },
    { x: 820, high: 480, low: 220, open: 230, close: 430 },
    { x: 880, high: 430, low: 190, open: 370, close: 210 },
    { x: 940, high: 490, low: 240, open: 320, close: 460 },
    { x: 1000, high: 460, low: 200, open: 420, close: 250 },
    { x: 1060, high: 480, low: 220, open: 240, close: 400 },
    { x: 1120, high: 420, low: 180, open: 390, close: 200 },
    { x: 1180, high: 500, low: 250, open: 300, close: 470 },
    { x: 1240, high: 400, low: 200, open: 260, close: 400 },
    { x: 1300, high: 460, low: 200, open: 420, close: 250 },

  ];

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen bg-[#22223b] text-white overflow-hidden">
      {/* Fullscreen Candlestick Chart SVG Background */}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
        <svg
          viewBox="0 0 1400 600"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full opacity-20"
          aria-hidden="true"
        >
          {/* Grid */}
          <g stroke="#ffffff" strokeOpacity="0.05">
            {Array.from({ length: 11 }).map((_, i) => (
              <line
                key={i}
                x1="80"
                x2="1320"
                y1={60 + i * 50}
                y2={60 + i * 50}
              />
            ))}
          </g>

          {/* Y Axis */}
          <line x1="80" y1="60" x2="80" y2="560" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2" />

          {/* X Axis */}
          <line x1="80" y1="510" x2="1320" y2="510" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2" />

          {/* Tick marks Y-axis */}
          {Array.from({ length: 11 }).map((_, i) => (
            <line
              key={`ytick-${i}`}
              x1="75"
              x2="85"
              y1={60 + i * 50}
              y2={60 + i * 50}
              stroke="#ffffff"
              strokeOpacity="0.25"
            />
          ))}

          {/* Tick marks X-axis */}
          {Array.from({ length: 16 }).map((_, i) => (
            <line
              key={`xtick-${i}`}
              x1={80 + i * 80}
              x2={80 + i * 80}
              y1="505"
              y2="515"
              stroke="#ffffff"
              strokeOpacity="0.25"
            />
          ))}

          {/* Candlesticks */}
          <g strokeWidth="2">
            {candles.map((candle, idx) => {
              const color = candle.close >= candle.open ? '#34d399' : '#f87171'; // green vs red
              const bodyTop = Math.min(candle.open, candle.close);
              const bodyBottom = Math.max(candle.open, candle.close);
              return (
                <g key={idx} transform={`translate(${candle.x},0)`}>
                  {/* Wick */}
                  <line
                    x1={10}
                    x2={10}
                    y1={candle.high}
                    y2={candle.low}
                    stroke={color}
                    strokeOpacity="0.7"
                  />
                  {/* Body */}
                  <rect
                    x={4}
                    y={bodyTop}
                    width={12}
                    height={bodyBottom - bodyTop}
                    fill={color}
                    fillOpacity="0.5"
                    stroke={color}
                    strokeOpacity="0.8"
                    rx="1"
                  />
                </g>
              );
            })}
          </g>

          {/* Optional faint line graph overlay */}
          <polyline
            points={candles
              .map(c => `${c.x},${c.close}`)
              .join(' ')}
            fill="none"
            stroke="#60a5fa"
            strokeWidth="1.5"
            strokeOpacity="0.3"
          />
        </svg>
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 text-center max-w-2xl px-6">
        <h1 className="text-5xl font-extrabold mb-6">Backtest Your Stock Strategies</h1>
        <p className="text-xl text-gray-300 mb-10">
          Run simulations, analyze performance, and optimize your trading strategies — all in one place.
        </p>

        <button
          onClick={handleStart}
          className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg text-xl font-medium transition"
        >
          Get Started
        </button>
      </div>
    </main>
  );
}
