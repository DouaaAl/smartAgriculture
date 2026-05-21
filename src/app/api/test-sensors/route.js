// app/api/test-sensors/route.js
// Simulates ESP32 sensor readings so you can test everything
// without physical hardware connected

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const scenario = searchParams.get('scenario') || 'normal'

  const scenarios = {
    normal: {
      moisture:  62,  ec: 1.8,  ph: 6.8,
      soilTemp:  21,  nitrogen: 'medium',
      battery:   78,  device: 'esp32-mock'
    },
    dry: {
      moisture:  22,  ec: 2.1,  ph: 6.5,
      soilTemp:  28,  nitrogen: 'low',
      battery:   65,  device: 'esp32-mock'
    },
    waterlogged: {
      moisture:  92,  ec: 1.2,  ph: 7.1,
      soilTemp:  18,  nitrogen: 'medium',
      battery:   80,  device: 'esp32-mock'
    },
    saline: {
      moisture:  55,  ec: 3.8,  ph: 7.8,
      soilTemp:  24,  nitrogen: 'low',
      battery:   71,  device: 'esp32-mock'
    },
    acidic: {
      moisture:  58,  ec: 1.5,  ph: 5.1,
      soilTemp:  22,  nitrogen: 'medium',
      battery:   90,  device: 'esp32-mock'
    }
  }

  const data = scenarios[scenario] || scenarios.normal

  return Response.json({
    ...data,
    scenario,
    timestamp:    new Date().toISOString(),
    available_scenarios: Object.keys(scenarios),
    note: 'Mock data — replace with real MQTT data when ESP32 is connected'
  })
}

export async function POST(req) {
  // Simulates ESP32 posting real sensor data
  // When ESP32 is ready, it posts to this endpoint (or /api/sensors)
  const body = await req.json()
  console.log('Received sensor data:', body)

  return Response.json({
    status:    'received',
    data:      body,
    timestamp: new Date().toISOString()
  })
}