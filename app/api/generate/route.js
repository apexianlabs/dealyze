import { NextResponse } from 'next/server'

// Deal math — ported from dealpilot-project/lib/dealMath.ts
function calcDeal({ price, rent, rate, downPct, vacancy, expenses }) {
  const down = price * (downPct / 100)
  const loan = price - down
  const monthlyRate = rate / 100 / 12
  const n = 360
  const mortgage = monthlyRate === 0
    ? loan / n
    : (loan * (monthlyRate * Math.pow(1 + monthlyRate, n))) / (Math.pow(1 + monthlyRate, n) - 1)
  const effRent = rent * (1 - vacancy / 100)
  const monthlyExp = effRent * (expenses / 100)
  const noiMonthly = effRent - monthlyExp
  const cashflow = noiMonthly - mortgage
  const noiAnnual = noiMonthly * 12
  const capRate = (noiAnnual / price) * 100
  const annualCF = cashflow * 12
  const coc = down > 0 ? (annualCF / down) * 100 : 0
  return { cashflow, capRate, coc, mortgage, noiMonthly, annualCF, downPayment: down }
}

function scoreDeal({ cashflow, capRate, coc }) {
  const score =
    (cashflow > 400 ? 2 : cashflow > 200 ? 1 : cashflow > 0 ? 0 : -2) +
    (capRate > 8 ? 2 : capRate > 6 ? 1 : capRate > 4 ? 0 : -1) +
    (coc > 10 ? 2 : coc > 6 ? 1 : coc > 0 ? 0 : -1)
  if (score >= 4) return { label: 'Strong Buy', confidence: 92 }
  if (score >= 2) return { label: 'Buy', confidence: 74 }
  if (score >= 0) return { label: 'Borderline', confidence: 55 }
  return { label: 'Pass', confidence: 88 }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { address, price, rent, rate, downPct, vacancy, expenses, userId } = body

    if (!price || !rent || !rate || !downPct) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const inputs = { price, rent, rate, downPct, vacancy: vacancy ?? 8, expenses: expenses ?? 35 }

    // Check usage limit
    if (userId) {
      const usageRes = await fetch(
        `${process.env.DB_API_URL}/usage/check?user_id=${userId}&product=dealyze`,
        { headers: { 'Authorization': `Bearer ${process.env.DB_API_KEY_DEALYZE}` } }
      )
      const usage = await usageRes.json()
      if (!usage.allowed) {
        return NextResponse.json({ error: 'limit_reached', used: usage.used, limit: usage.limit }, { status: 403 })
      }
    }

    // Run deal math
    const metrics = calcDeal(inputs)
    const verdict = scoreDeal(metrics)

    // Call AI API
    const prompt = `You are a real estate investment analyst. Analyse this property deal and respond ONLY with valid JSON.

Property: ${address || 'Address not provided'}
Purchase Price: $${price.toLocaleString()}
Monthly Rent: $${rent.toLocaleString()}
Interest Rate: ${rate}%
Down Payment: ${downPct}% ($${Math.round(metrics.downPayment).toLocaleString()})
Vacancy Rate: ${vacancy}%
Operating Expenses: ${expenses}%

Calculated Metrics:
- Monthly Cash Flow: $${Math.round(metrics.cashflow)}
- Annual Cash Flow: $${Math.round(metrics.annualCF)}
- Cap Rate: ${metrics.capRate.toFixed(2)}%
- Cash-on-Cash Return: ${metrics.coc.toFixed(2)}%
- Monthly Mortgage: $${Math.round(metrics.mortgage)}
- Verdict: ${verdict.label} (${verdict.confidence}% confidence)

Respond ONLY with this JSON:
{
  "summary": "2-3 sentence plain English analysis of whether this is a good deal and why",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "risks": ["risk 1", "risk 2", "risk 3"],
  "maxOffer": <maximum price you would pay as a number, based on achieving minimum 6% cap rate>,
  "maxOfferReason": "one sentence explaining the max offer calculation"
}`

    const aiRes = await fetch(`${process.env.AI_API_URL}/api/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.AI_API_KEY}` },
      body: JSON.stringify({ task: 'analyse_real_estate_deal', inputs: { prompt } })
    })

    if (!aiRes.ok) throw new Error('AI analysis failed')

    const aiData = await aiRes.json()
    let aiResult = aiData.data || aiData.result || {}

    try {
      if (typeof aiResult === 'string') {
        const clean = aiResult.replace(/```json|```/g, '').trim()
        aiResult = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0] || clean)
      } else if (aiResult.raw_response) {
        const clean = aiResult.raw_response.replace(/```json|```/g, '').trim()
        aiResult = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0] || clean)
      }
    } catch(e) {}

    // Save to DB
    if (userId) {
      await fetch(`${process.env.DB_API_URL}/db/dealyze/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DB_API_KEY_DEALYZE}` },
        body: JSON.stringify({
          user_id: userId,
          title: address || `$${price.toLocaleString()} property`,
          result_data: { metrics, verdict, ai: aiResult, inputs, address },
          status: 'active'
        })
      })
      await fetch(`${process.env.DB_API_URL}/usage/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DB_API_KEY_DEALYZE}` },
        body: JSON.stringify({ user_id: userId, product: 'dealyze', action: 'analyse_real_estate_deal' })
      })
    }

    return NextResponse.json({ metrics, verdict, ai: aiResult, address })
  } catch(err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
