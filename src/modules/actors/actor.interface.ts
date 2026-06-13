import { ActorStatus, ActorType } from '@/shared/constants';

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
  code: string;
  type: ActorType;
  address: IActorAddressOutput;
  status: ActorStatus;
}

/** Input for updating an actor — at least one field required at route layer. */
export interface IUpdateActorInput {
  name?: string;
  code?: string;
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

/** Involvement response — events/chains empty until supply chain module exists. */
export interface IActorInvolvementOutput {
  actor: IActorOutput;
  events: [];
  supplyChains: [];
  stats: {
    eventCount: number;
    supplyChainCount: number;
  };
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
