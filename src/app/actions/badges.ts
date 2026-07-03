'use server';

import { supabaseService } from '@/lib/supabase-server';

export async function dismissBadgeAction(recordId: string) {
  const db = supabaseService();
  const { error } = await (db.from('badge_unlocks') as any).update({ shown: true }).eq('id', recordId);
  if (error) {
    console.error('Failed to dismiss badge:', error.message);
    throw new Error('Failed to dismiss badge');
  }
}
