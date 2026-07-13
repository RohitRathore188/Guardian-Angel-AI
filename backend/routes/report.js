import express from 'express';
import { supabase } from '../utils/supabase.js';
import { visionModel } from '../utils/gemini.js';
import { matchFace } from '../utils/faceMatcher.js';
import { sendEmail } from '../utils/emailService.js';
import { sendSMS } from '../utils/twilio.js';

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

    // 2. Perform Facial Recognition Scan
    let faceMatchResult = { match_found: false, matched_child: null, confidence: 0, reason: "No image provided" };
    if (image_url) {
      faceMatchResult = await matchFace(image_url);
    }

    // 3. Insert into Supabase
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
            structured_analysis: aiAnalysis || null,
            face_match: faceMatchResult
          },
          image_urls: image_url ? [image_url] : [],
          is_anonymous: isAnonymous || false,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // 4. Create initial case event
    if (report) {
      const eventMsg = faceMatchResult.match_found 
        ? `Emergency report received. Visual match found: ${faceMatchResult.matched_child.name} (Confidence: ${faceMatchResult.confidence}%).`
        : 'Emergency report received by the system.';

      await supabase.from('case_events').insert([
        {
          report_id: report.id,
          event_type: 'created',
          message: eventMsg,
          metadata: { 
            title: 'Report Submitted',
            match_found: faceMatchResult.match_found,
            matched_child: faceMatchResult.matched_child
          }
        }
      ]);

      // 5. Send automated Resend email to matched parent
      if (faceMatchResult.match_found && faceMatchResult.matched_child?.parent_email) {
        const { name, parent_name, parent_email } = faceMatchResult.matched_child;
        const trackingLink = `http://localhost:5173/companion?case_id=${report.id}`;
        
        await sendEmail({
          to: parent_email,
          subject: `🚨 [Guardian Angel AI] URGENT: Match Found for ${name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
              <h2 style="color: #ef4444; margin-top: 0;">🚨 Alert: Child Located</h2>
              <p>Dear <strong>${parent_name}</strong>,</p>
              <p>An emergency report has been filed for a child who visually matches your missing child, <strong>${name}</strong>.</p>
              <p><strong>Incident Location:</strong> ${report.address || 'GPS Coordinates'}</p>
              <p><strong>Match Confidence:</strong> ${faceMatchResult.confidence}%</p>
              <p><strong>AI Analysis details:</strong> ${faceMatchResult.reason}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p>Emergency responders (police/NGO) are being dispatched to this location. You can track this rescue case live via the companion link below:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${trackingLink}" style="background-color: #e94560; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Track Active Rescue Operations</a>
              </div>
              <p style="font-size: 11px; color: #777;">If you have any questions or this report was filed in error, please contact Emergency services at 112.</p>
            </div>
          `
        });
      }

      // 6. Broadcast SMS Alerts to registered volunteers
      if (dbSeverity === 'critical' || dbSeverity === 'high') {
        try {
          const { data: volunteers } = await supabase
            .from('profiles')
            .select('full_name, mobile_number')
            .eq('role', 'volunteer');

          if (volunteers && volunteers.length > 0) {
            const smsBody = `🚨 Guardian Angel Amber Alert: A ${dbSeverity} priority case has been reported near ${report.address.slice(0, 40)}. Volunteers please log into your deck immediately to coordinate rescue support.`;
            for (const v of volunteers) {
              if (v.mobile_number) {
                await sendSMS({ to: v.mobile_number, body: smsBody });
              }
            }
          }
        } catch (smsErr) {
          console.error("Failed to broadcast volunteer SMS alerts:", smsErr);
        }
      }
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
