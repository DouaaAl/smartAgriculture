'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import styles from './monitering.module.css'
import mqtt from 'mqtt'

export default function MonitoringPage() {
  // Live sensor state
  const [sensors, setSensors]       = useState(null)
  const [connected, setConnected]   = useState(false)
  const [alerts, setAlerts]         = useState([])
  const [mqttClientInstance, setMqttClientInstance] = useState(null)

  // Irrigation mode control
  const [activeMode, setActiveMode]   = useState('manual') // 'auto' | 'scheduled' | 'manual'
  const [appliedMode, setAppliedMode] = useState('manual')
  const [pumpStatus, setPumpStatus]   = useState('OFF')

  // Scheduled mode state
  const [schedules, setSchedules]   = useState([])
  const [newSchedule, setNewSchedule] = useState('')

  // Auto mode threshold setting
  const [autoThreshold, setAutoThreshold] = useState(30) // irrigate when soil < 30%

  // Compute Alerts based on active payload metadata
  function computeAlerts(data) {
    const newAlerts = []
    if (data.soilMoisture !== undefined && data.soilMoisture < 25) {
      newAlerts.push({ level: 'critical', msg: `Soil moisture critical: ${data.soilMoisture}%` })
    }
    if (data.soilMoisture !== undefined && data.soilMoisture > 85) {
      newAlerts.push({ level: 'warning',  msg: `Soil moisture too high: ${data.soilMoisture}%` })
    }
    if (data.temperature !== undefined && data.temperature > 38) {
      newAlerts.push({ level: 'warning',  msg: `High temperature: ${data.temperature}°C` })
    }
    if (data.waterLevel !== undefined && data.waterLevel < 15) {
      newAlerts.push({ level: 'critical', msg: `Water tank low: ${data.waterLevel}%` })
    }
    setAlerts(newAlerts)
  }

  // Publish direct JSON payload over HiveMQ Broker to toggle the ESP8266 relay pin
  const sendPumpCommand = (cmd) => {
    if (!mqttClientInstance || !connected) {
      alert('Cannot send command. MQTT broker client is currently offline.')
      return
    }

    const payload = JSON.stringify({ command: cmd })
    mqttClientInstance.publish('agrorover/relay', payload, { qos: 1, retain: true })
    setPumpStatus(cmd)
    console.log(`[MQTT OUT] Published to agrorover/relay: ${payload}`)
  }

  // Initialize secure client WebSockets connection to HiveMQ
  useEffect(() => {
    const brokerUrl = "wss://c6b41c2d6ad04ee5845a6583f17b738d.s1.eu.hivemq.cloud:8884/mqtt"
    
    const client = mqtt.connect(brokerUrl, {
      username: "agrorover",
      password: "AgroRover2026!",
      clientId: "agrorover-monitor-" + Math.random().toString(16).substring(2, 10),
    })

    client.on('connect', () => {
      console.log('Monitoring space connected safely to HiveMQ Broker!')
      setConnected(true)
      client.subscribe('agrorover/sensors')
    })

    client.on('message', (topic, payload) => {
      if (topic === 'agrorover/sensors') {
        try {
          const json = JSON.parse(payload.toString())
          setSensors(json)
          if (json.pumpStatus) setPumpStatus(json.pumpStatus)
          computeAlerts(json)
        } catch (err) {
          console.error('Failed to parse monitoring telemetry frame:', err)
        }
      }
    })

    client.on('close', () => {
      setConnected(false)
    })

    setMqttClientInstance(client)

    return () => {
      if (client) client.end()
    }
  }, [])

  // Auto-mode logical pipeline execution loops
  useEffect(() => {
    if (appliedMode !== 'auto' || !sensors || sensors.soilMoisture === undefined) return
    
    const shouldIrrigate = sensors.soilMoisture < autoThreshold
    if (shouldIrrigate && pumpStatus === 'OFF') {
      sendPumpCommand('ON')
    } else if (!shouldIrrigate && pumpStatus === 'ON') {
      sendPumpCommand('OFF')
    }
  }, [sensors, appliedMode, autoThreshold, pumpStatus])

  // Scheduled mode chronometer lookup logic loop
  useEffect(() => {
    if (appliedMode !== 'scheduled' || schedules.length === 0) return

    const check = setInterval(() => {
      const now = new Date()
      const matches = schedules.some(s => {
        const d = new Date(s)
        return Math.abs(d - now) < 60000 // Match accurately inside a 1-minute time block window
      })
      if (matches && pumpStatus === 'OFF') {
        sendPumpCommand('ON')
      }
    }, 30000)

    return () => clearInterval(check)
  }, [appliedMode, schedules, pumpStatus])

  function addSchedule() {
    if (newSchedule) {
      setSchedules(prev => [...prev, newSchedule])
      setNewSchedule('')
    }
  }

  function removeSchedule(i) {
    setSchedules(prev => prev.filter((_, idx) => idx !== i))
  }

  return (
    <div className={styles.monitoring}>
      <h1>
        Monitoring
        <span style={{
          fontSize: 12, fontWeight: 400, marginLeft: 12,
          color: connected ? '#1D9E75' : '#ef4444'
        }}>
          {connected ? '● Live (HiveMQ Cloud)' : '○ Connection Offline'}
        </span>
      </h1>

      {/* ── Sensor values dashboard card layouts ── */}
      <section style={{ marginTop: '1.5rem' }}>
        <h3>Environment Data:</h3>
        <div className={styles.top}>

          <article>
            <div>
              <Image width={20} height={20} alt="alert" src="/icons/danger.png" />
              <span>Active Alerts</span>
            </div>
            <h2>{alerts.length}</h2>
            <span>{alerts.map(a => a.msg).join(' · ') || 'All systems optimal'}</span>
          </article>

          <article>
            <div>
              <Image width={20} height={20} alt="soil" src="/icons/irrigation.png" />
              <span>Soil Moisture</span>
            </div>
            <h2>{sensors?.soilMoisture !== undefined ? `${sensors.soilMoisture}%` : '—'}</h2>
            <span>
              {sensors?.soilMoisture !== undefined
                ? sensors.soilMoisture < 30 ? 'Needs irrigation'
                  : sensors.soilMoisture > 80 ? 'Over-saturated'
                  : 'Optimal range'
                : 'Awaiting device telemetry'}
            </span>
          </article>

          <article>
            <div>
              <Image width={20} height={20} alt="temperature" src="/icons/temperature.png" />
              <span>Air Temp</span>
            </div>
            <h2>{sensors?.temperature !== undefined ? `${sensors.temperature}°C` : '—'}</h2>
            <span>Ambient conditions</span>
          </article>

          <article>
            <div>
              <Image width={20} height={20} alt="humidity" src="/icons/irrigation.png" />
              <span>Humidity</span>
            </div>
            <h2>{sensors?.humidity !== undefined ? `${sensors.humidity}%` : '—'}</h2>
            <span>Air saturation</span>
          </article>

          <article>
            <div>
              <Image width={20} height={20} alt="water" src="/icons/irrigation.png" />
              <span>Water Level</span>
            </div>
            <h2>{sensors?.waterLevel !== undefined ? `${sensors.waterLevel}%` : '—'}</h2>
            <span>Reservoir space</span>
          </article>

        </div>
      </section>
      <br />

      {/* ── Pump state message banner ── */}
      <div style={{
        padding: '12px 16px',
        background: pumpStatus === 'ON' ? '#dcfce7' : '#f3f4f6',
        border: pumpStatus === 'ON' ? '1px solid #1D9E75' : '1px solid #e5e7eb',
        borderRadius: 8, marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 12, fontSize: 14
      }}>
        <span>{pumpStatus === 'ON' ? '💧 Pump Status: RUNNING' : '⏸️ Pump Status: STOPPED'}</span>
        <span style={{ color: '#6b7280' }}>· Mode Active Context: {appliedMode.toUpperCase()}</span>
      </div>

      {/* ── Irrigation control space ── */}
      <section>
        <h3>Irrigation Control:</h3>
        <div className={styles.bottom}>

          {/* Mode 1: Automatic Automation Block */}
          <article style={{
            border: activeMode === 'auto' ? '2px solid #1D9E75' : '1px solid #e5e7eb',
            borderRadius: 10, padding: 16, backgroundColor: 'white'
          }}>
            <h3>🤖 Automatic Irrigation</h3>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 12px' }}>
              Triggers the physical rover pump automatically when moisture values fall beneath the designated slider threshold.
            </p>
            <label style={{ fontSize: 13, display: 'block' }}>
              Target Threshold: <strong>{autoThreshold}%</strong>
              <input
                type="range" min={10} max={60} value={autoThreshold}
                onChange={e => setAutoThreshold(+e.target.value)}
                style={{ width: '100%', marginTop: 8 }}
              />
            </label>
            <button
              type="button"
              className={styles.apply}
              onClick={() => { setActiveMode('auto'); setAppliedMode('auto') }}
              style={{ width: '100%', marginTop: '12px', padding: '6px 0', cursor: 'pointer' }}
            >
              {appliedMode === 'auto' ? '✓ Auto Active' : 'Apply Auto Mode'}
            </button>
          </article>

          {/* Mode 2: Scheduled Automation Block */}
          <article style={{
            border: activeMode === 'scheduled' ? '2px solid #1D9E75' : '1px solid #e5e7eb',
            borderRadius: 10, padding: 16, backgroundColor: 'white'
          }}>
            <h3>📅 Scheduled Irrigation</h3>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 8px' }}>
              Triggers pump activation sequentially at precise localized schedule dates.
            </p>
            <h4>Target Windows:</h4>
            <div className={styles.timeline} style={{ maxHeight: '80px', overflowY: 'auto', margin: '6px 0' }}>
              {schedules.length === 0
                ? <p style={{ fontSize: 12, color: '#9ca3af' }}>No execution schedules mapped</p>
                : schedules.map((s, i) => (
                  <p key={i} style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>{s.replace('T', ' ')}</span>
                    <button type="button" onClick={() => removeSchedule(i)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>Delete</button>
                  </p>
                ))
              }
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                type="datetime-local"
                value={newSchedule}
                onChange={e => setNewSchedule(e.target.value)}
                style={{ padding: '4px', fontSize: 12 }}
              />
              <button type="button" onClick={addSchedule} style={{ padding: '0 8px' }}>Add</button>
            </div>
            <button
              type="button"
              className={styles.apply}
              onClick={() => { setActiveMode('scheduled'); setAppliedMode('scheduled') }}
              style={{ width: '100%', marginTop: 12, padding: '6px 0', cursor: 'pointer' }}
            >
              {appliedMode === 'scheduled' ? '✓ Schedule Active' : 'Apply Schedule Mode'}
            </button>
          </article>

          {/* Mode 3: Manual Automation Block */}
          <article style={{
            border: activeMode === 'manual' ? '2px solid #1D9E75' : '1px solid #e5e7eb',
            borderRadius: 10, padding: 16, backgroundColor: 'white'
          }}>
            <h3>🎛️ Manual Override</h3>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 12px' }}>
              Bypasses background calculations to hand total relay operation command power directly back to you.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className={styles.irrigate}
                onClick={() => sendPumpCommand('ON')}
                disabled={appliedMode !== 'manual' || pumpStatus === 'ON'}
                style={{ flex: 1, padding: '8px 0', cursor: 'pointer' }}
              >
                💧 Turn ON
              </button>
              <button
                type="button"
                onClick={() => sendPumpCommand('OFF')}
                disabled={appliedMode !== 'manual' || pumpStatus === 'OFF'}
                style={{ flex: 1, padding: '8px 0', cursor: 'pointer' }}
              >
                ⏹ Turn OFF
              </button>
            </div>
            <button
              type="button"
              style={{ width: '100%', marginTop: 12, padding: '6px 0', cursor: 'pointer' }}
              className={styles.apply}
              onClick={() => { setActiveMode('manual'); setAppliedMode('manual') }}
            >
              {appliedMode === 'manual' ? '✓ Manual Control Active' : 'Set to Manual Control'}
            </button>
          </article>

        </div>
      </section>
    </div>
  )
}