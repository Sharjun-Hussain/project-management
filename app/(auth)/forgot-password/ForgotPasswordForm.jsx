"use client";

import React, { useRef, useState } from "react";
import { Mail, ArrowRight, CheckCircle2, ArrowLeft, KeyRound } from "lucide-react";
import { toast } from "sonner";
import AuthInput from "../../../components/auth/AuthInput";

const ForgotPasswordForm = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [emailValue, setEmailValue] = useState(""); // Still need this for displaying in success state
  const emailRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const email = emailRef.current?.value;
    
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setEmailValue(email);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="animate-slide-up text-center space-y-6 w-full max-w-md">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-500/20">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Check your email
          </h2>
          <p className="text-muted-foreground mb-2">
            We sent a password reset link to
          </p>
          <p className="font-bold text-foreground text-lg">{emailValue}</p>
        </div>

        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Didn't receive the email? Check your spam folder or{" "}
          <button
            onClick={() => setIsSubmitted(false)}
            className="text-indigo-600 font-bold hover:underline"
          >
            try again
          </button>
          .
        </p>

        <div className="pt-6">
          <a
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Log In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md relative animate-fade-in">
      <a
        href="/login"
        className="absolute -top-16 lg:-top-20 left-0 text-sm font-bold text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors animate-slide-up"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Login
      </a>

      <div className="animate-slide-up delay-100 space-y-8 relative">
        <div className="mb-8">
          <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6">
            <KeyRound className="w-7 h-7 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Forgot Password?
          </h2>
          <p className="text-muted-foreground">
            No worries, we'll send you reset instructions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up delay-200">
          <AuthInput
            ref={emailRef}
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            icon={Mail}
            required
            autoComplete="email"
          />

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] group"
          >
            Send Reset Link
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
