import express from 'express';
import { supabase } from '../utils/supabase.js';

const router = express.Router();

// GET /api/cases - Fetch all active cases
router.get('/', async (req, res) => {
  try {
    const { data: cases, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map database 'reports' into the exact 'Case' format the frontend expects
    const formattedCases = cases.map(c => {
      let mappedStatus = c.status;
      if (c.status === 'pending') mappedStatus = 'reported';
      else if (c.status === 'assigned' || c.status === 'in_progress' || c.status === 'analysis') mappedStatus = 'dispatched';
      else if (c.status === 'resolved') mappedStatus = 'rescued';

      return {
        id: c.id,
        location: { 
          lat: c.latitude || 17.43, 
          lng: c.longitude || 78.31, 
          address: c.address || 'Unknown Location' 
        },
        status: mappedStatus,
        ai_severity: c.priority || 'high',
        ai_analysis: c.ai_analysis?.assessment || 'Emergency reported by citizen.',
        ai_dispatch_reason: 'Pending authority review',
        created_at: c.created_at,
        evidence: (c.image_urls && c.image_urls.length > 0) ? [{ file_url: c.image_urls[0] }] : [],
        structured_analysis: c.ai_analysis?.structured_analysis || null
      };
    });

    res.json(formattedCases);
  } catch (error) {
    console.error('Fetch cases error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/cases/:id/status - Update case status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ error: 'Status is required' });

    // Translate frontend status to database status
    let dbStatus = status;
    if (status === 'reported') dbStatus = 'pending';
    else if (status === 'dispatched') dbStatus = 'assigned';
    else if (status === 'rescued') dbStatus = 'resolved';
    else if (status === 'closed') dbStatus = 'closed';

    const { data: updatedCase, error } = await supabase
      .from('reports')
      .update({ status: dbStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log the event with correct database columns
    await supabase.from('case_events').insert([
      {
        report_id: id,
        event_type: 'status_change',
        message: `Case status changed to ${status}`,
        metadata: { title: 'Status Updated' }
      }
    ]);

    res.json(updatedCase);
  } catch (error) {
    console.error('Update case error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
