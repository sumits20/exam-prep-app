import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';

export const examTypesRouter = Router();

examTypesRouter.get('/', requireAuth, async (_req, res) => {
  const { data, error } = await supabase
    .from('exam_types')
    .select('id, slug, name, question_count, scenarios_drawn, scenarios_total, domain_count')
    .eq('is_active', true);

  if (error) {
    console.error('Failed to fetch exam_types:', error.message);
    res.status(500).json({ error: 'Failed to fetch exam types' });
    return;
  }

  res.json({
    examTypes: (data ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      questionCount: row.question_count,
      scenariosDrawn: row.scenarios_drawn,
      scenariosTotal: row.scenarios_total,
      domainCount: row.domain_count,
    })),
  });
});
