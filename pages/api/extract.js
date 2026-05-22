export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64, mimeType, model, mode } = req.body;

  if (!imageBase64 || !model) {
    return res.status(400).json({ error: 'Missing required fields: imageBase64, model' });
  }

  const systemPrompt =
    mode === 'recreate'
      ? `You are an expert prompt engineer specializing in AI image generation.
Analyze the provided image and write a detailed, accurate prompt that could recreate it using an AI image generator like Midjourney, Stable Diffusion, or DALL-E.

Your prompt should cover:
- Subject and composition
- Art style, medium, and technique
- Lighting and mood
- Color palette
- Camera angle and perspective (if photographic)
- Any notable textures, details, or effects
- Quality modifiers (e.g. highly detailed, 8k, cinematic)

Return ONLY the prompt — no explanations, no preamble. Just the raw prompt text.`
      : `You are an expert prompt engineer.
Analyze the provided image thoroughly and extract a comprehensive, detailed prompt that describes what you see.

Your extraction should cover:
- Main subject and scene description
- Visual style and aesthetic
- Composition and framing
- Colors and lighting
- Mood and atmosphere
- Any text visible in the image
- Technical or artistic details

Return ONLY the descriptive prompt — no explanations, no labels. Just the raw prompt text that captures the essence of this image.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://prompt-generator.vercel.app',
        'X-Title': 'Prompt Generator',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`,
                },
              },
              {
                type: 'text',
                text:
                  mode === 'recreate'
                    ? 'Write an AI image generation prompt that could recreate this image.'
                    : 'Extract a detailed descriptive prompt from this image.',
              },
            ],
          },
        ],
        temperature: 0.4,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData?.error?.message || `OpenRouter error: ${response.status}`);
    }

    const data = await response.json();
    const extracted = data.choices?.[0]?.message?.content?.trim();

    if (!extracted) throw new Error('Empty response from model');

    return res.status(200).json({
      prompt: extracted,
      model: data.model,
      usage: data.usage,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
