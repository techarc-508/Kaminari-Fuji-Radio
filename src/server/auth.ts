import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import type { AuditLogEntry } from '../types/admin.ts';

interface AdminSession {
  token: string;
  username: string;
  createdAt: number;
  expiresAt: number;
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const activeSessions = new Map<string, AdminSession>();
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const auditLogs: AuditLogEntry[] = [];

// Hash password with scrypt
export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Initial Admin Credentials
let adminSalt = generateSalt();
let initialPassword = process.env.ADMIN_PASSWORD || 'ambient-radio-admin';
let adminPasswordHash = hashPassword(initialPassword, adminSalt);
let adminUsername = process.env.ADMIN_USERNAME || 'admin';

export function verifyPassword(password: string): boolean {
  const hash = hashPassword(password, adminSalt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(adminPasswordHash, 'hex'));
}

export function updateAdminPassword(newPassword: string): boolean {
  if (!newPassword || newPassword.length < 6) return false;
  adminSalt = generateSalt();
  adminPasswordHash = hashPassword(newPassword, adminSalt);
  return true;
}

export function createSession(username: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const session: AdminSession = {
    token,
    username,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  activeSessions.set(token, session);
  return token;
}

export function destroySession(token: string): void {
  activeSessions.delete(token);
}

export function validateSession(token?: string): boolean {
  if (!token) return false;
  const session = activeSessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return false;
  }
  return true;
}

// Audit logger
export function logAudit(action: string, details: string, req?: Request): void {
  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    action,
    user: 'admin',
    details,
    timestamp: new Date().toISOString(),
    ip: req?.ip || req?.socket?.remoteAddress || '127.0.0.1',
  };
  auditLogs.unshift(entry);
  if (auditLogs.length > 200) auditLogs.pop();
}

export function getAuditLogs(): AuditLogEntry[] {
  return auditLogs;
}

// Login Rate Limiter (Max 5 failed attempts per 10 mins per IP)
export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);
  if (!attempt) return true;
  if (now - attempt.lastAttempt > 10 * 60 * 1000) {
    loginAttempts.delete(ip);
    return true;
  }
  return attempt.count < 8;
}

export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(ip) || { count: 0, lastAttempt: now };
  attempt.count += 1;
  attempt.lastAttempt = now;
  loginAttempts.set(ip, attempt);
}

export function resetRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}

// Express Auth Middleware
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers['x-admin-token']) {
    token = req.headers['x-admin-token'] as string;
  }

  if (!validateSession(token)) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    return;
  }

  next();
}
