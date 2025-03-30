import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Truck, ArrowRight, Zap, Clock, DollarSign, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Truck size={20} className="text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">AI Transport Bidder</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-muted-foreground hover:text-foreground">Features</Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground">How it Works</Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link>
            <Link href="#testimonials" className="text-muted-foreground hover:text-foreground">Testimonials</Link>
          </nav>
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button>Get Started</Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Automate transport deals with AI-powered negotiation
              </h1>
              <p className="text-xl text-muted-foreground">
                Find the best transport offers and let AI negotiate the best possible prices - saving you time and money.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <SignedOut>
                  <SignUpButton mode="modal">
                    <Button size="lg" className="gap-2">
                      Start Saving Today
                      <ArrowRight size={18} />
                    </Button>
                  </SignUpButton>
                  <Link href="#how-it-works">
                    <Button variant="outline" size="lg">
                      How It Works
                    </Button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <Button size="lg" className="gap-2">
                      Go to Dashboard
                      <ArrowRight size={18} />
                    </Button>
                  </Link>
                  <Link href="/offers">
                    <Button variant="outline" size="lg">
                      View Offers
                    </Button>
                  </Link>
                </SignedIn>
              </div>
            </div>
            <div className="flex-1 relative h-[400px] w-full rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80 z-10 rounded-lg"></div>
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <div className="bg-white/10 backdrop-blur-md p-8 rounded-lg border border-white/20 shadow-xl w-4/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Truck size={20} className="text-white" />
                      <span className="font-semibold text-white">Load #1248</span>
                    </div>
                    <span className="bg-green-500/20 text-green-300 py-1 px-3 rounded-full text-sm">AI Negotiating</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-white/70">Origin</span>
                      <span className="text-white font-medium">Berlin, DE</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Destination</span>
                      <span className="text-white font-medium">Madrid, ES</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Initial Price</span>
                      <span className="text-white line-through">€1,850</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">AI Negotiated</span>
                      <span className="text-green-300 font-bold">€1,620</span>
                    </div>
                    <div className="flex justify-between mt-6">
                      <span className="text-white/70">Savings</span>
                      <span className="text-green-300 font-bold">€230 (12.4%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Key Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              AI Transport Bidder saves you time and money through advanced AI-driven negotiation and automation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-card rounded-lg p-6 shadow-sm border">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                <Zap size={24} className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Negotiation</h3>
              <p className="text-muted-foreground">Our AI automatically negotiates with carriers to get you the best possible rates for your freight.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-card rounded-lg p-6 shadow-sm border">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                <Truck size={24} className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multi-Platform Integration</h3>
              <p className="text-muted-foreground">Access offers from multiple freight exchanges like Trans.eu, TimoCom, and Freightos in one place.</p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-card rounded-lg p-6 shadow-sm border">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                <Clock size={24} className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Time-Saving Automation</h3>
              <p className="text-muted-foreground">Automatically find and filter transport offers that match your requirements, saving hours of manual work.</p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-card rounded-lg p-6 shadow-sm border">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                <DollarSign size={24} className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Cost Reduction</h3>
              <p className="text-muted-foreground">On average, our users save 8-15% on their transport costs through AI-driven price negotiations.</p>
            </div>
            
            {/* Feature 5 */}
            <div className="bg-card rounded-lg p-6 shadow-sm border">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                <Shield size={24} className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Reliable</h3>
              <p className="text-muted-foreground">All your data is encrypted and protected, ensuring your business information stays confidential.</p>
            </div>
            
            {/* Feature 6 */}
            <div className="bg-card rounded-lg p-6 shadow-sm border">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                <ArrowRight size={24} className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Updates</h3>
              <p className="text-muted-foreground">Get instant notifications on new offers, price changes, and negotiation progress.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to transform your transport operations?
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
            Join thousands of companies who are saving time and money with AI Transport Bidder
          </p>
          <SignedOut>
            <SignUpButton mode="modal">
              <Button size="lg" variant="secondary" className="gap-2">
                Start Your Free Trial
                <ArrowRight size={18} />
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="gap-2">
                Go to Dashboard
                <ArrowRight size={18} />
              </Button>
            </Link>
          </SignedIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <Truck size={20} className="text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">AI Transport Bidder</span>
            </div>
            <div className="flex gap-8">
              <Link href="#" className="text-muted-foreground hover:text-foreground">Privacy</Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">Terms</Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">Contact</Link>
            </div>
          </div>
          <div className="mt-8 text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} AI Transport Bidder. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
