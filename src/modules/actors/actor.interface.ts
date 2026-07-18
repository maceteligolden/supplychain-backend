import {
  ActorStatus,
  ActorType,
  SupplyChainEventType,
  SupplyChainStatus,
} from '@/shared/constants';

/** Nested address DTO returned by the API. */
export interface IActorAddressOutput {
  line1?: string;
  city: string;
  region: string;
  country: string;
}

/** Public actor DTO returned by the API. */
export interface IActorOutput {
  id: string;
  name: string;
  code: string;
  type: ActorType;
  address: IActorAddressOutput;
  status: ActorStatus;
  createdAt: string;
  updatedAt: string;
}

/** Input for creating an actor. */
export interface ICreateActorInput {
  name: string;
  type: ActorType;
  address: IActorAddressOutput;
  status: ActorStatus;
}

/** Input for updating an actor — at least one field required at route layer. */
export interface IUpdateActorInput {
  name?: string;
  type?: ActorType;
  address?: Partial<IActorAddressOutput>;
  status?: ActorStatus;
}

/** List response shape expected by the frontend. */
export interface IGetActorsOutput {
  actors: IActorOutput[];
  total: number;
}

/** Delete response shape expected by the frontend. */
export interface IDeleteActorOutput {
  success: boolean;
  id: string;
}

/** Involvement response with supply chain events. */
export interface IActorInvolvementOutput {
  actor: IActorOutput;
  events: IActorInvolvementEventOutput[];
  supplyChains: IActorInvolvementSupplyChainOutput[];
  stats: {
    eventCount: number;
    supplyChainCount: number;
  };
}

/** Supply chain summary embedded in actor involvement. */
export interface IActorInvolvementSupplyChainOutput {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: SupplyChainStatus;
  commodityId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Event entry embedded in actor involvement. */
export interface IActorInvolvementEventOutput {
  event: {
    id: string;
    supplyChainId: string;
    type: SupplyChainEventType;
    occurredAt: string;
    actorId: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
  };
  supplyChain: IActorInvolvementSupplyChainOutput;
}

/** PostgreSQL actor row returned from queries. */
export interface IActorRecord {
  id: string;
  name: string;
  code: string;
  type: ActorType;
  addressLine1: string | null;
  addressCity: string;
  addressRegion: string;
  addressCountry: string;
  status: ActorStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** Normalized address fields for repository writes. */
export interface IActorAddressRecord {
  addressLine1?: string | null;
  addressCity: string;
  addressRegion: string;
  addressCountry: string;
}
