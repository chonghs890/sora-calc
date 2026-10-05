import React, { useState } from 'react';
import { LoanCalculationResult, LoanConfig } from '../types/sora';
import { calculateMonthlyInstallment, formatRate, formatSGD } from '../utils/soraCalculations';
import { Scale, Check, ArrowRight, Shield } from 'lucide-react';

interface ComparisonScenarioProps {
  currentCalculation: LoanCalculationResult;
  config: LoanConfig;
}

export const ComparisonScenario: React.FC<ComparisonScenarioProps> = ({
  currentCalculation,
  config,
}) => {
  const [fixedRate, setFixedRate] = useState<number>(2.85);
  const hdbConcessionaryRate = 2.60; // Standard Singapore HDB rate = CPF OA (2.50%) + 0.10%

  const fixedMonthly = calculateMonthlyInstallment(
    config.loanAmount,
    fixedRate,
    config.tenureYears
  );
  const fixedTotalPayment = fixedMonthly * config.tenureYears * 12;
  const fixedTotalInterest = fixedTotalPayment - config.loanAmount;

  const hdbMonthly = calculateMonthlyInstallment(
    config.loanAmount,
    hdbConcessionaryRate,
    config.tenureYears
  );
  const hdbTotalPayment = hdbMonthly * config.tenureYears * 12;
  const hdbTotalInterest = hdbTotalPayment - config.loanAmount;

  const diffVsFixed = currentCalculation.monthlyInstallment - fixedMonthly;
  const diffVsHdb = currentCalculation.monthlyInstallment - hdbMonthly;

  // Breakeven benchmark SORA rate
  const breakevenFixedSora = Math.max(0, fixedRate - config.spread);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">
              Package & Rate Comparison
            </h2>
            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              Singapore Mortgage Presets
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Benchmark this SORA floating package against Bank Fixed packages and HDB Concessionary loan
          </p>
        </div>

        {/* Fixed Rate Customizer */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <span className="text-slate-600 font-medium">Bank Fixed Rate:</span>
          <div className="flex items-center">
            <input
              type="number"
              min={1.0}
              max={6.0}
              step={0.05}
              value={fixedRate}
              onChange={(e) => setFixedRate(Number(e.target.value))}
              className="w-16 px-2 py-1 border border-slate-200 rounded font-mono text-center text-slate-900 font-semibold text-xs"
            />
            <span className="ml-1 text-slate-500">%</span>
          </div>
        </div>
      </div>

      {/* Comparison Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Selected SORA Floating Package */}
        <div className="border-2 border-slate-900 rounded-xl p-4.5 bg-slate-900/2 flex flex-col justify-between relative">
          <div className="absolute -top-2.5 right-4 bg-slate-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Your Selection
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Floating SORA Package
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {config.benchmarkType.replace('_', ' ')} + Spread
            </h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
                {formatSGD(currentCalculation.monthlyInstallment)}
              </span>
              <span className="text-xs text-slate-500">/mo</span>
            </div>
            <div className="text-xs text-slate-600 mt-1 font-mono">
              All-in: {formatRate(currentCalculation.effectiveAnnualRate, 2)}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-200 text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span>Benchmark Rate:</span>
              <span className="font-mono">{formatRate(currentCalculation.baseSoraRate, 4)}</span>
            </div>
            <div className="flex justify-between">
              <span>Bank Spread:</span>
              <span className="font-mono">+{formatRate(currentCalculation.spread, 2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-900 pt-1">
              <span>Lifetime Interest:</span>
              <span className="font-mono">{formatSGD(currentCalculation.totalInterest)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Bank Fixed Rate Package */}
        <div className="border border-slate-200 rounded-xl p-4.5 bg-white flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Bank Fixed Rate
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {formatRate(fixedRate, 2)} Fixed Package
            </h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
                {formatSGD(fixedMonthly)}
              </span>
              <span className="text-xs text-slate-500">/mo</span>
            </div>
            <div className="text-xs mt-1">
              {diffVsFixed > 0 ? (
                <span className="text-emerald-700 font-medium">
                  SORA is {formatSGD(Math.abs(diffVsFixed))} /mo higher
                </span>
              ) : (
                <span className="text-emerald-700 font-medium">
                  SORA saves {formatSGD(Math.abs(diffVsFixed))} /mo
                </span>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span>Rate Stability:</span>
              <span className="text-slate-900 font-medium">Locked 2-3 Years</span>
            </div>
            <div className="flex justify-between">
              <span>Breakeven SORA:</span>
              <span className="font-mono font-medium text-slate-900">
                {formatRate(breakevenFixedSora, 2)}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-slate-900 pt-1">
              <span>Lifetime Interest:</span>
              <span className="font-mono">{formatSGD(fixedTotalInterest)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: HDB Concessionary Loan */}
        <div className="border border-slate-200 rounded-xl p-4.5 bg-white flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Singapore Statutory
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              HDB Concessionary Loan
            </h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
                {formatSGD(hdbMonthly)}
              </span>
              <span className="text-xs text-slate-500">/mo</span>
            </div>
            <div className="text-xs mt-1">
              {diffVsHdb > 0 ? (
                <span className="text-slate-600">
                  SORA is {formatSGD(Math.abs(diffVsHdb))} /mo higher
                </span>
              ) : (
                <span className="text-emerald-700 font-medium">
                  SORA saves {formatSGD(Math.abs(diffVsHdb))} /mo
                </span>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span>Formula:</span>
              <span className="text-slate-900">CPF OA + 0.10%</span>
            </div>
            <div className="flex justify-between">
              <span>Statutory Rate:</span>
              <span className="font-mono font-medium text-slate-900">
                {formatRate(hdbConcessionaryRate, 2)}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-slate-900 pt-1">
              <span>Lifetime Interest:</span>
              <span className="font-mono">{formatSGD(hdbTotalInterest)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Insight Box */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed">
        <span className="font-semibold text-slate-900 block mb-1">
          Market Intelligence & Refinancing Insight
        </span>
        If you expect MAS overnight SORA to decline below{' '}
        <span className="font-mono font-bold text-slate-900">
          {formatRate(breakevenFixedSora, 2)}
        </span>{' '}
        over the coming lock-in window, the floating SORA package delivers lower cumulative interest.
        If SORA remains above this breakeven threshold, a fixed package offers superior certainty.
      </div>
    </div>
  );
};
