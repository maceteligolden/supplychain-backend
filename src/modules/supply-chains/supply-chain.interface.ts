import { SupplyChainStatus } from '@/shared/constants';
import type {
  AssessmentRiskLevel,
  SupplyChainOverallRiskLevel,
} from '@/shared/constants/supply-chain-labels.constants';

/** PostgreSQL supply chain row returned from queries. */
export interface ISupplyChainRecord {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: SupplyChainStatus;
  commodityId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** API supply chain DTO. */
export interface ISupplyChainOutput {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: SupplyChainStatus;
  commodityId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IGetSupplyChainsOutput {
  supplyChains: ISupplyChainOutput[];
  total: number;
}

export type ISupplyChainAllocationInput = {
  batchId: string;
  quantity: number;
};

export interface ICreateSupplyChainInput {
  name: string;
  description?: string;
  status: SupplyChainStatus;
  commodityId?: string;
  allocations?: ISupplyChainAllocationInput[];
}

export interface IUpdateSupplyChainInput {
  name?: string;
  description?: string;
  status?: SupplyChainStatus;
  commodityId?: string;
}

export interface IDeleteSupplyChainOutput {
  success: boolean;
  id: string;
}

export interface ISyncSupplyChainAllocationsInput {
  allocations: ISupplyChainAllocationInput[];
}

export interface ISyncSupplyChainAllocationsOutput {
  allocations: {
    id: string;
    batchId: string;
    supplyChainId: string;
    quantity: number;
    allocatedAt: string;
    createdAt: string;
    updatedAt: string;
  }[];
  total: number;
}

/** Farm deforestation assessment analysis metrics. */
export interface IFarmAssessmentAnalysis {
  deforestationPercent: number;
  afforestationPercent: number;
  stabilityPercent: number;
  forestCoverPercent: number;
  protectedAreaOverlapPercent: number;
  protectedAreaDetected: boolean;
  whispRiskPcrop?: string | null;
}

/** Farm deforestation assessment record. */
export interface IFarmAssessment {
  id: string;
  farmId: string;
  riskLevel: AssessmentRiskLevel;
  analysis: IFarmAssessmentAnalysis;
  assessedAt: string;
  boundaryAreaHectares: number;
  createdAt: string;
}

/** Per-farm risk entry in a supply chain risk summary. */
export interface ISupplyChainFarmRiskEntry {
  farmId: string;
  farmName: string;
  riskLevel: AssessmentRiskLevel | null;
  latestAssessedAt?: string;
  analysis?: IFarmAssessmentAnalysis | null;
  allocatedQuantity: number;
  unit?: string;
}

/** Deforestation risk summary for a supply chain. */
export interface ISupplyChainRiskSummaryOutput {
  supplyChainId: string;
  overallRiskLevel: SupplyChainOverallRiskLevel;
  linkedFarmsCount: number;
  assessedFarmsCount: number;
  unassessedFarmsCount: number;
  hasPartialAssessment: boolean;
  farmRisks: ISupplyChainFarmRiskEntry[];
}

/** Summary statistics embedded in a supply chain report. */
export interface ISupplyChainStats {
  linkedFarmsCount: number;
  allocatedBatchesCount: number;
  totalAllocatedQuantity: number;
  eventsRecordedCount: number;
}

/** Batch allocation row in a supply chain report. */
export interface ISupplyChainReportAllocation {
  farmName: string;
  batchNumber: string;
  quantity: number;
  unit: string;
}

/** Lifecycle event row in a supply chain report. */
export interface ISupplyChainReportEvent {
  typeLabel: string;
  occurredAt: string;
  actorName: string;
  actorAddress: string;
  notes?: string;
}

/** Per-farm deforestation metrics in a supply chain report. */
export interface ISupplyChainReportDeforestationFarm {
  farmName: string;
  riskLabel: string;
  deforestationPercent: number | null;
  forestCoverPercent: number | null;
  protectedAreaOverlapPercent: number | null;
  lastAssessedAt?: string;
}

/** Deforestation section of a supply chain report. */
export interface ISupplyChainReportDeforestation {
  overallRiskLabel: string;
  farms: ISupplyChainReportDeforestationFarm[];
}

/** Traceability report DTO for export and display. */
export interface ISupplyChainReportOutput {
  name: string;
  code: string;
  statusLabel: string;
  commodityName: string;
  description?: string;
  generatedAt: string;
  stats: ISupplyChainStats;
  allocations: ISupplyChainReportAllocation[];
  events: ISupplyChainReportEvent[];
  deforestation: ISupplyChainReportDeforestation;
}
