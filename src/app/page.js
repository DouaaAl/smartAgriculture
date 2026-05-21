'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import styles from './page.module.css'
import mqtt from 'mqtt'

export default function Home() {
  const [sensors, setSensors] = useState(null)
  const [mqttConnected, setMqttConnected] = useState(false)

  useEffect(() => {
    // HiveMQ Cloud secure WebSockets URL on port 8884
    const brokerUrl = "wss://c6b41c2d6ad04ee5845a6583f17b738d.s1.eu.hivemq.cloud:8884/mqtt"
    
    const mqttClient = mqtt.connect(brokerUrl, {
      username: "agrorover",
      password: "AgroRover2026!",
      // Unique client ID per browser instance prevents cross-tab disconnect loops
      clientId: "agrorover-web-" + Math.random().toString(16).substring(2, 10),
    })

    mqttClient.on("connect", () => {
      console.log("Connected directly to HiveMQ Cloud!")
      setMqttConnected(true)
      mqttClient.subscribe("agrorover/sensors")
    })

    mqttClient.on("message", (topic, payload) => {
      if (topic === "agrorover/sensors") {
        try {
          const json = JSON.parse(payload.toString())
          setSensors(json)
        } catch (err) {
          console.error("Failed to parse incoming sensor data packet:", err)
        }
      }
    })

    mqttClient.on("close", () => {
      setMqttConnected(false)
    })

    // Clean up connections when the component unmounts
    return () => {
      if (mqttClient) mqttClient.end()
    }
  }, [])

  return (
    <main className={styles.main}>
      <div className={styles.top}>

        {/* Active alerts */}
        <article>
          <div>
            <Image width={20} height={20} alt="alert" src="/icons/danger.png" />
            <span>Active Alerts</span>
          </div>
          <h2>3</h2>
          <span>2 critical, 1 warning</span>
        </article>

        {/* Soil Moisture — LIVE PACKETS FROM HIVEMQ */}
        <article>
          <div>
            <Image width={20} height={20} alt="soil moisture" src="/icons/irrigation.png" />
            <span>Soil Moisture</span>
          </div>
          <h2>{sensors?.soilMoisture !== undefined ? `${sensors.soilMoisture}%` : '—'}</h2>
          <span>
            {mqttConnected 
              ? (sensors ? '🟢 Live connection' : '⏳ Awaiting first update...') 
              : '🔴 Broker offline'}
          </span>
        </article>

        {/* Air temp — LIVE PACKETS FROM HIVEMQ */}
        <article>
          <div>
            <Image width={20} height={20} alt="temperature" src="/icons/temperature.png" />
            <span>Air temp</span>
          </div>
          <h2>{sensors?.temperature !== undefined ? `${sensors.temperature}°C` : '—'}</h2>
          <span>Humidity: {sensors?.humidity !== undefined ? `${sensors.humidity}%` : '—'}</span>
        </article>

      </div>
      
      <div className={styles.mid}>
        <article>
          <header>
            <Image width={30} height={30} alt="camera" src={"/icons/camera.png"} />
            <h3>Disease alerts (ESP32-CAM)</h3>
            <a href="/">View all</a>
          </header>
          
          <section>
            <div>
              <Image alt="blight" width={20} height={20} src={"/icons/blight.png"} />
              <article>
                <h3>Tomato late blight</h3>
                <p>
                  34.0209°N 6.8416°W · Sector 3 · 09:14 AM Tomato · Confidence 94%
                </p>
                <span>Critical</span>
              </article>
            </div>

            <div>
              <Image alt="mildew" width={20} height={20} src={"/icons/mildew.png"} />
              <article>
                <h3>Powdery mildew</h3>
                <p>
                  34.0209°N 6.8416°W · Sector 3 · 09:14 AM Tomato · Confidence 94%
                </p>
                <span>Warning</span>
              </article>
            </div>

            <div>
              <Image alt="mildew" width={20} height={20} src={"/icons/mildew.png"} />
              <article>
                <h3>Corn northern leaf blight</h3>
                <p>
                  34.0209°N 6.8416°W · Sector 3 · 09:14 AM Tomato · Confidence 94%
                </p>
                <span>Critical</span>
              </article>
            </div>
          </section>
        </article>

        <article>
          <header>
            <Image width={30} height={30} alt="solution" src={"/icons/solution.png"} />
            <h3>Recommended solutions</h3>
            <a href="/">For: Tomato late blight</a>
          </header>
          
          <section>
            <div>
              <h4>1</h4>
              <article>
                <h3>Copper-based fungicide spray</h3>
                <p>
                  Apply copper hydroxide 77% WP at 2.5g/L. Best match for clay-loam soil and current humidity ({sensors?.humidity !== undefined ? `${sensors.humidity}%` : '58%'}). Repeat every 7 days.
                </p>
                <span>Best match: soil + weather fit</span>
              </article>
            </div>

            <div>
              <h4>2</h4>
              <article>
                <h3>Remove infected leaves immediately</h3>
                <p>
                  Prune and bag affected foliage before irrigation to prevent spore spread. Combine with fungicide for best results.
                </p>
                <span>Mechanical · use alongside #1</span>
              </article>
            </div>

            <div>
              <h4>3</h4>
              <article>
                <h3>Adjust irrigation schedule</h3>
                <p>
                  Shift watering to early morning only. Avoid overhead irrigation — use drip to reduce leaf wetness and limit blight spread.
                </p>
                <span>Preventive · Pump state: {sensors?.pumpStatus || 'OFF'}</span>
              </article>
            </div>
          </section>
        </article>
      </div>

      <div className={styles.bottom}>
        <article>
          <header>
            <Image src={'/icons/map.png'} width={20} height={20} alt="map" />
            <h3>Field map</h3>
            <a href="/">Open full map</a>
          </header>

          <button type="button">Get land advice</button>
          <span>
            Select area on Google Maps to get soil + weather based crop advice
          </span>
        </article>

        <article>
          <header>
            <Image src={'/icons/chat.png'} width={20} height={20} alt="chat" />
            <h3>AI crop assistant</h3>
          </header>
          <div className={styles.buttons}>
            <button type="button">Ask about your farm</button>
            <button type="button">Ask AI</button>
          </div>
        </article>
      </div>
    </main>
  );
}