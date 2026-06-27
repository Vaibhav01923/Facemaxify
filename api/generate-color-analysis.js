import OpenAI, { toFile } from "openai";

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

    const { photoUrl } = req.body;
    if (!photoUrl) return res.status(400).json({ error: 'photoUrl is required' });
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not defined');

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Fetch the portrait and convert to buffer
    let imageBuffer;
    if (photoUrl.startsWith('data:')) {
      const base64Data = photoUrl.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      const response = await fetch(photoUrl);
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    }

    const prompt = `Create personal color analysis infographic for uploaded portrait. Use beauty aesthetic, warm background. On the left, high-res portrait. On the right, serif and script header, Personal Color Analysis theme title. Spaced subtitle descriptors. Sections Best Colors with swatches, labels, Your Undertone, with icons and caption, Clothing Comparison showing exactly 4 versions of the same model wearing different colored outfits — 2 labeled GREAT with a green checkmark, 1 labeled OKAY with a yellow indicator, and 1 labeled AVOID with a red X, Best Neutrals with swatches. Include a seasonal palette grid. Finish with Quick Guide, which includes best traits, enhances, avoid, Style Tip. Maintain minimalist grid, whitespace, rounded corners, subtle shadows, magazine aesthetic.`;

    const response = await openai.images.edit({
      model: "gpt-image-2",
      image: await toFile(imageBuffer, 'portrait.png', { type: 'image/png' }),
      prompt,
      n: 1,
      size: "1536x1024",
    });

    const b64 = response.data[0].b64_json;
    if (!b64) return res.status(500).json({ error: 'No image returned' });

    res.status(200).json({ image: `data:image/png;base64,${b64}` });
  } catch (error) {
    console.error('Color Analysis Error:', error);
    res.status(500).json({ error: 'Failed to generate color analysis: ' + error.message });
  }
}
