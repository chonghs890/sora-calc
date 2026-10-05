import React, { useState } from 'react';
import { X, Check, Copy, ExternalLink, RefreshCw, Terminal, CheckCircle2 } from 'lucide-react';
import { fetchSoraRates } from '../services/masApiService';
import { MASApiResponse } from '../types/sora';

interface BackendIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customEndpoint: string;
  onSaveEndpoint: (url: string) => void;
  currentApiData: MASApiResponse | null;
  onRatesUpdated: (data: MASApiResponse) => void;
}

export const BackendIntegrationModal: React.FC<BackendIntegrationModalProps> = ({
  isOpen,
  onClose,
  customEndpoint,
  onSaveEndpoint,
  currentApiData,
  onRatesUpdated,
}) => {
  const [endpointInput, setEndpointInput] = useState(customEndpoint);
  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [copiedTab, setCopiedTab] = useState<'node' | 'python' | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'node' | 'python' | 'contract'>('node');

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestState('testing');
    setTestMessage('Pinging endpoint...');
    try {
      const result = await fetchSoraRates(endpointInput);
      onRatesUpdated(result);
      if (result.source === 'custom_backend') {
        setTestState('success');
        setTestMessage(`Connected! Found ${result.rates.length} rates. Latest SORA: ${result.latestRate.sora}%`);
        onSaveEndpoint(endpointInput);
      } else {
        setTestState('error');
        setTestMessage(`Endpoint unreachable or invalid format. Reverted to official MAS benchmark archive.`);
      }
    } catch (err: any) {
      setTestState('error');
      setTestMessage(err?.message || 'Failed to reach custom backend');
    }
  };

  const copyCode = (code: string, type: 'node' | 'python') => {
    navigator.clipboard.writeText(code);
    setCopiedTab(type);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const nodeCode = `// Express / Node.js Backend Route: /api/sora/rates
import express from 'express';

const router = express.Router();
const MAS_API = 'https://eservices.mas.gov.sg/api/action/datastore/search.json?resource_id=9a0bf149-30c4-461a-8eed-4c58d8f6d4eb&limit=90&sort=end_of_day desc';

router.get('/api/sora/rates', async (req, res) => {
  try {
    const response = await fetch(MAS_API);
    const data = await response.json();
    const records = data.result?.records || [];

    // Map to SORA Calculator SG format
    const rates = records.map(r => ({
      date: r.end_of_day,
      sora: parseFloat(r.sora),
      compounded1M: parseFloat(r.comp_sora_1m),
      compounded3M: parseFloat(r.comp_sora_3m),
      compounded6M: parseFloat(r.comp_sora_6m),
      volume: parseFloat(r.aggregate_volume || 0),
    }));

    res.json({ rates, publishedAt: '09:00 SGT' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch MAS rates' });
  }
});

export default router;`;

  const pythonCode = `# FastAPI Python Route: /api/sora/rates
from fastapi import APIRouter
import httpx

router = APIRouter()
MAS_API = "https://eservices.mas.gov.sg/api/action/datastore/search.json?resource_id=9a0bf149-30c4-461a-8eed-4c58d8f6d4eb&limit=90&sort=end_of_day desc"

@router.get("/api/sora/rates")
async def get_mas_sora():
    async with httpx.AsyncClient() as client:
        resp = await client.get(MAS_API)
        data = resp.json()
        records = data.get("result", {}).get("records", [])

        rates = [{
            "date": r["end_of_day"],
            "sora": float(r["sora"]),
            "compounded1M": float(r.get("comp_sora_1m", 0)),
            "compounded3M": float(r.get("comp_sora_3m", 0)),
            "compounded6M": float(r.get("comp_sora_6m", 0)),
            "volume": float(r.get("aggregate_volume", 0)),
        } for r in records]

        return {"rates": rates, "publishedAt": "09:00 SGT"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Backend Integration Hub
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hook up your custom Node.js, Python, or proxy server for live MAS overnight rates
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 pt-4">
          {/* Custom Endpoint Input */}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
              Custom Backend Endpoint URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={endpointInput}
                onChange={(e) => setEndpointInput(e.target.value)}
                placeholder="e.g. /api/sora/rates or https://api.yourdomain.com/mas/sora"
                className="flex-1 px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                onClick={handleTestConnection}
                disabled={testState === 'testing'}
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                {testState === 'testing' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test & Save'
                )}
              </button>
            </div>

            {testMessage && (
              <div
                className={`mt-2 p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  testState === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {testState === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
                <span>{testMessage}</span>
              </div>
            )}
          </div>

          {/* Active Data Source Status */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Active Data Source:</span>
              <span className="font-semibold text-slate-900">
                {currentApiData?.source === 'custom_backend'
                  ? 'Custom Backend Proxy'
                  : currentApiData?.source === 'live_api'
                  ? 'Direct MAS eServices API'
                  : 'MAS Verified Benchmark Archive'}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Latest Rate Loaded:</span>
              <span className="font-mono text-slate-900">
                {currentApiData?.latestRate.date} (SORA {currentApiData?.latestRate.sora}%)
              </span>
            </div>
          </div>

          {/* Sample Backend Implementation Snippets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Backend Starter Templates
              </span>
              <div className="flex p-0.5 bg-slate-100 rounded-md text-[11px]">
                <button
                  onClick={() => setActiveCodeTab('node')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeCodeTab === 'node'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Node.js Express
                </button>
                <button
                  onClick={() => setActiveCodeTab('python')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeCodeTab === 'python'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Python FastAPI
                </button>
              </div>
            </div>

            <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 p-3.5 text-slate-100 text-[11px] font-mono leading-relaxed">
              <button
                onClick={() =>
                  copyCode(
                    activeCodeTab === 'node' ? nodeCode : pythonCode,
                    activeCodeTab === 'node' ? 'node' : 'python'
                  )
                }
                className="absolute top-2.5 right-2.5 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1 transition-colors"
              >
                {copiedTab ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
              <pre className="overflow-x-auto max-h-56 pr-16">
                <code>{activeCodeTab === 'node' ? nodeCode : pythonCode}</code>
              </pre>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
