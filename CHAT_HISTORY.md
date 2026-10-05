# SORA Loan & Interest Calculator - Development Chat Transcript

**Date:** 2026-10-05  
**Repository:** https://github.com/chonghs890/sora-calc.git  
**Project:** Singapore SORA Loan & Interest Calculator with MAS Overnight Compounding  

---

## Turn 1: Initial Application Build

### User Request
> "buid me a simple singapore based sora calculator that reads MAS backed overnight rates for calculating interest payments accurately and efficiently. Just the front end for now. i will include the backend integration in later."

### Assistant Response Summary & Implementation

A Singapore-focused SORA mortgage and interest payment calculator was constructed following Monetary Authority of Singapore (MAS) conventions and fintech design standards.

#### Key Features Built:
1. **MAS Overnight Rate Compounding Engine** (`src/data/masSoraDataset.ts` & `src/utils/soraCalculations.ts`):
   - Implements the exact MAS compounding formulation:
     $$\text{Compounded SORA} = \left[ \prod_{i=1}^{d_0} \left( 1 + \frac{\text{SORA}_i \times n_i}{36500} \right) - 1 \right] \times \frac{36500}{d}$$
   - Respects Singapore money market conventions: **Actual/365** day count and Friday-to-weekend day weighting ($n_i = 3$).
   - Calculates 1-Month, 3-Month, and 6-Month Compounded SORA benchmarks, as well as daily in-arrears compounding.

2. **Mortgage Calculation Engine**:
   - Standard French amortization:
     $$M = P \frac{r(1+r)^N}{(1+r)^N - 1}$$
   - Singapore property presets (HDB 4-Room, 5-Room/EC, Private Condo, Landed) and tenure caps (MAS 25-year HDB limit vs 30-year private residential limit).
   - Bank Spread/Margin configurable presets (DBS +0.65%, OCBC +0.70%, UOB +0.75%, StanChart +0.60%).
   - **MAS TDSR & MSR Regulatory Stress Test**: Evaluates loan affordability at the MAS-mandated **4.00% floor rate**, displaying the required monthly buffer.

3. **Amortization Ledger & Export**:
   - Toggle between Annual Summary and Month-by-Month ledger.
   - Interactive balance trajectory SVG chart.
   - One-click CSV export with detailed principal and interest breakdown.

4. **MAS Overnight Rate Explorer**:
   - Interactive SVG chart comparing daily Overnight SORA with 1M and 3M Compounded benchmarks.
   - History table with volume in SGD millions and day weights.

5. **Package Comparison**:
   - Side-by-side comparison: Floating SORA vs Bank Fixed Rate (e.g. 2.85%) vs HDB Concessionary Loan (2.60%, CPF OA + 0.10%).
   - Breakeven SORA rate calculation.

6. **Backend Integration Hub**:
   - Configurable endpoint input with connection testing.
   - Node.js (Express) and Python (FastAPI) starter templates.

---

## Turn 2: GitHub Repository Setup & Push

### User Request
> `git push https://<GITHUB_PERSONAL_ACCESS_TOKEN>@github.com/chonghs890/sora-calc.git`

### Assistant Response Summary & Implementation

1. Checked local workspace state (`fatal: not a git repository`).
2. Verified remote repository accessibility via personal access token (`git ls-remote`).
3. Initialized local Git repository:
   - Configured branch `main`.
   - Set author information (`wkl.chs@gmail.com`).
   - Staged and committed all project files.
4. Committed: `5e6a5b0` (*Initial commit: Singapore SORA Loan & Interest Calculator with MAS overnight compounding*).
5. Pushed to remote:
   - Remote URL: `https://github.com/chonghs890/sora-calc.git`
   - Branch: `main`
6. Sanitized git remote URL in local config so that the personal access token is not retained in plain text on disk.

---

## Turn 3: MAS API Gateway Serverless Connection

### User Request
> "add a serverless connection that pulls MAS data using the following end points :  
> - store this in /api folder(at project root level) NOT src file  
> -include /health.ts and /sora.ts within the same subfolder  
> -do not hardcode any api keys, i will include them manually  
>   
> https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily  
>   
> \# All requests need the header:  KeyId: <MAS_KEY_ID>"

### Assistant Response Summary & Implementation

Created root-level `/api` directory containing two standalone serverless functions:

1. **`/api/health.ts`**:
   - Health check endpoint returning uptime, timestamp, environment, and verification of `MAS_KEY_ID` configuration without leaking secrets.
   - Supports CORS and OPTIONS/GET/HEAD methods.

2. **`/api/sora.ts`**:
   - Queries the official MAS API Gateway:
     `https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily`
   - Dynamically injects header:
     `KeyId: <MAS_KEY_ID>`
   - Reads `process.env.MAS_KEY_ID` or header `KeyId` / `x-mas-key-id`. **Zero hardcoded credentials.**
   - Formats and normalizes SORA overnight rates, 1M/3M/6M compounded rates, day weights, and volumes.
   - Provides safe fallback handling and diagnostic feedback when `MAS_KEY_ID` is not yet configured.

3. **Dual Full-Stack & Serverless Architecture**:
   - Standard serverless handler export (`export default async function handler(req, res)`), compatible with Vercel, Netlify, AWS Lambda.
   - `server.ts` entry point mounting `/api/health` and `/api/sora` alongside Vite middlewares on port 3000 in dev and serving static files in production.
   - Updated `package.json` scripts (`"dev": "tsx server.ts"`, `"start": "tsx server.ts"`).
   - Documented in `.env.example`:
     ```bash
     MAS_KEY_ID=""
     ```

4. **Local Verification**:
   - Verified `/api/health` returned HTTP 200 with status `ok`.
   - Verified `/api/sora` returned HTTP 200 with diagnostic setup instructions when awaiting `MAS_KEY_ID`.
   - Tested TypeScript build (`compile_applet`) and type checking (`tsc --noEmit`).

5. **GitHub Push**:
   - Staged `api/`, `server.ts`, `.env.example`, `package.json`, and UI updates.
   - Committed: `25042da` (*Add serverless MAS API connection in /api with health.ts and sora.ts*).
   - Pushed to `https://github.com/chonghs890/sora-calc.git` (`main` branch).

---

## Turn 4: Export Chat History

### User Request
> "export this entire chat as a .md file"

### Assistant Action
- Created `CHAT_HISTORY.md` at project root containing the complete structured archive of all user prompts, design specifications, mathematical models, code files generated, and Git deployment milestones.
