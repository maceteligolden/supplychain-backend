import { SupplyChainEventType } from '@/shared/constants';

/** Public supply chain event DTO returned by the API. */
export interface ISupplyChainEventOutput {
  id: string;
  supplyChainId: string;
  type: SupplyChainEventType;
  occurredAt: string;
  actorId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Input for creating a supply chain event. */
export interface ICreateSupplyChainEventInput {
  type: SupplyChainEventType;
  occurredAt: string;
  actorId: string;
  notes?: string;
}

/** Input for updating a supply chain event — notes and actor only. */
export interface IUpdateSupplyChainEventInput {
  notes?: string;
  actorId?: string;
}

/** List response shape expected by the frontend. */
export interface IGetSupplyChainEventsOutput {
  events: ISupplyChainEventOutput[];
  total: number;
}

/** PostgreSQL supply chain event row returned from queries. */
export interface ISupplyChainEventRecord {
  id: string;
  supplyChainId: string;
  type: SupplyChainEventType;
  occurredAt: Date;
  actorId: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Actor involvement event entry. */
export interface IActorInvolvementEventOutput {
  event: ISupplyChainEventOutput;
  supplyChain: {
    id: string;
    name: string;
    code: string;
    description?: string;
    status: string;
    commodityId?: string;
    createdAt: string;
    updatedAt: string;
  };
}
