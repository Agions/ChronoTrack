import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * 验证用户凭据
   */
  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.usersService.findByEmail(email);
      
      if (user && await user.comparePassword(password)) {
        const { password, ...result } = user.toObject();
        return result;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 用户登录
   */
  async login(user: any) {
    // 更新最后登录时间
    await this.usersService.updateLastLogin(user._id);
    
    const payload = { sub: user._id, email: user.email, roles: user.roles };
    
    // 生成访问令牌和刷新令牌
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(
        { ...payload, tokenType: 'refresh' },
        { expiresIn: '7d' },
      ),
    ]);

    // 保存刷新令牌到用户记录
    await this.usersService.setRefreshToken(user._id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        employeeId: user.employeeId,
      },
    };
  }

  /**
   * 使用刷新令牌获取新的访问令牌
   */
  async refreshToken(refreshToken: string) {
    try {
      // 验证刷新令牌
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      // 检查令牌类型
      if (payload.tokenType !== 'refresh') {
        throw new UnauthorizedException('无效的刷新令牌');
      }

      // 获取用户信息
      const user = await this.usersService.findById(payload.sub);
      
      // 验证刷新令牌是否匹配
      if (user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('刷新令牌已失效');
      }

      // 生成新的访问令牌
      const newPayload = { sub: user._id, email: user.email, roles: user.roles };
      const accessToken = await this.jwtService.signAsync(newPayload);

      return {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          roles: user.roles,
          employeeId: user.employeeId,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  /**
   * 用户登出
   */
  async logout(userId: string) {
    // 清除用户的刷新令牌
    await this.usersService.setRefreshToken(userId, null);
    return { success: true };
  }

  /**
   * 注册新用户
   */
  async register(userData: any) {
    // 检查密码与确认密码是否一致
    if (userData.password !== userData.confirmPassword) {
      throw new BadRequestException('密码与确认密码不一致');
    }

    // 创建新用户
    const { confirmPassword, ...userDto } = userData;
    const user = await this.usersService.create(userDto);
    
    // 自动登录
    return this.login(user);
  }
} 