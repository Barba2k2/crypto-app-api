import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  async getActiveUsers() {
    // Você pode ajustar os critérios de "ativo" conforme necessário
    return this.usersRepository.find({
      where: {
        // Exemplo de critérios para usuários ativos:
        // lastLoginAt: MoreThan(subDays(new Date(), 30)), // Logou nos últimos 30 dias
        // isActive: true,                                 // Campo explícito de ativo
      },
      relations: ['favoriteCoins', 'priceAlerts'], // Inclui relações necessárias
    });
  }
}
