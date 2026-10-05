import {
  AmortizationPeriod,
  AnnualAmortizationSummary,
  BenchmarkType,
  LoanCalculationResult,
  LoanConfig,
  MASOvernightRate,
} from '../types/sora';
import { calculateMASCompoundedSORA } from '../data/masSoraDataset';

/**
 * Calculates monthly mortgage payment using standard French amortization formula
 */
export function calculateMonthlyInstallment(
  principal: number,
  annualRatePct: number,
  tenureYears: number
): number {
  if (principal <= 0 || tenureYears <= 0) return 0;
  if (annualRatePct <= 0) {
    return principal / (tenureYears * 12);
  }

  const monthlyRate = annualRatePct / 100 / 12;
  const totalMonths = tenureYears * 12;
  const factor = Math.pow(1 + monthlyRate, totalMonths);
  const installment = (principal * (monthlyRate * factor)) / (factor - 1);

  return Math.round(installment * 100) / 100;
}

/**
 * Formats Singapore Dollar (SGD) currency
 */
export function formatSGD(amount: number, showCents: boolean = false): string {
  if (isNaN(amount)) return 'S$0';
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(amount);
}

/**
 * Formats interest rates to 2 or 4 decimal places
 */
export function formatRate(rate: number, decimals: number = 4): string {
  if (isNaN(rate)) return '0.0000%';
  return rate.toFixed(decimals) + '%';
}

/**
 * Executes complete loan computation, generating monthly schedule and annual summaries
 */
export function calculateSoraLoan(
  config: LoanConfig,
  rates: MASOvernightRate[]
): LoanCalculationResult {
  const latest = rates[0] || {
    sora: 2.95,
    compounded1M: 3.00,
    compounded3M: 3.05,
    compounded6M: 3.12,
  };

  // Determine base benchmark rate
  let baseSoraRate = 0;
  if (config.customRateOverride !== null && config.customRateOverride !== undefined) {
    baseSoraRate = config.customRateOverride;
  } else {
    switch (config.benchmarkType) {
      case '1M_SORA':
        baseSoraRate = latest.compounded1M;
        break;
      case '3M_SORA':
        baseSoraRate = latest.compounded3M;
        break;
      case '6M_SORA':
        baseSoraRate = latest.compounded6M;
        break;
      case 'DAILY_ARREARS': {
        // Compute dynamically using available overnight rates and weights
        const sampleSlice = rates.slice(0, 30);
        baseSoraRate = calculateMASCompoundedSORA(sampleSlice, 30);
        break;
      }
      default:
        baseSoraRate = latest.compounded3M;
    }
  }

  const effectiveAnnualRate = Number((baseSoraRate + config.spread).toFixed(4));
  const totalMonths = config.tenureYears * 12;

  // Monthly installment at current SORA package
  const monthlyInstallment = calculateMonthlyInstallment(
    config.loanAmount,
    effectiveAnnualRate,
    config.tenureYears
  );

  // Regulatory Stress Test Installment (MAS regulatory floor 4.00%)
  const stressMonthlyInstallment = calculateMonthlyInstallment(
    config.loanAmount,
    config.stressRate,
    config.tenureYears
  );
  const monthlyStressBuffer = Math.max(0, stressMonthlyInstallment - monthlyInstallment);

  // Generate Amortization Schedule
  const schedule: AmortizationPeriod[] = [];
  const annualMap: { [year: number]: AnnualAmortizationSummary } = {};

  let currentBalance = config.loanAmount;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;

  const monthlyRate = effectiveAnnualRate / 100 / 12;
  const startYear = new Date().getFullYear();
  const startMonth = new Date().getMonth();

  for (let m = 1; m <= totalMonths; m++) {
    const interestPayment = currentBalance * monthlyRate;
    let principalPayment = monthlyInstallment - interestPayment;

    // Handle last month rounding or balance clearance
    if (m === totalMonths || principalPayment > currentBalance) {
      principalPayment = currentBalance;
    }

    const closingBalance = Math.max(0, currentBalance - principalPayment);
    cumulativeInterest += interestPayment;
    cumulativePrincipal += principalPayment;

    const periodDate = new Date(startYear, startMonth + m - 1, 1);
    const dateStr = periodDate.toLocaleDateString('en-SG', {
      month: 'short',
      year: 'numeric',
    });
    const loanYear = Math.ceil(m / 12);

    const periodEntry: AmortizationPeriod = {
      period: m,
      year: loanYear,
      month: ((m - 1) % 12) + 1,
      dateStr,
      openingBalance: currentBalance,
      monthlyInstallment: principalPayment + interestPayment,
      principalPaid: principalPayment,
      interestPaid: interestPayment,
      closingBalance,
      cumulativeInterest,
      cumulativePrincipal,
      effectiveRate: effectiveAnnualRate,
    };

    schedule.push(periodEntry);

    // Track annual summary
    if (!annualMap[loanYear]) {
      annualMap[loanYear] = {
        year: loanYear,
        openingBalance: currentBalance,
        totalPaid: 0,
        principalPaid: 0,
        interestPaid: 0,
        closingBalance: 0,
      };
    }
    annualMap[loanYear].totalPaid += principalPayment + interestPayment;
    annualMap[loanYear].principalPaid += principalPayment;
    annualMap[loanYear].interestPaid += interestPayment;
    annualMap[loanYear].closingBalance = closingBalance;

    currentBalance = closingBalance;
    if (currentBalance <= 0) break;
  }

  const annualSummaries = Object.values(annualMap);
  const totalPayment = cumulativePrincipal + cumulativeInterest;
  const firstYearSchedule = schedule.slice(0, 12);
  const firstYearInterest = firstYearSchedule.reduce((acc, curr) => acc + curr.interestPaid, 0);
  const firstYearPrincipal = firstYearSchedule.reduce((acc, curr) => acc + curr.principalPaid, 0);

  return {
    monthlyInstallment,
    stressMonthlyInstallment,
    monthlyStressBuffer,
    totalPayment,
    totalInterest: cumulativeInterest,
    effectiveAnnualRate,
    baseSoraRate,
    spread: config.spread,
    firstYearInterest,
    firstYearPrincipal,
    schedule,
    annualSummaries,
  };
}

/**
 * Exports amortization schedule to CSV string
 */
export function generateAmortizationCSV(
  schedule: AmortizationPeriod[],
  config: LoanConfig
): string {
  const headers = [
    'Month #',
    'Loan Year',
    'Date',
    'Opening Balance (SGD)',
    'Monthly Installment (SGD)',
    'Principal Paid (SGD)',
    'Interest Paid (SGD)',
    'Closing Balance (SGD)',
    'Cumulative Interest (SGD)',
    'Effective Rate (%)',
  ];

  const rows = schedule.map((p) => [
    p.period,
    p.year,
    `"${p.dateStr}"`,
    p.openingBalance.toFixed(2),
    p.monthlyInstallment.toFixed(2),
    p.principalPaid.toFixed(2),
    p.interestPaid.toFixed(2),
    p.closingBalance.toFixed(2),
    p.cumulativeInterest.toFixed(2),
    p.effectiveRate.toFixed(4),
  ]);

  const meta = [
    `# SORA Loan Amortization Schedule`,
    `# Loan Amount: ${config.loanAmount} SGD`,
    `# Tenure: ${config.tenureYears} Years`,
    `# Benchmark: ${config.benchmarkType}`,
    `# Bank Spread: ${config.spread}%`,
    `# Generated on: ${new Date().toISOString()}`,
    '',
  ];

  return [
    ...meta,
    headers.join(','),
    ...rows.map((r) => r.join(',')),
  ].join('\n');
}

/**
 * Triggers a download of the CSV in browser
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
