"use client"

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Bot, Workflow, Zap, BarChart3, Shield, CheckCircle2, Menu, X, ChevronRight, Plus, Minus, Route, Cog, Rocket } from "lucide-react";
import { ReactNode, useState, useEffect, useRef } from "react";


import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { Icon } from "@tabler/icons-react";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useClerk } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import { AuroraText } from "@/components/ui/aurora-text";
import React from "react";
import { toast } from "sonner";
import Navbar from "@/components/navbar";

// Define types for component props
interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

interface StepCardProps {
  number: string;
  title: string;
  description: string;
}

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  avatarSrc?: string;
}

interface PricingPlan {
  monthly: number;
  yearly: number;
  title: string;
  description: string;
  features: string[];
  popular?: boolean;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface DetailedFeature {
  title: string;
  description: string;
  image: string;
}

const AuroraHeader = React.memo(({ delayAurora = 0 }: { delayAurora?: number }) => {
  return (
    <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl leading-tight">
      Smart Transport Management 
      with <AuroraText delayAurora={delayAurora}>AI-Powered</AuroraText> Solutions
    </h1>
  );
});
AuroraHeader.displayName = "AuroraHeader";

export default function Home() {
  const [isYearly, setIsYearly] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const answerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const clerk = useClerk();
  const pricingPlans: PricingPlan[] = [
    {
      title: "Basic",
      description: "Perfect for small logistics providers.",
      monthly: 10,
      yearly: 100,
      features: [
        "Up to 20 shipments/month",
        "AI marketplace comparison",
        "Basic price negotiation",
        "Email support",
        "Community access"
      ]
    },
    {
      title: "Pro",
      description: "For growing transportation companies.",
      monthly: 20,
      yearly: 200,
      features: [
        "Unlimited shipments",
        "Advanced AI negotiations",
        "Multi-marketplace access",
        "Priority support",
        "Team collaboration",
        "Route optimization"
      ],
      popular: true
    },
    {
      title: "Business",
      description: "For larger logistics operations.",
      monthly: 50,
      yearly: 500,
      features: [
        "Unlimited shipments",
        "Custom negotiation strategies",
        "All marketplace integrations",
        "24/7 dedicated support",
        "Advanced security",
        "Custom AI models",
        "API access"
      ]
    }
  ];
  const testimonials = [
    {
      quote:
        "Alterion helped us reduce freight costs by 17% through AI-powered negotiations. The platform finds the best rates automatically across marketplaces.",
      name: "James Kim",
      designation: "Logistics Manager at FastFreight",
      src: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=3560&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      quote:
        "The AI negotiation assistant is like having an expert broker on your team 24/7. It knows exactly how to secure the best rates for each route.",
      name: "Emily Watson",
      designation: "Operations Director at GlobalShip",
      src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      quote:
        "Comparing offers across different marketplaces used to take hours. Alterion does it in seconds and even handles negotiations automatically.",
      name: "Michael Rodriguez",
      designation: "Transport Coordinator at SpeedLogistics",
      src: "https://images.unsplash.com/photo-1623582854588-d60de57fa33f?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      quote:
        "The real-time route optimization combined with AI negotiation has transformed our shipping efficiency. We've cut costs by 22% in just three months.",
      name: "Sarah Johnson",
      designation: "Supply Chain Manager at QuickFreight",
      src: "https://images.unsplash.com/photo-1636041293178-808a6762ab39?q=80&w=3464&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      quote:
        "Alterion's platform has given us access to rates we never knew existed. The AI negotiation tool consistently outperforms our human negotiators.",
      name: "Lisa Thompson",
      designation: "Procurement Director at TransGlobal",
      src: "https://images.unsplash.com/photo-1624561172888-ac93c696e10c?q=80&w=2592&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
  ];

  const faqItems: FAQItem[] = [
    {
      question: "What is Alterion and how does it work?",
      answer: "Alterion is an AI-powered transportation management system that helps you find and negotiate the best shipping rates across multiple marketplaces. The platform uses artificial intelligence to analyze offers, suggest the best options, and automatically negotiate better prices with carriers."
    },
    {
      question: "How does the AI negotiation assistant work?",
      answer: "Our AI negotiation assistant uses advanced machine learning algorithms trained on thousands of successful freight negotiations. It automatically communicates with carriers, analyzes their offers, and negotiates better rates based on market conditions, route specifics, and your business requirements - all without you leaving the platform."
    },
    {
      question: "What marketplaces does Alterion integrate with?",
      answer: "Alterion integrates with all major freight and transport marketplaces including FreightWaves, DAT, Truckstop.com, 123Loadboard, and many regional transport exchanges. Our platform continually expands with new marketplace integrations based on customer needs."
    },
    {
      question: "How secure is my shipping data with Alterion?",
      answer: "Security is our top priority. We use enterprise-grade encryption for all data, comply with transportation industry regulations, and never share your sensitive information with third parties. Your negotiation strategies and rate data are completely confidential."
    },
    {
      question: "Can I try Alterion before committing?",
      answer: "Yes! We offer a 14-day free trial on all our plans. You'll get full access to all features including AI marketplace comparison and negotiation assistance during the trial period, allowing you to see the savings before you commit."
    },
    {
      question: "What kind of support do you provide?",
      answer: "We provide comprehensive support including email assistance, detailed documentation, video tutorials, and community forums. Premium plans include priority support with transportation industry experts and dedicated account managers familiar with logistics operations."
    }
  ];

  const [activeFeature, setActiveFeature] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const featureIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    // Function to move to next feature
    const nextFeature = () => {
      setActiveFeature((prev) => (prev + 1) % detailedFeatures.length);
    };

    // Set up the interval for feature changes
    featureIntervalRef.current = setInterval(nextFeature, 5000);

    // Cleanup on unmount
    return () => {
      if (featureIntervalRef.current) {
        clearInterval(featureIntervalRef.current);
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  const handleFeatureClick = (index: number) => {
    // Clear the existing interval
    if (featureIntervalRef.current) {
      clearInterval(featureIntervalRef.current);
    }
    setActiveFeature(index);
    // Restart the interval
    featureIntervalRef.current = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % detailedFeatures.length);
    }, 5000);
  };

  useEffect(() => {
    // Function to move to next step
    const nextStep = () => {
      setActiveStep((prev) => (prev + 1) % 3);
    };

    // Set up the interval for step changes
    intervalRef.current = setInterval(nextStep, 6000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  const handleStepClick = (index: number) => {
    // Clear the existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setActiveStep(index);
    // Restart the interval
    intervalRef.current = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 6000);
  };

  

  const detailedFeatures: DetailedFeature[] = [
    {
      title: "AI-Powered Rate Negotiation",
      description: "Our intelligent negotiation assistant works on your behalf to secure the best shipping rates. The AI analyzes historical data, current market conditions, and carrier behavior patterns to negotiate optimal prices, reducing your freight costs by an average of 15-20%.",
      image: "/alterion_mock2.png"
    },
    {
      title: "Multi-Marketplace Comparison",
      description: "Compare transport offers across all major freight marketplaces in one unified interface. Alterion aggregates rates from different platforms and presents them with AI-powered recommendations, saving hours of manual research and ensuring you never miss the best deal.",
      image: "/alterion_mock3.png"
    },
    {
      title: "Real-Time Analytics Dashboard",
      description: "Gain deep insights into your transport spending, negotiation performance, and carrier reliability with our comprehensive analytics. Track savings from AI negotiations, identify cost-saving opportunities, and optimize your logistics strategy with data-driven decisions.",
      image: "/alterion_mock4.png"
    },
    {
      title: "Route Planning & Optimization",
      description: "Visualize and optimize transport routes with our interactive mapping tool. Compare different routing options, view real-time traffic conditions, and find the most efficient paths for your shipments, reducing transit times and fuel costs.",
      image: "/alterion_mock5.png"
    }
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? (theme === 'system' ? systemTheme : theme) : 'light';

  

  return (
    <div 
      className="flex-auto overflow-auto home-page scroll-smooth"
      style={{
        scrollbarWidth: 'thin', // For Firefox
        scrollbarColor: 'var(--primary) transparent', // For Firefox
      }}
    >
      {/* New Navbar */}
      <Navbar />
      
      {/* Hero Section - Add padding-top to account for fixed navbar */}
      <section className="relative w-full pt-32 pb-24 px-6 md:px-12 lg:px-24 flex flex-col items-center justify-center text-center space-y-8 overflow-hidden" id="hero">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Badge className="mb-0 text-xs font-medium rounded-full cursor-pointer hover:bg-muted" variant="outline" onClick={() => toast.success("Coming soon!")}>
            <p className="flex items-center p-1">✨ Introducing AI Forwarder Agent <ChevronRight className="h-4 w-4 text-muted-foreground" /></p>
          </Badge>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {/* 
            Calculate aurora delay:
            - Initial delay of text animation: 0.4s
            - Duration of text animation: 0.6s
            - Add a little extra time (0.2s) to ensure text is fully visible
            - Total aurora delay: 0.4 + 0.6 + 0.2 = 1.2s
          */}
            <AuroraHeader delayAurora={1.2} />
        </motion.div>
        
        <motion.p 
          className="text-lg md:text-xl text-muted-foreground max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          Find and negotiate the best transport rates across multiple marketplaces with AI assistance. Compare offers, negotiate prices, and manage shipments all in one platform.
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <Button size="lg" className="gap-2" onClick={() => router.push("/sign-in")}>
            Get Started <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => router.push("/demo")}>
            Book Demo
          </Button>
        </motion.div>
        
        {/* Dashboard Preview */}
        <motion.div 
          className="relative w-full max-w-7xl mt-16 p-[1px] rounded-lg"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.8, 
            delay: 1.3,
            ease: [0.25, 0.1, 0.25, 1] 
          }}
        >
          <div className="absolute inset-0 border-2 border-primary rounded-lg " />
          <div className="relative w-full rounded-lg border shadow-2xl overflow-hidden flex justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-primary/10 z-10 pointer-events-none" />
            <iframe width="2033" height="814" src="https://www.youtube.com/embed/5I6VUHXV35A?autoplay=1&mute=1" title="Alterion - TMS Demo Showcase" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>

          </div>
        </motion.div>
      </section>

      {/* New Features Section */}
      <section className="py-24 pb-36 px-6 md:px-12 lg:px-24 bg-background" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="outline">
              <p className="flex items-center p-1">Features</p>
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Revolutionize Your Freight Management with AI
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              A comprehensive suite of AI-powered tools designed to streamline transport operations, find the best marketplace offers, and negotiate better rates automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Features List */}
            <div className="space-y-4">
              {detailedFeatures.map((feature, index) => (
                <div
                  key={index}
                  className={`transition-all duration-200 ${
                    activeFeature === index 
                      ? 'bg-background' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <button
                    onClick={() => handleFeatureClick(index)}
                    className="w-full py-4 flex items-start gap-4 text-left"
                  >
                    <div 
                      className={`w-1 self-stretch rounded-full transition-all duration-200 ${
                        activeFeature === index 
                          ? 'bg-purple-500 scale-y-100' 
                          : 'bg-purple-500/30 scale-y-50'
                      }`}
                    />
                    <div>
                      <h3 className="text-lg md:text-xl font-medium mb-2">{feature.title}</h3>
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ 
                          height: activeFeature === index ? "auto" : 0,
                          opacity: activeFeature === index ? 1 : 0
                        }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </motion.div>
                    </div>
                  </button>
                </div>
              ))}
            </div>

            {/* Feature Image */}
            <div className="relative aspect-[4/3] overflow-hidden border-2 rounded-xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={detailedFeatures[activeFeature].image}
                    alt={detailedFeatures[activeFeature].title}
                    fill
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>


      {/* Testimonials Section
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-muted/50" id="testimonials">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Used by Successful Entrepreneurs</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what our customers are saying about our platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard 
              quote={testimonials[0].quote}
              author={testimonials[0].name}
              role={testimonials[0].designation}
              avatarSrc={testimonials[0].src}
            />
            <TestimonialCard 
              quote={testimonials[1].quote}
              author={testimonials[1].name}
              role={testimonials[1].designation}
              avatarSrc={testimonials[1].src}
            />
            <TestimonialCard 
              quote={testimonials[2].quote}
              author={testimonials[2].name} 
              role={testimonials[2].designation}
              avatarSrc={testimonials[2].src}
            />
          </div>
        </div>
      </section> */}

        {/* How It Works Section */}
        <section className="py-16 px-6 md:px-12 lg:px-24" id="how-it-works">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4" variant="outline">
                <p className="flex items-center p-1">How It Works</p>
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                Book Shipments in Minutes, Not Hours
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Find, compare, and book transport with AI assistance in three simple steps.
              </p>
            </div>
            
            <div className="flex flex-col gap-8">
              {/* Steps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    icon: <Route className="w-5 h-5" />,
                    title: "Enter Shipment Details",
                    description: "Input your origin, destination, and cargo details. Our AI will search across marketplaces for the best available transport options."
                  },
                  {
                    icon: <Cog className="w-5 h-5" />,
                    title: "Compare & Select Offers",
                    description: "Review AI-recommended transport options from multiple marketplaces. Compare prices, transit times, and carrier ratings all in one place."
                  },
                  {
                    icon: <Rocket className="w-5 h-5" />,
                    title: "Negotiate & Book",
                    description: "Let our AI assistant negotiate better rates or negotiate manually. Book your shipment directly through our platform once satisfied."
                  }
                ].map((step, index) => (
                  <button
                    key={index}
                    onClick={() => handleStepClick(index)}
                    className="flex flex-col items-center text-center group"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                      <span className="text-purple-500">{step.icon}</span>
                    </div>
                    <h3 className="text-lg md:text-xl font-medium mb-2">{step.title}</h3>
                    <p className="text-sm md:text-base text-muted-foreground mb-3">{step.description}</p>
                    <div className="w-full h-0.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-purple-500 transition-all duration-200 ${
                          activeStep === index ? 'w-full' : 'w-0'
                        }`}
                      />
                    </div>
                  </button>
                ))}
              </div>

              {/* Step Image */}
              <div className="relative aspect-[16/9] overflow-hidden border-2 rounded-xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={`/step${activeStep + 1}.png`}
                      alt={["Enter Shipment Details", "Compare & Select Offers", "Negotiate & Book"][activeStep]}
                      fill
                      className="object-cover"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

      {/* Pricing Section
      <section className="py-24 px-6 md:px-12 lg:px-24" id="pricing">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Choose the plan that's right for your business. All plans include a 14-day free trial.
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
                className="data-[state=checked]:bg-primary"
              />
              <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                Yearly
                <span className="ml-1.5 inline-block text-xs py-0.5 px-1.5 bg-primary/10 text-primary rounded-full">
                  Save 20%
                </span>
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <Card 
                key={plan.title} 
                className={`p-6 flex flex-col border-2 ${
                  plan.popular 
                    ? 'border-primary shadow-lg relative' 
                    : 'hover:border-primary/50 transition-colors'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg rounded-tr-lg">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">{plan.title}</h3>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isYearly ? 'yearly' : 'monthly'}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="flex items-baseline"
                    >
                      <span className="text-4xl font-bold">
                        ${isYearly ? Math.round(plan.yearly / 12) : plan.monthly}
                      </span>
                      <span className="text-muted-foreground ml-2">/month</span>
                    </motion.div>
                  </AnimatePresence>
                  {isYearly && (
                    <p className="text-sm text-muted-foreground mt-2">
                      ${plan.yearly} billed yearly
                    </p>
                  )}
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature) => (
                    <PricingFeature key={feature}>{feature}</PricingFeature>
                  ))}
                </ul>
                <Button 
                  variant={plan.popular ? "default" : "outline"} 
                  className="w-full"
                >
                  {plan.title === "Business" ? "Contact Sales" : "Get Started"}
                </Button>
              </Card>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              Need a custom plan? <Link href="#" className="text-primary font-medium hover:underline">Contact us</Link> for custom pricing.
            </p>
          </div>
        </div>
      </section> */}

      {/* FAQ Section */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-muted/50" id="faq">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about Alterion and our services.
            </p>
          </div>
          
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="border bg-background rounded-lg transition-all duration-200 hover:border-primary/50"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-medium">{item.question}</span>
                  {openFAQ === index ? (
                    <Minus className="h-4 w-4 text-primary flex-shrink-0" />
                  ) : (
                    <Plus className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </button>
                <div
                  className="relative overflow-hidden transition-all duration-200 ease-in-out"
                  style={{
                    height: openFAQ === index ? `${answerRefs.current[index]?.offsetHeight || 0}px` : '0',
                  }}
                >
                  <div 
                    ref={el => {
                      answerRefs.current[index] = el;
                    }}
                    className="px-6 pb-4 absolute top-0 left-0 right-0"
                  >
                    <p className="text-muted-foreground">{item.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              Still have questions?{" "}
              <Link href="#" className="text-primary font-medium hover:underline">
                Contact our support team
              </Link>
            </p>
          </div>
        </div>
      </section>
      

    

      {/* CTA Section */}
      <section className="py-24 px-6 md:px-12 lg:px-24 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(var(--chart-2),0.15),transparent_50%)]"></div>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Reduce Your Transport Costs?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join other logistics teams saving time and money with our AI-powered transport management and negotiation platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="gap-2" onClick={() => router.push("/sign-in")}>
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/demo')}>
              Schedule a Demo
            </Button>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 lg:px-24 border-t">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Image 
              src={currentTheme === 'dark' ? "/alterionlogo-light.png" : "/alterionlogo-dark.png"} 
              alt="Alterion Logo" 
              width={120} 
              height={50} 
              style={{ objectFit: 'contain', height: 'auto' }}
              className="w-auto transition-all duration-200"
              suppressHydrationWarning
            />
            <p className="text-sm text-muted-foreground">
              Smart Transport Management with AI-Powered Solutions
            </p>
            <div className="flex items-center hover:bg-muted rounded-md w-fit border">
            {/* <ModeToggle /> */}
            </div>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Alterion. All rights reserved.</p>
          </div>
          <div>
            <h4 className="font-medium mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Features</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Pricing</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Marketplaces</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Roadmap</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Documentation</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Shipping Guides</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">API Reference</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Carrier Network</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">About</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Blog</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Careers</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Testimonial Card Component
function TestimonialCard({ quote, author, role, avatarSrc }: TestimonialCardProps) {
  return (
    <Card className="p-6 h-full flex flex-col">
      <div className="mb-4 text-3xl text-primary">"</div>
      <p className="text-muted-foreground mb-6 flex-grow">{quote}</p>
      <div className="flex items-center gap-3">
        {avatarSrc && (
          <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 border">
            <Image 
              src={avatarSrc} 
              alt={`${author} avatar`} 
              width={40} 
              height={40} 
              className="object-cover w-full h-full"
            />
          </div>
        )}
        <div>
          <p className="font-semibold">{author}</p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </div>
    </Card>
  );
}

// Pricing Feature Component
function PricingFeature({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}
