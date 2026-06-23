import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';

export interface AuthPayload {
  sub: string;
  name: string;
  username: string;
  role: string;
  roleId: string;
  branchId?: string | null;
  departmentId?: string | null;
  permissions: string[];
  jti: string;
  iss: string;
}

const ACCESS_TOKEN_EXPIRY = '8h';
const REFRESH_TOKEN_BYTES = 64;

export class TokenService {
  generateAccessToken(user: any, roleCode: string, permissions: string[]): string {
    const payload: AuthPayload = {
      sub: user.id,
      name: user.name,
      username: user.username,
      role: roleCode,
      roleId: user.roleId,
      branchId: user.branchId,
      departmentId: user.departmentId,
      permissions,
      jti: uuidv4(),
      iss: 'kinetic-crm-api',
    };

    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
  }

  hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  verifyAccessToken(token: string): AuthPayload {
    return jwt.verify(token, env.JWT_SECRET) as AuthPayload;
  }

  getRefreshTokenExpiry(): Date {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
}
