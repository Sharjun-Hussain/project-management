"use client";

import React, { useRef, useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, Globe, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const slides = [
  "/slide1.jpg",
  "/slide2.jpg",
  "/slide3.jpg"
];

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    if (searchParams.get("expired") === "1") {
      toast.warning("Your session has expired. Please log in again to continue.", {
        duration: 5000,
        id: "session-expired",
      });
      import("next-auth/react").then(({ signOut }) => {
        signOut({ redirect: false });
      });
    }
  }, [searchParams]);

  // Autoplay functionality for the slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 4500); // 4.5 seconds
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

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
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans bg-[#F0EDEA]">
      {/* OUTER BACKGROUND LAYER (SYNCED SLIDER WITH DIAGONAL SPLIT) */}
      <div 
         className="absolute inset-0 z-0 bg-black pointer-events-none [clip-path:polygon(0_0,100%_0,100%_100%,0_100%)] lg:[clip-path:polygon(0_0,70%_0,50%_100%,0_100%)]" 
      >
         <div className="absolute inset-0">
           {slides.map((src, index) => (
             <div 
               key={index} 
               className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${currentSlide === index ? 'opacity-100' : 'opacity-0'}`}
             >
               <img src={src} alt="Outer Bg" className="w-full h-full object-cover opacity-[0.85]" />
             </div>
           ))}
         </div>
         {/* Premium overlay to slightly blur/darken the outer background like in the reference */}
         <div className="absolute inset-0 bg-black/40 backdrop-blur-[6px]" /> 
      </div>

      {/* MAIN WHITE CARD */}
      <div className="relative z-10 w-[95%] max-w-300 h-auto min-h-162.5 lg:h-[90vh] lg:max-h-212.5 bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl flex flex-col lg:flex-row overflow-hidden my-6 lg:my-0">
        
        {/* LEFT PANEL (INNER IMAGE SLIDER) */}
        {/* We absolutely position it so the container is flush on desktop, but relatively stacked on mobile */}
        <div 
          className="relative lg:absolute m-2 lg:m-0 lg:left-4 lg:top-4 lg:bottom-4 z-10 overflow-hidden rounded-[24px] lg:rounded-[32px] shadow-2xl bg-black h-65 lg:h-auto w-[calc(100%-16px)] lg:w-[56%] [clip-path:polygon(0_0,100%_0,100%_100%,0_100%)] lg:[clip-path:polygon(0_0,85%_0,100%_100%,0_100%)] shrink-0"
        >
            {/* Sliding images */}
            <div className="absolute inset-0">
              {slides.map((src, index) => (
                <div 
                  key={index} 
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${currentSlide === index ? 'opacity-100' : 'opacity-0'}`}
                >
                  <img src={src} alt="Art space" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30" />
                </div>
              ))}
            </div>

            {/* Left Inner Panel Content */}
            {/* Placed carefully to avoid the clipped right region. 20% on the right translates to slightly left of the diagonal cut. */}
            <div className="absolute top-6 lg:top-8 left-6 lg:left-8 right-[5%] lg:right-[20%] flex justify-between items-center text-white z-10">
              <div className="font-bold tracking-wide text-sm lg:text-base drop-shadow-md">My Personal Dashboard</div>
            </div>

            <div className="absolute bottom-4 lg:bottom-8 left-6 lg:left-8 right-6 lg:right-8 flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-start md:items-end z-10">
              <div className="flex items-center gap-3">
                <img src="/vercel.svg" alt="Profile" className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 border-white/20 shadow-lg object-cover bg-white p-2" />
                <div className="text-white">
                    <div className="font-bold text-base lg:text-lg leading-tight drop-shadow-md">Joon</div>
                    <div className="text-[11px] lg:text-xs text-white/90 font-medium drop-shadow-md">Software Engineer</div>
                </div>
              </div>
              
              <div className="flex gap-2 self-end">
                <button onClick={prevSlide} className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border border-white/40 flex items-center justify-center text-white hover:bg-white/20 backdrop-blur-md transition-all shadow-md active:scale-95">
                  <ArrowLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </button>
                <button onClick={nextSlide} className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border border-white/40 flex items-center justify-center text-white hover:bg-white/20 backdrop-blur-md transition-all shadow-md active:scale-95">
                  <ArrowRight className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </button>
              </div>
            </div>
        </div>

        {/* RIGHT PANEL (FORM CONTAINER) */}
        {/* Stacked below on mobile, positioned absolute right on desktop. Text is centered safely away from the slope */}
        <div className="relative lg:absolute right-0 top-0 bottom-0 z-0 flex flex-1 flex-col justify-center px-6 py-6 lg:py-0 lg:px-[5%] w-full lg:w-[51%]">
           
           <div className="absolute top-4 lg:top-8 left-6 lg:left-8 right-8 flex justify-between items-center z-10">
              <div className="font-black text-[16px] lg:text-[18px] tracking-widest text-slate-900 uppercase">
                Dashboard
              </div>
           </div>

           <div className="w-full max-w-90 mx-auto mt-12 lg:mt-12 relative z-10">
              <div className="text-center mb-8 lg:mb-10">
                <h1 className="text-4xl lg:text-[44px] font-black tracking-tight text-slate-900 mb-2 lg:mb-3">Hi Joon</h1>
                <p className="text-slate-500 font-medium text-sm lg:text-[15px]">Welcome to Personal Dashboard</p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                 <div className="space-y-1">
                   <input 
                     type="email" 
                     ref={emailRef}
                     placeholder="Email" 
                     autoComplete="email"
                     required
                     className="w-full h-14 bg-white border border-slate-300 text-slate-900 rounded-xl px-5 font-semibold focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all placeholder:text-slate-400 placeholder:font-normal"
                   />
                 </div>

                 <div className="space-y-1">
                   <input 
                     type="password" 
                     ref={passwordRef}
                     placeholder="Password"
                     autoComplete="current-password"
                     required 
                     className="w-full h-14 bg-white border border-slate-300 text-slate-900 rounded-xl px-5 font-semibold focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all placeholder:text-slate-400 placeholder:font-normal"
                   />
                 </div>

                 <div className="flex justify-end pt-2 pb-2">
                    <a href="#" className="text-xs font-extrabold text-[#eb4a36] hover:text-red-700 transition-colors">Forgot password ?</a>
                 </div>

                 <div className="pt-2">
                   <button 
                     type="submit" 
                     disabled={isLoading}
                     className="w-full h-[52px] bg-[#eb4a36] hover:bg-[#d63f2d] text-white rounded-[14px] font-bold text-[15px] transition-all shadow-lg shadow-red-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                   >
                     {isLoading ? (
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                       "Login"
                     )}
                   </button>
                 </div>
              </form>

              {/* Socials at bottom */}
              <div className="mt-16 flex justify-center items-center gap-5">
                <a href="#" className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm"><Facebook className="w-4 h-4 fill-current" /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm"><Twitter className="w-4 h-4 fill-current" /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm"><Linkedin className="w-4 h-4 fill-current" /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm"><Instagram className="w-4 h-4" /></a>
              </div>
           </div>
        </div>
      </div>
    </main>
  );
};

export default LoginForm;
