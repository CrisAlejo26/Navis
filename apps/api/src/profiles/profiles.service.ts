import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './profile.entity';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profiles: Repository<Profile>,
  ) {}

  /**
   * Devuelve el perfil del usuario y lo crea vacío la primera vez.
   * Evita tener que engancharse a los hooks de creación de Better Auth.
   */
  async findOrCreate(userId: string): Promise<Profile> {
    const existing = await this.profiles.findOne({ where: { userId } });
    if (existing) return existing;

    return this.profiles.save(this.profiles.create({ userId }));
  }

  async update(userId: string, dto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.findOrCreate(userId);
    Object.assign(profile, dto);
    return this.profiles.save(profile);
  }
}
