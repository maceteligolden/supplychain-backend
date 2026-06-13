export { ActorController } from './actor.controller';
export { ActorRepository } from './actor.repository';
export { ActorService } from './actor.service';
export { createActorRoutes } from './actor.routes';
export { seedActorsIfEmpty } from './actor.seed';
export type {
  IActorOutput,
  IActorAddressOutput,
  ICreateActorInput,
  IUpdateActorInput,
  IGetActorsOutput,
  IDeleteActorOutput,
  IActorInvolvementOutput,
  IActorRecord,
} from './actor.interface';
