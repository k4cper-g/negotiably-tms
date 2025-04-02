'use client'

import React, { useState, useEffect } from 'react'
import { SignupForm } from "@/components/signup-form"
import Image from 'next/image';
import { SignUp } from '@clerk/clerk-react';

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set loading to false after a small delay to ensure all components are ready
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return null; // Return nothing while loading
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-8">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
              <Image 
                src="/alterionlogo-dark.png" 
                alt="Alterion Logo" 
                priority
                style={{ objectFit: 'contain' }} 
                width={120}
                height={50}
              />

          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm mx-auto">
            {/* <SignupForm /> */}
            <SignUp 
              appearance={{
                elements: {
                  rootBox: {
                    width: '100%',
                    maxWidth: '100%',
                    boxShadow: 'none',
                    margin: '0 auto',
                  },
                  card: {
                    border: 'none',
                    boxShadow: 'none',
                    backgroundColor: 'transparent',
                    maxWidth: '100%',
                    width: '100%',
                  },
                  headerTitle: {
                    fontSize: '1.5rem',
                    fontWeight: '600',
                  },
                  headerSubtitle: {
                    color: 'var(--muted-foreground, #64748b)',
                  },
                  formButtonPrimary: {
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    padding: '0.5rem 1rem',
                    '&:hover': {
                      backgroundColor: '#333333',
                    },
                  },
                  socialButtonsBlockButton: {
                    border: '1px solid var(--border, #e2e8f0)',
                    '&:hover': {
                      backgroundColor: 'var(--accent, #f8fafc)',
                    },
                  },
                  footerAction: {
                    color: 'var(--muted-foreground, #64748b)',
                  },
                  formFieldInput: {
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border, #e2e8f0)',
                    '&:focus': {
                      borderColor: 'var(--ring, #94a3b8)',
                      boxShadow: '0 0 0 1px var(--ring, #94a3b8)',
                    },
                  },
                  main: {
                    width: '100%',
                    maxWidth: '100%',
                  },
                  form: {
                    width: '100%',
                    maxWidth: '100%',
                  },
                },
                layout: {
                  socialButtonsVariant: 'iconButton',
                  socialButtonsPlacement: 'top',
                },
              }}
              signInUrl="/sign-in"
              redirectUrl="/dashboard"
            />
          </div>
        </div>
        <span className='text-center text-sm text-muted-foreground'>© 2025 Alterion. All rights reserved</span>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/hills.jpg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}

