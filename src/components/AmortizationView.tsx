import React, { useState } from 'react';
import {
  AmortizationPeriod,
  AnnualAmortizationSummary,
  LoanConfig,
} from '../types/sora';
import { formatSGD, formatRate } from '../utils/soraCalculations';
import { Download, Search, Calendar, ChevronRight } from 'lucide-react';

interface AmortizationViewProps {
  schedule: AmortizationPeriod[];
  annualSummaries: AnnualAmortizationSummary[];
  config: LoanConfig;
  onExportCSV: () => void;
}

export const AmortizationView: React.FC<AmortizationViewProps> = ({
  schedule,
  annualSummaries,
  config,
  onExportCSV,
}) => {
  const [viewMode, setViewMode] = useState<'annual' | 'monthly'>('annual');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter schedule if in monthly mode
  const filteredSchedule = schedule.filter((item) => {
    if (selectedYear !== 'all' && item.year !== selectedYear) return false;
    if (searchQuery.trim() !== '') {
      return (
        item.dateStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.period).includes(searchQuery)
      );
    }
    return true;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-xs space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Amortization Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full principal reduction and interest repayment trajectory under SORA
          </p>
        </div>

        {/* View Mode Switcher and Actions */}
        <div className="flex items-center gap-2">
          {/* Segmented control for View Mode */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setViewMode('annual')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                viewMode === 'annual'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual Summary
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                viewMode === 'monthly'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Ledger
            </button>
          </div>

          <button
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Download CSV amortization file"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* SVG Balance Trajectory Chart */}
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
        <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
          <span className="font-semibold text-slate-800">
            Loan Balance Over Time
          </span>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
              Remaining Balance
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Cumulative Interest
            </span>
          </div>
        </div>

        {/* Responsive Amortization Line Graph */}
        <div className="w-full h-44 sm:h-52 pt-2">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 700 160">
            <defs>
              <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f172a" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 40, 80, 120, 160].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="700"
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
              />
            ))}

            {/* Path for Principal Balance */}
            {annualSummaries.length > 0 && (() => {
              const maxVal = config.loanAmount * 1.05;
              const points = annualSummaries.map((s, idx) => {
                const x = (idx / (annualSummaries.length - 1)) * 680 + 10;
                const y = 150 - (s.closingBalance / maxVal) * 140;
                return `${x},${y}`;
              });
              const areaPoints = `10,150 ${points.join(' ')} 690,150`;

              return (
                <>
                  <polygon points={areaPoints} fill="url(#balanceGrad)" />
                  <polyline
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth="2.5"
                    points={points.join(' ')}
                  />
                  {annualSummaries.map((s, idx) => {
                    if (idx % 5 !== 0 && idx !== annualSummaries.length - 1)
                      return null;
                    const x = (idx / (annualSummaries.length - 1)) * 680 + 10;
                    const y = 150 - (s.closingBalance / maxVal) * 140;
                    return (
                      <g key={s.year}>
                        <circle cx={x} cy={y} r="3.5" fill="#0f172a" />
                        <text
                          x={x}
                          y={158}
                          fontSize="9"
                          fill="#64748b"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          Yr {s.year}
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

      {/* Monthly Filter Bar if in monthly mode */}
      {viewMode === 'monthly' && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by month / year (e.g. 2027 or Nov)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 whitespace-nowrap">Filter Year:</span>
            <select
              value={selectedYear}
              onChange={(e) =>
                setSelectedYear(
                  e.target.value === 'all' ? 'all' : Number(e.target.value)
                )
              }
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
            >
              <option value="all">All Years</option>
              {annualSummaries.map((s) => (
                <option key={s.year} value={s.year}>
                  Year {s.year}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Table Data Grid */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        {viewMode === 'annual' ? (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Year</th>
                <th className="py-2.5 px-3 text-right">Opening Balance</th>
                <th className="py-2.5 px-3 text-right">Total Repaid</th>
                <th className="py-2.5 px-3 text-right">Principal</th>
                <th className="py-2.5 px-3 text-right">Interest</th>
                <th className="py-2.5 px-3 text-right">Ending Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
              {annualSummaries.map((item) => (
                <tr
                  key={item.year}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <td className="py-2 px-3 font-sans font-medium text-slate-900">
                    Year {item.year}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums">
                    {formatSGD(item.openingBalance)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums font-semibold text-slate-900">
                    {formatSGD(item.totalPaid)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-emerald-700">
                    {formatSGD(item.principalPaid)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-amber-700">
                    {formatSGD(item.interestPaid)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums font-medium text-slate-900">
                    {formatSGD(item.closingBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Opening</th>
                <th className="py-2.5 px-3 text-right">Installment</th>
                <th className="py-2.5 px-3 text-right">Principal</th>
                <th className="py-2.5 px-3 text-right">Interest</th>
                <th className="py-2.5 px-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
              {filteredSchedule.slice(0, 120).map((row) => (
                <tr
                  key={row.period}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <td className="py-2 px-3 text-slate-400 tabular-nums">
                    {row.period}
                  </td>
                  <td className="py-2 px-3 font-sans text-slate-900">
                    {row.dateStr}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums">
                    {formatSGD(row.openingBalance)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums font-semibold text-slate-900">
                    {formatSGD(row.monthlyInstallment)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-emerald-700">
                    {formatSGD(row.principalPaid)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-amber-700">
                    {formatSGD(row.interestPaid)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-900">
                    {formatSGD(row.closingBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewMode === 'monthly' && filteredSchedule.length > 120 && (
        <p className="text-center text-xs text-slate-500">
          Showing first 120 months. Use "Export CSV" for all{' '}
          {filteredSchedule.length} payments.
        </p>
      )}
    </div>
  );
};
