export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status}`);
    }

    const data = await response.json();

    // Return sorted, clean model list
    const models = data.data
      .map((m) => ({
        id: m.id,
        name: m.name,
        context: m.context_length,
        pricing: m.pricing,
        vision: m.architecture?.modality?.includes('image') ?? false,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json({ models });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
