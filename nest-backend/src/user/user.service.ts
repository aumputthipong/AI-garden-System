import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { RegisterDTO } from './dto/register.dto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { getAdminEmails } from 'src/common/utils/admin-emails.util';


@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    
  ) {}
  private allowedPromoters: string[] = getAdminEmails(); // 🔹 อีเมลที่อนุญาต (จาก env ADMIN_EMAILS)

  create(registerDTO: RegisterDTO): Promise<User> {
    const newUser = this.userRepository.create(registerDTO);
    return this.userRepository.save(newUser);
  }

  
  
  findAll():Promise<User[]> {
    return this.userRepository.find();
  }
  
  findOne(userId: string): Promise<User | null> {

    return this.userRepository.findOneBy({ userId:userId });
  }



  findByEmail(email: string):Promise<User| null>{
    return this.userRepository.findOneBy({ email });
  } 

  async promoteToAdmin(promoterId: string,userId: string): Promise<User> {
    const promoter = await this.userRepository.findOne({ where: { userId: promoterId } });
    const user = await this.userRepository.findOne({ where: { userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!this.allowedPromoters.includes(promoter.email)) {
      throw new ForbiddenException('You are not authorized to promote an admin');
    }

    if (user.role === 'admin') {
      throw new ForbiddenException('User is already an admin');
    }

    user.role = 'admin';
    return this.userRepository.save(user);
  }

  async demoteFromAdmin(promoterId: string,userId: string): Promise<User> {
    const promoter = await this.userRepository.findOne({ where: { userId: promoterId } });
    const user = await this.userRepository.findOne({ where: { userId } });

    if (!this.allowedPromoters.includes(promoter.email)) {
      throw new ForbiddenException('You are not authorized to demote an admin');
    }

    if (user.role !== 'admin') {
      throw new ForbiddenException('User is not an admin');
    }

    user.role = 'user';
    return this.userRepository.save(user);
  }
  
}
