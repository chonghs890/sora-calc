import React, { useState } from 'react';
import { MASOvernightRate } from '../types/sora';
import { formatRate } from '../utils/soraCalculations';
import { BookOpen, Calendar, HelpCircle, Activity, Layers } from 'lucide-react';

interface MASRateInspectorProps {
  rates: MASOvernightRate[];
  sourceNote?: string;
  sourceType: string;
}

export const MASRateInspector: React.FC<MASRateInspectorProps> = ({
  rates,
  sourceNote,
  sourceType,
}) => {
  const [selectedRange, setSelectedRange] = useState<'30d' | 'all'>('30d');
  const displayedRates = selectedRange === '30d' ? rates.slice(0, 30) : rates;

  // Chart data setup
  const reversedForChart = [...displayedRates].reverse();
  const minRate = Math.min(...reversedForChart.map((r) => r.sora)) - 0.1;
  const maxRate = Math.max(...reversedForChart.map((r) => r.compounded6M)) + 0.1;
  const rateRange = Math.max(0.2, maxRate - minRate);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">
              MAS Published Overnight Rates & Compounding Feed
            </h2>
            <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Official Benchmark
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Volume-weighted interbank overnight transactions published daily by
            Monetary Authority of Singapore (09:00 SGT)
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setSelectedRange('30d')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              selectedRange === '30d'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setSelectedRange('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              selectedRange === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Available ({rates.length})
          </button>
        </div>
      </div>

      {/* SVG Rate Chart: Overnight vs 3M Compounded */}
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 mb-3 gap-2">
          <span className="font-semibold text-slate-800">
            Overnight SORA vs Compounded Benchmark
          </span>
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-slate-900" />
              Overnight SORA (Daily)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-emerald-600" />
              3M Compounded SORA
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-sky-500 stroke-dashed" />
              1M Compounded SORA
            </span>
          </div>
        </div>

        <div className="w-full h-48 sm:h-56">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 700 180">
            {/* Horizontal guide lines */}
            {[0, 45, 90, 135, 180].map((y, idx) => {
              const val = maxRate - (idx / 4) * rateRange;
              return (
                <g key={y}>
                  <line
                    x1="40"
                    y1={y}
                    x2="690"
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                  />
                  <text
                    x="35"
                    y={y + 3}
                    fontSize="9"
                    fill="#94a3b8"
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {val.toFixed(2)}%
                  </text>
                </g>
              );
            })}

            {/* Polyline: 3M Compounded SORA (Smooth Green Line) */}
            {reversedForChart.length > 1 && (() => {
              const pts3M = reversedForChart.map((r, i) => {
                const x = 40 + (i / (reversedForChart.length - 1)) * 645;
                const y = 170 - ((r.compounded3M - minRate) / rateRange) * 160;
                return `${x},${y}`;
              });
              return (
                <polyline
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.5"
                  points={pts3M.join(' ')}
                />
              );
            })()}

            {/* Polyline: 1M Compounded SORA (Sky Line) */}
            {reversedForChart.length > 1 && (() => {
              const pts1M = reversedForChart.map((r, i) => {
                const x = 40 + (i / (reversedForChart.length - 1)) * 645;
                const y = 170 - ((r.compounded1M - minRate) / rateRange) * 160;
                return `${x},${y}`;
              });
              return (
                <polyline
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                  points={pts1M.join(' ')}
                />
              );
            })()}

            {/* Polyline: Daily Overnight SORA (Slate Line with points) */}
            {reversedForChart.length > 1 && (() => {
              const ptsSora = reversedForChart.map((r, i) => {
                const x = 40 + (i / (reversedForChart.length - 1)) * 645;
                const y = 170 - ((r.sora - minRate) / rateRange) * 160;
                return `${x},${y}`;
              });
              return (
                <>
                  <polyline
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth="1.8"
                    points={ptsSora.join(' ')}
                  />
                  {reversedForChart.map((r, i) => {
                    if (
                      i % Math.ceil(reversedForChart.length / 8) !== 0 &&
                      i !== reversedForChart.length - 1
                    )
                      return null;
                    const x = 40 + (i / (reversedForChart.length - 1)) * 645;
                    const y = 170 - ((r.sora - minRate) / rateRange) * 160;
                    return (
                      <g key={r.date}>
                        <circle cx={x} cy={y} r="3" fill="#0f172a" />
                        <text
                          x={x}
                          y={178}
                          fontSize="8.5"
                          fill="#64748b"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {r.date.slice(5)}
                        </text>
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* MAS Mathematical Compounding Formula Explain Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-800 mb-2">
          <BookOpen className="w-4 h-4 text-slate-600" />
          <span>MAS SORA Compounding Formula & Conventions</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800 overflow-x-auto mb-2.5">
          Compounded SORA = [ &prod; (1 + (SORA_i &times; n_i) / 36,500) - 1 ] &times; (36,500 / d)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-600 text-[11px] leading-relaxed">
          <div>
            <span className="font-semibold text-slate-900 block">Actual/365 Convention</span>
            Singapore dollar money market convention divides annual rate by 365 days (not 360).
          </div>
          <div>
            <span className="font-semibold text-slate-900 block">Weekend Weighting (n_i)</span>
            Friday's rate carries forward to Saturday and Sunday (weight = 3 calendar days).
          </div>
          <div>
            <span className="font-semibold text-slate-900 block">Robust Transaction Volume</span>
            Daily rate calculated from billions of dollars in actual overnight SGD borrowing deals.
          </div>
        </div>
      </div>

      {/* Daily Historical Table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Daily MAS Publication History
          </span>
          <span className="text-xs text-slate-400">
            Source: {sourceNote || 'Monetary Authority of Singapore (Datastore)'}
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Day</th>
                <th className="py-2.5 px-3 text-right">Overnight Rate</th>
                <th className="py-2.5 px-3 text-right">Weight (n_i)</th>
                <th className="py-2.5 px-3 text-right">1M Compounded</th>
                <th className="py-2.5 px-3 text-right">3M Compounded</th>
                <th className="py-2.5 px-3 text-right">Volume (S$M)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
              {displayedRates.map((r) => (
                <tr key={r.date} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2 px-3 font-sans font-medium text-slate-900">
                    {r.date}
                  </td>
                  <td className="py-2 px-3 font-sans text-slate-500">
                    {r.dayOfWeek}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums font-semibold text-slate-900">
                    {formatRate(r.sora)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-500">
                    {r.dayWeight} {r.dayWeight > 1 ? 'days' : 'day'}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-800">
                    {formatRate(r.compounded1M)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-emerald-700 font-semibold">
                    {formatRate(r.compounded3M)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-600">
                    S${r.volume.toLocaleString()}M
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
