import React from 'react';
import { Download, Sliders, Database, ExternalLink } from 'lucide-react';
import { MASApiResponse } from '../types/sora';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  apiData: MASApiResponse | null;
  onOpenBackendModal: () => void;
  onExportCSV: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  apiData,
  onOpenBackendModal,
  onExportCSV,
}) => {
  const navItems = [
    { id: 'calculator', label: 'Calculator' },
    { id: 'amortization', label: 'Amortization' },
    { id: 'rates', label: 'MAS Rate Feed' },
    { id: 'compare', label: 'Compare Packages' },
  ];

  const getSourceBadge = () => {
    if (!apiData) return { label: 'Connecting...', color: 'bg-amber-400' };
    if (apiData.source === 'custom_backend') {
      return { label: 'Custom Backend', color: 'bg-emerald-500' };
    }
    if (apiData.source === 'live_api') {
      return { label: 'Live MAS API', color: 'bg-emerald-500' };
    }
    return { label: 'MAS Benchmark Data', color: 'bg-sky-500' };
  };

  const badge = getSourceBadge();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="#calculator"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('calculator');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 hover:text-slate-800 transition-colors"
          >
            SORA Calculator SG
          </a>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className={`w-2 h-2 rounded-full ${badge.color}`}></span>
            {badge.label}
          </span>
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`transition-colors py-1 relative whitespace-nowrap ${
                activeTab === item.id
                  ? 'text-slate-900 font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              {item.label}
              {activeTab === item.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
              )}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenBackendModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            title="Configure Backend API Endpoint"
          >
            <Database className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Backend API</span>
          </button>
          <button
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
};
