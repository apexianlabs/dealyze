'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'

function GeneratePageInner() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [activeTab, setActiveTab] = useState('verdict')
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({
    address: '',
    price: '',
    rent: '',
    rate: '7.0',
    downPct: '20',
    vacancy: '8',
    expenses: '35'
  })

  const COLOR = '#16a34a'

  useEffect(() => {
    const match = document.cookie.match(/dea_user=([^;]+)/)
    if (match) {
      try { setUser(JSON.parse(decodeURIComponent(match[1]))) } catch(e) {}
    }
  }, [])

  const handleAnalyse = async () => {
    if (!form.address || !form.price || !form.rent) {
      setError('Please enter the property address, price and monthly rent')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const token = document.cookie.match(/dea_token=([^;]+)/)?.[1] || ''
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...form, userId: user?.id,
          price: parseFloat(form.price),
          rent: parseFloat(form.rent),
          rate: parseFloat(form.rate),
          downPct: parseFloat(form.downPct),
          vacancy: parseFloat(form.vacancy),
          expenses: parseFloat(form.expenses)
        })
      })
      const data = await res.json()
      if (data.error === 'limit_reached') { setError('limit_reached'); setLoading(false); return }
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data)
      setActiveTab('verdict')
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  const inputStyle = { width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13, outline:'none', boxSizing:'border-box', background:'#fff' }
  const labelStyle = { fontSize:12, fontWeight:600, color:'#475569', marginBottom:4, display:'block' }

  const verdictColors = {
    'Strong Buy': { bg:'#f0fdf4', border:'#bbf7d0', text:'#15803d', emoji:'🟢' },
    'Buy':        { bg:'#f0fdf4', border:'#bbf7d0', text:'#16a34a', emoji:'✅' },
    'Borderline': { bg:'#fff7ed', border:'#fed7aa', text:'#d97706', emoji:'🟡' },
    'Pass':       { bg:'#fef2f2', border:'#fecaca', text:'#dc2626', emoji:'🔴' },
  }

  if (error === 'limit_reached') return (
    <div style={{minHeight:'100vh',background:'#f8fafc',display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:'Inter,Arial,sans-serif'}}>
      <div style={{background:'#fff',borderRadius:16,padding:32,maxWidth:400,textAlign:'center',border:'1px solid #e2e8f0'}}>
        <div style={{fontSize:40,marginBottom:16}}>📊</div>
        <h2 style={{fontSize:18,fontWeight:800,color:'#0f172a',marginBottom:8}}>Free limit reached</h2>
        <p style={{fontSize:14,color:'#64748b',marginBottom:24}}>You've used your 3 free analyses. Upgrade to keep analysing deals.</p>
        <Link href="/billing" style={{display:'block',background:COLOR,color:'#fff',padding:'12px 24px',borderRadius:9,textDecoration:'none',fontWeight:700,fontSize:14,marginBottom:12}}>Upgrade now →</Link>
        <button onClick={() => setError('')} style={{background:'none',border:'none',color:'#94a3b8',fontSize:13,cursor:'pointer'}}>Maybe later</button>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#f8fafc',fontFamily:'Inter,Arial,sans-serif'}}>
      <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <Link href="/dashboard" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none'}}>
          <div style={{width:28,height:28,borderRadius:7,background:COLOR,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff'}}>D</div>
          <span style={{fontSize:14,fontWeight:800,color:'#0f172a'}}>Dealyze</span>
        </Link>
        <Link href="/dashboard" style={{fontSize:13,color:'#64748b',textDecoration:'none'}}>← Dashboard</Link>
      </div>

      <div style={{maxWidth:960,margin:'0 auto',padding:'32px 20px'}}>
        <div style={{marginBottom:28}}>
          <h1 style={{fontSize:22,fontWeight:800,color:'#0f172a',marginBottom:6}}>Analyse a property deal</h1>
          <p style={{fontSize:14,color:'#64748b'}}>Enter the numbers and get an instant AI verdict with cash flow, cap rate and max offer price.</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns: result ? '1fr 1fr' : '1fr',gap:24}}>
          {/* Form */}
          <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e8f0',padding:24}}>
            <h2 style={{fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:20}}>Property Details</h2>

            <div style={{marginBottom:14}}>
              <label style={labelStyle}>Property Address *</label>
              <input style={inputStyle} placeholder="e.g. 123 Main St, Austin TX 78701" value={form.address}
                onChange={e => setForm({...form, address: e.target.value})} />
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div>
                <label style={labelStyle}>Purchase Price ($) *</label>
                <input style={inputStyle} type="number" placeholder="350000" value={form.price}
                  onChange={e => setForm({...form, price: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Monthly Rent ($) *</label>
                <input style={inputStyle} type="number" placeholder="2400" value={form.rent}
                  onChange={e => setForm({...form, rent: e.target.value})} />
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div>
                <label style={labelStyle}>Interest Rate (%)</label>
                <input style={inputStyle} type="number" step="0.1" placeholder="7.0" value={form.rate}
                  onChange={e => setForm({...form, rate: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Down Payment (%)</label>
                <input style={inputStyle} type="number" placeholder="20" value={form.downPct}
                  onChange={e => setForm({...form, downPct: e.target.value})} />
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
              <div>
                <label style={labelStyle}>Vacancy Rate (%)</label>
                <input style={inputStyle} type="number" placeholder="8" value={form.vacancy}
                  onChange={e => setForm({...form, vacancy: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Operating Expenses (%)</label>
                <input style={inputStyle} type="number" placeholder="35" value={form.expenses}
                  onChange={e => setForm({...form, expenses: e.target.value})} />
              </div>
            </div>

            {error && error !== 'limit_reached' && (
              <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:12,marginBottom:16,fontSize:13,color:'#dc2626'}}>{error}</div>
            )}

            <button onClick={handleAnalyse} disabled={loading}
              style={{width:'100%',background:loading ? '#86efac' : COLOR,color:'#fff',border:'none',borderRadius:9,padding:'13px 24px',fontSize:14,fontWeight:700,cursor:loading?'not-allowed':'pointer'}}>
              {loading ? '🔍 Analysing deal...' : '📊 Analyse Deal'}
            </button>

            <p style={{fontSize:11,color:'#94a3b8',marginTop:12,textAlign:'center'}}>Default rates: 7% interest, 20% down, 8% vacancy, 35% expenses</p>
          </div>

          {/* Results */}
          {result && (
            <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e8f0',padding:24}}>
              <h2 style={{fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:4}}>Analysis Result</h2>
              <p style={{fontSize:12,color:'#94a3b8',marginBottom:16,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{result.address}</p>

              {/* Verdict badge */}
              {result.verdict && (() => {
                const vc = verdictColors[result.verdict.label] || verdictColors['Borderline']
                return (
                  <div style={{background:vc.bg,border:`1px solid ${vc.border}`,borderRadius:10,padding:'12px 16px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div>
                      <div style={{fontSize:18,fontWeight:800,color:vc.text}}>{vc.emoji} {result.verdict.label}</div>
                      <div style={{fontSize:12,color:'#64748b',marginTop:2}}>Confidence: {result.verdict.confidence}%</div>
                    </div>
                    {result.ai?.maxOffer && (
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:11,color:'#94a3b8'}}>MAX OFFER</div>
                        <div style={{fontSize:16,fontWeight:800,color:'#0f172a'}}>${result.ai.maxOffer.toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Tabs */}
              <div style={{display:'flex',gap:6,marginBottom:16,borderBottom:'1px solid #f1f5f9',paddingBottom:8,flexWrap:'wrap'}}>
                {[
                  {key:'verdict', label:'📊 Metrics'},
                  {key:'ai', label:'🤖 AI Analysis'},
                  {key:'strengths', label:'✅ Strengths'},
                  {key:'risks', label:'⚠️ Risks'},
                ].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    style={{padding:'6px 10px',borderRadius:6,border:'none',fontSize:11,fontWeight:600,cursor:'pointer',
                      background:activeTab===tab.key ? COLOR : '#f1f5f9',
                      color:activeTab===tab.key ? '#fff' : '#64748b'}}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'verdict' && result.metrics && (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {[
                    {label:'Monthly Cash Flow', value:`$${Math.round(result.metrics.cashflow).toLocaleString()}`, good: result.metrics.cashflow > 0},
                    {label:'Annual Cash Flow', value:`$${Math.round(result.metrics.annualCF).toLocaleString()}`, good: result.metrics.annualCF > 0},
                    {label:'Cap Rate', value:`${result.metrics.capRate.toFixed(1)}%`, good: result.metrics.capRate > 6},
                    {label:'Cash-on-Cash Return', value:`${result.metrics.coc.toFixed(1)}%`, good: result.metrics.coc > 6},
                    {label:'Monthly Mortgage', value:`$${Math.round(result.metrics.mortgage).toLocaleString()}`, good: null},
                    {label:'Down Payment', value:`$${Math.round(result.metrics.downPayment).toLocaleString()}`, good: null},
                  ].map((m, i) => (
                    <div key={i} style={{background:'#f8fafc',borderRadius:8,padding:'12px 14px',border:'1px solid #e2e8f0'}}>
                      <div style={{fontSize:10,fontWeight:600,color:'#94a3b8',marginBottom:4,textTransform:'uppercase'}}>{m.label}</div>
                      <div style={{fontSize:16,fontWeight:800,color: m.good === null ? '#0f172a' : m.good ? '#16a34a' : '#dc2626'}}>{m.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'ai' && result.ai?.summary && (
                <div>
                  <div style={{background:'#f8fafc',borderRadius:8,padding:14,marginBottom:12,fontSize:13,color:'#334155',lineHeight:1.7}}>{result.ai.summary}</div>
                  {result.ai.maxOfferReason && (
                    <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:8,padding:14}}>
                      <div style={{fontSize:11,fontWeight:700,color:COLOR,marginBottom:6}}>MAX OFFER RATIONALE</div>
                      <div style={{fontSize:13,color:'#334155',lineHeight:1.6}}>{result.ai.maxOfferReason}</div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'strengths' && result.ai?.strengths && (
                <div>
                  {result.ai.strengths.map((s, i) => (
                    <div key={i} style={{display:'flex',gap:10,marginBottom:10,alignItems:'flex-start'}}>
                      <span style={{color:COLOR,fontSize:16,flexShrink:0}}>✓</span>
                      <span style={{fontSize:13,color:'#334155',lineHeight:1.5}}>{s}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'risks' && result.ai?.risks && (
                <div>
                  {result.ai.risks.map((r, i) => (
                    <div key={i} style={{display:'flex',gap:10,marginBottom:10,alignItems:'flex-start'}}>
                      <span style={{color:'#dc2626',fontSize:16,flexShrink:0}}>⚠</span>
                      <span style={{fontSize:13,color:'#334155',lineHeight:1.5}}>{r}</span>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => {
                const txt = `Dealyze Analysis — ${result.address}\nVerdict: ${result.verdict?.label} (${result.verdict?.confidence}% confidence)\nCash Flow: $${Math.round(result.metrics?.cashflow)}/mo\nCap Rate: ${result.metrics?.capRate?.toFixed(1)}%\nCash-on-Cash: ${result.metrics?.coc?.toFixed(1)}%\nMax Offer: $${result.ai?.maxOffer?.toLocaleString()}`
                navigator.clipboard.writeText(txt)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }} style={{width:'100%',marginTop:16,background:'#f1f5f9',border:'none',borderRadius:8,padding:'10px',fontSize:13,fontWeight:600,color:'#475569',cursor:'pointer'}}>
                {copied ? '✓ Copied!' : '📋 Copy Summary'}
              </button>

              <Link href="/dashboard" style={{display:'block',marginTop:10,textAlign:'center',fontSize:13,color:'#94a3b8',textDecoration:'none'}}>View all analyses →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GeneratePage() {
  return <Suspense><GeneratePageInner /></Suspense>
}
