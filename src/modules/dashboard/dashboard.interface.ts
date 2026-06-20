import { SupplyChainOverallRiskLevel } from '@/shared/constants';

export interface IDashboardKpi {
  /** Unique identifier for the KPI card. */
  id: string;
  /** Display label shown on the dashboard card. */
  label: string;
  /** Current metric value. */
  value: number;
  /** Optional description below the value. */
  description?: string;
}

export interface IOngoingSupplyChain {
  /** Supply chain identifier. */
  supplyChainId: string;
  /** Display name of the supply chain. */
  name: string;
  /** Commodity name linked to the chain. */
  commodityName: string;
  /** Human-readable progress label (e.g. "At Collection"). */
  progressLabel: string;
  /** Number of lifecycle events recorded on this chain. */
  eventsRecordedCount: number;
  /** Aggregated deforestation risk from linked farm assessments. */
  overallRiskLevel: SupplyChainOverallRiskLevel;
}

export interface IDashboardChartPoint {
  /** Category label for the chart axis. */
  label: string;
  /** Numeric value for the chart bar. */
  value: number;
}

export interface IDashboardRecentActivity {
  /** Unique activity identifier. */
  id: string;
  /** Human-readable activity description. */
  description: string;
  /** ISO timestamp of when the activity occurred. */
  occurredAt: string;
  /** Supply chain this activity belongs to. */
  supplyChainId: string;
}

export interface IDashboardSummary {
  /** Key performance indicators for the overview cards. */
  kpis: IDashboardKpi[];
  /** Active supply chains still in progress (not delivered). */
  ongoingSupplyChains: IOngoingSupplyChain[];
  /** Event counts grouped by lifecycle type for charts. */
  eventsByType: IDashboardChartPoint[];
  /** Active chains grouped by furthest lifecycle stage reached. */
  chainProgress: IDashboardChartPoint[];
  /** Recent supply-chain activity feed items. */
  recentActivity: IDashboardRecentActivity[];
}

export type IGetDashboardSummaryOutput = IDashboardSummary;
