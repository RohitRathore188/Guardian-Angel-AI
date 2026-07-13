import { globalEventBus } from './eventBus';
import { EventType, EventPayload } from './eventTypes';

export const dispatchEvent = <T = any>(
  type: EventType,
  data: T,
  options?: {
    caseId?: string;
    status?: string;
    user?: { name: string; role: string };
    source?: 'client' | 'server' | 'ai' | 'system';
  }
) => {
  const payload: EventPayload<T> = {
    type,
    timestamp: Date.now(),
    caseId: options?.caseId,
    status: options?.status,
    user: options?.user,
    source: options?.source || 'client',
    data,
  };
  globalEventBus.publish(payload);
};
