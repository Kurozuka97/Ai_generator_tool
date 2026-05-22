export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { intent, category, tone, outputLength, language, model } = req.body;

  if (!intent || !model) {
    return res.status(400).json({ error: 'Missing required fields: intent, model' });
  }

  const systemPrompt = `You are an expert prompt engineer. Your job is to craft high-quality, effective prompts for AI systems.

Given the user's intent, generate a detailed, well-structured prompt that:
- Is clear, specific, and unambiguous
- Includes relevant context and constraints
- Specifies the desired output format where applicable
- Uses appropriate tone and language
- Is optimized for the selected category

Return ONLY the generated prompt — no explanations, no preamble, no markdown fences. Just the raw prompt text ready to copy and use.`;

  const userMessage = `Generate an AI prompt for the following:

Intent: ${intent}
Category: ${category || 'General'}
Tone: ${tone || 'Neutral'}
Preferred output length: ${outputLength || 'Medium'}
Language: ${language || 'English'}

Craft a complete, ready-to-use prompt based on the above.`;

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
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData?.error?.message || `OpenRouter error: ${response.status}`);
    }

    const data = await response.json();
    const generated = data.choices?.[0]?.message?.content?.trim();

    if (!generated) throw new Error('Empty response from model');

    return res.status(200).json({
      prompt: generated,
      model: data.model,
      usage: data.usage,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
