import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
    Provide a structured, easy-to-read report using the following format:

    # ⚡ Executive Summary
    (One concise paragraph summarizing their overall harmony and strongest features.)

    # 🟢 Softmax Protocol (Lifestyle & Grooming)
    *   **Body Fat Assessment:** (Check photo: if >15% suggest leaning down, if >20% mark as URGENT).
    *   **Skin & Grooming:** (Specific advice on skincare, hair, and facial hair).
    *   **Style:** (Quick tips to enhance current features).
    
    # 🔴 Hardmax Protocol (Medical/Surgical)
    *   **Bone Structure:** (Analyze jaw, chin, cheekbones).
    *   **Balance:** (Note specific asymmetries or ratios calling for intervention).
    *   **Recommendation:** (Only suggest surgery if ratios are extreme. If good (>7/10), explicitly look for "No surgical intervention recommended".)

    **Tone:** Professional, objective, direct, and actionable. Avoid fluff.
    `;

    const parts = [prompt];
    if (imagePart) parts.push(imagePart);

    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ analysis: text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Failed to generate analysis" + error.message });
  }
}
