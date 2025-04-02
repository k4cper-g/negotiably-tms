"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { toast } from 'sonner'
import { useMutation } from 'convex/react'
import { api } from "../../../convex/_generated/api"

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card } from '@/components/ui/card'

// Define form validation schema
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  message: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export default function DemoPage() {
  const router = useRouter()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Get the Convex mutation
  const storeDemoRequest = useMutation(api.demo.storeDemoRequest)
  
  // Initialize form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      message: "",
    },
  })

  // Form submission handler
  async function onSubmit(data: FormData) {
    try {
      setIsSubmitting(true)
      // Store the demo request in the database using Convex
      const result = await storeDemoRequest({
        email: data.email,
        message: data.message,
      })
      
      console.log("Demo request stored:", result)
      toast.success("Demo request submitted successfully!")
      setIsSubmitted(true)
    } catch (error) {
      console.error("Error submitting demo request:", error)
      toast.error("Failed to submit demo request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4 sm:px-6 flex justify-center">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Link>
        </div>

        <Card className="p-6 sm:p-10 border-2 border-primary/20 shadow-lg">
          {!isSubmitted ? (
            <>
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Book a Demo</h1>
                <p className="text-muted-foreground">
                  Interested in our AI-powered transport negotiation platform? Leave your details below and we'll get back to you shortly.
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="your.email@company.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          We'll use this email to contact you about your demo request.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about your business needs and what you'd like to see in the demo..." 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Share any specific areas of our platform you're interested in exploring.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Request Demo"}
                  </Button>
                </form>
              </Form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Thank You!</h2>
              <p className="text-muted-foreground mb-6">
                Your demo request has been submitted successfully. Our team will contact you shortly at the email address you provided.
              </p>
              <Button variant="outline" onClick={() => router.push('/')}>
                Return to Home
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}