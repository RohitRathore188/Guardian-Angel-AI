import express from 'express';
import { chatModel } from '../utils/gemini.js';
import { supabase } from '../utils/supabase.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { message, case_id } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ 
        reply: "I am running in mock mode because the Gemini API key is missing. Please provide it in the .env file!" 
      });
    }

    // 1. Fetch case context from database if case_id is valid
    let caseContext = "";
    if (case_id && !case_id.startsWith('mock-')) {
      try {
        const { data: report } = await supabase
          .from('reports')
          .select('*')
          .eq('id', case_id)
          .maybeSingle();

        if (report) {
          caseContext = `
          CONTEXT OF THE EMERGENCY REPORTED BY THIS CITIZEN:
          - Location: ${report.address || 'Unknown'}
          - Threat Priority: ${report.priority}
          - Incident Description: ${report.description || 'Citizen reported an emergency.'}
          - AI Visual Assessment: ${report.ai_analysis?.assessment || 'No photo assessment available.'}
          Use this context to give highly specific, reassuring, and relevant instructions. Reference the location or details naturally if appropriate.
          `;
        }
      } catch (dbErr) {
        console.warn("Could not fetch case context for chatbot:", dbErr.message);
      }
    }

    const prompt = `You are a helpful, calm, and reassuring AI Emergency Companion for the Guardian Angel app. 
    A citizen is in distress or asking a question. Respond briefly (1-2 sentences), calmly, and offer actionable advice.
    ${caseContext}
    Citizen says: "${message}"`;

    const result = await chatModel.generateContent(prompt);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    // If Gemini fails (e.g. rate limit / quota exceeded), return a helpful offline reply
    res.json({ 
      reply: "I'm here with you. Please stay calm, keep the child safe, and do not leave them. Emergency services have been notified and are on their way."
    });
  }
});

export default router;
