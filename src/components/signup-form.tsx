import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import * as Clerk from '@clerk/clerk-react'
import { useSignUp } from '@clerk/clerk-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from "next/navigation"

export function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const router = useRouter();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Timer for resending code
  useEffect(() => {
    if (pendingVerification && resendTimer === 0) {
      setResendTimer(21); // 21 seconds countdown
    }

    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [pendingVerification, resendTimer]);

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d*$/.test(value)) return;

    // Update the code array
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input if value is added
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!verificationCode[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    
    // Check if pasted content is a 6-digit number
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setVerificationCode(newCode);
      
      // Focus the last input
      inputRefs.current[5]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signUp) return;
    
    try {
      setLoading(true);
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setResendTimer(21);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    
    try {
      setLoading(true);
      setError("");
      
      if (!pendingVerification) {
        // Create the user
        await signUp.create({
          emailAddress: email,
          password,
        });
        
        // Start the sign-up verification process
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        
        // Set pending verification to true to show the verification code input
        setPendingVerification(true);
        setResendTimer(21);
      } else {
        // Combine the 6 digits into a single verification code
        const combinedCode = verificationCode.join('');
        
        if (combinedCode.length !== 6) {
          throw new Error("Please enter all 6 digits of the verification code");
        }
        
        // Attempt to verify the email with the provided code
        const completeSignUp = await signUp.attemptEmailAddressVerification({
          code: combinedCode,
        });
        
        if (completeSignUp.status !== "complete") {
          // The status can also be "abandoned" or "missing_requirements"
          throw new Error("Verification failed. Please try again.");
        }
        
        // If we reach here, the verification was successful
        await setActive({ session: completeSignUp.createdSessionId });
        
        // Show verification success UI
        setVerificationSuccess(true);
        
        // Set a small delay before redirecting to give Convex time to create the user record
        setLoading(true);
        
        // Wait for 2 seconds to allow Convex to sync the user record
        setTimeout(() => {
          // Redirect to the dashboard or home page
          router.push("/dashboard");
        }, 500);
        
        return; // Early return to prevent setLoading(false) from being called immediately
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignUp = (strategy: "oauth_github" | "oauth_google" | "oauth_apple") => {
    if (!isLoaded || !signUp) return;
    
    signUp.authenticateWithRedirect({
      strategy,
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/dashboard"
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {verificationSuccess ? (
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="p-4 rounded-full bg-green-100 mb-2">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 0C6.268 0 0 6.268 0 14C0 21.732 6.268 28 14 28C21.732 28 28 21.732 28 14C28 6.268 21.732 0 14 0ZM11.2 19.6L5.6 14L7.448 12.152L11.2 15.904L20.552 6.552L22.4 8.4L11.2 19.6Z" fill="#22C55E"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Verification Successful!</h1>
            <p className="text-balance text-sm text-muted-foreground">
              Your account has been created successfully.<br/>
              Redirecting to your dashboard...
            </p>
          </div>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        </div>
      ) : pendingVerification ? (
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="p-4 rounded-md bg-gray-700 mb-2">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 0C6.268 0 0 6.268 0 14C0 21.732 6.268 28 14 28C21.732 28 28 21.732 28 14C28 6.268 21.732 0 14 0Z" fill="#52525B"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Verify your email</h1>
            <p className="text-balance text-sm text-muted-foreground">
              Enter the verification code sent to your email ID<br/>
              <span className="flex items-center justify-center gap-1">
                {email}
                <button className="text-primary opacity-70">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.293 2.293a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1 0 1.414l-13 13A1 1 0 0 1 8 21H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 .293-.707l13-13zM5 16.414V19h2.586l12-12L17 4.414l-12 12z" fill="currentColor"/>
                  </svg>
                </button>
              </span>
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="w-full max-w-sm">
            {error && (
              <div className="block text-sm text-red-400 mb-4 text-center">
                {error}
              </div>
            )}
            
            <div className="flex justify-center gap-2">
              {verificationCode.map((digit, index) => (
                <div 
                  key={index} 
                  className={`w-11 h-11 rounded-md border ${index === 0 && digit ? 'border-2 border-primary' : 'border-input'} flex items-center justify-center overflow-hidden`}
                >
                  <input
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-full h-full text-center bg-transparent border-none outline-none"
                    required
                  />
                </div>
              ))}
            </div>
            
            <div className="text-center mt-4 text-sm text-muted-foreground">
              <button 
                type="button" 
                onClick={handleResendCode}
                disabled={resendTimer > 0 || loading}
                className={`${resendTimer > 0 ? 'cursor-not-allowed text-muted-foreground' : 'text-primary hover:underline'}`}
              >
                Didn't receive a code? {resendTimer > 0 ? `(${resendTimer}s)` : ''}
              </button>
            </div>
            
            <Button 
              type="submit" 
              className="mt-6 w-full py-5 bg-gray-800 hover:bg-gray-700 text-white font-medium flex items-center justify-center gap-2"
              disabled={loading || !isLoaded || verificationCode.some(digit => !digit)}
            >
              {loading ? "Processing..." : "Continue"}
              {!loading && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.293 18.293a1 1 0 1 0 1.414 1.414l7-7a1 1 0 0 0 0-1.414l-7-7a1 1 0 0 0-1.414 1.414L19.586 12l-6.293 6.293z" fill="currentColor"/>
                </svg>
              )}
            </Button>
          </form>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-balance text-sm text-muted-foreground">
              Enter your details below to create your account
            </p>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {error && (
              <div className="block text-sm text-red-400">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <input 
                  id="email" 
                  type="email" 
                  placeholder="m@example.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <input 
                  id="password" 
                  type="password" 
                  placeholder="•••••••••" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <div id="clerk-captcha" className="mt-2"></div>
            
            <Button 
              type="submit" 
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground"
              disabled={loading || !isLoaded}
            >
              {loading ? "Processing..." : "Sign Up"}
            </Button>

            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => handleOAuthSignUp("oauth_github")}
                className="inline-flex h-10 w-full items-center justify-center hover:bg-muted rounded-md border border-input bg-background text-sm font-medium"
                disabled={loading || !isLoaded}
              >
              <svg viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>github [#142]</title> <desc>Created with Sketch.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-140.000000, -7559.000000)" fill="#000000"> <g id="icons" transform="translate(56.000000, 160.000000)"> <path d="M94,7399 C99.523,7399 104,7403.59 104,7409.253 C104,7413.782 101.138,7417.624 97.167,7418.981 C96.66,7419.082 96.48,7418.762 96.48,7418.489 C96.48,7418.151 96.492,7417.047 96.492,7415.675 C96.492,7414.719 96.172,7414.095 95.813,7413.777 C98.04,7413.523 100.38,7412.656 100.38,7408.718 C100.38,7407.598 99.992,7406.684 99.35,7405.966 C99.454,7405.707 99.797,7404.664 99.252,7403.252 C99.252,7403.252 98.414,7402.977 96.505,7404.303 C95.706,7404.076 94.85,7403.962 94,7403.958 C93.15,7403.962 92.295,7404.076 91.497,7404.303 C89.586,7402.977 88.746,7403.252 88.746,7403.252 C88.203,7404.664 88.546,7405.707 88.649,7405.966 C88.01,7406.684 87.619,7407.598 87.619,7408.718 C87.619,7412.646 89.954,7413.526 92.175,7413.785 C91.889,7414.041 91.63,7414.493 91.54,7415.156 C90.97,7415.418 89.522,7415.871 88.63,7414.304 C88.63,7414.304 88.101,7413.319 87.097,7413.247 C87.097,7413.247 86.122,7413.234 87.029,7413.87 C87.029,7413.87 87.684,7414.185 88.139,7415.37 C88.139,7415.37 88.726,7417.2 91.508,7416.58 C91.513,7417.437 91.522,7418.245 91.522,7418.489 C91.522,7418.76 91.338,7419.077 90.839,7418.982 C86.865,7417.627 84,7413.783 84,7409.253 C84,7403.59 88.478,7399 94,7399" id="github-[#142]"> </path> </g> </g> </g> </g></svg>
              </Button>
              <Button
                type="button"
                onClick={() => handleOAuthSignUp("oauth_google")}
                className="inline-flex h-10 w-full items-center justify-center hover:bg-muted rounded-md border border-input text-sm font-medium bg-background"
                disabled={loading || !isLoaded}
              >
        <svg viewBox="-3 0 262 262" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"></path><path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"></path><path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"></path><path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335"></path></g></svg>

              </Button>
              <Button
                type="button"
                onClick={() => handleOAuthSignUp("oauth_apple")}
                className="inline-flex h-10 w-full items-center justify-center hover:bg-muted rounded-md border border-input bg-background text-sm font-medium"
                disabled={loading || !isLoaded}
              >
             <svg viewBox="-1.5 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>apple [#173]</title> <desc>Created with Sketch.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-102.000000, -7439.000000)" fill="#000000"> <g id="icons" transform="translate(56.000000, 160.000000)"> <path d="M57.5708873,7282.19296 C58.2999598,7281.34797 58.7914012,7280.17098 58.6569121,7279 C57.6062792,7279.04 56.3352055,7279.67099 55.5818643,7280.51498 C54.905374,7281.26397 54.3148354,7282.46095 54.4735932,7283.60894 C55.6455696,7283.69593 56.8418148,7283.03894 57.5708873,7282.19296 M60.1989864,7289.62485 C60.2283111,7292.65181 62.9696641,7293.65879 63,7293.67179 C62.9777537,7293.74279 62.562152,7295.10677 61.5560117,7296.51675 C60.6853718,7297.73474 59.7823735,7298.94772 58.3596204,7298.97372 C56.9621472,7298.99872 56.5121648,7298.17973 54.9134635,7298.17973 C53.3157735,7298.17973 52.8162425,7298.94772 51.4935978,7298.99872 C50.1203933,7299.04772 49.0738052,7297.68074 48.197098,7296.46676 C46.4032359,7293.98379 45.0330649,7289.44985 46.8734421,7286.3899 C47.7875635,7284.87092 49.4206455,7283.90793 51.1942837,7283.88393 C52.5422083,7283.85893 53.8153044,7284.75292 54.6394294,7284.75292 C55.4635543,7284.75292 57.0106846,7283.67793 58.6366882,7283.83593 C59.3172232,7283.86293 61.2283842,7284.09893 62.4549652,7285.8199 C62.355868,7285.8789 60.1747177,7287.09489 60.1989864,7289.62485" id="apple-[#173]"> </path> </g> </g> </g> </g></svg>
           
              </Button>
            </div>
          </form>
          <div className="text-center text-sm">
            Already have an account?{" "}
            <a
              href="/sign-in"
              className="underline underline-offset-4 hover:text-primary"
            >
              Sign in
            </a>
          </div>
        </>
      )}
    </div>
  )
}
