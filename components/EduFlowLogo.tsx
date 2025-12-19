"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface LogoProps {
    className?: string;
    variant?: "splash" | "icon" | "sidebar";
    color?: string;
}

export function EduFlowLogo({ className, variant = "icon", color = "currentColor" }: LogoProps) {
    const isSplash = variant === "splash";
    const uniqueId = `flow-path-${Math.random().toString(36).substr(2, 9)}`;

    // Splash Screen (Full Screen Dark Theme)
    if (isSplash) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black font-sans animate-in fade-in duration-500">
                <div className="relative">
                    <svg width="120" height="120" viewBox="0 0 100 100" className="overflow-visible">
                        <path
                            id={uniqueId}
                            d="M20,50 Q35,20 50,50 T80,50"
                            fill="none"
                            stroke="#fff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            className="animate-pulse"
                            style={{
                                strokeDasharray: 100,
                                animation: "draw 3s ease-in-out infinite alternate"
                            }}
                        >
                            <animate
                                attributeName="d"
                                values="M20,50 Q35,20 50,50 T80,50; M20,50 Q35,80 50,50 T80,50; M20,50 Q35,20 50,50 T80,50"
                                dur="3s"
                                repeatCount="indefinite"
                            />
                        </path>
                        <circle r="3" fill="#fff">
                            <animateMotion dur="3s" repeatCount="indefinite">
                                <mpath href={`#${uniqueId}`} />
                            </animateMotion>
                        </circle>
                    </svg>
                </div>
                <div className="mt-6 text-center">
                    <span className="text-white font-[200] text-xl tracking-[0.5em] uppercase animate-pulse">
                        EduFlow
                    </span>
                </div>
                <style jsx>{`
          @keyframes draw {
            0% { stroke-dashoffset: 100; opacity: 0.3; }
            100% { stroke-dashoffset: 0; opacity: 1; }
          }
        `}</style>
            </div>
        );
    }

    // Sidebar / Icon Version (Scalable, Colorable)
    return (
        <div className={cn("flex items-center justify-center", className)}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="overflow-visible">
                <path
                    id={uniqueId}
                    d="M20,50 Q35,20 50,50 T80,50"
                    fill="none"
                    stroke={color}
                    strokeWidth="6"
                    strokeLinecap="round"
                >
                    {/* Only animate geometry wiggles, keep stroke solid for UI icons */}
                    <animate
                        attributeName="d"
                        values="M20,50 Q35,20 50,50 T80,50; M20,50 Q35,80 50,50 T80,50; M20,50 Q35,20 50,50 T80,50"
                        dur="4s"
                        repeatCount="indefinite"
                    />
                </path>
                <circle r="6" fill={color}>
                    <animateMotion dur="4s" repeatCount="indefinite">
                        <mpath href={`#${uniqueId}`} />
                    </animateMotion>
                </circle>
            </svg>
        </div>
    );
}
