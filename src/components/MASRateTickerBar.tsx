import React from 'react';
import { RefreshCw, Activity, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { MASOvernightRate } from '../types/sora';
import { formatRate } from '../utils/soraCalculations';

interface MASRateTickerBarProps {
  latestRate: MASOvernightRate | null;
  previousRate: MASOvernightRate | null;
  sourceNote?: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const MASRateTickerBar: React.FC<MASRateTickerBarProps> = ({
  latestRate,
  previousRate,
  sourceNote,
  onRefresh,
  isRefreshing,
}) => {
  if (!latestRate) return null;

  const soraDelta = previousRate ? latestRate.sora - previousRate.sora : 0;
  const isUp = soraDelta >= 0;

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Key Rates Ticker Grid */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            {/* 3M SORA */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">3M Compounded SORA:</span>
              <span className="font-mono font-semibold text-slate-900 text-sm tabular-nums">
                {formatRate(latestRate.compounded3M)}
              </span>
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] font-medium">
                Mortgage Standard
              </span>
            </div>

            <div className="hidden sm:block text-slate-300">·</div>

            {/* 1M SORA */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">1M Compounded:</span>
              <span className="font-mono font-semibold text-slate-900 text-sm tabular-nums">
                {formatRate(latestRate.compounded1M)}
              </span>
            </div>

            <div className="hidden sm:block text-slate-300">·</div>

            {/* 6M SORA */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">6M Compounded:</span>
              <span className="font-mono font-semibold text-slate-900 text-sm tabular-nums">
                {formatRate(latestRate.compounded6M)}
              </span>
            </div>

            <div className="hidden sm:block text-slate-300">·</div>

            {/* Overnight SORA */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Overnight SORA:</span>
              <span className="font-mono font-semibold text-slate-900 text-sm tabular-nums">
                {formatRate(latestRate.sora)}
              </span>
              {previousRate && (
                <span
                  className={`inline-flex items-center text-[11px] font-mono tabular-nums ${
                    isUp ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {isUp ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(soraDelta).toFixed(4)}%
                </span>
              )}
            </div>

            <div className="hidden lg:block text-slate-300">·</div>

            {/* Volume */}
            <div className="hidden xl:flex items-center gap-1.5 text-slate-500">
              <span>Volume:</span>
              <span className="font-mono text-slate-800 font-medium tabular-nums">
                S${latestRate.volume.toLocaleString()}M
              </span>
            </div>
          </div>

          {/* Contextual Info & Refresh Button */}
          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <div className="flex items-center gap-2">
              <span>MAS Publication: {latestRate.date} (09:00 SGT)</span>
              <span aria-hidden="true">·</span>
              <span className="hidden sm:inline">Convention: Actual/365</span>
            </div>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors p-1 rounded hover:bg-slate-100"
              title="Refresh rates from MAS feed"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-slate-900' : ''}`}
              />
              <span className="sr-only">Refresh rates</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
