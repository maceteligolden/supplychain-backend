import { BatchStatus, CommodityUnit } from '@/shared/constants';

/** Public batch DTO returned by the API. */
export interface IBatchOutput {
  id: string;
  batchNumber: string;
  farmId: string;
  commodityId: string;
  harvestDate: string;
  quantity: number;
  unit: CommodityUnit;
  status: BatchStatus;
  createdAt: string;
  updatedAt: string;
}

/** Input for creating a batch. */
export interface ICreateBatchInput {
  farmId: string;
  harvestDate: string;
  quantity: number;
  batchNumber?: string;
  /** Required when the farm grows more than one commodity. */
  commodityId?: string;
}

/** Input for updating a batch — at least one field required at route layer. */
export interface IUpdateBatchInput {
  harvestDate?: string;
  quantity?: number;
}

/** List response shape expected by the frontend. */
export interface IGetBatchesOutput {
  batches: IBatchOutput[];
  total: number;
}

/** Batch creation workflow step status. */
export type IBatchCreationStepStatus = 'pending' | 'completed' | 'skipped' | 'failed';

/** Batch creation workflow step returned after POST /batches. */
export interface IBatchCreationStep {
  id: string;
  label: string;
  status: IBatchCreationStepStatus;
  detail?: string;
}

/** Create response shape expected by the frontend. */
export interface ICreateBatchOutput {
  batch: IBatchOutput;
  assessment: null;
  steps: IBatchCreationStep[];
}

/** Delete response shape expected by the frontend. */
export interface IDeleteBatchOutput {
  success: boolean;
  id: string;
}

/** PostgreSQL batch row returned from queries. */
export interface IBatchRecord {
  id: string;
  batchNumber: string;
  farmId: string;
  commodityId: string;
  harvestDate: string;
  quantity: number;
  unit: CommodityUnit;
  status: BatchStatus;
  createdAt: Date;
  updatedAt: Date;
}
