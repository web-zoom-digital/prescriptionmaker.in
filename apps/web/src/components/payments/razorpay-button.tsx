'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RazorpayButtonProps {
  planId: string
  amount: number
  currency?: string
  billing: 'monthly' | 'yearly'
  className?: string
  children: React.ReactNode
}

export function RazorpayButton({
  planId,
  amount,
  currency = 'INR',
  billing,
  className,
  children,
}: RazorpayButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handlePayment = async () => {
    try {
      setIsLoading(true)

      // 1. Create order on server
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency, planId }),
      })

      if (response.status === 401) {
        // Not logged in -> redirect to signup with plan details
        router.push(`/signup?plan=${planId}&billing=${billing}`)
        return
      }

      if (!response.ok) {
        throw new Error('Failed to create order')
      }

      const order = await response.json()

      // If we are in local mock mode without keys
      if (order.id.startsWith('mock_')) {
        toast.success(`Mock Payment Success for ${order.amount / 100} ${order.currency}`)
        router.push('/dashboard')
        return
      }

      // 2. Initialize Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'PrescriptionMaker',
        description: `Upgrade to ${planId} plan (${billing})`,
        order_id: order.id,
        handler: async function (response: any) {
          toast.success('Payment successful! Processing upgrade...')
          
          // Verify on server (we'd typically do this via webhook, but good to verify locally too)
          // For now, let's just pretend it succeeded and redirect
          setTimeout(() => {
            router.push('/dashboard')
          }, 1500)
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#0d9488'
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (response: any) {
        toast.error('Payment failed. Please try again.')
        console.error(response.error)
      })
      
      rzp.open()

    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className={cn('relative flex items-center justify-center', className)}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          children
        )}
      </button>
    </>
  )
}
