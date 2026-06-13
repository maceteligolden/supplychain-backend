import { inject, injectable } from 'tsyringe';

import { BadRequestError, NotFoundError } from '@/shared/errors';

import {
  IActorInvolvementOutput,
  IActorOutput,
  ICreateActorInput,
  IDeleteActorOutput,
  IGetActorsOutput,
  IUpdateActorInput,
} from './actor.interface';
import { mapActorToOutput, mapAddressToRecord } from './actor.mapper';
import { ActorRepository } from './actor.repository';

/**
 * ActorService implements actor CRUD and involvement business logic.
 */
@injectable()
export class ActorService {
  constructor(
    @inject(ActorRepository) private readonly actorRepository: ActorRepository,
  ) {}

  /** Lists all actors with total count. */
  async listActors(): Promise<IGetActorsOutput> {
    const [records, total] = await Promise.all([
      this.actorRepository.findAll(),
      this.actorRepository.countAll(),
    ]);

    return {
      actors: records.map(mapActorToOutput),
      total,
    };
  }

  /** Returns a single actor by id. */
  async getActorById(id: string): Promise<IActorOutput> {
    const record = await this.actorRepository.findById(id);

    if (!record) {
      throw new NotFoundError('Actor not found');
    }

    return mapActorToOutput(record);
  }

  /** Returns actor involvement — empty events/chains until supply chain module exists. */
  async getActorInvolvement(id: string): Promise<IActorInvolvementOutput> {
    const actor = await this.getActorById(id);

    return {
      actor,
      events: [],
      supplyChains: [],
      stats: {
        eventCount: 0,
        supplyChainCount: 0,
      },
    };
  }

  /** Creates an actor with a unique code. */
  async createActor(input: ICreateActorInput): Promise<IActorOutput> {
    const code = input.code.toUpperCase();
    await this.assertCodeAvailable(code);

    const record = await this.actorRepository.create({
      name: input.name,
      code,
      type: input.type,
      status: input.status,
      address: mapAddressToRecord(input.address),
    });

    return mapActorToOutput(record);
  }

  /** Updates an existing actor. */
  async updateActor(id: string, input: IUpdateActorInput): Promise<IActorOutput> {
    const existing = await this.actorRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Actor not found');
    }

    const nextCode = input.code ? input.code.toUpperCase() : existing.code;

    if (nextCode !== existing.code) {
      await this.assertCodeAvailable(nextCode, id);
    }

    const nextAddress = input.address
      ? {
          addressLine1:
            input.address.line1 !== undefined
              ? input.address.line1.trim() || null
              : existing.addressLine1,
          addressCity: input.address.city?.trim() ?? existing.addressCity,
          addressRegion: input.address.region?.trim() ?? existing.addressRegion,
          addressCountry: input.address.country?.trim() ?? existing.addressCountry,
        }
      : undefined;

    const updated = await this.actorRepository.updateById(id, {
      name: input.name,
      code: input.code ? nextCode : undefined,
      type: input.type,
      status: input.status,
      address: nextAddress,
    });

    if (!updated) {
      throw new NotFoundError('Actor not found');
    }

    return mapActorToOutput(updated);
  }

  /** Deletes an actor by id when not referenced by events. */
  async deleteActor(id: string): Promise<IDeleteActorOutput> {
    const existing = await this.actorRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Actor not found');
    }

    const isReferenced = await this.actorRepository.isReferencedByEvents(id);

    if (isReferenced) {
      throw new BadRequestError(
        'Cannot delete actor referenced by supply chain events',
      );
    }

    const deleted = await this.actorRepository.deleteById(id);

    if (!deleted) {
      throw new NotFoundError('Actor not found');
    }

    return { success: true, id };
  }

  private async assertCodeAvailable(code: string, excludeId?: string): Promise<void> {
    const existing = await this.actorRepository.findByCode(code);

    if (existing && existing.id !== excludeId) {
      throw new BadRequestError('Actor code already exists', {
        issues: [{ path: 'code', message: 'Code must be unique' }],
      });
    }
  }
}
