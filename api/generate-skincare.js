
import { generateJson, toImageBlock } from "./_lib/claude.js";

const stringList = { type: "array", items: { type: "string" } };
const routineSteps = {
  type: "array",
  items: {
    type: "object",
    properties: {
      step: { type: "string" },
      product_type: { type: "string" },
      reason: { type: "string" },
    },
    required: ["step", "product_type", "reason"],
    additionalProperties: false,
  },
};

const SKINCARE_SCHEMA = {
  type: "object",
  properties: {
    analysis: {
      type: "object",
      properties: {
        skin_type: { type: "string", enum: ["Oily", "Dry", "Combination", "Normal", "Sensitive"] },
        concerns: stringList,
        severity_score: { type: "integer" },
        summary: { type: "string" },
      },
      required: ["skin_type", "concerns", "severity_score", "summary"],
      additionalProperties: false,
    },
    improvements: {
      type: "array",
      items: {
        type: "object",
        properties: { area: { type: "string" }, advice: { type: "string" } },
        required: ["area", "advice"],
        additionalProperties: false,
      },
    },
    routine: {
      type: "object",
      properties: { morning: routineSteps, evening: routineSteps, weekly: stringList },
      required: ["morning", "evening", "weekly"],
      additionalProperties: false,
    },
    lifestyle_tips: stringList,
  },
  required: ["analysis", "improvements", "routine", "lifestyle_tips"],
  additionalProperties: false,
};

const PROMPT = `You are an expert Dermatologist and Esthetician. Analyze the user's skin from the provided photo and give a detailed, actionable skin report.

Return ONLY a raw JSON object matching this exact schema (no markdown, no code blocks, no text before or after):
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
}

severity_score is a whole number from 1 (clear, healthy skin) to 10 (severe concerns).`;

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
    if (!currentPhotoUrl) return res.status(400).json({ error: 'currentPhotoUrl is required' });

    const image = await toImageBlock(currentPhotoUrl);
    const result = await generateJson({ prompt: PROMPT, schema: SKINCARE_SCHEMA, image });

    res.status(200).json({ result });
  } catch (error) {
    console.error('Skincare API Error:', error);
    res.status(500).json({ error: 'Failed to generate analysis: ' + error.message });
  }
}
