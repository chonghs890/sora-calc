export type PropertyType = 'hdb' | 'condo' | 'landed' | 'commercial';

export type BenchmarkType = '1M_SORA' | '3M_SORA' | '6M_SORA' | 'DAILY_ARREARS';

export interface MASOvernightRate {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  sora: number; // Daily overnight rate in %
  soraIndex: number;
  compounded1M: number;
  compounded3M: number;
  compounded6M: number;
  volume: number; // in SGD Million
  dayWeight: number; // 1 for weekdays, 3 for Friday -> weekend
}

export interface LoanConfig {
  loanAmount: number;
  tenureYears: number;
  propertyType: PropertyType;
  benchmarkType: BenchmarkType;
  spread: number; // Bank spread percentage, e.g. 0.65
  stressRate: number; // MAS regulatory floor, e.g. 4.00
  startDate: string; // YYYY-MM-DD
  customRateOverride: number | null; // Optional manual override
}

export interface AmortizationPeriod {
  period: number; // 1 to tenure * 12
  year: number;
  month: number;
  dateStr: string;
  openingBalance: number;
  monthlyInstallment: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
  effectiveRate: number;
}

export interface AnnualAmortizationSummary {
  year: number;
  openingBalance: number;
  totalPaid: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
}

export interface LoanCalculationResult {
  monthlyInstallment: number;
  stressMonthlyInstallment: number;
  monthlyStressBuffer: number;
  totalPayment: number;
  totalInterest: number;
  effectiveAnnualRate: number;
  baseSoraRate: number;
  spread: number;
  firstYearInterest: number;
  firstYearPrincipal: number;
  schedule: AmortizationPeriod[];
  annualSummaries: AnnualAmortizationSummary[];
}

export interface MASApiResponse {
  success: boolean;
  source: 'live_api' | 'custom_backend' | 'mas_archive';
  endpoint?: string;
  publishedAt: string;
  rates: MASOvernightRate[];
  latestRate: MASOvernightRate;
  note?: string;
}
