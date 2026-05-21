'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import mqtt from 'mqtt'
import styles from './map.module.css';

// Leaflet must be imported dynamically (no SSR) — it uses window context objects
const MapComponent = dynamic(() => import('../components/MapPicker'), { ssr: false })

export default function MapPage() {
  const [selected,    setSelected]   = useState(null)   // {lat, lng}
  const [landData,    setLandData]   = useState(null)
  const [loading,     setLoading]    = useState(false)
  const [sensorData,  setSensorData] = useState(null)
  const [activeTab,   setActiveTab]  = useState('crops') // crops | advice | soil | weather
  const [connected,   setConnected]  = useState(false)

  // Use a mutable ref to store live telemetry frames safely.
  // This avoids passing sensorData to handleLocationSelect's dependency array,
  // preventing unnecessary function recreations every time a value drops.
  const liveSensorRef = useRef(null)

  // Establish stable real-time secure MQTT stream connections to HiveMQ Cloud
  useEffect(() => {
    const brokerUrl = "wss://c6b41c2d6ad04ee5845a6583f17b738d.s1.eu.hivemq.cloud:8884/mqtt"
    
    const client = mqtt.connect(brokerUrl, {
      username: "agrorover",
      password: "AgroRover2026!",
      clientId: "agrorover-map-" + Math.random().toString(16).substring(2, 10),
    })

    client.on('connect', () => {
      setConnected(true)
      client.subscribe('agrorover/sensors')
    })

    client.on('message', (topic, payload) => {
      if (topic === 'agrorover/sensors') {
        try {
          const json = JSON.parse(payload.toString())
          const mappedData = {
            moisture:  json.soilMoisture,
            ec:        1.8,                  // Hardware placeholder frame estimate
            ph:        null,                 // Pulls through the external Land API service pipeline
            soilTemp:  json.temperature,     // Proxy air ambient metrics context
            note:      'live'
          }
          setSensorData(mappedData)
          liveSensorRef.current = mappedData
        } catch (err) {
          console.error('Failed to translate inbound maps MQTT frame payload:', err)
        }
      }
    })

    client.on('close', () => {
      setConnected(false)
    })

    return () => {
      if (client) client.end()
    }
  }, [])

  // Location selector processing callback wrapper
  const handleLocationSelect = useCallback(async ({ lat, lng }) => {
    setSelected({ lat, lng })
    setLandData(null)
    setLoading(true)

    try {
      const res = await fetch('/api/land-advice', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lng,
          sensorData: liveSensorRef.current, // Always pulls the absolute latest live state evaluation
          diseases: []                       
        })
      })
      const data = await res.json()
      setLandData(data)
    } catch {
      alert('Failed to calculate spatial land classification details.')
    } finally {
      setLoading(false)
    }
  }, []) // Dependency array is completely clean now, ensuring optimal rendering speed!

  return (
    <div style={{ display:'flex', height:'100vh', fontFamily:'var(--font-sans)' }}>

      {/* ── Left side control configuration panel ── */}
      <div style={{
        width:      420,
        overflowY:  'auto',
        borderRight:'0.5px solid #e5e7eb',
        display:    'flex',
        flexDirection: 'column'
      }}>
        {/* Panel Layout Header */}
        <div style={{ padding:'16px', borderBottom:'0.5px solid #e5e7eb' }}>
          <h2 style={{ fontSize:16, fontWeight:600, margin:0 }}>
            🗺️ Land Advisor
          </h2>
          <p style={{ fontSize:12, color:'#6b7280', margin:'4px 0 0' }}>
            Click anywhere on the map to analyze soil, weather, and get crop advice
          </p>
        </div>

        {/* Real-time MQTT Live Pipeline State Indicator Banner */}
        <div style={{
          padding:   '8px 16px',
          background: connected ? '#f0fdf4' : '#fef9ec',
          borderBottom: '0.5px solid #e5e7eb',
          fontSize:  12,
          display:   'flex',
          gap:       12,
          flexWrap:  'wrap',
          alignItems: 'center'
        }}>
          {sensorData ? (
            <>
              <span style={{ color:'#085041', fontWeight: 500 }}>
                💧 Moisture: {sensorData.moisture}%
              </span>
              <span style={{ color:'#085041', fontWeight: 500 }}>
                ⚡ EC: {sensorData.ec} dS/m
              </span>
              <span style={{ color:'#085041', fontWeight: 500 }}>
                🧪 pH: {sensorData.ph || '—'}
              </span>
              <span style={{ color: '#1D9E75', marginLeft: 'auto', fontSize: 11 }}>
                ● Live (MQTT)
              </span>
            </>
          ) : (
            <span style={{ color:'#854F0B' }}>
              {connected ? '⏳ Awaiting live rover telemetry stream...' : '⚠️ HiveMQ Server Offline'}
            </span>
          )}
        </div>

        {!selected && (
          <div style={{
            flex:1, display:'flex', alignItems:'center',
            justifyContent:'center', flexDirection:'column',
            gap:12, padding:24, color:'#9ca3af', textAlign:'center'
          }}>
            <div style={{ fontSize:48 }}>📍</div>
            <div style={{ fontSize:14 }}>
              Click on the map to select your land location
            </div>
            <div style={{ fontSize:12 }}>
              You&apos;ll get soil type, weather data, crop compatibility scores, and AI advice
            </div>
          </div>
        )}

        {loading && (
          <div style={{
            flex:1, display:'flex', alignItems:'center',
            justifyContent:'center', flexDirection:'column', gap:12
          }}>
            <div style={{
              width:32, height:32, border:'3px solid #e5e7eb',
              borderTop:'3px solid #1D9E75', borderRadius:'50%',
              animation:'spin 0.8s linear infinite'
            }}/>
            <div style={{ fontSize:13, color:'#6b7280' }}>
              Fetching soil and weather data...
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {landData && !loading && (
          <div style={{ flex:1, display:'flex', flexDirection:'column' }}>

            {/* Selection Navigation Sub-Tabs */}
            <div style={{
              display:'flex', borderBottom:'0.5px solid #e5e7eb'
            }}>
              {['crops','advice','soil','weather'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{
                    flex:1, padding:'10px 4px',
                    fontSize:12, fontWeight:500,
                    border:'none', cursor:'pointer',
                    borderBottom: activeTab===tab ? '2px solid #1D9E75' : '2px solid transparent',
                    color:        activeTab===tab ? '#1D9E75' : '#6b7280',
                    background:   'transparent',
                    textTransform: 'capitalize'
                  }}>
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ padding:16, flex:1, overflowY:'auto' }}>

              {/* CROPS TAB COMPONENT */}
              {activeTab === 'crops' && (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ fontSize:13, color:'#6b7280', marginBottom:4 }}>
                    Scored for your exact location, soil, and weather
                  </div>
                  {landData.crops?.map(crop => (
                    <div key={crop.name} style={{
                      border:       '0.5px solid #e5e7eb',
                      borderRadius: 10,
                      padding:      12,
                      background:   crop.recommended ? '#f0fdf4' : '#fff'
                    }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:20 }}>{crop.emoji}</span>
                          <div>
                            <div style={{ fontSize:13, fontWeight:600 }}>{crop.name}</div>
                            <div style={{ fontSize:11, color:'#6b7280' }}>{crop.notes}</div>
                          </div>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0, marginLeft:8 }}>
                          <div style={{
                            fontSize:11, fontWeight:600, padding:'2px 8px',
                            borderRadius:100,
                            background:
                              crop.compatibility==='Excellent' ? '#dcfce7' :
                              crop.compatibility==='Good'      ? '#e0f2fe' :
                              crop.compatibility==='Fair'      ? '#fef9c3' : '#fee2e2',
                            color:
                              crop.compatibility==='Excellent' ? '#166534' :
                              crop.compatibility==='Good'      ? '#075985' :
                              crop.compatibility==='Fair'      ? '#854d0e' : '#991b1b',
                          }}>
                            {crop.compatibility}
                          </div>
                          <div style={{ fontSize:12, fontWeight:600, color:'#374151', marginTop:2 }}>
                            {crop.score}%
                          </div>
                        </div>
                      </div>

                      {/* Accuracy Score Indicator Progression Bar */}
                      <div style={{
                        height:4, background:'#e5e7eb',
                        borderRadius:100, marginTop:8, overflow:'hidden'
                      }}>
                        <div style={{
                          height:'100%', borderRadius:100,
                          width:`${crop.score}%`,
                          background:
                            crop.score >= 85 ? '#22c55e' :
                            crop.score >= 70 ? '#3b82f6' :
                            crop.score >= 50 ? '#eab308' : '#ef4444',
                          transition:'width 0.5s ease'
                        }}/>
                      </div>

                      {/* Environmental Warnings */}
                      {crop.issues?.length > 0 && (
                        <div style={{ marginTop:6 }}>
                          {crop.issues.map((issue, i) => (
                            <div key={i} style={{
                              fontSize:11, color:'#b45309',
                              display:'flex', gap:4, marginTop:2
                            }}>
                              <span>⚠️</span><span>{issue}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ADVICE TAB COMPONENT */}
              {activeTab === 'advice' && (
                <div>
                  <div style={{
                    background:'#f0fdf4', borderRadius:10,
                    padding:14, fontSize:13, lineHeight:1.7,
                    color:'#111827', whiteSpace:'pre-wrap',
                    border:'0.5px solid #bbf7d0'
                  }}>
                    {landData.advice}
                  </div>
                  <div style={{
                    fontSize:11, color:'#9ca3af',
                    marginTop:8, textAlign:'right'
                  }}>
                    Powered by Llama 3.1 (Groq) · free
                  </div>
                </div>
              )}

              {/* SOIL TAB COMPONENT */}
              {activeTab === 'soil' && (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[
                    { label:'Soil type',     value:landData.soil?.soilType,  icon:'🪨' },
                    { label:'pH',            value:landData.soil?.ph,        icon:'🧪' },
                    { label:'Clay content',  value:`${landData.soil?.clay}%`,icon:'🏺' },
                    { label:'Sand content',  value:`${landData.soil?.sand}%`,icon:'🏖️' },
                    { label:'Organic carbon',value:`${landData.soil?.soc} g/kg`,icon:'🌿'},
                    { label:'Nitrogen',      value:`${landData.soil?.nitrogen} g/kg`,icon:'⚗️'},
                    { label:'Bulk density',  value:`${landData.soil?.density} g/cm³`,icon:'⚖️'},
                  ].map(row => (
                    <div key={row.label} style={{
                      display:'flex', justifyContent:'space-between',
                      alignItems:'center', padding:'10px 12px',
                      background:'#f9fafb', borderRadius:8,
                      border:'0.5px solid #e5e7eb'
                    }}>
                      <span style={{ fontSize:13, color:'#374151' }}>
                        {row.icon} {row.label}
                      </span>
                      <span style={{ fontSize:13, fontWeight:600, color:'#111827' }}>
                        {row.value || '—'}
                      </span>
                    </div>
                  ))}
                  <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>
                    Source: ISRIC SoilGrids 2.0 (250m resolution)
                  </div>
                </div>
              )}

              {/* WEATHER TAB COMPONENT */}
              {activeTab === 'weather' && (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[
                    { label:'Temperature',        value:`${landData.weather?.temperature}°C`,icon:'🌡️' },
                    { label:'Humidity',           value:`${landData.weather?.humidity}%`,    icon:'💧' },
                    { label:'Wind speed',         value:`${landData.weather?.windSpeed} km/h`,icon:'💨'},
                    { label:'Rain (7 days)',       value:`${landData.weather?.rain7d}mm`,     icon:'🌧️' },
                    { label:'Max temp (7d)',       value:`${landData.weather?.tempMax}°C`,    icon:'🔆' },
                    { label:'Min temp (7d)',       value:`${landData.weather?.tempMin}°C`,    icon:'❄️' },
                    { label:'Evapotranspiration', value:`${landData.weather?.evaporation}mm/day`,icon:'☀️'},
                  ].map(row => (
                    <div key={row.label} style={{
                      display:'flex', justifyContent:'space-between',
                      alignItems:'center', padding:'10px 12px',
                      background:'#f9fafb', borderRadius:8,
                      border:'0.5px solid #e5e7eb'
                    }}>
                      <span style={{ fontSize:13, color:'#374151' }}>
                        {row.icon} {row.label}
                      </span>
                      <span style={{ fontSize:13, fontWeight:600, color:'#111827' }}>
                        {row.value || '—'}
                      </span>
                    </div>
                  ))}
                  <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>
                    Source: Open-Meteo (free, no API key)
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* ── Visual Map Rendering Canvas (Right Panel) ── */}
      <div style={{ flex:1, position:'relative' }}>
        <MapComponent onLocationSelect={handleLocationSelect} selected={selected} />
      </div>
    </div>
  )
}