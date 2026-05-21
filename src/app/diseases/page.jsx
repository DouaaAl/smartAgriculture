// app/diseases/page.js
'use client'
import { useState, useEffect } from 'react'

// ── Disease knowledge base ────────────────────────────────────
// Used to enrich detections with causes, symptoms, and solutions
const DISEASE_DB = {
  'Tomato late blight': {
    pathogen:  'Phytophthora infestans (fungus-like)',
    severity:  'critical',
    emoji:     '🍅',
    color:     '#dc2626',
    symptoms:  'Dark brown water-soaked lesions on leaves and stems. White mold on leaf undersides in humid conditions. Fruit turns dark brown.',
    causes:    'High humidity (>80%), cool temperatures (10–20°C), wet conditions. Spreads rapidly via wind and water.',
    solutions: [
      {
        rank:    1,
        name:    'Copper-based fungicide',
        detail:  'Apply copper hydroxide 77% WP at 2.5g/L water. Spray every 7 days. Best for clay-loam soil and humidity >60%.',
        type:    'chemical',
        timing:  'Immediately',
        bestFor: ['high_humidity', 'clay_loam', 'outdoor']
      },
      {
        rank:    2,
        name:    'Remove infected plant parts',
        detail:  'Prune all affected leaves and stems. Bag and remove — do not compost. Disinfect pruning tools with bleach solution.',
        type:    'mechanical',
        timing:  'Immediately',
        bestFor: ['any']
      },
      {
        rank:    3,
        name:    'Adjust irrigation to drip only',
        detail:  'Switch from overhead to drip irrigation. Water early morning only. Wet leaves accelerate blight spread.',
        type:    'cultural',
        timing:  'This week',
        bestFor: ['high_moisture', 'any']
      },
      {
        rank:    4,
        name:    'Mancozeb fungicide',
        detail:  'Apply Mancozeb 80% WP at 2g/L as preventive treatment on healthy plants nearby.',
        type:    'chemical',
        timing:  'Preventive',
        bestFor: ['preventive']
      }
    ],
    prevention: 'Use resistant varieties. Maintain good air circulation. Avoid overhead irrigation. Apply preventive copper spray at first sign of humid weather.',
  },
  'Tomato early blight': {
    pathogen:  'Alternaria solani (fungus)',
    severity:  'warning',
    emoji:     '🍅',
    color:     '#f97316',
    symptoms:  'Dark brown spots with yellow rings (target-board pattern) on lower leaves first. Leaves yellow and drop.',
    causes:    'Warm temperatures (24–29°C), high humidity, wet foliage, plant stress.',
    solutions: [
      {
        rank:    1,
        name:    'Chlorothalonil or Mancozeb spray',
        detail:  'Apply at 2g/L every 7–10 days. Start from bottom leaves upward.',
        type:    'chemical',
        timing:  'Immediately',
        bestFor: ['any']
      },
      {
        rank:    2,
        name:    'Remove lower infected leaves',
        detail:  'Remove leaves touching soil. Improves air flow and reduces spore source.',
        type:    'mechanical',
        timing:  'Immediately',
        bestFor: ['any']
      },
      {
        rank:    3,
        name:    'Mulch around plant base',
        detail:  'Apply 5cm straw or organic mulch to prevent soil spores splashing onto leaves.',
        type:    'cultural',
        timing:  'This week',
        bestFor: ['any']
      }
    ],
    prevention: 'Rotate crops every 2–3 years. Remove crop debris. Use certified disease-free seeds.',
  },
  'Powdery mildew': {
    pathogen:  'Various Erysiphales (fungi)',
    severity:  'warning',
    emoji:     '🌿',
    color:     '#8b5cf6',
    symptoms:  'White powdery coating on leaf surface. Leaves curl and yellow. Affects young growth first.',
    causes:    'Warm dry days + cool humid nights. Poor air circulation. Dense planting.',
    solutions: [
      {
        rank:    1,
        name:    'Sulfur-based fungicide',
        detail:  'Apply wettable sulfur 80% at 2g/L. Very effective against powdery mildew. Do not apply above 32°C.',
        type:    'chemical',
        timing:  'Immediately',
        bestFor: ['any']
      },
      {
        rank:    2,
        name:    'Neem oil spray',
        detail:  'Mix 5ml neem oil + 2ml dish soap per 1L water. Spray every 7 days. Organic option.',
        type:    'organic',
        timing:  'Immediately',
        bestFor: ['organic', 'low_severity']
      },
      {
        rank:    3,
        name:    'Baking soda spray',
        detail:  '1 tbsp baking soda + 1 tsp dish soap per 1L water. Budget home remedy for early stages.',
        type:    'organic',
        timing:  'Early stage only',
        bestFor: ['early_stage', 'low_budget']
      },
      {
        rank:    4,
        name:    'Improve air circulation',
        detail:  'Prune dense foliage. Increase plant spacing. Avoid nitrogen over-fertilization.',
        type:    'cultural',
        timing:  'This week',
        bestFor: ['any']
      }
    ],
    prevention: 'Choose resistant varieties. Avoid dense planting. Keep foliage dry.',
  },
  'Corn northern leaf blight': {
    pathogen:  'Exserohilum turcicum (fungus)',
    severity:  'critical',
    emoji:     '🌽',
    color:     '#dc2626',
    symptoms:  'Long cigar-shaped gray-green lesions (up to 15cm). Lesions turn tan with dark borders.',
    causes:    'Moderate temperatures (18–27°C), high humidity, prolonged leaf wetness.',
    solutions: [
      {
        rank:    1,
        name:    'Propiconazole fungicide',
        detail:  'Apply at silking stage. Most effective systemic fungicide for northern leaf blight.',
        type:    'chemical',
        timing:  'At silking',
        bestFor: ['any']
      },
      {
        rank:    2,
        name:    'Remove heavily infected leaves',
        detail:  'Reduce inoculum load. Especially important near crop edges where spread starts.',
        type:    'mechanical',
        timing:  'Immediately',
        bestFor: ['any']
      }
    ],
    prevention: 'Plant resistant hybrids. Rotate with non-host crops. Till crop debris after harvest.',
  },
  'Healthy': {
    pathogen:  'None',
    severity:  'healthy',
    emoji:     '✅',
    color:     '#16a34a',
    symptoms:  'No disease symptoms detected. Plant appears healthy.',
    causes:    'N/A',
    solutions: [],
    prevention: 'Continue current care routine. Monitor regularly.',
  }
}

// ── Severity config ───────────────────────────────────────────
const SEVERITY = {
  critical: { label:'Critical', bg:'#fef2f2', border:'#fecaca', text:'#dc2626', dot:'#dc2626' },
  warning:  { label:'Warning',  bg:'#fffbeb', border:'#fed7aa', text:'#d97706', dot:'#f59e0b' },
  healthy:  { label:'Healthy',  bg:'#f0fdf4', border:'#bbf7d0', text:'#16a34a', dot:'#16a34a' },
}

const SOLUTION_TYPE_COLORS = {
  chemical:   { bg:'#eff6ff', text:'#1d4ed8' },
  organic:    { bg:'#f0fdf4', text:'#16a34a' },
  mechanical: { bg:'#faf5ff', text:'#7c3aed' },
  cultural:   { bg:'#fefce8', text:'#854d0e' },
}

// ── Main page ─────────────────────────────────────────────────
export default function DiseasesPage() {
  const [alerts,     setAlerts]     = useState([])
  const [selected,   setSelected]   = useState(null)
  const [filter,     setFilter]     = useState('all')   // all | critical | warning | healthy
  const [loading,    setLoading]    = useState(false)
  const [sensorData, setSensorData] = useState(null)
  const [showAddForm,setShowAddForm] = useState(false)

  // Load mock alerts on mount
  useEffect(() => {
    loadMockAlerts()
    fetch('/api/test-sensors?scenario=normal')
      .then(r => r.json()).then(setSensorData)
  }, [])

  function loadMockAlerts() {
    const mock = [
      {
        id:         1,
        disease:    'Tomato late blight',
        confidence: 94.2,
        plant:      'Tomato',
        sector:     'Sector 3',
        lat:        34.0209,
        lng:        -6.8416,
        timestamp:  new Date(Date.now() - 25 * 60000).toISOString(),
        imageUrl:   null,
        source:     'esp32cam-mock',
        resolved:   false,
      },
      {
        id:         2,
        disease:    'Powdery mildew',
        confidence: 88.7,
        plant:      'Pepper',
        sector:     'Sector 5',
        lat:        34.0198,
        lng:        -6.8421,
        timestamp:  new Date(Date.now() - 90 * 60000).toISOString(),
        imageUrl:   null,
        source:     'esp32cam-mock',
        resolved:   false,
      },
      {
        id:         3,
        disease:    'Corn northern leaf blight',
        confidence: 91.3,
        plant:      'Corn',
        sector:     'Sector 1',
        lat:        34.0214,
        lng:        -6.8409,
        timestamp:  new Date(Date.now() - 150 * 60000).toISOString(),
        imageUrl:   null,
        source:     'esp32cam-mock',
        resolved:   false,
      },
      {
        id:         4,
        disease:    'Healthy',
        confidence: 97.1,
        plant:      'Tomato',
        sector:     'Sector 2',
        lat:        34.0201,
        lng:        -6.8430,
        timestamp:  new Date(Date.now() - 200 * 60000).toISOString(),
        imageUrl:   null,
        source:     'esp32cam-mock',
        resolved:   true,
      },
    ]
    setAlerts(mock)
    setSelected(mock[0])
  }

  async function fetchLiveAlert() {
    setLoading(true)
    try {
      const res  = await fetch('/api/test-disease?disease=late_blight')
      const data = await res.json()
      const newAlert = {
        id:         Date.now(),
        disease:    data.disease,
        confidence: data.confidence,
        plant:      data.plant,
        sector:     'Live scan',
        lat:        data.lat,
        lng:        data.lng,
        timestamp:  new Date().toISOString(),
        imageUrl:   null,
        source:     'esp32cam-mock',
        resolved:   false,
      }
      setAlerts(prev => [newAlert, ...prev])
      setSelected(newAlert)
    } finally {
      setLoading(false)
    }
  }

  function markResolved(id) {
    setAlerts(prev =>
      prev.map(a => a.id === id ? { ...a, resolved: true } : a)
    )
    if (selected?.id === id) setSelected(prev => ({ ...prev, resolved: true }))
  }

  function deleteAlert(id) {
    setAlerts(prev => prev.filter(a => a.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  // Filter alerts
  const filtered = alerts.filter(a => {
    if (filter === 'all')      return true
    const info = DISEASE_DB[a.disease]
    if (filter === 'critical') return info?.severity === 'critical'
    if (filter === 'warning')  return info?.severity === 'warning'
    if (filter === 'healthy')  return info?.severity === 'healthy'
    if (filter === 'active')   return !a.resolved
    return true
  })

  const counts = {
    all:      alerts.length,
    critical: alerts.filter(a => DISEASE_DB[a.disease]?.severity === 'critical').length,
    warning:  alerts.filter(a => DISEASE_DB[a.disease]?.severity === 'warning').length,
    healthy:  alerts.filter(a => DISEASE_DB[a.disease]?.severity === 'healthy').length,
    active:   alerts.filter(a => !a.resolved).length,
  }

  const selectedInfo = selected ? DISEASE_DB[selected.disease] : null
  const sev          = selectedInfo ? SEVERITY[selectedInfo.severity] : null

  function timeAgo(ts) {
    const mins = Math.floor((Date.now() - new Date(ts)) / 60000)
    if (mins < 1)  return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)  return `${hrs}h ago`
    return `${Math.floor(hrs/24)}d ago`
  }

  return (
    <div style={{
      display:       'flex',
      height:        'calc(100vh - 48px)',
      fontFamily:    'var(--font-sans)',
      background:    '#f9fafb'
    }}>

      {/* ── Left: alert list ── */}
      <div style={{
        width:         340,
        display:       'flex',
        flexDirection: 'column',
        borderRight:   '0.5px solid #e5e7eb',
        background:    '#fff'
      }}>
        {/* Header */}
        <div style={{ padding:'14px 16px', borderBottom:'0.5px solid #e5e7eb' }}>
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            marginBottom:   10
          }}>
            <div>
              <div style={{ fontSize:15, fontWeight:600 }}>
                🦠 Disease Alerts
              </div>
              <div style={{ fontSize:12, color:'#6b7280', marginTop:1 }}>
                {counts.active} active · {counts.all} total
              </div>
            </div>
            <button
              onClick={fetchLiveAlert}
              disabled={loading}
              style={{
                padding:      '6px 12px',
                borderRadius: 8,
                border:       'none',
                background:   '#1D9E75',
                color:        '#fff',
                fontSize:     12,
                cursor:       'pointer',
                display:      'flex',
                alignItems:   'center',
                gap:          5
              }}
            >
              {loading ? '...' : '+ Simulate scan'}
            </button>
          </div>

          {/* Filter tabs */}
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {[
              { key:'all',      label:'All' },
              { key:'active',   label:'Active' },
              { key:'critical', label:'Critical' },
              { key:'warning',  label:'Warning' },
              { key:'healthy',  label:'Healthy' },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding:      '3px 10px',
                borderRadius: 100,
                border:       '0.5px solid',
                borderColor:  filter === f.key ? '#1D9E75' : '#e5e7eb',
                background:   filter === f.key ? '#e6f7f1' : 'transparent',
                color:        filter === f.key ? '#065f46' : '#6b7280',
                fontSize:     12,
                cursor:       'pointer',
                fontWeight:   filter === f.key ? 600 : 400
              }}>
                {f.label}
                {counts[f.key] > 0 && (
                  <span style={{
                    marginLeft:   4,
                    background:   filter === f.key ? '#1D9E75' : '#e5e7eb',
                    color:        filter === f.key ? '#fff' : '#6b7280',
                    borderRadius: 100,
                    padding:      '0 5px',
                    fontSize:     10
                  }}>
                    {counts[f.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Alert list */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {filtered.length === 0 && (
            <div style={{
              padding:    40,
              textAlign:  'center',
              color:      '#9ca3af',
              fontSize:   13
            }}>
              No alerts in this category
            </div>
          )}
          {filtered.map(alert => {
            const info     = DISEASE_DB[alert.disease] || {}
            const severity = SEVERITY[info.severity || 'warning']
            const isSelected = selected?.id === alert.id

            return (
              <div
                key={alert.id}
                onClick={() => setSelected(alert)}
                style={{
                  padding:     '12px 16px',
                  borderBottom:'0.5px solid #f3f4f6',
                  cursor:      'pointer',
                  background:  isSelected ? '#f0fdf4' : '#fff',
                  borderLeft:  isSelected ? '3px solid #1D9E75' : '3px solid transparent',
                  opacity:     alert.resolved ? 0.6 : 1,
                  transition:  'background 0.1s'
                }}
              >
                <div style={{
                  display:        'flex',
                  alignItems:     'flex-start',
                  justifyContent: 'space-between',
                  gap:            8
                }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{
                      display:    'flex',
                      alignItems: 'center',
                      gap:        6,
                      marginBottom: 3
                    }}>
                      <span style={{ fontSize:16 }}>{info.emoji || '🌿'}</span>
                      <span style={{
                        fontSize:     13,
                        fontWeight:   600,
                        color:        '#111827',
                        overflow:     'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace:   'nowrap'
                      }}>
                        {alert.disease}
                      </span>
                    </div>
                    <div style={{ fontSize:11, color:'#6b7280' }}>
                      🌱 {alert.plant} · 📍 {alert.sector}
                    </div>
                    <div style={{
                      display:    'flex',
                      alignItems: 'center',
                      gap:        8,
                      marginTop:  5
                    }}>
                      <span style={{
                        fontSize:     11,
                        padding:      '2px 7px',
                        borderRadius: 100,
                        background:   severity?.bg,
                        color:        severity?.text,
                        border:       `0.5px solid ${severity?.border}`,
                        fontWeight:   500
                      }}>
                        {severity?.label}
                      </span>
                      <span style={{ fontSize:11, color:'#9ca3af' }}>
                        {alert.confidence}% confidence
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:11, color:'#9ca3af' }}>
                      {timeAgo(alert.timestamp)}
                    </div>
                    {alert.resolved && (
                      <div style={{
                        fontSize:   10,
                        color:      '#16a34a',
                        marginTop:  4,
                        fontWeight: 500
                      }}>
                        ✓ Resolved
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Manual add button */}
        <div style={{ padding:'12px 16px', borderTop:'0.5px solid #e5e7eb' }}>
          <button
            onClick={() => setShowAddForm(s => !s)}
            style={{
              width:        '100%',
              padding:      '9px',
              borderRadius: 8,
              border:       '0.5px dashed #d1d5db',
              background:   '#fafafa',
              color:        '#6b7280',
              fontSize:     13,
              cursor:       'pointer'
            }}
          >
            + Add manual observation
          </button>
        </div>
      </div>

      {/* ── Right: detail panel ── */}
      <div style={{ flex:1, overflowY:'auto', padding:20 }}>

        {/* Manual add form */}
        {showAddForm && (
          <ManualAddForm
            onAdd={(alert) => {
              setAlerts(prev => [{ ...alert, id: Date.now() }, ...prev])
              setShowAddForm(false)
            }}
            onClose={() => setShowAddForm(false)}
            diseaseNames={Object.keys(DISEASE_DB)}
          />
        )}

        {!selected && !showAddForm && (
          <div style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            height:         '60%',
            gap:            12,
            color:          '#9ca3af'
          }}>
            <div style={{ fontSize:48 }}>🦠</div>
            <div style={{ fontSize:15, fontWeight:500 }}>
              Select an alert to view details
            </div>
            <div style={{ fontSize:13 }}>
              Click any alert on the left to see diagnosis, causes, and ranked solutions
            </div>
          </div>
        )}

        {selected && selectedInfo && !showAddForm && (
          <div style={{ maxWidth:720 }}>

            {/* Alert header */}
            <div style={{
              background:   sev?.bg,
              border:       `0.5px solid ${sev?.border}`,
              borderRadius: 14,
              padding:      '18px 20px',
              marginBottom: 16
            }}>
              <div style={{
                display:        'flex',
                alignItems:     'flex-start',
                justifyContent: 'space-between',
                gap:            12
              }}>
                <div>
                  <div style={{
                    display:    'flex',
                    alignItems: 'center',
                    gap:        10,
                    marginBottom: 6
                  }}>
                    <span style={{ fontSize:28 }}>{selectedInfo.emoji}</span>
                    <div>
                      <div style={{
                        fontSize:   20,
                        fontWeight: 700,
                        color:      '#111827'
                      }}>
                        {selected.disease}
                      </div>
                      <div style={{ fontSize:13, color:'#6b7280', marginTop:1 }}>
                        {selectedInfo.pathogen}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display:   'flex',
                    gap:       12,
                    flexWrap:  'wrap',
                    fontSize:  13,
                    color:     '#374151'
                  }}>
                    <span>🌱 {selected.plant}</span>
                    <span>📍 {selected.sector}</span>
                    <span>🕐 {timeAgo(selected.timestamp)}</span>
                    <span>🎯 {selected.confidence}% confidence</span>
                    <span>📡 {selected.source}</span>
                  </div>
                </div>

                <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                  {!selected.resolved && (
                    <button
                      onClick={() => markResolved(selected.id)}
                      style={{
                        padding:      '6px 12px',
                        borderRadius: 8,
                        border:       '0.5px solid #bbf7d0',
                        background:   '#f0fdf4',
                        color:        '#16a34a',
                        fontSize:     12,
                        cursor:       'pointer',
                        fontWeight:   500
                      }}
                    >
                      ✓ Mark resolved
                    </button>
                  )}
                  <button
                    onClick={() => deleteAlert(selected.id)}
                    style={{
                      padding:      '6px 12px',
                      borderRadius: 8,
                      border:       '0.5px solid #fecaca',
                      background:   '#fef2f2',
                      color:        '#dc2626',
                      fontSize:     12,
                      cursor:       'pointer'
                    }}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>

              {/* Confidence bar */}
              <div style={{ marginTop:12 }}>
                <div style={{
                  display:        'flex',
                  justifyContent: 'space-between',
                  fontSize:       11,
                  color:          '#6b7280',
                  marginBottom:   4
                }}>
                  <span>Detection confidence</span>
                  <span>{selected.confidence}%</span>
                </div>
                <div style={{
                  height:     6,
                  background: '#e5e7eb',
                  borderRadius:100,
                  overflow:   'hidden'
                }}>
                  <div style={{
                    height:     '100%',
                    width:      `${selected.confidence}%`,
                    background: sev?.dot,
                    borderRadius: 100,
                    transition: 'width 0.5s ease'
                  }}/>
                </div>
              </div>
            </div>

            {/* 3-column info */}
            <div style={{
              display:             'grid',
              gridTemplateColumns: '1fr 1fr',
              gap:                 12,
              marginBottom:        16
            }}>
              <InfoCard icon="🔬" title="Symptoms" text={selectedInfo.symptoms} />
              <InfoCard icon="⚡" title="Causes" text={selectedInfo.causes} />
            </div>

            {/* Solutions */}
            {selectedInfo.solutions.length > 0 && (
              <div style={{
                background:   '#fff',
                border:       '0.5px solid #e5e7eb',
                borderRadius: 14,
                overflow:     'hidden',
                marginBottom: 16
              }}>
                <div style={{
                  padding:     '14px 18px',
                  borderBottom:'0.5px solid #f3f4f6',
                  display:     'flex',
                  alignItems:  'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ fontSize:14, fontWeight:600 }}>
                    💊 Recommended solutions
                  </div>
                  <div style={{ fontSize:12, color:'#9ca3af' }}>
                    Ranked for your soil + weather conditions
                  </div>
                </div>

                {selectedInfo.solutions.map((sol, i) => {
                  const typeColor = SOLUTION_TYPE_COLORS[sol.type] ||
                    { bg:'#f3f4f6', text:'#374151' }

                  return (
                    <div key={i} style={{
                      padding:     '14px 18px',
                      borderBottom: i < selectedInfo.solutions.length - 1
                        ? '0.5px solid #f3f4f6' : 'none',
                      display:     'flex',
                      gap:         14,
                      alignItems:  'flex-start'
                    }}>
                      {/* Rank badge */}
                      <div style={{
                        width:          32,
                        height:         32,
                        borderRadius:   '50%',
                        background:     i === 0 ? '#1D9E75' :
                                        i === 1 ? '#3b82f6' : '#e5e7eb',
                        color:          i < 2 ? '#fff' : '#6b7280',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        fontSize:       14,
                        fontWeight:     700,
                        flexShrink:     0
                      }}>
                        {sol.rank}
                      </div>

                      <div style={{ flex:1 }}>
                        <div style={{
                          display:    'flex',
                          alignItems: 'center',
                          gap:        8,
                          marginBottom: 4
                        }}>
                          <span style={{ fontSize:14, fontWeight:600, color:'#111827' }}>
                            {sol.name}
                          </span>
                          <span style={{
                            fontSize:     11,
                            padding:      '2px 8px',
                            borderRadius: 100,
                            background:   typeColor.bg,
                            color:        typeColor.text,
                            fontWeight:   500
                          }}>
                            {sol.type}
                          </span>
                          <span style={{
                            fontSize:     11,
                            padding:      '2px 8px',
                            borderRadius: 100,
                            background:   '#fefce8',
                            color:        '#854d0e'
                          }}>
                            ⏰ {sol.timing}
                          </span>
                        </div>
                        <div style={{ fontSize:13, color:'#374151', lineHeight:1.6 }}>
                          {sol.detail}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Prevention */}
            <InfoCard
              icon="🛡️"
              title="Prevention"
              text={selectedInfo.prevention}
              color="#eff6ff"
              border="#bfdbfe"
            />

            {/* Sensor context */}
            {sensorData && (
              <div style={{
                marginTop:    16,
                background:   '#f9fafb',
                border:       '0.5px solid #e5e7eb',
                borderRadius: 12,
                padding:      '14px 16px'
              }}>
                <div style={{
                  fontSize:     13,
                  fontWeight:   600,
                  marginBottom: 10,
                  color:        '#374151'
                }}>
                  📊 Current soil readings (relevant to this disease)
                </div>
                <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
                  {[
                    { label:'Moisture', value:`${sensorData.moisture}%`,
                      warn: sensorData.moisture > 75,
                      warnMsg:'High moisture increases blight risk' },
                    { label:'EC',       value:`${sensorData.ec} dS/m`,
                      warn: sensorData.ec > 2.5,
                      warnMsg:'High salinity stresses plant immunity' },
                    { label:'pH',       value:sensorData.ph,
                      warn: sensorData.ph < 6 || sensorData.ph > 7.5,
                      warnMsg:'pH out of range weakens plant resistance' },
                  ].map(s => (
                    <div key={s.label}>
                      <div style={{ fontSize:11, color:'#9ca3af' }}>{s.label}</div>
                      <div style={{
                        fontSize:   16,
                        fontWeight: 700,
                        color:      s.warn ? '#dc2626' : '#111827'
                      }}>
                        {s.value}
                      </div>
                      {s.warn && (
                        <div style={{ fontSize:11, color:'#dc2626' }}>
                          ⚠️ {s.warnMsg}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}

// ── Reusable info card ────────────────────────────────────────
function InfoCard({ icon, title, text, color='#f9fafb', border='#e5e7eb' }) {
  return (
    <div style={{
      background:   color,
      border:       `0.5px solid ${border}`,
      borderRadius: 12,
      padding:      '14px 16px'
    }}>
      <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>
        {icon} {title}
      </div>
      <div style={{ fontSize:13, color:'#4b5563', lineHeight:1.6 }}>
        {text}
      </div>
    </div>
  )
}

// ── Manual add form ───────────────────────────────────────────
function ManualAddForm({ onAdd, onClose, diseaseNames }) {
  const [form, setForm] = useState({
    disease:    'Tomato late blight',
    plant:      '',
    sector:     '',
    confidence: 85,
    notes:      ''
  })

  function handleSubmit() {
    if (!form.plant || !form.sector) {
      alert('Please fill in plant type and sector')
      return
    }
    onAdd({
      ...form,
      timestamp: new Date().toISOString(),
      source:    'manual',
      resolved:  false,
      lat:       34.0209,
      lng:       -6.8416,
    })
  }

  return (
    <div style={{
      background:   '#fff',
      border:       '0.5px solid #e5e7eb',
      borderRadius: 14,
      padding:      20,
      marginBottom: 16,
      maxWidth:     600
    }}>
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginBottom:   16
      }}>
        <div style={{ fontSize:15, fontWeight:600 }}>
          📝 Add manual observation
        </div>
        <button onClick={onClose} style={{
          background:'transparent', border:'none',
          fontSize:18, cursor:'pointer', color:'#9ca3af'
        }}>×</button>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <label style={{ fontSize:13 }}>
          <div style={{ color:'#374151', marginBottom:4, fontWeight:500 }}>
            Disease detected
          </div>
          <select
            value={form.disease}
            onChange={e => setForm(f => ({ ...f, disease: e.target.value }))}
            style={{
              width:'100%', padding:'8px 10px',
              borderRadius:8, border:'0.5px solid #d1d5db',
              fontSize:13, outline:'none'
            }}
          >
            {diseaseNames.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <label style={{ fontSize:13 }}>
            <div style={{ color:'#374151', marginBottom:4, fontWeight:500 }}>
              Plant type
            </div>
            <input
              value={form.plant}
              onChange={e => setForm(f => ({ ...f, plant: e.target.value }))}
              placeholder="e.g. Tomato"
              style={{
                width:'100%', padding:'8px 10px',
                borderRadius:8, border:'0.5px solid #d1d5db',
                fontSize:13, outline:'none', boxSizing:'border-box'
              }}
            />
          </label>
          <label style={{ fontSize:13 }}>
            <div style={{ color:'#374151', marginBottom:4, fontWeight:500 }}>
              Field sector
            </div>
            <input
              value={form.sector}
              onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
              placeholder="e.g. Sector 3"
              style={{
                width:'100%', padding:'8px 10px',
                borderRadius:8, border:'0.5px solid #d1d5db',
                fontSize:13, outline:'none', boxSizing:'border-box'
              }}
            />
          </label>
        </div>

        <label style={{ fontSize:13 }}>
          <div style={{
            color:'#374151', marginBottom:4, fontWeight:500,
            display:'flex', justifyContent:'space-between'
          }}>
            <span>Confidence</span>
            <span style={{ color:'#1D9E75' }}>{form.confidence}%</span>
          </div>
          <input
            type="range" min="50" max="100" step="1"
            value={form.confidence}
            onChange={e => setForm(f => ({ ...f, confidence: Number(e.target.value) }))}
            style={{ width:'100%' }}
          />
        </label>

        <label style={{ fontSize:13 }}>
          <div style={{ color:'#374151', marginBottom:4, fontWeight:500 }}>
            Notes (optional)
          </div>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="e.g. observed in north corner of sector 3..."
            rows={2}
            style={{
              width:'100%', padding:'8px 10px',
              borderRadius:8, border:'0.5px solid #d1d5db',
              fontSize:13, resize:'vertical',
              fontFamily:'inherit', outline:'none',
              boxSizing:'border-box'
            }}
          />
        </label>

        <button onClick={handleSubmit} style={{
          padding:      '10px',
          borderRadius: 8,
          border:       'none',
          background:   '#1D9E75',
          color:        '#fff',
          fontSize:     14,
          fontWeight:   600,
          cursor:       'pointer'
        }}>
          Add observation
        </button>
      </div>
    </div>
  )
}