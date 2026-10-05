import React from 'react';
import { LoanCalculationResult, LoanConfig } from '../types/sora';
import { formatRate, formatSGD } from '../utils/soraCalculations';
import { ShieldCheck, TrendingUp, AlertTriangle, PieChart, DollarSign } from 'lucide-react';

interface SummaryMetricsGridProps {
  calculation: LoanCalculationResult;
  config: LoanConfig;
}

export const SummaryMetricsGrid: React.FC<SummaryMetricsGridProps> = ({
  calculation,
  config,
}) => {
  const principalShare = (config.loanAmount / calculation.totalPayment) * 100;
  const interestShare = (calculation.totalInterest / calculation.totalPayment) * 100;

  const firstYearInterestPct =
    (calculation.firstYearInterest /
      (calculation.firstYearInterest + calculation.firstYearPrincipal)) *
    100;

  return (
    <div className="space-y-4">
      {/* Primary Key Metric Card: Monthly Installment */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <span>Estimated Monthly Repayment</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-mono">
                {formatRate(calculation.effectiveAnnualRate)} All-in Rate
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-white tabular-nums">
                {formatSGD(calculation.monthlyInstallment)}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ month</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Based on {config.benchmarkType.replace('_', ' ')} (
              {formatRate(calculation.baseSoraRate)}) + Bank Spread (+
              {formatRate(calculation.spread, 2)})
            </p>
          </div>

          {/* Regulatory MAS Stress Test Callout */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3.5 sm:max-w-xs w-full">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span className="font-semibold flex items-center gap-1.5 text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5" />
                MAS Stress Test ({config.stressRate.toFixed(2)}%)
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-mono font-bold text-white tabular-nums">
                {formatSGD(calculation.stressMonthlyInstallment)}
              </span>
              <span className="text-xs text-amber-300 font-mono font-medium tabular-nums">
                +{formatSGD(calculation.monthlyStressBuffer)} /mo
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Ensure your monthly income complies with TDSR at this higher regulatory floor.
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Metrics 3-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Interest */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Interest
            </span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-mono font-bold text-slate-900 tabular-nums">
            {formatSGD(calculation.totalInterest)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>{interestShare.toFixed(1)}% of total repayment</span>
            <span className="font-mono text-slate-700">
              Total {formatSGD(calculation.totalPayment)}
            </span>
          </div>
        </div>

        {/* Year 1 Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Year 1 Interest
            </span>
            <PieChart className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-mono font-bold text-slate-900 tabular-nums">
            {formatSGD(calculation.firstYearInterest)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Principal repaid Y1:</span>
            <span className="font-mono font-medium text-slate-800">
              {formatSGD(calculation.firstYearPrincipal)}
            </span>
          </div>
        </div>

        {/* Total Payment Over Tenure */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Loan Lifetime
            </span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-mono font-bold text-slate-900 tabular-nums">
            {formatSGD(calculation.totalPayment)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>{config.tenureYears * 12} Installments</span>
            <span className="text-emerald-700 font-medium">Actual/365</span>
          </div>
        </div>
      </div>

      {/* Visual Amortization Progress Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-900"></span>
              Principal: {formatSGD(config.loanAmount)} ({principalShare.toFixed(1)}%)
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-500">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500"></span>
              Interest: {formatSGD(calculation.totalInterest)} ({interestShare.toFixed(1)}%)
            </span>
          </div>
          <span className="text-slate-400 hidden sm:inline">Amortization Split</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-md overflow-hidden flex">
          <div
            className="bg-slate-900 h-full transition-all duration-300"
            style={{ width: `${principalShare}%` }}
            title={`Principal: ${principalShare.toFixed(1)}%`}
          />
          <div
            className="bg-amber-500 h-full transition-all duration-300"
            style={{ width: `${interestShare}%` }}
            title={`Interest: ${interestShare.toFixed(1)}%`}
          />
        </div>
      </div>
    </div>
  );
};
