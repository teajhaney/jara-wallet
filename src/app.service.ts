import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }

  getHealthCheck() {
    const uptimeSeconds = process.uptime();
    return {
      status: 'healthy',
      service: 'Jara Wallet API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: this.formatUptime(uptimeSeconds),
      environment: process.env.NODE_ENV || 'development',
      message: 'API is running successfully',
    };
  }
}
