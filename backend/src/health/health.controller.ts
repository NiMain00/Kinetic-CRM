import { Controller, Get } from '@nestjs/common';

/**
 * Lightweight health endpoint.
 *
 * The Docker Compose healthcheck curls `http://localhost:4000/health`.
 * Without this route the backend container would never report healthy and
 * dependent services (scheduler) would never start.
 */
@Controller('health')
export class HealthController {
  @Get()
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
