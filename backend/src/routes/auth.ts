import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';

export const authRouter = Router();

authRouter.post('/record-login', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const userAgent = req.headers['user-agent'] ?? null;

  const { error: historyError } = await supabase
    .from('user_login_history')
    .insert({ user_id: userId, user_agent: userAgent });

  if (historyError) {
    console.error('Failed to insert user_login_history:', historyError.message);
    res.status(500).json({ error: 'Failed to record login' });
    return;
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId);

  if (profileError) {
    console.error('Failed to update profiles.last_login_at:', profileError.message);
    res.status(500).json({ error: 'Failed to record login' });
    return;
  }

  res.status(200).json({ recorded: true });
});
