// app/api/chat/route.js
// Uses Groq (free) instead of Ollama
// Ollama runs locally and can't be deployed to Vercel
// Groq runs the same Llama model in the cloud for free

import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req) {
  try {
    const { message, history, farmContext, landData } = await req.json()

    if (!message?.trim()) {
      return Response.json({ error: 'Empty message' }, { status: 400 })
    }

    const systemPrompt = `You are AgroBot, an expert agricultural AI assistant for Moroccan farmers.
You speak Arabic (Darija), French, and English. Always reply in the same language the farmer uses.
Be practical, specific, and concise. Never give vague advice.

${farmContext ? `
LIVE FARM DATA (use this for personalized advice):
- Soil moisture: ${farmContext.moisture ?? 'not connected'}%
- EC salinity: ${farmContext.ec ?? 'not connected'} dS/m
- Soil pH: ${farmContext.ph ?? 'not connected'}
- Soil temperature: ${farmContext.soilTemp ?? 'not connected'}°C
- Active disease alerts: ${farmContext.alerts?.join(', ') || 'none'}
- Weather: ${farmContext.weather || 'unknown'}
` : ''}

${landData ? `
SELECTED LAND DATA:
- Location: ${landData.location}
- Soil type: ${landData.soil?.soilType}
- Soil pH: ${landData.soil?.ph}
- Weather: ${landData.weather?.temperature}°C, humidity ${landData.weather?.humidity}%
- Best crops for this land: ${landData.crops?.filter(c => c.recommended).map(c => c.name).join(', ')}
` : ''}

RULES:
- If moisture > 70% → warn about overwatering and fungal risk
- If EC > 2.5 dS/m → warn about salt stress, recommend leaching
- If pH < 6.0 → recommend agricultural lime
- If humidity > 75% and warm → warn about late blight / powdery mildew
- Always reference the farmer's actual data in your answer
- Keep answers under 150 words unless a detailed plan is requested
- For disease questions, name the disease, cause, and 2-3 treatment options`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-8),
      { role: 'user', content: message.trim() }
    ]

    const completion = await groq.chat.completions.create({
      model:       'llama-3.1-8b-instant',
      messages,
      max_tokens:  512,
      temperature: 0.7
    })

    return Response.json({
      reply: completion.choices[0].message.content,
      model: 'llama-3.1-8b-instant (Groq)'
    })

  } catch (err) {
    if (err.status === 429) {
      return Response.json({ error: 'Rate limit — wait a moment' }, { status: 429 })
    }
    return Response.json({ error: 'Chat unavailable' }, { status: 500 })
  }
}