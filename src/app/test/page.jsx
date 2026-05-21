// app/test/page.js
'use client'
import { useState } from 'react'

export default function TestPage() {
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState({})

  async function run(key, fn) {
    setLoading(l => ({ ...l, [key]: true }))
    try {
      const result = await fn()
      setResults(r => ({ ...r, [key]: result }))
    } catch (err) {
      setResults(r => ({ ...r, [key]: { error: err.message } }))
    } finally {
      setLoading(l => ({ ...l, [key]: false }))
    }
  }

  const tests = [
    {
  key: 'bridge_live',
  label: '🌐 Live bridge sensors',
  fn: () => fetch(`${process.env.NEXT_PUBLIC_BRIDGE_URL}/api/sensors`).then(r => r.json())
},
{
  key: 'bridge_pump_on',
  label: '💧 Turn pump ON (bridge)',
  fn: () => fetch(`${process.env.NEXT_PUBLIC_BRIDGE_URL}/api/relay`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ command: 'ON' })
  }).then(r => r.json())
},
{
  key: 'bridge_pump_off',
  label: '⏹ Turn pump OFF (bridge)',
  fn: () => fetch(`${process.env.NEXT_PUBLIC_BRIDGE_URL}/api/relay`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ command: 'OFF' })
  }).then(r => r.json())
},
    {
      key: 'sensors_normal',
      label: '💧 Mock sensors (normal)',
      fn: () => fetch('/api/test-sensors?scenario=normal').then(r => r.json())
    },
    {
      key: 'sensors_dry',
      label: '🏜️ Mock sensors (dry)',
      fn: () => fetch('/api/test-sensors?scenario=dry').then(r => r.json())
    },
    {
      key: 'sensors_saline',
      label: '⚡ Mock sensors (high EC)',
      fn: () => fetch('/api/test-sensors?scenario=saline').then(r => r.json())
    },
    {
      key: 'disease_blight',
      label: '🍅 Mock disease (late blight)',
      fn: () => fetch('/api/test-disease?disease=late_blight').then(r => r.json())
    },
    {
      key: 'disease_healthy',
      label: '✅ Mock disease (healthy)',
      fn: () => fetch('/api/test-disease?disease=healthy').then(r => r.json())
    },
    {
      key: 'land_advice',
      label: '🗺️ Land advice (Rabat coords)',
      fn: () => fetch('/api/land-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: 34.0209, lng: -6.8416,
          sensorData: { moisture:62, ec:1.8, ph:6.8, soilTemp:21 }
        })
      }).then(r => r.json())
    },
    {
      key: 'chat',
      label: '🤖 Chat (disease question)',
      fn: () => fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'My tomatoes have brown spots. What disease is this and how do I treat it?',
          farmContext: { moisture:72, ec:1.8, ph:6.8, humidity:78 }
        })
      }).then(r => r.json())
    },
  ]

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:24, fontFamily:'sans-serif' }}>
      <h1>🧪 AgroRover Test Dashboard</h1>
      <p style={{ color:'#6b7280', marginBottom:24 }}>
        Test all API endpoints without ESP32 hardware connected.
        When ESP32 is ready, real data will replace mock data automatically.
      </p>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {tests.map(test => (
          <div key={test.key} style={{
            border:'1px solid #e5e7eb', borderRadius:10, overflow:'hidden'
          }}>
            <div style={{
              display:'flex', alignItems:'center',
              justifyContent:'space-between',
              padding:'12px 16px', background:'#f9fafb'
            }}>
              <span style={{ fontWeight:500 }}>{test.label}</span>
              <button
                onClick={() => run(test.key, test.fn)}
                disabled={loading[test.key]}
                style={{
                  padding:'6px 16px', borderRadius:8,
                  border:'none', background:'#1D9E75',
                  color:'#fff', cursor:'pointer', fontSize:13
                }}
              >
                {loading[test.key] ? '...' : 'Run test'}
              </button>
            </div>

            {results[test.key] && (
              <pre style={{
                margin:0, padding:'12px 16px',
                background:'#111827', color:'#d1fae5',
                fontSize:12, overflowX:'auto',
                maxHeight:300, overflowY:'auto'
              }}>
                {JSON.stringify(results[test.key], null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>

      <div style={{
        marginTop:24, padding:16,
        background:'#eff6ff', borderRadius:10,
        fontSize:13, color:'#1e40af'
      }}>
        <strong>When ESP32 is connected:</strong> Replace mock fetch calls with MQTT
        subscription to <code>agrorover/sensors</code> and pass real data to the same APIs.
        No other code changes needed.
      </div>
    </div>
  )
}