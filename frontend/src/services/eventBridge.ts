import type { DomainEvent } from '@/types/events';

type EventHandler = (event: DomainEvent) => void;

export class EventBridge {
  private handlers = new Map<string, Set<EventHandler>>();
  private emittedInCycle = new Set<string>();

  /** Subscribe to an event type. Returns unsubscribe function. */
  on(type: string, handler: EventHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  /** Subscribe to a specific event's type (discriminated union safety). */
  onEvent<T extends DomainEvent['type']>(
    type: T,
    handler: (event: DomainEvent & { type: T }) => void,
  ): () => void {
    return this.on(type, handler as EventHandler);
  }

  /** Emit an event — calls all handlers synchronously. Dedup per cycle. */
  emit(event: DomainEvent): void {
    const dedupKey = `${event.type}:${JSON.stringify(event)}`;
    if (this.emittedInCycle.has(dedupKey)) return;
    this.emittedInCycle.add(dedupKey);

    const handlers = this.handlers.get(event.type);
    if (!handlers) return;

    handlers.forEach((handler) => {
      try {
        handler(event);
      } catch (err) {
        console.error(`[EventBridge] Handler error for ${event.type}:`, err);
      }
    });
  }

  /** Clear the dedup set (call at start of each React lifecycle if needed). */
  resetCycle(): void {
    this.emittedInCycle.clear();
  }

  /** Remove all handlers (testing teardown). */
  clear(): void {
    this.handlers.clear();
    this.emittedInCycle.clear();
  }
}

export const eventBus = new EventBridge();
