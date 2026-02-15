
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

    const { currentPhotoUrl, previousPhotoUrl, daysSinceLastScan } = req.body;

    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not defined");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use 1.5-flash for multimodal

    const parts = [];

    // Helper to process image URL to inline data
    const processImage = async (url) => {
        try {
            let mimeType = "image/jpeg";
            let data = "";
            if (url.startsWith("data:")) {
                const matches = url.match(/^data:(.+);base64,(.+)$/);
                if (matches) {
                    mimeType = matches[1];
                    data = matches[2];
                }
            } else {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                data = Buffer.from(arrayBuffer).toString("base64");
            }
            return {
                inlineData: {
                    data: data,
                    mimeType: mimeType
                }
            };
        } catch (e) {
            console.error("Failed to process image:", e);
            return null;
        }
    };

    // 1. Add Prompt
    let promptText = `
    You are an expert Dermatologist and Esthetician. 
    Analyze the user's skin condition from the provided photo(s) and create a highly personalized skincare routine.

    **Context:**
    - Days since last check-in: ${daysSinceLastScan || 'First scan'}
    `;

    if (previousPhotoUrl) {
        promptText += `\n**Comparison Task:**\nThere are two images. The first is the CURRENT image. The second is the PREVIOUS image from ${daysSinceLastScan} days ago.\nCompare them closely. Has their skin quality (acne, redness, texture, dark circles) improved or worsened? Be specific.`;
        
        if (daysSinceLastScan > 14) {
            promptText += `\n\n**CRITICAL OBSERVATION:** The user has not uploaded a photo in ${daysSinceLastScan} days (Goal is 7 days). You must respectfully but firmly reprimand them for breaking their consistency streak. Explain why consistency is key for skin turnover cycles.`;
        }
    } else {
        promptText += `\n**Task:**\nAnalyze the single provided image for skin quality.`;
    }

    promptText += `
    
    **Output Guidelines:**
    Return a structured JSON object. DO NOT use Markdown.

    **JSON Schema:**
    {
      "analysis": {
        "skin_type": "Oily/Dry/Combination/Sensitive",
        "concerns": ["Acne", "Hyperpigmentation", "Rosacea", "Dullness"],
        "severity_score": 1-10 (1=Perfect, 10=Severe Issues)
      },
      "progress_report": {
        "status": "improved" | "worsened" | "maintained" | "new_user",
        "summary": "Comparison text (or 'Welcome to your first scan' if new). Mention the missed check-in here if applicable."
      },
      "routine": {
        "morning": [
           { "step": "Cleanser", "product_type": "Salicylic Acid Cleanser", "reason": "To combat active breakout..." },
           { "step": "Treatment", "product_type": "Vitamin C Serum", "reason": "For brightness..." }
        ],
        "evening": [
           { "step": "Cleanser", "product_type": "Gentle Foam", "reason": "Remove dirt without stripping..." },
           { "step": "Active", "product_type": "Retinol 0.5%", "reason": "Cell turnover..." }
        ],
        "weekly": ["Exfoliate (Wed/Sat)", "Clay Mask (Sun)"]
      },
      "lifestyle_tips": ["Drink 3L water", "Change pillowcase"]
    }
    `;

    parts.push(promptText);

    // 2. Add Current Image
    const currentImagePart = await processImage(currentPhotoUrl);
    if (currentImagePart) {
        parts.push(currentImagePart);
        parts.push("This is the CURRENT photo.");
    }

    // 3. Add Previous Image (if available)
    if (previousPhotoUrl) {
        const prevImagePart = await processImage(previousPhotoUrl);
        if (prevImagePart) {
            parts.push(prevImagePart);
            parts.push("This is the PREVIOUS photo from " + daysSinceLastScan + " days ago.");
        }
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    let text = response.text();
    
    // Clean up
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
        const jsonResponse = JSON.parse(text);
        res.status(200).json({ result: jsonResponse });
    } catch (e) {
        console.error("Failed to parse Gemini JSON:", text);
        res.status(500).json({ error: "Failed to parse AI response" });
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Failed to generate analysis: " + error.message });
  }
}
