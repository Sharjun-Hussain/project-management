"use client";

import React, { useRef, useState } from "react";
import { Lock, ArrowRight, CheckCircle2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import AuthInput from "../../../components/auth/AuthInput";

const ResetPasswordForm = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const password = passwordRef.current?.value;
    const confirmPassword = confirmPasswordRef.current?.value;

    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

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
            Password updated
          </h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Your password has been successfully reset. Click below to log in securely.
          </p>
        </div>

        <div className="pt-6">
          <a
            href="/login"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] group"
          >
            Continue to Login
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md relative animate-slide-up">
      <div className="space-y-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Set new password
          </h2>
          <p className="text-muted-foreground">
            Your new password must be different from previous used passwords.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up delay-100">
          <AuthInput
            ref={passwordRef}
            label="New Password"
            type="password"
            placeholder="Create new password"
            icon={Lock}
            required
            autoComplete="new-password"
          />

          <AuthInput
            ref={confirmPasswordRef}
            label="Confirm Password"
            type="password"
            placeholder="Repeat new password"
            icon={Lock}
            required
            autoComplete="new-password"
          />

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] group mt-2"
          >
            Reset Password
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </form>

        <div className="text-center animate-slide-up delay-200">
          <a
            href="/login"
            className="text-sm font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
