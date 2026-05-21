'use client'
import { useState, useEffect } from 'react'

export default function DiagnosticsPage() {
  const [data, setData] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    async function fetchDiagnostic() {
      try {
        const res = await fetch('/api/detect-disease')
        const json = await res.json()
        if (json.diagnostic) setData(json.diagnostic)
        setConnected(true)
      } catch {
        setConnected(false)
      }
    }
    fetchDiagnostic()
    const interval = setInterval(fetchDiagnostic, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main style={{ padding: '2.5rem', width: '95%', margin: '0 auto', fontFamily: 'var(--font-poppins), sans-serif' }}>
      
      {/* Upper Status Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: '#1D9E75', fontSize: '1.8rem', fontWeight: '600', margin: 0 }}>🔬 Live Vision Diagnostics</h1>
          <p style={{ fontSize: '0.9rem', color: 'gray', marginTop: '0.3rem' }}>
            Real-time inference tracking linked directly to the AgroRover ESP32-CAM module.
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem',
          background: 'white', padding: '0.5rem 1rem', borderRadius: '15px',
          boxShadow: '0px 2px 4px rgba(0,0,0,0.05)', color: connected ? '#1D9E75' : '#dc2626', fontWeight: '600'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: connected ? '#1D9E75' : '#dc2626', display: 'inline-block' }}></span>
          {connected ? 'ESP32 Camera Stream Live' : 'Connecting to Server...'}
        </div>
      </div>

      {!data ? (
        <div style={{ background: 'white', padding: '3rem', borderRadius: '15px', textAlign: 'center', color: 'gray', border: '2px dashed #d1d5db' }}>
          ⏳ Waiting for initial frame transmission from ESP32-CAM payload engine...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', gap: '2rem', alignItems: 'start' }}>
          
          {/* Left Column - Image Section */}
          <article style={{ background: 'white', borderRadius: '15px', padding: '1.5rem', boxShadow: '0px 4px 10px rgba(0,0,0,0.02)' }}>
            <h3 style={{ color: '#1D9E75', fontSize: '1rem', marginBottom: '1rem', fontWeight: '600' }}>📸 Latest Capture Feed</h3>
            <div style={{ width: '100%', position: 'relative', background: '#0f0f11', borderRadius: '10px', overflow: 'hidden' }}>
              <img src={data.imageSrc} alt="ESP32 Frame Stream" style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '400px', objectFit: 'contain' }} />
              <span style={{
                position: 'absolute', top: '12px', left: '12px', padding: '0.4rem 0.8rem',
                borderRadius: '10px', fontSize: '0.75rem', fontWeight: '700', color: 'white',
                background: data.status === 'Sick' ? '#ef4444' : data.status === 'Warning' ? '#f59e0b' : '#10b981', textTransform: 'uppercase'
              }}>
                {data.status}
              </span>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'gray' }}>
              <span><b>Target Node:</b> Camera_Node_01</span>
              <span><b>Captured:</b> {data.timestamp}</span>
            </div>
          </article>

          {/* Right Column - System Solutions Layout */}
          <article style={{ background: 'white', borderRadius: '15px', padding: '2rem', boxShadow: '0px 4px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ borderBottom: '1px solid #F5F4ED', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'gray', fontWeight: '600' }}>Inference Classification Result</span>
              <h2 style={{ fontSize: '1.8rem', color: data.status === 'Sick' ? '#991b1b' : '#1D9E75', margin: '0.2rem 0 0.5rem 0', fontWeight: '700' }}>
                {data.condition}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'gray', margin: 0 }}>
                <b>Model Assessment Context:</b> <span style={{ color: data.status === 'Sick' ? '#dc2626' : '#10b981', fontWeight: '600' }}>{data.severity}</span>
              </p>
            </div>

            {/* Parallel Live MQTT Telemetry Component Data Visualizer */}
            {data.sensors && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem', background: '#F5F4ED', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'gray', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>Soil Moisture</span>
                  <strong style={{ fontSize: '1.1rem', color: '#1D9E75' }}>{data.sensors.soilMoisture}%</strong>
                </div>
                <div style={{ textAlign: 'center', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '0.7rem', color: 'gray', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>Temperature</span>
                  <strong style={{ fontSize: '1.1rem', color: '#374151' }}>{data.sensors.temperature}°C</strong>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'gray', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>Humidity</span>
                  <strong style={{ fontSize: '1.1rem', color: '#374151' }}>{data.sensors.humidity}%</strong>
                </div>
              </div>
            )}

            <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '1rem', textTransform: 'uppercase' }}>
              🌱 Recommended AgroRover Countermeasures:
            </h3>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.solutions.map((solution, index) => (
                <div key={index} style={{
                  display: 'flex', gap: '1.2rem', alignItems: 'flex-start',
                  background: '#F5F4ED', padding: '1rem', borderRadius: '12px',
                  borderLeft: data.status === 'Sick' ? '4px solid #ef4444' : data.status === 'Warning' ? '4px solid #f59e0b' : '4px solid #1D9E75'
                }}>
                  <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: data.status === 'Sick' ? '#fecaca' : '#d1fae5',
                    color: data.status === 'Sick' ? '#dc2626' : '#059669',
                    fontSize: '0.75rem', fontWeight: '700', flexShrink: 0
                  }}>
                    {index + 1}
                  </span>
                  <p style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: '1.6', margin: 0 }}>
                    {solution}
                  </p>
                </div>
              ))}
            </section>
          </article>

        </div>
      )}
    </main>
  )
}