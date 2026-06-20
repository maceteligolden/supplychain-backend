import { inject, injectable } from 'tsyringe';

import { ActorRepository } from '@/modules/actors/actor.repository';
import { SupplyChainRepository } from '@/modules/supply-chains/supply-chain.repository';
import { BadRequestError, NotFoundError } from '@/shared/errors';

import {
  ICreateSupplyChainEventInput,
  IGetSupplyChainEventsOutput,
  ISupplyChainEventOutput,
  ISupplyChainEventRecord,
  IUpdateSupplyChainEventInput,
} from './supply-chain-event.interface';
import { SupplyChainEventRepository } from './supply-chain-event.repository';
import { validateEventSequence } from './supply-chain-event.util';

const mapEventToOutput = (
  record: ISupplyChainEventRecord,
): ISupplyChainEventOutput => ({
  id: record.id,
  supplyChainId: record.supplyChainId,
  type: record.type,
  occurredAt: record.occurredAt.toISOString(),
  actorId: record.actorId,
  notes: record.notes ?? undefined,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

/**
 * SupplyChainEventService implements supply chain lifecycle event business logic.
 */
@injectable()
export class SupplyChainEventService {
  constructor(
    @inject(SupplyChainEventRepository)
    private readonly supplyChainEventRepository: SupplyChainEventRepository,
    @inject(SupplyChainRepository)
    private readonly supplyChainRepository: SupplyChainRepository,
    @inject(ActorRepository)
    private readonly actorRepository: ActorRepository,
  ) {}

  /** Lists events for a supply chain. */
  async listEventsBySupplyChainId(
    supplyChainId: string,
  ): Promise<IGetSupplyChainEventsOutput> {
    await this.assertSupplyChainExists(supplyChainId);

    const records =
      await this.supplyChainEventRepository.findBySupplyChainId(supplyChainId);

    return {
      events: records.map(mapEventToOutput),
      total: records.length,
    };
  }

  /** Creates a lifecycle event on a supply chain. */
  async createEvent(
    supplyChainId: string,
    input: ICreateSupplyChainEventInput,
  ): Promise<ISupplyChainEventOutput> {
    await this.assertSupplyChainExists(supplyChainId);
    await this.assertActorActive(input.actorId);

    const existing =
      await this.supplyChainEventRepository.findBySupplyChainId(supplyChainId);
    const validation = validateEventSequence(existing, input.type);

    if (!validation.valid) {
      throw new BadRequestError(validation.message);
    }

    const record = await this.supplyChainEventRepository.create({
      supplyChainId,
      type: input.type,
      occurredAt: new Date(input.occurredAt),
      actorId: input.actorId,
      notes: input.notes,
    });

    return mapEventToOutput(record);
  }

  /** Updates notes and/or actor on an existing event. */
  async updateEvent(
    supplyChainId: string,
    eventId: string,
    input: IUpdateSupplyChainEventInput,
  ): Promise<ISupplyChainEventOutput> {
    const existing = await this.supplyChainEventRepository.findByIdForSupplyChain(
      supplyChainId,
      eventId,
    );

    if (!existing) {
      throw new NotFoundError('Supply chain event not found');
    }

    if (input.actorId) {
      await this.assertActorActive(input.actorId);
    }

    const updated = await this.supplyChainEventRepository.updateById(eventId, {
      notes: input.notes,
      actorId: input.actorId,
    });

    if (!updated) {
      throw new NotFoundError('Supply chain event not found');
    }

    return mapEventToOutput(updated);
  }

  private async assertSupplyChainExists(supplyChainId: string): Promise<void> {
    const supplyChain = await this.supplyChainRepository.findById(supplyChainId);

    if (!supplyChain) {
      throw new NotFoundError('Supply chain not found');
    }
  }

  private async assertActorActive(actorId: string): Promise<void> {
    const actor = await this.actorRepository.findById(actorId);

    if (!actor) {
      throw new BadRequestError('Actor not found', {
        issues: [{ path: 'actorId', message: 'Actor must exist' }],
      });
    }

    if (actor.status !== 'ACTIVE') {
      throw new BadRequestError('Actor must be active to record events', {
        issues: [{ path: 'actorId', message: 'Actor must be ACTIVE' }],
      });
    }
  }
}
