import React, { useState, useEffect, useMemo } from 'react';
import {
  LoanConfig,
  MASApiResponse,
  MASOvernightRate,
} from './types/sora';
import { fetchSoraRates } from './services/masApiService';
import {
  calculateSoraLoan,
  downloadCSV,
  formatRate,
  formatSGD,
  generateAmortizationCSV,
} from './utils/soraCalculations';
import { Navbar } from './components/Navbar';
import { MASRateTickerBar } from './components/MASRateTickerBar';
import { LoanInputsPanel } from './components/LoanInputsPanel';
import { SummaryMetricsGrid } from './components/SummaryMetricsGrid';
import { AmortizationView } from './components/AmortizationView';
import { MASRateInspector } from './components/MASRateInspector';
import { ComparisonScenario } from './components/ComparisonScenario';
import { BackendIntegrationModal } from './components/BackendIntegrationModal';
import {
  ShieldAlert,
  Info,
  CheckCircle2,
  FileSpreadsheet,
  Calculator,
  Layers,
  ArrowRight,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('calculator');
  const [isRefreshingRates, setIsRefreshingRates] = useState<boolean>(false);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState<boolean>(false);
  const [customBackendUrl, setCustomBackendUrl] = useState<string>('');
  const [apiData, setApiData] = useState<MASApiResponse | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Default Singapore Mortgage Loan Configuration
  const [loanConfig, setLoanConfig] = useState<LoanConfig>({
    loanAmount: 800000, // S$800K (Typical Singapore 5-room HDB or EC mortgage)
    tenureYears: 25,
    propertyType: 'hdb',
    benchmarkType: '3M_SORA',
    spread: 0.65, // Standard +0.65% bank spread
    stressRate: 4.0, // MAS TDSR 4.00% regulatory floor
    startDate: new Date().toISOString().split('T')[0],
    customRateOverride: null,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load initial MAS SORA rates on mount
  useEffect(() => {
    const loadRates = async () => {
      setIsRefreshingRates(true);
      const data = await fetchSoraRates(customBackendUrl);
      setApiData(data);
      setIsRefreshingRates(false);
    };
    loadRates();
  }, []);

  const handleRefreshRates = async () => {
    setIsRefreshingRates(true);
    const data = await fetchSoraRates(customBackendUrl);
    setApiData(data);
    setIsRefreshingRates(false);
    showToast('MAS SORA overnight benchmark rates refreshed');
  };

  // Perform calculation whenever config or rates change
  const calculationResult = useMemo(() => {
    const rates = apiData?.rates || [];
    return calculateSoraLoan(loanConfig, rates);
  }, [loanConfig, apiData]);

  // Export Amortization Schedule to CSV
  const handleExportCSV = () => {
    if (!calculationResult.schedule || calculationResult.schedule.length === 0)
      return;
    const csvContent = generateAmortizationCSV(
      calculationResult.schedule,
      loanConfig
    );
    const filename = `SORA_Loan_Schedule_${loanConfig.loanAmount}_${loanConfig.tenureYears}Y.csv`;
    downloadCSV(filename, csvContent);
    showToast(`Downloaded ${filename}`);
  };

  const latestRate = apiData?.latestRate || null;
  const previousRate =
    apiData && apiData.rates.length > 1 ? apiData.rates[1] : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1. Strict 3-Zone Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiData={apiData}
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
        onExportCSV={handleExportCSV}
      />

      {/* 2. Official MAS SORA Rate Ticker */}
      <MASRateTickerBar
        latestRate={latestRate}
        previousRate={previousRate}
        sourceNote={apiData?.note}
        onRefresh={handleRefreshRates}
        isRefreshing={isRefreshingRates}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
        {/* Navigation Tabs (Mobile & Quick Access) */}
        <div className="flex md:hidden items-center gap-1 p-1 bg-slate-200/70 rounded-lg overflow-x-auto">
          {[
            { id: 'calculator', label: 'Calculator' },
            { id: 'amortization', label: 'Amortization' },
            { id: 'rates', label: 'MAS Rate Feed' },
            { id: 'compare', label: 'Compare Packages' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === item.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Calculator Main View */}
        {activeTab === 'calculator' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Loan Inputs (5 cols on lg) */}
              <div className="lg:col-span-5">
                <LoanInputsPanel
                  config={loanConfig}
                  onChange={setLoanConfig}
                  latestRate={latestRate}
                />
              </div>

              {/* Right Column: Key Metrics & Summary (7 cols on lg) */}
              <div className="lg:col-span-7 space-y-6">
                <SummaryMetricsGrid
                  calculation={calculationResult}
                  config={loanConfig}
                />

                {/* Quick Switch to Full Amortization Schedule */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      View Year-by-Year Amortization Schedule
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Explore monthly balance reductions, interest accumulation,
                      and export to CSV
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('amortization')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <span>View Schedule</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Singapore Regulatory TDSR / MSR Guidelines Box */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs text-slate-600 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Monetary Authority of Singapore (MAS) Borrowing Limits</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    Under MAS regulations, financial institutions must apply a Total Debt
                    Servicing Ratio (TDSR) limit of <span className="font-semibold text-slate-900">55%</span> of
                    gross monthly income, and a Mortgage Servicing Ratio (MSR) limit of{' '}
                    <span className="font-semibold text-slate-900">30%</span> for HDB and EC purchases. All
                    eligibility assessments use the MAS medium-term stress interest rate (
                    <span className="font-semibold text-slate-900">4.00% floor</span>) rather than the
                    introductory promotional rate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Amortization Ledger */}
        {activeTab === 'amortization' && (
          <AmortizationView
            schedule={calculationResult.schedule}
            annualSummaries={calculationResult.annualSummaries}
            config={loanConfig}
            onExportCSV={handleExportCSV}
          />
        )}

        {/* Tab 3: MAS Rate Explorer & Feed */}
        {activeTab === 'rates' && (
          <MASRateInspector
            rates={apiData?.rates || []}
            sourceNote={apiData?.note}
            sourceType={apiData?.source || 'mas_archive'}
          />
        )}

        {/* Tab 4: Compare Packages */}
        {activeTab === 'compare' && (
          <ComparisonScenario
            currentCalculation={calculationResult}
            config={loanConfig}
          />
        )}
      </main>

      {/* Backend Integration Drawer/Modal */}
      <BackendIntegrationModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        customEndpoint={customBackendUrl}
        onSaveEndpoint={(url) => {
          setCustomBackendUrl(url);
          showToast('Custom backend URL saved');
        }}
        currentApiData={apiData}
        onRatesUpdated={(data) => {
          setApiData(data);
          showToast('Updated rates from backend');
        }}
      />

      {/* Footnote per anti-slop rules: quiet, clean, helpful */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            <span>SORA Calculator SG</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>MAS Overnight Rate Compounding & Mortgage Analysis</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsBackendModalOpen(true)}
              className="hover:text-slate-900 transition-colors"
            >
              Backend API Integration
            </button>
            <span aria-hidden="true">·</span>
            <span>Singapore Money Market (Actual/365)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
