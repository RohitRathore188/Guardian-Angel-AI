import { EventType, EventPayload } from './eventTypes';

type EventCallback<T = any> = (payload: EventPayload<T>) => void;

class EventBus {
  private listeners: Map<EventType, Set<EventCallback>> = new Map();

  subscribe<T = any>(type: EventType, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    return () => {
      const callbacks = this.listeners.get(type);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  publish<T = any>(payload: EventPayload<T>): void {
    const callbacks = this.listeners.get(payload.type);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`Error in event callback for type ${payload.type}:`, err);
        }
      });
    }
  }
}

export const globalEventBus = new EventBus();
