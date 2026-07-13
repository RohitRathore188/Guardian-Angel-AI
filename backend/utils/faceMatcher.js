import { supabase } from './supabase.js';
import { visionModel } from './gemini.js';

export async function matchFace(imageUrl) {
  try {
    // 1. Fetch missing children database
    const { data: missingChildren, error } = await supabase
      .from('missing_children')
      .select('*');

    if (error || !missingChildren || missingChildren.length === 0) {
      console.warn("No missing children registry data available for matching.");
      return { match_found: false, matched_child: null, confidence: 0, reason: "No database records" };
    }

    // 2. Prepare visual matching query
    // Fetch base64 image data
    const imgRes = await fetch(imageUrl);
    const arrayBuffer = await imgRes.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg"
      }
    };

    // Serialize registry profiles for Gemini analysis
    const registryDescriptions = missingChildren.map(c => ({
      id: c.id,
      name: c.name,
      age: c.age,
      gender: c.gender,
      description: c.description,
      parent_name: c.parent_name,
      parent_phone: c.parent_phone,
      parent_email: c.parent_email
    }));

    const prompt = `You are a forensic facial and visual matching agent for a child rescue network.
    Compare the child in this uploaded photo against the missing children registry list:
    ${JSON.stringify(registryDescriptions)}

    Evaluate hair color/texture, eye shape, age estimate, gender, and clothing descriptions.
    Determine if there is a match. Since this is an emergency rescue app, flag matches only if there is a strong similarity (confidence > 75%).
    
    Return a valid JSON object matching this schema (no markdown, no backticks, just raw JSON text):
    {
      "match_found": true or false,
      "matched_child": {
        "id": "string",
        "name": "string",
        "parent_name": "string",
        "parent_phone": "string",
        "parent_email": "string"
      } or null,
      "confidence": number between 0 and 100,
      "reason": "Explain your visual alignment or discrepancy reasoning in 1-2 sentences."
    }`;

    const result = await visionModel.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const matchResult = JSON.parse(jsonMatch[0]);
      console.log("Facial Recognition Matching Scan completed:", matchResult);
      return matchResult;
    }
    
    return { match_found: false, matched_child: null, confidence: 0, reason: "Parsing failed" };
  } catch (err) {
    console.error("Facial matching scanner failed:", err);
    return { match_found: false, matched_child: null, confidence: 0, reason: err.message };
  }
}
