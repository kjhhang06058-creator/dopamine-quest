'use client';

import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useGameStore } from '@/store/useGameStore';

type SyncStatus = 'disabled' | 'signed-out' | 'syncing' | 'synced';

interface SyncContextValue {
  status: SyncStatus;
  email: string | null;
  sendMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue>({
  status: 'disabled',
  email: null,
  sendMagicLink: async () => ({ error: 'Supabase가 설정되지 않았습니다.' }),
  signOut: async () => {},
});

export function useSync() {
  return useContext(SyncContext);
}

const SYNC_DEBOUNCE_MS = 1500;

export function SyncProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>(supabase ? 'signed-out' : 'disabled');
  const [email, setEmail] = useState<string | null>(null);
  const reconciling = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auth session lifecycle: on sign-in, reconcile local vs. cloud save (whichever has the newer `updatedAt` wins).
  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    async function reconcile(userId: string) {
      reconciling.current = true;
      setStatus('syncing');

      const local = useGameStore.getState();
      const { data, error } = await client
        .from('game_saves')
        .select('state, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data?.state) {
        const remote = data.state as ReturnType<typeof useGameStore.getState>;
        const remoteUpdatedAt = remote.updatedAt ?? 0;
        if (remoteUpdatedAt > local.updatedAt) {
          useGameStore.getState().applyRemoteState(remote);
        } else {
          await client.from('game_saves').upsert({ user_id: userId, state: local, updated_at: new Date().toISOString() });
        }
      } else {
        await client.from('game_saves').upsert({ user_id: userId, state: local, updated_at: new Date().toISOString() });
      }

      reconciling.current = false;
      setStatus('synced');
    }

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      if (session?.user) {
        reconcile(session.user.id);
      } else {
        setStatus('signed-out');
      }
    });

    client.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null);
      if (data.session?.user) reconcile(data.session.user.id);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // While signed in, push local changes to the cloud (debounced) so the other device picks them up next reconcile.
  useEffect(() => {
    if (!supabase || !email) return;
    const client = supabase;

    const unsubscribe = useGameStore.subscribe((state) => {
      if (reconciling.current) return;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(async () => {
        const { data } = await client.auth.getSession();
        const userId = data.session?.user?.id;
        if (!userId) return;
        await client.from('game_saves').upsert({ user_id: userId, state, updated_at: new Date().toISOString() });
        setStatus('synced');
      }, SYNC_DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [email]);

  async function sendMagicLink(emailInput: string) {
    if (!supabase) return { error: 'Supabase가 설정되지 않았습니다.' };
    const { error } = await supabase.auth.signInWithOtp({
      email: emailInput,
      options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined },
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setEmail(null);
    setStatus('signed-out');
  }

  return <SyncContext.Provider value={{ status, email, sendMagicLink, signOut }}>{children}</SyncContext.Provider>;
}
