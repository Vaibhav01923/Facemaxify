import { generateJson, toImageBlock } from "./_lib/claude.js";
import { languageName, reportLanguage } from "./_lib/language.js";

const assessmentAdvice = {
  type: "object",
  properties: { assessment: { type: "string" }, advice: { type: "string" } },
  required: ["assessment", "advice"],
  additionalProperties: false,
};

const RECOMMENDATIONS_SCHEMA = {
  type: "object",
  properties: {
    executive_summary: { type: "string" },
    softmax: {
      type: "object",
      properties: {
        body_fat: assessmentAdvice,
        skin_grooming: assessmentAdvice,
        style: assessmentAdvice,
      },
      required: ["body_fat", "skin_grooming", "style"],
      additionalProperties: false,
    },
    hardmax: {
      type: "object",
      properties: {
        bone_structure: { type: "string" },
        balance: { type: "string" },
        recommendation: { type: "string" },
      },
      required: ["bone_structure", "balance", "recommendation"],
      additionalProperties: false,
    },
  },
  required: ["executive_summary", "softmax", "hardmax"],
  additionalProperties: false,
};

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // SECURITY: Verify user is authenticated via Clerk
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Missing authentication token" });
    }

    // Extract the token (Clerk session token)
    const token = authHeader.substring(7);

    // Basic validation - in production, you'd verify the JWT signature
    // For now, we trust that Clerk's frontend SDK only sends valid tokens
    if (!token || token.length < 20) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const { metrics, frontPhotoUrl } = req.body;
    // Visitors who came through the Spanish / Japanese pages get the report text in their language.
    const language = reportLanguage(req.body.language);

    if (!Array.isArray(metrics)) {
      return res.status(400).json({ error: "metrics is required" });
    }

    // Prepare inputs
    const metricsSummary = metrics
      .map(
        (m) =>
          `- ${m.name}: ${m.value} (${m.score}/10) - Ideal: ${m.idealMin}-${m.idealMax}`,
      )
      .join("\n");

    // The photo is optional for this report: fall back to metrics only if it can't be used.
    let image = null;
    if (frontPhotoUrl) {
      try {
        image = await toImageBlock(frontPhotoUrl);
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
    ${
      language
        ? `**Language:** Write every text value in ${languageName(language)}. Keep the JSON keys exactly as in the schema (in English) and translate the example phrases (such as "CRITICAL/URGENT" and "No major intervention recommended") naturally.`
        : ""
    }
    **CRITICAL:** Return ONLY valid JSON matching the exact schema above. No breakdown, no preamble, do NOT wrap in markdown code blocks.
    `;

    const analysis = await generateJson({
      prompt,
      schema: RECOMMENDATIONS_SCHEMA,
      image,
    });

    res.status(200).json({ analysis });
  } catch (error) {
    console.error("Claude API Error:", error);
    res
      .status(500)
      .json({ error: "Failed to generate analysis: " + error.message });
  }
}
