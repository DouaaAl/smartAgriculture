// app/api/land-advice/route.js
import Groq from 'groq-sdk'
import { getLocationEstimate } from '@/lib/locationEstimates'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ── Fetch weather from Open-Meteo (free, no key) ──────────────
async function getWeather(lat, lng) {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,` +
      `wind_speed_10m,weather_code` +
      `&daily=precipitation_sum,temperature_2m_max,temperature_2m_min,` +
      `et0_fao_evapotranspiration` +
      `&forecast_days=7&timezone=auto`

    const res  = await fetch(url, { next: { revalidate: 1800 } })
    const data = await res.json()

    const current = data.current
    const daily   = data.daily

    return {
      temperature:  current.temperature_2m,
      humidity:     current.relative_humidity_2m,
      precipitation: current.precipitation,
      windSpeed:    current.wind_speed_10m,
      rain7d:       daily.precipitation_sum.reduce((a, b) => a + b, 0).toFixed(1),
      tempMax:      Math.max(...daily.temperature_2m_max).toFixed(1),
      tempMin:      Math.min(...daily.temperature_2m_min).toFixed(1),
      evaporation:  daily.et0_fao_evapotranspiration[0]?.toFixed(1),
    }
  } catch {
    return null
  }
}

// ── Fetch soil from ISRIC SoilGrids (free, no key) ────────────
async function getSoil(lat, lng) {
  try {
    const url =
      `https://rest.isric.org/soilgrids/v2.0/properties/query` +
      `?lon=${lng}&lat=${lat}` +
      `&property=phh2o&property=clay&property=sand&property=soc` +
      `&property=nitrogen&property=bdod` +
      `&depth=0-5cm&value=mean`

    const res  = await fetch(url, { next: { revalidate: 86400 } }) // cache 24h
    const data = await res.json()

    const get = (name) => {
      const prop = data?.properties?.layers?.find(l => l.name === name)
      return prop?.depths?.[0]?.values?.mean ?? null
    }

    const phRaw    = get('phh2o')   // stored as pH*10
    const clayRaw  = get('clay')    // g/kg
    const sandRaw  = get('sand')    // g/kg
    const socRaw   = get('soc')     // dg/kg
    const nitRaw   = get('nitrogen')// cg/kg
    const bdodRaw  = get('bdod')    // cg/cm³

    const ph      = phRaw   ? (phRaw / 10).toFixed(1)    : null
    const clay    = clayRaw ? (clayRaw / 10).toFixed(1)  : null  // %
    const sand    = sandRaw ? (sandRaw / 10).toFixed(1)  : null  // %
    const soc     = socRaw  ? (socRaw  / 10).toFixed(2)  : null  // g/kg
    const nitrogen= nitRaw  ? (nitRaw  / 100).toFixed(2) : null  // g/kg
    const density = bdodRaw ? (bdodRaw / 100).toFixed(2) : null  // g/cm³

    // Classify soil type from clay + sand %
    const c = parseFloat(clay) || 30
    const s = parseFloat(sand) || 40
    let soilType = 'loam'
    if      (c > 40)           soilType = 'clay'
    else if (c > 25 && s < 45) soilType = 'clay-loam'
    else if (s > 70)           soilType = 'sandy-loam'
    else if (s > 85)           soilType = 'sandy'
    else                       soilType = 'loam'

    return { ph, clay, sand, soc, nitrogen, density, soilType }
  } catch {
    // Fallback for Rabat if API is down
    return {
      ph: '6.8', clay: '32', sand: '38',
      soc: '1.2', nitrogen: '0.9',
      density: '1.3', soilType: 'clay-loam'
    }
  }
}

// ── Crop compatibility engine ─────────────────────────────────
function getCropCompatibility(weather, soil, sensorData) {
  const temp     = weather?.temperature  || 20
  const humidity = weather?.humidity     || 60
  const rain7d   = parseFloat(weather?.rain7d || 0)
  const ph       = parseFloat(soil?.ph   || 6.8)
  const clay     = parseFloat(soil?.clay || 30)

  // Sensor data (from ESP32 when connected, mock when not)
  const soilMoisture = sensorData?.moisture || null
  const ec           = sensorData?.ec       || null

  const crops = [
    {
      name: 'Tomato', emoji: '🍅',
      conditions: { tempMin:15, tempMax:32, phMin:6.0, phMax:7.0, humMax:80 },
      notes: 'Needs drip irrigation. Susceptible to late blight in high humidity.'
    },
    {
      name: 'Pepper', emoji: '🫑',
      conditions: { tempMin:18, tempMax:35, phMin:6.0, phMax:7.5, humMax:85 },
      notes: 'Drought-tolerant once established. Avoid waterlogging.'
    },
    {
      name: 'Potato', emoji: '🥔',
      conditions: { tempMin:10, tempMax:25, phMin:5.5, phMax:6.5, humMax:75 },
      notes: 'Prefers slightly acidic soil. Needs well-drained conditions.'
    },
    {
      name: 'Wheat', emoji: '🌾',
      conditions: { tempMin:5,  tempMax:24, phMin:6.0, phMax:7.5, humMax:70 },
      notes: 'Rain-fed possible in Rabat. Plant Oct–Nov for best yield.'
    },
    {
      name: 'Lettuce', emoji: '🥬',
      conditions: { tempMin:7,  tempMax:22, phMin:6.0, phMax:7.0, humMax:90 },
      notes: 'Fast cycle (45 days). Ideal for winter months in Morocco.'
    },
    {
      name: 'Onion', emoji: '🧅',
      conditions: { tempMin:10, tempMax:28, phMin:6.0, phMax:7.0, humMax:70 },
      notes: 'Drought-tolerant. Plant Oct–Mar for best results in Rabat.'
    },
    {
      name: 'Strawberry', emoji: '🍓',
      conditions: { tempMin:10, tempMax:26, phMin:5.5, phMax:6.5, humMax:80 },
      notes: 'High export value. Morocco exports to EU. Needs acidic soil.'
    },
    {
      name: 'Zucchini', emoji: '🥒',
      conditions: { tempMin:18, tempMax:35, phMin:6.0, phMax:7.5, humMax:85 },
      notes: 'High yield per m². Good for drip irrigation systems.'
    },
    {
      name: 'Olive', emoji: '🫒',
      conditions: { tempMin:5,  tempMax:40, phMin:5.5, phMax:8.0, humMax:60 },
      notes: 'Long-term investment. Extremely drought-resistant once mature.'
    },
    {
      name: 'Barley', emoji: '🌾',
      conditions: { tempMin:5,  tempMax:25, phMin:6.0, phMax:8.0, humMax:65 },
      notes: 'Most drought-tolerant cereal. Good for Morocco\'s dry conditions.'
    },
  ]

  return crops.map(crop => {
    const c = crop.conditions
    let score   = 100
    let issues  = []
    let matches = []

    // Temperature check
    if (temp < c.tempMin) {
      score -= 30
      issues.push(`Too cold (${temp}°C, needs >${c.tempMin}°C)`)
    } else if (temp > c.tempMax) {
      score -= 25
      issues.push(`Too hot (${temp}°C, needs <${c.tempMax}°C)`)
    } else {
      matches.push(`Temperature ${temp}°C is ideal`)
    }

    // pH check
    if (ph < c.phMin) {
      score -= 20
      issues.push(`pH too low (${ph}, needs >${c.phMin}) — add lime`)
    } else if (ph > c.phMax) {
      score -= 15
      issues.push(`pH too high (${ph}, needs <${c.phMax})`)
    } else {
      matches.push(`pH ${ph} is compatible`)
    }

    // Humidity check
    if (humidity > c.humMax) {
      score -= 15
      issues.push(`High humidity (${humidity}%) — fungal disease risk`)
    } else {
      matches.push(`Humidity ${humidity}% is acceptable`)
    }

    // Rain check
    if (rain7d < 5 && temp > 20) {
      score -= 5
      issues.push('Low rainfall — irrigation required')
    }

    // EC check from sensors
    if (ec && ec > 2.5) {
      score -= 20
      issues.push(`High soil salinity (EC ${ec}) — salt stress risk`)
    }

    // Soil moisture from sensors
    if (soilMoisture) {
      if (soilMoisture < 30) {
        score -= 15
        issues.push(`Low soil moisture (${soilMoisture}%) — irrigate`)
      } else if (soilMoisture > 80) {
        score -= 10
        issues.push(`High soil moisture (${soilMoisture}%) — reduce irrigation`)
      }
    }

    const compatibility =
      score >= 85 ? 'Excellent' :
      score >= 70 ? 'Good'      :
      score >= 50 ? 'Fair'      : 'Poor'

    return {
      ...crop,
      score:         Math.max(0, score),
      compatibility,
      issues,
      matches,
      recommended:   score >= 70
    }
  }).sort((a, b) => b.score - a.score)
}

// ── Main API handler ──────────────────────────────────────────
export async function POST(req) {
  try {
    const { lat, lng, sensorData, diseases } = await req.json()

    if (!lat || !lng) {
      return Response.json({ error: 'lat and lng required' }, { status: 400 })
    }

    // Get location-based estimate for EC fallback (no outside DB)
    const locationEst = getLocationEstimate(lat, lng)

    // Enrich sensorData: use real EC if available, otherwise use location estimate
    const enrichedSensorData = sensorData ? {
      ...sensorData,
      ec: sensorData.ec ?? locationEst.ec,
    } : {
      ec:       locationEst.ec,
      moisture: null,
      soilTemp: null,
    }

    // Fetch weather + soil in parallel
    const [weather, soil] = await Promise.all([
      getWeather(lat, lng),
      getSoil(lat, lng)
    ])

    // Score crop compatibility
    const crops = getCropCompatibility(weather, soil, enrichedSensorData)

    // Build context for AI advice
    const context = `
Location: ${lat.toFixed(4)}, ${lng.toFixed(4)} (Morocco region) — ${locationEst.zone}
Weather: ${weather?.temperature}°C, humidity ${weather?.humidity}%,
  rain last 7 days: ${weather?.rain7d}mm, wind: ${weather?.windSpeed} km/h
  Evapotranspiration: ${weather?.evaporation}mm/day
Soil: type=${soil?.soilType}, pH=${soil?.ph},
  clay=${soil?.clay}%, sand=${soil?.sand}%
  organic carbon=${soil?.soc} g/kg, nitrogen=${soil?.nitrogen} g/kg
EC (salinity): ${enrichedSensorData.ec} dS/m ${sensorData?.ec ? '(live sensor)' : `(estimated — ${locationEst.notes})`}
${sensorData?.moisture != null ? `
Live sensor readings:
  Soil moisture: ${sensorData.moisture}%
  Soil temp: ${sensorData.soilTemp}°C` : 'Soil moisture sensor: not connected yet (using map data only)'}
${diseases?.length ? `Active disease alerts: ${diseases.join(', ')}` : ''}
Top recommended crops: ${crops.filter(c => c.recommended).map(c => c.name).join(', ')}
`

    // Ask Groq for personalized advice
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are an expert agronomist for Moroccan farmers.
Given environmental data, provide specific, actionable advice.
Structure your response with these exact sections:
1. SOIL HEALTH (2-3 sentences about soil condition and what to improve)
2. IRRIGATION (specific advice on how much and how often to water)
3. IMMEDIATE ACTIONS (2-3 bullet points of things to do this week)
4. DISEASE RISK (based on humidity and temperature, what diseases to watch for)
Keep total response under 200 words. Be practical and specific.`
        },
        {
          role: 'user',
          content: `Analyze this farm data and give advice:\n${context}`
        }
      ],
      max_tokens: 400,
      temperature: 0.5
    })

    const advice = completion.choices[0].message.content

    return Response.json({
      location:    { lat, lng },
      zone:        locationEst.zone,
      weather,
      soil,
      crops,
      advice,
      sensorData:  enrichedSensorData,
      ecSource:    sensorData?.ec ? 'live-sensor' : 'location-estimate',
      generatedAt: new Date().toISOString()
    })

  } catch (err) {
    console.error('land-advice error:', err)
    return Response.json({ error: 'Failed to fetch land data' }, { status: 500 })
  }
}