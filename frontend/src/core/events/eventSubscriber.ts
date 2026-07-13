import { useEffect } from 'react';
import { globalEventBus } from './eventBus';
import { EventType, EventPayload } from './eventTypes';

export const useEventSubscription = <T = any>(
  type: EventType,
  callback: (payload: EventPayload<T>) => void
) => {
  useEffect(() => {
    const unsubscribe = globalEventBus.subscribe(type, callback);
    return () => {
      unsubscribe();
    };
  }, [type, callback]);
};
