"use client";

import { usePopupStore } from "../store/usePopupStore";
import { useRouter } from "next/navigation";

export default function ActionPopup() {
  const { message, title, icon, clearPopup } = usePopupStore();
  const router = useRouter();

  if (!message) return null;

  const handleClose = () => {
    clearPopup();
    router.push("/");
  };

  return (
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-slate-950/20 backdrop-blur-[2px] vignette-overlay"
      onClick={handleClose} 
    >
      <div className="w-full max-w-sm bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col relative border border-slate-100 animate-in zoom-in-95 duration-200">
        
        <div className="px-5 pt-5 pb-5">
          
          <div className="flex justify-center mb-2">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-primary-container text-primary">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {icon}
              </span>
            </div>
          </div>
          
          <div className="text-center space-y-4">
            <h3 className="font-headline text-2xl font-black tracking-tight text-on-background">
              {title}
            </h3>
            
            <p className="text-sm leading-relaxed text-on-surface-variant font-medium">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}