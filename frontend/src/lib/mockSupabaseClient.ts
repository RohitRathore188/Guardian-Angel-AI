import { MockRealtimeChannel } from './mockRealtimeChannel';

/* eslint-disable @typescript-eslint/no-explicit-any */
export class MockSupabaseQueryBuilder<T = any> implements PromiseLike<{ data: T | null; error: any }> {
  private table: string;
  private currentRole: string;
  private dataPromise: Promise<{ data: any; error: any }>;

  constructor(table: string, currentRole: string) {
    this.table = table;
    this.currentRole = currentRole;

    let defaultData: any = [];
    if (table === 'profiles') {
      defaultData = [
        {
          id: 'mock-user-123',
          full_name: this.currentRole === 'admin' ? 'Demo Admin' : this.currentRole === 'citizen' ? 'Demo Citizen' : 'Demo Authority',
          role: this.currentRole === 'admin' ? 'admin' : this.currentRole === 'citizen' ? 'citizen' : 'police',
          created_at: new Date().toISOString()
        },
        {
          id: 'mock-user-456',
          full_name: 'System Admin',
          role: 'admin',
          created_at: new Date().toISOString()
        }
      ];
    }

    this.dataPromise = Promise.resolve({ data: defaultData, error: null });
  }

  public select(_columns?: string): this {
    return this;
  }

  public eq(column: string, value: any): this {
    if (this.table === 'profiles' && column === 'id') {
      const userProfile = {
        id: value,
        full_name: this.currentRole === 'admin' ? 'Demo Admin' : this.currentRole === 'citizen' ? 'Demo Citizen' : 'Demo Authority',
        role: this.currentRole === 'admin' ? 'admin' : this.currentRole === 'citizen' ? 'citizen' : 'police',
        created_at: new Date().toISOString()
      };
      this.dataPromise = Promise.resolve({ data: userProfile, error: null });
    }
    return this;
  }

  public single(): this {
    this.dataPromise = this.dataPromise.then((res) => {
      const data = Array.isArray(res.data) ? res.data[0] : res.data;
      return { data: data || null, error: null };
    });
    return this;
  }

  public order(_column: string, _options?: { ascending?: boolean }): this {
    return this;
  }

  public limit(_count: number): this {
    return this;
  }

  public insert(values: any): Promise<{ data: any; error: any }> {
    return Promise.resolve({ data: values, error: null });
  }

  public update(values: any): Promise<{ data: any; error: any }> {
    return Promise.resolve({ data: values, error: null });
  }

  public delete(): Promise<{ data: any; error: any }> {
    return Promise.resolve({ data: null, error: null });
  }

  public then<TResult1 = { data: T | null; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: T | null; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.dataPromise.then(onfulfilled, onrejected);
  }
}

export class MockSupabaseAuth {
  private currentRole = 'authority';
  private session: any = null;
  private listeners: Set<(event: string, session: any) => void> = new Set();

  public async getSession(): Promise<{ data: { session: any }; error: any }> {
    return { data: { session: this.session }, error: null };
  }

  public onAuthStateChange(callback: (event: string, session: any) => void): { data: { subscription: { unsubscribe: () => void } } } {
    this.listeners.add(callback);
    callback('INITIAL_SESSION', this.session);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners.delete(callback);
          }
        }
      }
    };
  }

  public async signInWithPassword(credentials: any): Promise<{ data: { user: any; session: any }; error: any }> {
    const email = credentials.email || 'user@example.com';
    if (email.toLowerCase().includes('admin')) {
      this.currentRole = 'admin';
    } else if (email.toLowerCase().includes('citizen')) {
      this.currentRole = 'citizen';
    } else {
      this.currentRole = 'authority';
    }
    const dummyUser = { id: 'mock-user-123', email };
    const dummySession = { access_token: 'mock-token', user: dummyUser };
    this.session = dummySession;

    this.listeners.forEach((cb) => cb('SIGNED_IN', dummySession));
    return { data: { user: dummyUser, session: dummySession }, error: null };
  }

  public async signUp(credentials: any): Promise<{ data: { user: any; session: any }; error: any }> {
    const email = credentials.email || 'user@example.com';
    const metadataRole = credentials.options?.data?.role;
    if (metadataRole === 'citizen') {
      this.currentRole = 'citizen';
    } else if (metadataRole === 'admin') {
      this.currentRole = 'admin';
    } else if (metadataRole) {
      this.currentRole = 'authority';
    } else {
      this.currentRole = email.toLowerCase().includes('admin') ? 'admin' : email.toLowerCase().includes('citizen') ? 'citizen' : 'authority';
    }
    const dummyUser = { id: 'mock-user-123', email };
    const dummySession = { access_token: 'mock-token', user: dummyUser };
    this.session = dummySession;

    this.listeners.forEach((cb) => cb('SIGNED_IN', dummySession));
    return { data: { user: dummyUser, session: dummySession }, error: null };
  }

  public async signOut(): Promise<{ error: any }> {
    this.session = null;
    this.listeners.forEach((cb) => cb('SIGNED_OUT', null));
    return { error: null };
  }

  public getCurrentRole(): string {
    return this.currentRole;
  }
}

class MockSupabaseStorageBucket {
  public async upload(path: string, _file: any): Promise<{ data: { path: string } | null; error: any }> {
    return { data: { path }, error: null };
  }

  public getPublicUrl(path: string): { data: { publicUrl: string } } {
    return {
      data: {
        publicUrl: `https://placehold.co/400x300/1a1a2e/e94560?text=Uploaded+${encodeURIComponent(path)}`
      }
    };
  }
}

class MockSupabaseStorage {
  public from(_bucket: string): MockSupabaseStorageBucket {
    return new MockSupabaseStorageBucket();
  }
}

export class MockSupabaseClient {
  public auth: MockSupabaseAuth;
  public storage: MockSupabaseStorage;

  constructor() {
    this.auth = new MockSupabaseAuth();
    this.storage = new MockSupabaseStorage();
  }

  public from(table: string): MockSupabaseQueryBuilder {
    return new MockSupabaseQueryBuilder(table, this.auth.getCurrentRole());
  }

  public channel(name: string): MockRealtimeChannel {
    return new MockRealtimeChannel(name);
  }

  public removeChannel(_channel: any): Promise<'ok'> {
    return Promise.resolve('ok');
  }
}

export const mockSupabaseClient = new MockSupabaseClient();
