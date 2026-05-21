// app/components/MapPicker.js
'use client'
import { useEffect, useRef } from 'react'

export default function MapPicker({ onLocationSelect, selected }) {
  const mapRef      = useRef(null)
  const markerRef   = useRef(null)
  const instanceRef = useRef(null)

useEffect(() => {
    let isMounted = true // 1. Add a mounted flag

    if (instanceRef.current) return

    import('leaflet').then(L => {
      // 2. Abort if the component unmounted while loading, 
      // or if another promise already set the instance
      if (!isMounted || instanceRef.current) return 

      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // 3. Optional safeguard to completely clear the container's internal Leaflet ID 
      // before attempting to initialize it again
      const container = L.DomUtil.get(mapRef.current)
      if (container != null) {
        container._leaflet_id = null
      }

      const map = L.map(mapRef.current).setView([34.02, -6.84], 12)
      instanceRef.current = map

      const satellite = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution:'Esri World Imagery', maxZoom:19 }
      )
      const streets = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution:'© OpenStreetMap contributors', maxZoom:19 }
      )

      satellite.addTo(map)
      L.control.layers({ 'Satellite': satellite, 'Street map': streets }).addTo(map)

      const greenIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:32px;height:32px;background:#1D9E75;
          border:3px solid #fff;border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 2px 8px rgba(0,0,0,0.3)">
        </div>`,
        iconSize:   [32, 32],
        iconAnchor: [16, 32],
      })

      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        if (markerRef.current) markerRef.current.remove()

        markerRef.current = L.marker([lat, lng], { icon: greenIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-size:13px;padding:4px;">
              <strong>📍 Selected location</strong><br/>
              Lat: ${lat.toFixed(5)}<br/>
              Lng: ${lng.toFixed(5)}<br/>
              <em style="color:#6b7280;font-size:11px;">Fetching data...</em>
            </div>
          `)
          .openPopup()

        onLocationSelect({ lat, lng })
      })
    })

    const link = document.createElement('link')
    link.rel  = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    return () => {
      isMounted = false // 4. Mark as unmounted during React cleanup
      if (instanceRef.current) {
        instanceRef.current.remove()
        instanceRef.current = null
      }
    }
  }, []) // Empty dependency array is correct here

  return (
    <div style={{ position:'relative', height:'100%' }}>
      <div ref={mapRef} style={{ height:'100%', width:'100%' }} />
      <div style={{
        position:  'absolute', bottom:20, left:'50%',
        transform: 'translateX(-50%)',
        background:'rgba(0,0,0,0.65)', color:'#fff',
        padding:   '6px 14px', borderRadius:100,
        fontSize:  12, pointerEvents:'none', zIndex:1000,
        backdropFilter:'blur(4px)'
      }}>
        🖱️ Click anywhere to analyze land
      </div>
    </div>
  )
}