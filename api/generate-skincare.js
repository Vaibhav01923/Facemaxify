
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { currentPhotoUrl } = req.body;

    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not defined');

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const processImage = async (url) => {
      try {
        let mimeType = 'image/jpeg', data = '';
        if (url.startsWith('data:')) {
          const matches = url.match(/^data:(.+);base64,(.+)$/);
          if (matches) { mimeType = matches[1]; data = matches[2]; }
        } else {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          data = Buffer.from(arrayBuffer).toString('base64');
        }
        return { inlineData: { data, mimeType } };
      } catch { return null; }
    };

    const prompt = `You are an expert Dermatologist and Esthetician. Analyze the user's skin from the provided photo and give a detailed, actionable skin report.

Return ONLY a raw JSON object matching this exact schema (no markdown, no code blocks):
{
  "analysis": {
    "skin_type": "Oily | Dry | Combination | Normal | Sensitive",
    "concerns": ["list of observed skin concerns"],
    "severity_score": 1,
    "summary": "2-3 sentence plain-English assessment of their current skin condition and what to focus on"
  },
  "improvements": [
    { "area": "specific concern or goal", "advice": "concrete actionable step to improve it" }
  ],
  "routine": {
    "morning": [{ "step": "Step name", "product_type": "Product type", "reason": "Why this helps" }],
    "evening": [{ "step": "Step name", "product_type": "Product type", "reason": "Why this helps" }],
    "weekly": ["Weekly treatment 1", "Weekly treatment 2"]
  },
  "lifestyle_tips": ["Tip 1", "Tip 2"]
}`;

    const parts = [prompt];
    const imagePart = await processImage(currentPhotoUrl);
    if (imagePart) parts.push(imagePart);

    const result = await model.generateContent(parts);
    let text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      res.status(200).json({ result: JSON.parse(text) });
    } catch {
      res.status(500).json({ error: 'Failed to parse AI response' });
    }
  } catch (error) {
    console.error('Skincare API Error:', error);
    res.status(500).json({ error: 'Failed to generate analysis: ' + error.message });
  }
}
