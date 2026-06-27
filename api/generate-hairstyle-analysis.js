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

    let imageBuffer;
    if (photoUrl.startsWith('data:')) {
      const base64Data = photoUrl.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      const response = await fetch(photoUrl);
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    }

    const prompt = `Iss portrait se ek hairstyle analysis graphic banao jisme side by side hairstyle comparisons best suited styles clearly highlight Design visual first elegant aur minimal neutral beige background ke saath clean infographic style Left side par uploaded photo ka ek bada studio portrait aur right side par ek structured panel jisme title aur Recommended section Top mein 4-5 hairstyle variations checkmarks ke saath dikhao beech mein Okay section jisme 4–5 styles neutral icons ke saath aur niche mein Less Flattering section jisme 4–5 styles X ke saath Footer mein short styling tips add karo jaise volume layers aur face framing Same subject use karo output high-res 4:5 format photo upload na ki ho toh mango.`;

    const response = await openai.images.edit({
      model: "gpt-image-2",
      image: await toFile(imageBuffer, 'portrait.png', { type: 'image/png' }),
      prompt,
      n: 1,
      size: "1024x1536",
    });

    const b64 = response.data[0].b64_json;
    if (!b64) return res.status(500).json({ error: 'No image returned' });

    res.status(200).json({ image: `data:image/png;base64,${b64}` });
  } catch (error) {
    console.error('Hairstyle Analysis Error:', error);
    res.status(500).json({ error: 'Failed to generate hairstyle analysis: ' + error.message });
  }
}
