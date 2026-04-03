import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

// ── API base — reads from Vercel env var at build time ────────
const API = import.meta.env.VITE_API_URL || ''

// ── Colour helpers ────────────────────────────────────────────
const riskColor = (score) => {
  if (score >= 0.65) return '#e53935'
  if (score >= 0.35) return '#fb8c00'
  return '#43a047'
}
const riskBg = (score) => {
  if (score >= 0.65) return '#fdecea'
  if (score >= 0.35) return '#fff3e0'
  return '#e8f5e9'
}
const riskLabel = (score) => {
  if (score >= 0.65) return 'High'
  if (score >= 0.35) return 'Medium'
  return 'Low'
}

// ── Location chips ────────────────────────────────────────────
const CHIPS = [
  { label: '🏘 Peddapalli Town',            val: 'peddapalli' },
  { label: '⛏ Godavarikhani',              val: 'godavarikhani' },
  { label: '🏭 Ramagundam',                val: 'ramagundam' },
  { label: '🌿 Manthani',                  val: 'manthani' },
  { label: '🏘 Sultanabad',                val: 'sultanabad' },
  { label: '🌾 Kamanpur',                  val: 'kamanpur' },
  { label: '🌾 Ramagiri',                  val: 'ramagiri' },
  { label: '🏘 Dharmaram',                 val: 'dharmaram' },
  { label: '🌳 Odela',                     val: 'odela' },
  { label: '🌾 Julapalli',                 val: 'julapalli' },
  { label: '🌾 Eligaid',                   val: 'eligaid' },
  { label: '🏘 Palakurthy',                val: 'palakurthy' },
  { label: '🌳 Srirampur',                 val: 'srirampur' },
  { label: '⚡ NTPC',                      val: 'ntpc' },
  { label: '💧 Yellampalli',               val: 'yellampalli' },
  { label: '⚠ Katnapalli',                val: 'katnapalli' },
]

// ── Sub-components ────────────────────────────────────────────
function RiskDot({ score, size = 10 }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      borderRadius: '50%', background: riskColor(score),
      marginRight: 6, flexShrink: 0,
    }} />
  )
}

function RiskBadge({ score }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: riskBg(score), color: riskColor(score),
      borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600,
      border: `1px solid ${riskColor(score)}40`,
      whiteSpace: 'nowrap',
    }}>
      <RiskDot score={score} size={8} />
      {riskLabel(score)}
    </span>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div style={{
      background: '#f8f9fa', borderRadius: 12, padding: '10px 6px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 3, flex: 1, minWidth: 0,
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{value}</span>
      <span style={{ fontSize: 10, color: '#888', textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
    </div>
  )
}

function RouteCard({ route }) {
  const [expanded, setExpanded] = useState(false)
  const isRecommended = route.recommended
  const isAvoid       = !isRecommended && route.avg_risk_score >= 0.65
  const avgRisk       = route.avg_risk_score ?? 0

  const borderColor = isAvoid ? '#e5393530' : isRecommended ? '#43a04740' : '#e0e0e0'
  const bg          = isAvoid ? '#fff5f5'   : isRecommended ? '#f0fdf4'   : '#fff'

  return (
    <div style={{
      border: `1.5px solid ${borderColor}`, borderRadius: 16,
      padding: '14px 16px', background: bg, marginBottom: 12,
    }}>
      {isAvoid && (
        <div style={{ fontSize: 12, fontWeight: 700, color: '#e53935', marginBottom: 8 }}>
          🔴 AVOID — HIGHEST RISK
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e', marginBottom: 4, lineHeight: 1.3 }}>
            {route.label ?? route.variant?.toUpperCase()}
          </div>
          {isRecommended && (
            <span style={{
              display: 'inline-block', background: '#e8f5e9', color: '#2e7d32',
              fontSize: 11, fontWeight: 700, borderRadius: 6,
              padding: '2px 8px', marginBottom: 6,
            }}>✅ Recommended</span>
          )}
          <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>
            {route.path?.slice(0, 5).join(' → ')}
            {route.path?.length > 5 ? ' → ...' : ''}
          </div>
        </div>
        <RiskBadge score={avgRisk} />
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <StatCard icon="📏" label="Distance"   value={`${route.distance_km} km`} />
        <StatCard icon="⏱"  label="Est. Time"  value={`${route.duration_min} min`} />
        <StatCard icon="🎯" label="Risk Score"  value={avgRisk.toFixed(3)} />
        <StatCard icon="📍" label="Hotspots"   value={route.hotspots?.length ?? 0} />
      </div>

      {/* Hotspot warning */}
      {route.hotspots?.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#e53935', display: 'flex', alignItems: 'center', gap: 5 }}>
          ⚠️ {route.hotspots.length} confirmed fatal hotspot{route.hotspots.length > 1 ? 's' : ''} on this route
        </div>
      )}

      {route.path?.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              marginTop: 10, background: 'none', border: 'none',
              color: '#1565c0', fontSize: 12, cursor: 'pointer',
              fontWeight: 500, padding: 0,
            }}
          >
            {expanded ? '▲ Hide' : `▼ Show all ${route.path.length} road segments`}
          </button>
          {expanded && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {route.coordinates?.map((c, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '5px 10px', background: '#f8f9fa', borderRadius: 8, fontSize: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <RiskDot score={c.risk_score} size={8} />
                    <span style={{ color: '#333' }}>{c.name}</span>
                    {c.is_hotspot && <span style={{ marginLeft: 4, color: '#e53935', fontSize: 10 }}>★</span>}
                  </div>
                  <span style={{ color: riskColor(c.risk_score), fontWeight: 600 }}>
                    {(c.risk_score * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function RiskSegmentRow({ seg }) {
  const pct = Math.round((seg.risk_score ?? 0) * 100)
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>
          {seg.name}
          {seg.is_hotspot && <span style={{ marginLeft: 5, color: '#e53935', fontSize: 10 }}>★ HOTSPOT</span>}
        </span>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: riskColor(seg.risk_score) }}>
            {(seg.risk_score ?? 0).toFixed(2)}
          </span>
        </div>
      </div>
      <div style={{
        height: 7, background: '#e0e0e0', borderRadius: 4,
        marginBottom: 6, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 4,
          width: `${Math.max(pct, 2)}%`,
          background: riskColor(seg.risk_score),
          transition: 'width 0.6s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#888' }}>
          {pct}% · {seg.road_type} · {seg.mandal}
        </span>
        <RiskBadge score={seg.risk_score} />
      </div>
    </div>
  )
}

function SegmentFactorCard({ seg }) {
  return (
    <div style={{
      border: `1.5px solid ${riskColor(seg.risk_score)}22`,
      borderRadius: 14, padding: '12px 16px',
      background: riskBg(seg.risk_score) + '44',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: 14, gap: 6 }}>
          <RiskDot score={seg.risk_score} size={11} />
          {seg.name}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ color: riskColor(seg.risk_score), fontWeight: 800, fontSize: 18, lineHeight: 1 }}>
            {Math.round((seg.risk_score ?? 0) * 100)}%
          </div>
          <div style={{ fontSize: 10, color: '#999' }}>accident risk</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>
        {seg.weather ?? 'clear'} · {seg.road_type} · {seg.mandal}
      </div>
      {seg.factors?.length > 0 ? (
        <>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#333' }}>
            Contributing factors (ML detected):
          </div>
          {seg.factors.map((f, i) => (
            <div key={i} style={{ fontSize: 12, color: '#444', paddingLeft: 8, lineHeight: 1.65 }}>
              • {f}
            </div>
          ))}
        </>
      ) : (
        <div style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>
          No dominant single factor — moderate combined conditions.
        </div>
      )}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [source,      setSource]      = useState('')
  const [dest,        setDest]        = useState('')
  const [weather,     setWeather]     = useState('')
  const [time,        setTime]        = useState('now')
  const [loading,     setLoading]     = useState(false)
  const [result,      setResult]      = useState(null)
  const [error,       setError]       = useState(null)
  const [activeTab,   setActiveTab]   = useState('recommendation')
  const [modelReady,  setModelReady]  = useState(false)
  const [activeField, setActiveField] = useState(null)

  const sourceRef = useRef(null)
  const destRef   = useRef(null)

  // Poll model readiness via /health
  useEffect(() => {
    const check = async () => {
      try {
        const res = await axios.get(`${API}/health`)
        if (res.data.model_ready) {
          setModelReady(true)
        } else {
          setTimeout(check, 3000)
        }
      } catch (e) {
        setTimeout(check, 4000)
      }
    }
    check()
  }, [])

  const handleChipClick = (val) => {
    if (activeField === 'dest' || (!activeField && source)) {
      setDest(val)
      setActiveField(null)
    } else {
      setSource(val)
      setActiveField('dest')
    }
  }

  const handleSubmit = async () => {
    if (!source.trim() || !dest.trim()) {
      setError('Please enter both source and destination.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    setActiveTab('recommendation')
    try {
      const res = await axios.post(`${API}/predict-route`, {
        origin:            source.trim(),
        destination:       dest.trim(),
        weather_condition: weather || null,
        time_of_day:       time || 'now',
      })
      setResult(res.data)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Failed to compute route. The backend may still be waking up — try again in a moment.'
      )
    } finally {
      setLoading(false)
    }
  }

  const WEATHER_EMOJI = { clear: "☀️", rainy: "🌧️", foggy: "🌫️", cloudy: "☁️" }

  const bestRoute  = result?.routes?.find(r => r.recommended)
  const worstRoute = result?.routes?.reduce((a, b) => (a.avg_risk_score > b.avg_risk_score ? a : b), result?.routes?.[0])
  const riskCutPct = bestRoute && worstRoute && worstRoute.avg_risk_score > 0
    ? Math.round((1 - bestRoute.avg_risk_score / worstRoute.avg_risk_score) * 100)
    : 0

  const TABS = [
    { id: 'recommended', label: '✅ Recommended' },
    { id: 'routes',         label: '🗺 Routes' },
    { id: 'risk',           label: '📊 Risk' },
    { id: 'explain',        label: '⚠ Explain' },
  ]

  const WEATHER_OPTIONS = [
    { value: '',       label: '🌐 Auto (Live Weather)' },
    { value: 'clear',  label: '☀️ Clear' },
    { value: 'cloudy', label: '⛅ Cloudy' },
    { value: 'rainy',  label: '🌧️ Rainy' },
    { value: 'foggy',  label: '🌫️ Foggy / Night' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, -apple-system, sans-serif" }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(160deg, #0d1b2a 0%, #1b2a4a 100%)',
        color: '#fff', padding: '28px 20px 30px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🛣️</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.3, margin: '0 0 6px' }}>
          Peddapalli Road Risk AI
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 16px' }}>
          ML Risk Scoring · Dijkstra Graph Routing · 68 Road Segments · Telangana
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
          {['Random Forest', 'Gradient Boosting', 'Dijkstra Routing', '14-Factor Model'].map(t => (
            <span key={t} style={{
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.20)',
              borderRadius: 20, padding: '4px 14px',
              fontSize: 12, color: '#cbd5e1',
            }}>{t}</span>
          ))}
        </div>
        {!modelReady && (
          <div style={{ color: '#fbbf24', fontSize: 12 }}>
            ⏳ ML model training on startup — please wait (~30-60s on first load)
          </div>
        )}
        {modelReady && (
          <div style={{ color: '#86efac', fontSize: 12 }}>✅ ML Model Ready</div>
        )}
      </div>

      {/* ── JOURNEY PLANNER ──────────────────────────────────── */}
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px 60px' }}>

        <div style={{
          background: '#fff', borderRadius: 20, padding: '20px 20px 18px',
          marginTop: -18, boxShadow: '0 4px 24px rgba(0,0,0,0.11)',
        }}>
          <h2 style={{ fontWeight: 700, fontSize: 17, margin: '0 0 18px' }}>
            Plan Your Journey
          </h2>

          {/* Source */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#e53935', display: 'block', marginBottom: 5 }}>
              📍 Origin
            </label>
            <input
              ref={sourceRef}
              list="loc-list"
              value={source}
              onChange={e => setSource(e.target.value)}
              onFocus={() => setActiveField('source')}
              placeholder="e.g. peddapalli, ramagundam, manthani…"
              style={{
                width: '100%', padding: '13px 14px', borderRadius: 12, boxSizing: 'border-box',
                border: `1.5px solid ${activeField === 'source' ? '#1565c0' : '#e0e0e0'}`,
                fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Destination */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 5 }}>
              🏁 Destination
            </label>
            <input
              ref={destRef}
              list="loc-list"
              value={dest}
              onChange={e => setDest(e.target.value)}
              onFocus={() => setActiveField('dest')}
              placeholder="e.g. godavarikhani, ntpc, sultanabad…"
              style={{
                width: '100%', padding: '13px 14px', borderRadius: 12, boxSizing: 'border-box',
                border: `1.5px solid ${activeField === 'dest' ? '#1565c0' : '#e0e0e0'}`,
                fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <datalist id="loc-list">
            {['peddapalli','ramagundam','godavarikhani','manthani','sultanabad',
              'kamanpur','ramagiri','dharmaram','srirampur','eligaid','julapalli',
              'palakurthy','odela','mutharam','anthergaon','ntpc','yellampalli','katnapalli'
            ].map(l => <option key={l} value={l} />)}
          </datalist>

          {/* Weather + Time row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 5 }}>
                🌤 Weather
              </label>
              <select
                value={weather}
                onChange={e => setWeather(e.target.value)}
                style={{
                  width: '100%', padding: '11px 12px', borderRadius: 12, boxSizing: 'border-box',
                  border: '1.5px solid #e0e0e0', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                  background: '#fff', color: '#1a1a2e', cursor: 'pointer',
                }}
              >
                {WEATHER_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 5 }}>
                ⏱ Departure Time
              </label>
              <input
                value={time}
                onChange={e => setTime(e.target.value)}
                placeholder="now · 08:30 · 22:00"
                style={{
                  width: '100%', padding: '11px 12px', borderRadius: 12, boxSizing: 'border-box',
                  border: '1.5px solid #e0e0e0', fontSize: 13,
                  outline: 'none', fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !modelReady}
            style={{
              width: '100%', padding: '15px', borderRadius: 14,
              background: modelReady
                ? 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)'
                : '#94a3b8',
              color: '#fff', fontWeight: 700, fontSize: 16,
              border: 'none', cursor: modelReady ? 'pointer' : 'not-allowed',
              boxShadow: modelReady ? '0 4px 16px rgba(21,101,192,0.35)' : 'none',
              transition: '0.2s', fontFamily: 'inherit', letterSpacing: 0.2,
            }}
          >
            {loading ? '⏳ Computing Routes...' : '🔍 Get ML Route Recommendation'}
          </button>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 12, background: '#fdecea', color: '#c62828',
              borderRadius: 10, padding: '10px 14px', fontSize: 13,
            }}>
              ❌ {error}
            </div>
          )}

          {/* Location chips */}
          <div style={{ marginTop: 18 }}>
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 10px' }}>
              Tap a place — first tap sets origin, second sets destination:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {CHIPS.map(chip => (
                <button
                  key={chip.label}
                  onClick={() => handleChipClick(chip.val)}
                  style={{
                    background: '#f1f5f9', border: '1px solid #e2e8f0',
                    borderRadius: 20, padding: '5px 13px',
                    fontSize: 12, cursor: 'pointer', color: '#334155',
                    fontWeight: 500, transition: '0.15s', outline: 'none',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── RESULTS ──────────────────────────────────────────── */}
        {result && (
          <div style={{ marginTop: 16 }}>

            {/* Journey header */}
            <div style={{
              background: 'linear-gradient(135deg, #0d1b2a 0%, #1b2a4a 100%)',
              borderRadius: 20, padding: '18px 20px',
              color: '#fff', marginBottom: 12,
            }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
                Peddapalli District · ML Risk Analysis
              </div>
              <h2 style={{ fontWeight: 800, fontSize: 19, margin: '0 0 10px', lineHeight: 1.2 }}>
                🏘 {result.origin} → 🏘 {result.destination}
              </h2>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: '#cbd5e1', marginBottom: 8 }}>
                <span>⏰ {time || 'now'}</span>
                <span>🌤 {result.weather?.condition?.toUpperCase()}</span>
                {result.weather?.temperature_c !== 'N/A' && (
                  <span>🌡 {result.weather.temperature_c}°C</span>
                )}
                <span style={{
                  background: 'rgba(255,255,255,0.12)',
                  borderRadius: 12, padding: '1px 10px', fontSize: 11,
                }}>
                  {WEATHER_EMOJI[result.weather?.condition] ?? '🌤'}
                  {' '}{result.weather?.condition}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#86efac', flexWrap: 'wrap' }}>
                <span>🗺 {result.routes?.length} routes computed</span>
                <span>🤖 {result.model_name} · {(result.model_accuracy * 100).toFixed(1)}% acc</span>
              </div>
            </div>

            {/* Tabs */}
            <div style={{
              background: '#fff', borderRadius: 20,
              boxShadow: '0 2px 16px rgba(0,0,0,0.08)', overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex', borderBottom: '1px solid #f0f0f0',
                overflowX: 'auto', WebkitOverflowScrolling: 'touch',
              }}>
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: 1, minWidth: 80, padding: '13px 6px',
                      border: 'none', background: 'none', fontFamily: 'inherit',
                      fontWeight: 600, fontSize: 12, cursor: 'pointer',
                      color: activeTab === tab.id ? '#1565c0' : '#888',
                      borderBottom: activeTab === tab.id
                        ? '2.5px solid #1565c0'
                        : '2.5px solid transparent',
                      transition: '0.2s', whiteSpace: 'nowrap', outline: 'none',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ padding: '16px 16px 20px' }}>

                {/* ── RECOMMENDATION TAB ── */}
                {activeTab === 'recommendation' && (
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: 15, margin: '0 0 14px' }}>
                      ML Recommendation
                    </h3>

                    {/* Best route */}
                    {bestRoute && (
                      <div style={{
                        border: '1.5px solid #43a04740', borderRadius: 16,
                        padding: '14px 16px', background: '#f0fdf4', marginBottom: 12,
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#2e7d32', marginBottom: 6 }}>
                          ✅ TAKE THIS ROUTE
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a2e', marginBottom: 6, lineHeight: 1.3 }}>
                          {bestRoute.label}
                        </div>
                        {bestRoute.path?.length > 0 && (
                          <div style={{
                            background: '#fff', borderRadius: 10, padding: '8px 12px',
                            fontSize: 12, color: '#555', lineHeight: 1.6, marginBottom: 10,
                          }}>
                            <span style={{ color: '#888' }}>Via: </span>
                            {bestRoute.path.join(' → ')}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 6 }}>
                          <StatCard icon="📏" label="Distance"   value={`${bestRoute.distance_km} km`} />
                          <StatCard icon="⏱"  label="Est. Time"  value={`${bestRoute.duration_min} min`} />
                          <StatCard icon="🎯" label="Risk Score"  value={bestRoute.avg_risk_score?.toFixed(3)} />
                          <StatCard icon="✂️"  label="Risk Cut"   value={`-${riskCutPct}%`} />
                        </div>
                        {result.recommendation && (
                          <div style={{
                            marginTop: 10, background: '#fff', borderRadius: 10,
                            padding: '10px 12px', fontSize: 13, color: '#1a1a2e', lineHeight: 1.65,
                          }}>
                            💡 {result.recommendation}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Worst route to avoid */}
                    {worstRoute && worstRoute.variant !== bestRoute?.variant && (
                      <div style={{
                        border: '1.5px solid #e5393530', borderRadius: 16,
                        padding: '14px 16px', background: '#fff5f5', marginBottom: 12,
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#e53935', marginBottom: 6 }}>
                          🔴 AVOID — HIGHEST RISK
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e', marginBottom: 4 }}>
                          {worstRoute.label}
                        </div>
                        <div style={{ fontSize: 12, color: '#888' }}>
                          Risk: {worstRoute.avg_risk_score?.toFixed(3)} · {worstRoute.distance_km} km · {worstRoute.duration_min} min
                        </div>
                      </div>
                    )}

                    {/* All Routes comparison table */}
                    {result.routes?.length > 0 && (
                      <div style={{
                        background: '#fff', borderRadius: 14,
                        border: '1px solid #f0f0f0', overflow: 'hidden',
                      }}>
                        <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: 14, borderBottom: '1px solid #f0f0f0' }}>
                          All Routes Compared
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#fafafa' }}>
                              {['Route', 'km', 'min', 'Risk'].map((h, i) => (
                                <th key={h} style={{
                                  padding: '8px 12px', fontSize: 12, color: '#888',
                                  textAlign: i === 0 ? 'left' : i === 3 ? 'right' : 'center',
                                  fontWeight: 600,
                                }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.routes.map((r, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                <td style={{ padding: '10px 12px', fontSize: 13, color: '#1a1a2e' }}>
                                  {r.recommended && <span style={{ marginRight: 4 }}>✅</span>}
                                  {r.label}
                                </td>
                                <td style={{ padding: '10px 6px', fontSize: 13, color: '#555', textAlign: 'center' }}>{r.distance_km}</td>
                                <td style={{ padding: '10px 6px', fontSize: 13, color: '#555', textAlign: 'center' }}>{r.duration_min}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                  <RiskBadge score={r.avg_risk_score} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ── ROUTES TAB ── */}
                {activeTab === 'routes' && (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, margin: '0 0 4px' }}>
                      {result.origin} → {result.destination}
                    </div>
                    <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
                      {result.routes?.length} route variants computed
                    </div>
                    {result.routes?.map((route, i) => (
                      <RouteCard key={i} route={route} />
                    ))}
                  </div>
                )}

                {/* ── RISK TAB ── */}
                {activeTab === 'risk' && (
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: 15, margin: '0 0 16px' }}>
                      Top Risk Segments (ML Scored)
                    </h3>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: 12, fontWeight: 600, color: '#1565c0',
                      padding: '0 2px', marginBottom: 14,
                    }}>
                      <span>Road Segment</span>
                      <div style={{ display: 'flex', gap: 32 }}>
                        <span>ML Score</span>
                        <span>Risk Level</span>
                      </div>
                    </div>
                    {result.top_risk_segments?.map((seg, i) => (
                      <RiskSegmentRow key={i} seg={seg} />
                    ))}
                    {(!result.top_risk_segments || result.top_risk_segments.length === 0) && (
                      <div style={{ color: '#888', fontSize: 13 }}>No risk breakdown available.</div>
                    )}
                  </div>
                )}

                {/* ── EXPLAIN TAB ── */}
                {activeTab === 'explain' && (
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: 15, margin: '0 0 14px' }}>
                      Risk Explanation (14-Factor Model)
                    </h3>
                    {result.top_risk_segments?.map((seg, i) => (
                      <SegmentFactorCard key={i} seg={seg} />
                    ))}
                    {(!result.top_risk_segments || result.top_risk_segments.length === 0) && (
                      <div style={{ color: '#888', fontSize: 13 }}>No explanation available.</div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          textAlign: 'center', fontSize: 11, color: '#aaa',
          marginTop: 24, lineHeight: 1.8,
        }}>
          Peddapalli Road Risk AI · Data: NCRB 2023 · Telangana Police<br />
          68 Road Segments · Peddapalli District, Telangana
        </div>
      </div>
    </div>
  )
}