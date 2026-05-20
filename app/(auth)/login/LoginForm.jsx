"use client";

import React, { useRef, useState } from "react";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import AuthInput from "../../../components/auth/AuthInput";

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  
  // Using refs as requested to avoid re-renders on every keystroke
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  // Show message if session expired
  React.useEffect(() => {
    if (searchParams.get("expired") === "1") {
      toast.warning("Your session has expired. Please log in again to continue.", {
        duration: 5000,
        id: "session-expired", // prevent duplicate toasts
      });
      
      // Clear the stale NextAuth session from the client cookies
      // redirect: false ensures we stay on the login page
      import("next-auth/react").then(({ signOut }) => {
        signOut({ redirect: false });
      });
    }
  }, [searchParams]);


  async function onSubmit(e) {
    e.preventDefault();
    
    const email = emailRef.current?.value;
    const password = passwordRef.current?.value;

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Logged in successfully");
        const callbackUrl = searchParams.get("callbackUrl") || "/app";
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-md w-full">
      <div className="mb-10 text-center lg:text-left animate-slide-up">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Log in to your account
        </h2>
        <p className="text-muted-foreground">
          Welcome back! Please enter your details.
        </p>
      </div>

      <div className="space-y-6 animate-slide-up delay-100">
        <form className="space-y-5" onSubmit={onSubmit}>
          <AuthInput
            ref={emailRef}
            label="Email"
            type="email"
            placeholder="Enter your email"
            icon={Mail}
            required
            autoComplete="email"
          />

          <AuthInput
            ref={passwordRef}
            label="Password"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            required
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="peer h-4 w-4 appearance-none rounded border border-input checked:bg-indigo-600 checked:border-indigo-600 transition-colors cursor-pointer"
                />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-primary-foreground opacity-0 peer-checked:opacity-100 pointer-events-none" />
              </div>
              <label
                htmlFor="remember"
                className="text-sm font-medium text-muted-foreground cursor-pointer select-none"
              >
                Remember for 30 days
              </label>
            </div>
            <a
              href="/forgot-password"
              className="text-sm font-bold text-indigo-600 hover:text-indigo-500"
            >
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
