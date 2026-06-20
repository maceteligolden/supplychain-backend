import { injectable } from 'tsyringe';

import { SupplyChainEventType } from '@/shared/constants';
import { prismaClient } from '@/shared/database';

import { ISupplyChainEventRecord } from './supply-chain-event.interface';

/**
 * SupplyChainEventRepository handles PostgreSQL persistence for supply chain events.
 */
@injectable()
export class SupplyChainEventRepository {
  /** Finds an event by id scoped to a supply chain. */
  async findByIdForSupplyChain(
    supplyChainId: string,
    eventId: string,
  ): Promise<ISupplyChainEventRecord | null> {
    return prismaClient.supplyChainEvent.findFirst({
      where: { id: eventId, supplyChainId },
    });
  }

  /** Returns all events ordered by occurredAt desc. */
  async findAll(): Promise<ISupplyChainEventRecord[]> {
    return prismaClient.supplyChainEvent.findMany({
      orderBy: { occurredAt: 'desc' },
    });
  }

  /** Returns all events for a supply chain ordered by occurredAt desc. */
  async findBySupplyChainId(supplyChainId: string): Promise<ISupplyChainEventRecord[]> {
    return prismaClient.supplyChainEvent.findMany({
      where: { supplyChainId },
      orderBy: { occurredAt: 'desc' },
    });
  }

  /** Returns all events for an actor ordered by occurredAt desc. */
  async findByActorId(actorId: string): Promise<ISupplyChainEventRecord[]> {
    return prismaClient.supplyChainEvent.findMany({
      where: { actorId },
      orderBy: { occurredAt: 'desc' },
    });
  }

  /** Returns total event count across all supply chains. */
  async countAll(): Promise<number> {
    return prismaClient.supplyChainEvent.count();
  }

  /** Returns whether any event references an actor. */
  async isActorReferenced(actorId: string): Promise<boolean> {
    const count = await prismaClient.supplyChainEvent.count({
      where: { actorId },
    });
    return count > 0;
  }

  /** Creates a supply chain event row. */
  async create(input: {
    supplyChainId: string;
    type: SupplyChainEventType;
    occurredAt: Date;
    actorId: string;
    notes?: string | null;
  }): Promise<ISupplyChainEventRecord> {
    return prismaClient.supplyChainEvent.create({
      data: {
        supplyChainId: input.supplyChainId,
        type: input.type,
        occurredAt: input.occurredAt,
        actorId: input.actorId,
        notes: input.notes?.trim() || null,
      },
    });
  }

  /** Updates notes and/or actor on an event. */
  async updateById(
    id: string,
    input: {
      notes?: string | null;
      actorId?: string;
    },
  ): Promise<ISupplyChainEventRecord | null> {
    try {
      return await prismaClient.supplyChainEvent.update({
        where: { id },
        data: {
          notes: input.notes !== undefined ? input.notes?.trim() || null : undefined,
          actorId: input.actorId,
        },
      });
    } catch {
      return null;
    }
  }
}
