import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { UserService } from "src/user/user.service";
import { Repository } from "typeorm";
import * as path from 'path';
import { downloadImage } from "src/common/utils/get-image-profile.util";
import { getAdminEmails } from "src/common/utils/admin-emails.util";
@Injectable()
export class AuthService{
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private userService: UserService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>, 

  ) {}



  async googleLogin(req): Promise<any> {
    if (!req.user) {
      throw new BadRequestException('Google login failed: No user information received.');
    }
  
    const { email, name, picture, googleId } = req.user;
    let user = await this.userRepository.findOne({ where: { email } });
    const adminEmails = getAdminEmails();

    const urlWithoutQuery = picture.split('?')[0];
    const ext = path.extname(urlWithoutQuery) || '.jpg';
    const filename = `${googleId}_${Date.now()}${ext}`;
  

    if(!user){
      let localPicture:string;
      try {
        localPicture = await downloadImage(picture, filename);
      } catch (error) {
        localPicture = picture;
      }
      user = this.userRepository.create({
        email,
        name,
        picture: localPicture,
        googleId,
        role: adminEmails.includes(email) ? 'admin' : 'user',
        googlePictureUrl: picture,
      })
    }else {
      user.name = name;
      user.googleId = googleId;
      if (user.googlePictureUrl !== picture) {
        let localPicture: string;
        try {
          localPicture = await downloadImage(picture, filename);
        } catch (error) {
          localPicture = picture;
        }
        user.picture = localPicture;
        user.googlePictureUrl = picture; 
      }
      if (adminEmails.includes(email)) {
        user.role = 'admin';
      }
    }
   

  

    user = await this.userRepository.save(user);
  
 
    const payload = { email: user.email, userId: user.userId, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}