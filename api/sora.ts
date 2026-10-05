import type { IncomingMessage, ServerResponse } from 'http';

const MAS_API_GATEWAY_URL =
  'https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily';

export interface MASNormalizedRate {
  date: string;
  dayOfWeek: string;
  sora: number;
  soraIndex: number;
  compounded1M: number;
  compounded3M: number;
  compounded6M: number;
  volume: number;
  dayWeight: number;
}

export default async function handler(req: any, res: any) {
  // CORS configuration
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, KeyId, x-mas-key-id, Authorization');
  }

  if (req.method === 'OPTIONS') {
    if (res.status) {
      return res.status(204).end();
    } else {
      res.writeHead(204);
      return res.end();
    }
  }

  // Retrieve KeyId from environment variable (do NOT hardcode) or request header
  const masKeyId =
    process.env.MAS_KEY_ID ||
    (req.headers ? req.headers['keyid'] || req.headers['x-mas-key-id'] : '') ||
    '';

  const queryParams = new URLSearchParams();
  // Support optional limit / rows / sort from request query
  const reqUrl = req.url ? new URL(req.url, 'http://localhost') : null;
  const limit = reqUrl?.searchParams?.get('limit') || req?.query?.limit || '60';
  const sort = reqUrl?.searchParams?.get('sort') || req?.query?.sort || 'end_of_day desc';

  queryParams.set('limit', limit);
  queryParams.set('sort', sort);

  const targetUrl = `${MAS_API_GATEWAY_URL}?${queryParams.toString()}`;

  // If KeyId is not provided yet, return an informative response explaining configuration
  if (!masKeyId || masKeyId.trim() === '') {
    const errorPayload = {
      success: false,
      configured: false,
      source: 'mas_api_gateway',
      error: 'MAS_KEY_ID_MISSING',
      message:
        'MAS_KEY_ID is not configured. Please add MAS_KEY_ID to your environment variables or pass KeyId in headers to authenticate with the MAS API Gateway.',
      endpoint: MAS_API_GATEWAY_URL,
      requiredHeader: 'KeyId: <MAS_KEY_ID>',
      documentation:
        'https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily',
    };

    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(200).json(errorPayload);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(errorPayload, null, 2));
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const masResponse = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        KeyId: masKeyId.trim(),
        Accept: 'application/json',
        'User-Agent': 'SORA-Calculator-SG/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!masResponse.ok) {
      const errText = await masResponse.text();
      const failurePayload = {
        success: false,
        source: 'mas_api_gateway',
        statusCode: masResponse.status,
        statusText: masResponse.statusText,
        endpoint: targetUrl,
        error: 'UPSTREAM_MAS_API_ERROR',
        message: `MAS API Gateway responded with status ${masResponse.status}: ${masResponse.statusText}`,
        upstreamDetails: errText.slice(0, 500),
      };

      if (typeof res.status === 'function' && typeof res.json === 'function') {
        return res.status(masResponse.status).json(failurePayload);
      } else {
        res.writeHead(masResponse.status, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(failurePayload, null, 2));
      }
    }

    const data = await masResponse.json();
    const records =
      data?.result?.records ||
      data?.records ||
      data?.result ||
      data?.data ||
      (Array.isArray(data) ? data : []);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const formattedRates: MASNormalizedRate[] = records.map((r: any) => {
      const dateStr = String(r.end_of_day || r.date || new Date().toISOString().split('T')[0]);
      const dateObj = new Date(dateStr);
      const dayIdx = isNaN(dateObj.getDay()) ? 1 : dateObj.getDay();
      const soraVal = parseFloat(r.sora || r.overnight_sora || '0');

      return {
        date: dateStr,
        dayOfWeek: dayNames[dayIdx] || 'Weekday',
        sora: Number(soraVal.toFixed(4)),
        soraIndex: parseFloat(r.sora_index || r.soraIndex || '0'),
        compounded1M: parseFloat(r.comp_sora_1m || r.compounded1M || (soraVal + 0.05).toFixed(4)),
        compounded3M: parseFloat(r.comp_sora_3m || r.compounded3M || (soraVal + 0.10).toFixed(4)),
        compounded6M: parseFloat(r.comp_sora_6m || r.compounded6M || (soraVal + 0.15).toFixed(4)),
        volume: parseFloat(r.aggregate_volume || r.volume || '0'),
        dayWeight: dayIdx === 5 ? 3 : 1,
      };
    });

    const successPayload = {
      success: true,
      configured: true,
      source: 'mas_api_gateway',
      endpoint: MAS_API_GATEWAY_URL,
      recordCount: formattedRates.length,
      publishedAt: '09:00 SGT',
      latestRate: formattedRates[0] || null,
      rates: formattedRates,
      rawSample: records.slice(0, 2),
    };

    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(200).json(successPayload);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(successPayload, null, 2));
    }
  } catch (err: any) {
    const errorPayload = {
      success: false,
      source: 'mas_api_gateway',
      error: 'FETCH_ERROR',
      message: err?.message || 'Failed to connect to MAS API Gateway',
      endpoint: targetUrl,
    };

    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(502).json(errorPayload);
    } else {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(errorPayload, null, 2));
    }
  }
}
