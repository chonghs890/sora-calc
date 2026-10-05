import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Activity,
  Key,
} from 'lucide-react';
import { checkServerlessHealth, fetchSoraRates } from '../services/masApiService';
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
  const [endpointInput, setEndpointInput] = useState(customEndpoint || '/api/sora');
  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [copiedTab, setCopiedTab] = useState<'serverless' | 'node' | 'python' | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'serverless' | 'node' | 'python'>('serverless');
  const [healthStatus, setHealthStatus] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      checkServerlessHealth().then((res) => {
        if (res.ok) setHealthStatus(res.data);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestState('testing');
    setTestMessage('Connecting to endpoint...');
    try {
      const result = await fetchSoraRates(endpointInput);
      onRatesUpdated(result);
      if (result.rates && result.rates.length > 0) {
        setTestState('success');
        setTestMessage(
          `Connection active! ${result.rates.length} rates loaded. Latest SORA: ${result.latestRate.sora}%. Source: ${result.source}`
        );
        onSaveEndpoint(endpointInput);
      } else {
        setTestState('error');
        setTestMessage('Endpoint responded, but returned empty rates list.');
      }
    } catch (err: any) {
      setTestState('error');
      setTestMessage(err?.message || 'Failed to reach backend endpoint');
    }
  };

  const copyCode = (code: string, type: 'serverless' | 'node' | 'python') => {
    navigator.clipboard.writeText(code);
    setCopiedTab(type);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const serverlessCode = `// Serverless Connection: /api/sora.ts (At project root)
// Target MAS API Gateway:
// https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily
// Header required: KeyId: <MAS_KEY_ID>

// In your .env file or serverless environment variables:
MAS_KEY_ID="YOUR_MAS_API_GATEWAY_KEY"

// Test endpoints:
// GET /api/health -> Checks serverless status & key configuration
// GET /api/sora   -> Fetches, normalizes and returns daily MAS SORA rates`;

  const nodeCode = `// Standalone Express route if running an external microservice
import express from 'express';
const router = express.Router();

const MAS_API = 'https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily';

router.get('/api/sora', async (req, res) => {
  const masKeyId = process.env.MAS_KEY_ID;
  if (!masKeyId) {
    return res.status(400).json({ error: 'MAS_KEY_ID environment variable is missing' });
  }

  const response = await fetch(MAS_API, {
    headers: { 'KeyId': masKeyId, 'Accept': 'application/json' }
  });
  const data = await response.json();
  res.json(data);
});`;

  const pythonCode = `# FastAPI Python Route: /api/sora
from fastapi import APIRouter, HTTPException
import os, httpx

router = APIRouter()
MAS_API = "https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily"

@router.get("/api/sora")
async def get_mas_sora():
    key_id = os.getenv("MAS_KEY_ID")
    if not key_id:
        raise HTTPException(status_code=400, detail="MAS_KEY_ID is missing")
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(MAS_API, headers={"KeyId": key_id})
        return resp.json()`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              MAS Serverless Connection Hub
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Root-level serverless functions: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">/api/sora.ts</code> and <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">/api/health.ts</code>
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
          {/* MAS API Gateway Information Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-600" />
                MAS API Gateway Endpoint
              </span>
              <span className="text-[11px] font-mono text-slate-500">Header: KeyId</span>
            </div>
            <div className="p-2 bg-white border border-slate-200 rounded font-mono text-[10.5px] text-slate-700 break-all select-all">
              https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500 pt-1">
              <span>Environment Variable: <code className="font-mono font-semibold text-slate-800">MAS_KEY_ID</code> (never hardcoded)</span>
              <span className="flex items-center gap-1">
                Status: {healthStatus?.masIntegration?.keyIdConfigured ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Key Configured
                  </span>
                ) : (
                  <span className="text-amber-700 font-medium">
                    Awaiting Key Injection
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Endpoint Input & Test Button */}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
              Active Serverless Route
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={endpointInput}
                onChange={(e) => setEndpointInput(e.target.value)}
                placeholder="/api/sora"
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
                {testState === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                )}
                <span>{testMessage}</span>
              </div>
            )}
          </div>

          {/* Code Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Connection Reference
              </span>
              <div className="flex p-0.5 bg-slate-100 rounded-md text-[11px]">
                <button
                  onClick={() => setActiveCodeTab('serverless')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeCodeTab === 'serverless'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Root /api Serverless
                </button>
                <button
                  onClick={() => setActiveCodeTab('node')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeCodeTab === 'node'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Express Microservice
                </button>
                <button
                  onClick={() => setActiveCodeTab('python')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeCodeTab === 'python'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  FastAPI
                </button>
              </div>
            </div>

            <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 p-3.5 text-slate-100 text-[11px] font-mono leading-relaxed">
              <button
                onClick={() =>
                  copyCode(
                    activeCodeTab === 'serverless'
                      ? serverlessCode
                      : activeCodeTab === 'node'
                      ? nodeCode
                      : pythonCode,
                    activeCodeTab
                  )
                }
                className="absolute top-2.5 right-2.5 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1 transition-colors"
              >
                {copiedTab === activeCodeTab ? (
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
              <pre className="overflow-x-auto max-h-52 pr-16">
                <code>
                  {activeCodeTab === 'serverless'
                    ? serverlessCode
                    : activeCodeTab === 'node'
                    ? nodeCode
                    : pythonCode}
                </code>
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
