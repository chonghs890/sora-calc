import React from 'react';
import {
  BenchmarkType,
  LoanConfig,
  PropertyType,
  MASOvernightRate,
} from '../types/sora';
import { formatRate, formatSGD } from '../utils/soraCalculations';
import { HelpCircle, ShieldAlert, Sparkles, Building, Home } from 'lucide-react';

interface LoanInputsPanelProps {
  config: LoanConfig;
  onChange: (newConfig: LoanConfig) => void;
  latestRate: MASOvernightRate | null;
}

export const LoanInputsPanel: React.FC<LoanInputsPanelProps> = ({
  config,
  onChange,
  latestRate,
}) => {
  const propertyPresets = [
    { label: 'HDB 4-Rm (S$500K)', amount: 500000, type: 'hdb' as PropertyType, tenure: 25 },
    { label: 'HDB 5-Rm / EC (S$800K)', amount: 800000, type: 'hdb' as PropertyType, tenure: 25 },
    { label: 'Private Condo (S$1.4M)', amount: 1400000, type: 'condo' as PropertyType, tenure: 30 },
    { label: 'Landed (S$2.6M)', amount: 2600000, type: 'landed' as PropertyType, tenure: 30 },
  ];

  const bankSpreadPresets = [
    { label: 'DBS +0.65%', value: 0.65 },
    { label: 'OCBC +0.70%', value: 0.70 },
    { label: 'UOB +0.75%', value: 0.75 },
    { label: 'StanChart +0.60%', value: 0.60 },
  ];

  const handlePropertyTypeChange = (type: PropertyType) => {
    let newTenure = config.tenureYears;
    // MAS limits HDB bank loans to max 25 years
    if (type === 'hdb' && newTenure > 25) {
      newTenure = 25;
    }
    onChange({ ...config, propertyType: type, tenureYears: newTenure });
  };

  const getBenchmarkRateValue = (type: BenchmarkType): number => {
    if (!latestRate) return 3.0;
    switch (type) {
      case '1M_SORA':
        return latestRate.compounded1M;
      case '3M_SORA':
        return latestRate.compounded3M;
      case '6M_SORA':
        return latestRate.compounded6M;
      case 'DAILY_ARREARS':
        return latestRate.sora;
    }
  };

  const maxTenure = config.propertyType === 'hdb' ? 25 : 30;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Loan Parameters</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure borrowing amount, tenure, and MAS SORA benchmark margin
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>Currency: SGD</span>
          <span aria-hidden="true">·</span>
          <span>Day Count: Actual/365</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Property Type Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Property Classification
            </label>
            <span className="text-[11px] text-slate-500">
              {config.propertyType === 'hdb' ? 'MSR 30% & TDSR 55% Applies' : 'TDSR 55% Applies'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'hdb', label: 'HDB Flat' },
              { id: 'condo', label: 'Private Condo' },
              { id: 'landed', label: 'Landed Home' },
              { id: 'commercial', label: 'Commercial' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePropertyTypeChange(p.id as PropertyType)}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                  config.propertyType === p.id
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loan Amount */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Loan Amount (SGD)
            </label>
            <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
              {formatSGD(config.loanAmount)}
            </span>
          </div>

          <div className="relative rounded-lg shadow-2xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <span className="text-slate-400 font-mono text-sm font-semibold">S$</span>
            </div>
            <input
              type="number"
              min={50000}
              max={20000000}
              step={10000}
              value={config.loanAmount}
              onChange={(e) =>
                onChange({
                  ...config,
                  loanAmount: Math.max(0, Number(e.target.value)),
                })
              }
              className="block w-full pl-10 pr-4 py-2.5 text-sm font-mono font-medium text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent tabular-nums"
              placeholder="e.g. 800000"
            />
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[11px] text-slate-400 mr-1">Presets:</span>
            {propertyPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() =>
                  onChange({
                    ...config,
                    loanAmount: preset.amount,
                    propertyType: preset.type,
                    tenureYears: preset.tenure,
                  })
                }
                className="text-[11px] px-2 py-0.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loan Tenure */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Loan Tenure
              </label>
              {config.propertyType === 'hdb' && (
                <span className="text-[11px] text-amber-700 font-medium">
                  (MAS HDB Cap: 25 Years)
                </span>
              )}
            </div>
            <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
              {config.tenureYears} Years ({config.tenureYears * 12} Mos)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={maxTenure}
              step={1}
              value={config.tenureYears}
              onChange={(e) =>
                onChange({ ...config, tenureYears: Number(e.target.value) })
              }
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
            />
            <div className="w-16 shrink-0">
              <input
                type="number"
                min={1}
                max={maxTenure}
                value={config.tenureYears}
                onChange={(e) =>
                  onChange({
                    ...config,
                    tenureYears: Math.min(
                      maxTenure,
                      Math.max(1, Number(e.target.value))
                    ),
                  })
                }
                className="w-full text-center text-xs font-mono font-medium py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Benchmark Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              SORA Rate Benchmark
            </label>
            <span className="text-[11px] text-slate-500">
              MAS Published Rates
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              {
                id: '3M_SORA' as BenchmarkType,
                title: '3-Month Compounded SORA',
                desc: 'Standard for residential mortgages',
                rate: getBenchmarkRateValue('3M_SORA'),
                recommended: true,
              },
              {
                id: '1M_SORA' as BenchmarkType,
                title: '1-Month Compounded SORA',
                desc: 'Reflects monthly rate adjustments',
                rate: getBenchmarkRateValue('1M_SORA'),
                recommended: false,
              },
              {
                id: '6M_SORA' as BenchmarkType,
                title: '6-Month Compounded SORA',
                desc: 'Semi-annual rate resetting',
                rate: getBenchmarkRateValue('6M_SORA'),
                recommended: false,
              },
              {
                id: 'DAILY_ARREARS' as BenchmarkType,
                title: 'Daily SORA (In-Arrears)',
                desc: 'Calculated from actual daily rates',
                rate: getBenchmarkRateValue('DAILY_ARREARS'),
                recommended: false,
              },
            ].map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => onChange({ ...config, benchmarkType: b.id })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  config.benchmarkType === b.id
                    ? 'border-slate-900 bg-slate-900/5 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-900">
                      {b.title}
                    </span>
                    {b.recommended && (
                      <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.2 rounded font-medium">
                        Popular
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
                    {formatRate(b.rate)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  {b.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Bank Spread / Margin */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Bank Spread (Margin % p.a.)
            </label>
            <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
              +{formatRate(config.spread, 2)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0.1}
              max={2.5}
              step={0.05}
              value={config.spread}
              onChange={(e) =>
                onChange({ ...config, spread: Number(e.target.value) })
              }
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
            />
            <div className="w-20 shrink-0">
              <input
                type="number"
                min={0}
                max={5}
                step={0.05}
                value={config.spread}
                onChange={(e) =>
                  onChange({ ...config, spread: Math.max(0, Number(e.target.value)) })
                }
                className="w-full text-center text-xs font-mono font-medium py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Quick Bank Presets */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[11px] text-slate-400 mr-1">Bank Spreads:</span>
            {bankSpreadPresets.map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={() => onChange({ ...config, spread: b.value })}
                className="text-[11px] px-2 py-0.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Regulatory Floor Rate & Custom Rate Overrides */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-slate-800">
                  MAS Regulatory Stress Test Rate
                </span>
                <p className="text-[11px] text-slate-500">
                  MAS Notice 645 requires TDSR assessment at minimum 4.00% floor
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="text-xs font-mono font-bold text-slate-900">
                {config.stressRate.toFixed(2)}%
              </span>
              <input
                type="number"
                min={3.0}
                max={8.0}
                step={0.25}
                value={config.stressRate}
                onChange={(e) =>
                  onChange({ ...config, stressRate: Math.max(1, Number(e.target.value)) })
                }
                className="w-16 text-center text-xs font-mono font-medium py-1 border border-slate-200 rounded"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
