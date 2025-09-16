'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // for search dropdown
  const [loadingTicker, setLoadingTicker] = useState(false); // for ticker details
  const [selectedTicker, setSelectedTicker] = useState<any>(null);
  const [showProceed, setShowProceed] = useState(false); // controls button delay
  const [days, setDays] = useState<number>(100); // NEW
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce fetch for search_ticker
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchTickers(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const fetchTickers = async (q: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/search_ticker/${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setResults(data); // expecting array of {symbol, company_name}
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickerDetails = async (symbol: string, daysValue?: number) => {
    try {
      setLoadingTicker(true);
      setShowProceed(false); // hide proceed button immediately
      // persist ticker and days to localStorage for Buy/Sell pages
      localStorage.setItem('ticker', symbol);
      localStorage.setItem('days', String(daysValue ?? days));

      const res = await fetch(
        `${baseUrl}/get_ticker/${encodeURIComponent(symbol)}?days=${daysValue ?? days}`
      );
      if (!res.ok) throw new Error('Failed to fetch ticker details');
      const data = await res.json();
      setSelectedTicker(data);
    } catch (err) {
      console.error(err);
      setSelectedTicker(null);
    } finally {
      setLoadingTicker(false);
    }
  };

  const handleSelect = (symbol: string) => {
    setQuery(symbol);
    setResults([]);
    fetchTickerDetails(symbol, days);
  };

  // Close dropdown when clicking outside search area
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setResults([]); // close dropdown
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Delay showing proceed button after graph is ready
  useEffect(() => {
    if (selectedTicker && !loadingTicker) {
      const timer = setTimeout(() => {
        setShowProceed(true);
      }, 1000); // 1 second delay
      return () => clearTimeout(timer);
    } else {
      setShowProceed(false);
    }
  }, [selectedTicker, loadingTicker]);

  return (
    <main className="flex flex-col items-center justify-start min-h-screen bg-[#10002b] text-white px-4 pt-20">
      <h1 className="text-3xl font-bold mb-6">Search Tickers</h1>

      {/* Search bar, days input, fetch button */}
      <div className="relative w-full max-w-4xl">
        {/* Main search controls row */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-center gap-4 mb-4">
          {/* Search bar */}
          <div className="w-full max-w-md relative" ref={containerRef}>
            <label className="text-sm text-gray-300 mb-1 block">Ticker Symbol</label>
            <input
              type="text"
              placeholder="Enter ticker symbol (e.g. AAPL)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#240046] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Dropdown */}
            {query && results.length > 0 && (
              <ul className="absolute w-full bg-[#240046] border border-blue-500 rounded-lg mt-1 max-h-60 overflow-auto z-10">
                {results.map((item: any, idx) => {
                  // expecting {symbol, company_name}
                  const symbol = item.symbol || item.ticker || item;
                  const companyName = item.company_name || '';
                  return (
                    <li
                      key={idx}
                      onClick={() => handleSelect(symbol)}
                      className="px-4 py-2 hover:bg-blue-500 cursor-pointer flex flex-col"
                    >
                      <span className="font-semibold">{symbol}</span>
                      {companyName && (
                        <span className="text-sm text-gray-300">{companyName}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {loading && (
              <div className="absolute right-4 top-9 text-sm text-gray-300">
                Loading...
              </div>
            )}
          </div>

          {/* Days input */}
          <div className="flex flex-col">
            <label className="text-sm text-gray-300 mb-1">Days</label>
            <input
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-4 py-3 rounded-lg bg-[#240046] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
            />
          </div>

          {/* Fetch Data Button */}
          <button
            onClick={() => query && fetchTickerDetails(query, days)}
            className="px-5 py-3 rounded-lg font-semibold shadow-md whitespace-nowrap"
            style={{ backgroundColor: '#9d4edd', color: '#10002b' }}
          >
            Fetch Data
          </button>
        </div>

        {/* Proceed Button with delay - centered */}
        {showProceed && (
          <div className="flex justify-center">
            <Link href="/buy-signals">
              <button
                className="flex items-center gap-2 px-6 py-3 text-sm rounded-full font-medium animate-bounce shadow-md"
                style={{ backgroundColor: '#9d4edd', color: '#10002b' }}
              >
                Proceed to strategy definition
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                  style={{ color: '#012D4A' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Loader for ticker details */}
      {loadingTicker && (
        <div className="mt-10 text-gray-300 animate-pulse">Loading ticker data...</div>
      )}

      {/* Show selected ticker data */}
      {selectedTicker && !loadingTicker && (
        <div className="mt-10 w-full max-w-5xl bg-[#240046] rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-2">
            {selectedTicker.company_name} ({selectedTicker.symbol})
          </h2>

          {/* Plotly Chart */}
          {selectedTicker.close &&
            Array.isArray(selectedTicker.close) &&
            selectedTicker.timestamp &&
            Array.isArray(selectedTicker.timestamp) && (
              <Plot
                data={[
                  {
                    x: selectedTicker.timestamp, // actual timestamps
                    y: selectedTicker.close,
                    type: 'scatter',
                    mode: 'lines+markers',
                    marker: { color: '#9d4edd' },
                    line: { color: '#9d4edd' },
                  },
                ]}
                layout={{
                  autosize: true,
                  title: `Closing Prices (Last ${days} Days)`,
                  paper_bgcolor: '#240046',
                  plot_bgcolor: '#240046',
                  font: { color: 'white' },
                  xaxis: {
                    title: 'Date',
                    type: 'date',
                    showgrid: true,
                    gridcolor: '#2a3f5f',
                  },
                  yaxis: {
                    title: 'Close Price',
                    showgrid: true,
                    gridcolor: '#2a3f5f',
                  },
                  margin: { l: 50, r: 30, t: 50, b: 50 },
                }}
                style={{ width: '100%', height: '500px' }}
                useResizeHandler={true}
              />
            )}
        </div>
      )}
    </main>
  );
}
