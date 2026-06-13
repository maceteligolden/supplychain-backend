import { injectable } from 'tsyringe';

import { prismaClient } from '@/shared/database';

import {
  IActorAddressRecord,
  IActorRecord,
  ICreateActorInput,
  IUpdateActorInput,
} from './actor.interface';

/**
 * ActorRepository handles PostgreSQL persistence for actors.
 */
@injectable()
export class ActorRepository {
  /** Returns all actors sorted by name. */
  async findAll(): Promise<IActorRecord[]> {
    return prismaClient.actor.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /** Returns total actor count. */
  async countAll(): Promise<number> {
    return prismaClient.actor.count();
  }

  /** Finds an actor by id. */
  async findById(id: string): Promise<IActorRecord | null> {
    return prismaClient.actor.findUnique({ where: { id } });
  }

  /** Finds an actor by unique code. */
  async findByCode(code: string): Promise<IActorRecord | null> {
    return prismaClient.actor.findUnique({
      where: { code: code.toUpperCase() },
    });
  }

  /** Returns true when any supply chain event references this actor. */
  isReferencedByEvents(_id: string): Promise<boolean> {
    // Supply chain events are not persisted yet — always false until that module lands.
    return Promise.resolve(false);
  }

  /** Creates a new actor row. */
  async create(input: {
    name: string;
    code: string;
    type: ICreateActorInput['type'];
    status: ICreateActorInput['status'];
    address: IActorAddressRecord;
  }): Promise<IActorRecord> {
    return prismaClient.actor.create({
      data: {
        name: input.name.trim(),
        code: input.code.toUpperCase(),
        type: input.type,
        status: input.status,
        addressLine1: input.address.addressLine1,
        addressCity: input.address.addressCity,
        addressRegion: input.address.addressRegion,
        addressCountry: input.address.addressCountry,
      },
    });
  }

  /** Updates an actor by id. */
  async updateById(
    id: string,
    input: {
      name?: string;
      code?: string;
      type?: IUpdateActorInput['type'];
      status?: IUpdateActorInput['status'];
      address?: Partial<IActorAddressRecord>;
    },
  ): Promise<IActorRecord | null> {
    try {
      return await prismaClient.actor.update({
        where: { id },
        data: {
          name: input.name?.trim(),
          code: input.code?.toUpperCase(),
          type: input.type,
          status: input.status,
          addressLine1: input.address?.addressLine1,
          addressCity: input.address?.addressCity,
          addressRegion: input.address?.addressRegion,
          addressCountry: input.address?.addressCountry,
        },
      });
    } catch {
      return null;
    }
  }

  /** Deletes an actor by id. Returns true when a row was removed. */
  async deleteById(id: string): Promise<boolean> {
    try {
      await prismaClient.actor.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
