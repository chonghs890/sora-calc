import type { IncomingMessage, ServerResponse } from 'http';

interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  masIntegration: {
    endpointConfigured: boolean;
    endpoint: string;
    keyIdConfigured: boolean;
    headerRequired: string;
  };
}

export default async function handler(req: any, res: any) {
  // Set CORS headers
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, KeyId, Authorization');
  }

  if (req.method === 'OPTIONS') {
    if (res.status) {
      return res.status(204).end();
    } else {
      res.writeHead(204);
      return res.end();
    }
  }

  const masKeyId = process.env.MAS_KEY_ID;
  const isKeyConfigured = Boolean(masKeyId && masKeyId.trim().length > 0);

  const payload: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    masIntegration: {
      endpointConfigured: true,
      endpoint:
        'https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily',
      keyIdConfigured: isKeyConfigured,
      headerRequired: 'KeyId: <MAS_KEY_ID>',
    },
  };

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(200).json(payload);
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(payload, null, 2));
  }
}
