/** Public batch allocation DTO returned by the API. */
export interface IAllocationOutput {
  id: string;
  batchId: string;
  supplyChainId: string;
  quantity: number;
  allocatedAt: string;
  createdAt: string;
  updatedAt: string;
}

/** Input for creating a batch allocation. */
export interface ICreateAllocationInput {
  batchId: string;
  supplyChainId: string;
  quantity: number;
  allocatedAt?: string;
}

/** Input for updating a batch allocation — at least one field required at route layer. */
export interface IUpdateAllocationInput {
  quantity?: number;
  allocatedAt?: string;
}

/** List response shape expected by the frontend. */
export interface IGetAllocationsOutput {
  allocations: IAllocationOutput[];
  total: number;
}

/** Delete response shape expected by the frontend. */
export interface IDeleteAllocationOutput {
  success: boolean;
  id: string;
}

/** PostgreSQL batch allocation row returned from queries. */
export interface IAllocationRecord {
  id: string;
  batchId: string;
  supplyChainId: string;
  quantity: number;
  allocatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
