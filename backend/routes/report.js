import express from 'express';
import { supabase } from '../utils/supabase.js';
import { visionModel } from '../utils/gemini.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { type, description, location, image_url, isAnonymous } = req.body;
    let aiAnalysis = null;
    let severity = 'medium';

    // 1. Analyze image with Gemini if provided
    if (image_url && process.env.GEMINI_API_KEY) {
      try {
        // Fetch the image from the public Supabase URL
        const imgRes = await fetch(image_url);
        const arrayBuffer = await imgRes.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        
        const imagePart = {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg"
          }
        };

        const prompt = `Analyze this image for an emergency rescue reporting application.
        Return a valid JSON object matching this schema (no markdown blocks, just raw JSON text):
        {
          "severity": "low" | "medium" | "high" | "critical",
          "assessment": "Detailed 2-3 sentence overview of what is seen.",
          "age": "Estimated age group",
          "gender": "Male" | "Female" | "Unknown",
          "condition": "Visible condition of the child",
          "injuries": ["Head Injury" | "Bleeding" | "Fracture" | "Burn" | "Dehydration" | "Exposure" | "Hypothermia" | "Unknown"],
          "blood_detected": true | false,
          "conscious": true | false,
          "crying": true | false,
          "weather_exposure": "High" | "Medium" | "Low",
          "hazards": ["Road Hazard" | "Water Hazard" | "Traffic Hazard" | "Crowd Density" | "None"],
          "crowd_density": "Low" | "Medium" | "High",
          "objects_detected": ["Child" | "Blanket" | "Bag" | "Bottle" | "Vehicle" | "Road" | "Tree" | "Building" | "Animal"],
          "confidence": number between 50 and 100,
          "recommended_response": "Safety response recommendation for dispatch"
        }`;

        const result = await visionModel.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        
        // Try to parse the JSON from Gemini
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiAnalysis = JSON.parse(jsonMatch[0]);
          severity = aiAnalysis.severity || 'medium';
        }
      } catch (aiError) {
        console.error("Gemini AI Analysis failed:", aiError);
      }
    }

    // Sanitize severity to match the database enum values: 'low', 'medium', 'high', 'critical'
    let dbSeverity = 'medium';
    if (typeof severity === 'string') {
      const lowerSeverity = severity.toLowerCase().trim();
      if (lowerSeverity.includes('crit')) {
        dbSeverity = 'critical';
      } else if (lowerSeverity.includes('high')) {
        dbSeverity = 'high';
      } else if (lowerSeverity.includes('low')) {
        dbSeverity = 'low';
      } else if (lowerSeverity.includes('med') || lowerSeverity.includes('mod')) {
        dbSeverity = 'medium';
      }
    }

    // 2. Insert into Supabase
    const { data: report, error } = await supabase
      .from('reports')
      .insert([
        { 
          description: description || 'Citizen reported an emergency.', 
          latitude: location?.lat, 
          longitude: location?.lng,
          address: location?.address || 'Unknown Location',
          priority: dbSeverity,
          ai_analysis: { 
            assessment: aiAnalysis?.assessment || 'Pending AI Analysis due to rate limits.',
            structured_analysis: aiAnalysis || null
          },
          image_urls: image_url ? [image_url] : [],
          is_anonymous: isAnonymous || false,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // 3. Create initial case event
    if (report) {
      await supabase.from('case_events').insert([
        {
          report_id: report.id,
          event_type: 'created',
          message: 'Emergency report received by the system.',
          metadata: { title: 'Report Submitted' }
        }
      ]);
    }

    res.status(201).json({ 
      success: true, 
      case_id: report.id,
      immediate_actions_for_citizen: [
        'Stay calm and remain with the child.',
        'Do NOT move the child unless there is immediate danger.',
        'Do NOT give the child food or water.',
        'Keep bystanders at a safe distance.',
        'Help is on the way — authorities have been alerted.'
      ],
      report, 
      aiAnalysis 
    });
  } catch (error) {
    console.error('Report submission error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
