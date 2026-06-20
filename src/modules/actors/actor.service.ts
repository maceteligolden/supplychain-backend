import { inject, injectable } from 'tsyringe';

import { SupplyChainEventRepository } from '@/modules/supply-chain-events/supply-chain-event.repository';
import { SupplyChainRepository } from '@/modules/supply-chains/supply-chain.repository';
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
    @inject(SupplyChainEventRepository)
    private readonly supplyChainEventRepository: SupplyChainEventRepository,
    @inject(SupplyChainRepository)
    private readonly supplyChainRepository: SupplyChainRepository,
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

  /** Returns actor involvement derived from supply chain events. */
  async getActorInvolvement(id: string): Promise<IActorInvolvementOutput> {
    const actor = await this.getActorById(id);
    const eventRecords = await this.supplyChainEventRepository.findByActorId(id);

    const supplyChainIds = new Set<string>();
    const events: IActorInvolvementOutput['events'] = [];

    for (const record of eventRecords) {
      const supplyChain = await this.supplyChainRepository.findById(
        record.supplyChainId,
      );

      if (!supplyChain) {
        continue;
      }

      supplyChainIds.add(supplyChain.id);
      events.push({
        event: {
          id: record.id,
          supplyChainId: record.supplyChainId,
          type: record.type,
          occurredAt: record.occurredAt.toISOString(),
          actorId: record.actorId,
          notes: record.notes ?? undefined,
          createdAt: record.createdAt.toISOString(),
          updatedAt: record.updatedAt.toISOString(),
        },
        supplyChain: {
          id: supplyChain.id,
          name: supplyChain.name,
          code: supplyChain.code,
          description: supplyChain.description ?? undefined,
          status: supplyChain.status,
          commodityId: supplyChain.commodityId ?? undefined,
          createdAt: supplyChain.createdAt.toISOString(),
          updatedAt: supplyChain.updatedAt.toISOString(),
        },
      });
    }

    const supplyChains = (
      await Promise.all(
        [...supplyChainIds].map((chainId) =>
          this.supplyChainRepository.findById(chainId),
        ),
      )
    )
      .filter((chain): chain is NonNullable<typeof chain> => chain !== null)
      .map((chain) => ({
        id: chain.id,
        name: chain.name,
        code: chain.code,
        description: chain.description ?? undefined,
        status: chain.status,
        commodityId: chain.commodityId ?? undefined,
        createdAt: chain.createdAt.toISOString(),
        updatedAt: chain.updatedAt.toISOString(),
      }));

    return {
      actor,
      events,
      supplyChains,
      stats: {
        eventCount: events.length,
        supplyChainCount: supplyChains.length,
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
