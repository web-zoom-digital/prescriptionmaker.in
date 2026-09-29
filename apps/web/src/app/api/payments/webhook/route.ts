import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!secret) {
      console.warn('RAZORPAY_WEBHOOK_SECRET not set, accepting webhook (DANGEROUS IN PROD)')
      // In production, this should throw an error.
    } else {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex')

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    const event = JSON.parse(rawBody)

    // Handle different event types
    switch (event.event) {
      case 'payment.captured':
        // Payment successful
        const payment = event.payload.payment.entity
        console.log('Payment captured:', payment.id, 'Amount:', payment.amount)
        
        // TODO: Update user plan in Supabase
        // const { notes: { userId, planId } } = payment
        break
      case 'payment.failed':
        console.log('Payment failed:', event.payload.payment.entity.id)
        break
      // Add other events like subscription.charged, etc.
      default:
        console.log('Unhandled Razorpay event:', event.event)
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
