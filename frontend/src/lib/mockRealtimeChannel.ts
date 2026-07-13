/* eslint-disable @typescript-eslint/no-explicit-any */
export class MockRealtimeChannel {
  public topic: string;

  constructor(topic: string) {
    this.topic = topic;
  }

  public on(_event: string, _filter: any, _callback: (...args: any[]) => void): this {
    return this;
  }

  public subscribe(callback?: (status: string, err?: any) => void): this {
    if (callback) {
      setTimeout(() => {
        callback('SUBSCRIBED');
      }, 0);
    }
    return this;
  }

  public unsubscribe(): Promise<'ok'> {
    return Promise.resolve('ok');
  }

  public presence(_options?: any): this {
    return this;
  }

  public track(_state: any): Promise<'ok'> {
    return Promise.resolve('ok');
  }

  public untrack(): Promise<'ok'> {
    return Promise.resolve('ok');
  }

  public send(_payload: any): Promise<'ok'> {
    return Promise.resolve('ok');
  }

  public channel(_name: string): this {
    return this;
  }
}
