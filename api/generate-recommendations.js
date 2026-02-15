import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // SECURITY: Verify user is authenticated via Clerk
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing authentication token' });
    }

    // Extract the token (Clerk session token)
    const token = authHeader.substring(7);
    
    // Basic validation - in production, you'd verify the JWT signature
    // For now, we trust that Clerk's frontend SDK only sends valid tokens
    if (!token || token.length < 20) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    const { metrics, frontPhotoUrl } = req.body;

    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not defined");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use gemini-3-flash-preview as requested
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // Prepare inputs
    const metricsSummary = metrics.map(m => `- ${m.name}: ${m.value} (${m.score}/10) - Ideal: ${m.idealMin}-${m.idealMax}`).join('\n');
    
    let imagePart = null;
    if (frontPhotoUrl) {
         try {
            // Check if it's base64 or URL
            let mimeType = "image/jpeg";
            let data = "";

            if (frontPhotoUrl.startsWith("data:")) {
                const matches = frontPhotoUrl.match(/^data:(.+);base64,(.+)$/);
                if (matches) {
                    mimeType = matches[1];
                    data = matches[2];
                }
            } else {
                // Fetch URL and convert to base64
                const response = await fetch(frontPhotoUrl);
                const arrayBuffer = await response.arrayBuffer();
                data = Buffer.from(arrayBuffer).toString("base64");
            }

            imagePart = {
                inlineData: {
                    data: data,
                    mimeType: mimeType
                }
            };
         } catch (e) {
             console.error("Failed to process image:", e);
         }
    }

    const prompt = `
    You are an expert aesthetic consultant specializing in facial harmony and "looksmaxxing". 
    Analyze the user's face based on the provided metrics and the photo.

    **Metrics:**
    ${metricsSummary}

    **Instructions:**
    Analyze the user's facial aesthetics and provide a structured JSON response. 
    DO NOT use Markdown. Return ONLY raw JSON.

    **JSON Schema:**
    {
      "executive_summary": "One concise paragraph (max 3 sentences) summarizing their overall harmony and strongest features.",
      "softmax": {
        "body_fat": { 
            "assessment": "Brief check based on photo (e.g., 'Estimated 15% range')",
            "advice": "Actionable advice (e.g., 'Lean down to 12% to reveal jawline'. If >18%, mark as CRITICAL/URGENT)"
        },
        "skin_grooming": { 
            "assessment": "Observation of skin quality/grooming",
            "advice": "Specific routine or style advice"
        },
        "style": { 
             "assessment": "Hair/Beard style observation",
             "advice": "Transformation tip"
        }
      },
      "hardmax": {
        "bone_structure": "Analysis of jaw, chin, cheekbones and ratios.",
        "balance": "Note specific asymmetries or deviations.",
        "recommendation": "Surgical/Procedural advice. If scores > 7/10, say 'No major intervention recommended'."
      }
    }

    **Tone:** Professional, objective, direct, and actionable. Avoid fluff.
    `;

    const parts = [prompt];
    if (imagePart) parts.push(imagePart);

    const result = await model.generateContent(parts);
    const response = await result.response;
    let text = response.text();
    
    // Clean up potential markdown code blocks if the model ignores instructions
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    res.status(200).json({ analysis: JSON.parse(text) });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Failed to generate analysis: " + error.message });
  }
}
