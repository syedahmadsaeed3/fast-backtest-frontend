'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Plotly for Next.js (client-side only)
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function ResultsPage() {
  const [stats, setStats] = useState<Record<string, any> | null>(null);
  const [graphData, setGraphData] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem('backtest_result');
    if (data) {
      const parsed = JSON.parse(data);
      setStats(parsed.stats || {});
      setGraphData(parsed.graph_data || {});
    }
  }, []);

  if (!stats || !graphData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#081c15] text-white">
        <p className="text-lg">No results found. Please run a strategy first.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#081c15] text-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Backtest Results</h1>

      {/* Graph */}
      <div className="w-full mb-8">
        <Plot
          data={graphData.data}
          layout={{
            ...graphData.layout,
            autosize: true,
            paper_bgcolor: '#081c15',
            plot_bgcolor: '#081c15',
            font: { color: '#ffffff' },
            width: undefined,
            height: 500,
            margin: { t: 40, l: 40, r: 40, b: 40 },
          }}
          style={{ width: '100%', height: '500px' }}
          useResizeHandler={true}
        />
      </div>

      {/* Stats Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-700 bg-[#0f2d22] shadow-md rounded-lg">
          <thead className="bg-[#194434]">
            <tr>
              <th className="py-2 px-4 border-b border-gray-700 text-left text-white">Metric</th>
              <th className="py-2 px-4 border-b border-gray-700 text-left text-white">Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats).map(([key, value]) => (
              <tr key={key} className="hover:bg-[#1c3d2f]">
                <td className="py-2 px-4 border-b border-gray-700 font-medium">{key}</td>
                <td className="py-2 px-4 border-b border-gray-700">{String(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
