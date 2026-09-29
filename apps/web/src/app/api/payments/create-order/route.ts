import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { verifyJWT } from '@/lib/auth/jwt'

// Initialize Razorpay
// For testing locally without real keys, we'll wrap it in a try/catch or conditionally initialize
const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null

export async function POST(req: NextRequest) {
  try {
    // 1. Verify user is logged in
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.split(' ')[1] || req.cookies.get('access_token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 2. Parse request body
    const body = await req.json()
    const { amount, currency = 'INR', receipt = 'receipt_123', planId } = body

    if (!amount || !planId) {
       return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!razorpay) {
      // Mock mode for local dev if keys aren't set
      console.log('[Mock Razorpay] Creating order for amount:', amount)
      return NextResponse.json({
        id: `mock_order_${Date.now()}`,
        currency,
        amount,
        receipt,
        status: 'created'
      }, { status: 200 })
    }

    // 3. Create order with Razorpay
    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise for INR)
      currency,
      receipt: `rcpt_${payload.sub}_${Date.now()}`,
      notes: {
        userId: payload.sub,
        planId: planId
      }
    }

    const order = await razorpay.orders.create(options)
    
    return NextResponse.json(order, { status: 200 })
  } catch (error) {
    console.error('Error creating Razorpay order:', error)
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    )
  }
}
