"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface LogoProps {
    className?: string;
    variant?: "splash" | "icon" | "sidebar";
    color?: string;
}

export function EduFlowLogo({ className, variant = "icon", color }: LogoProps) {
    const isSplash = variant === "splash";
    const isSidebar = variant === "sidebar";
    const uniqueId = `flow-path-${Math.random().toString(36).substr(2, 9)}`;

    // Default cyan-600 for non-splash, use white for splash (on cyan bg)
    const finalColor = color || (isSplash ? "#ffffff" : "#0891b2");

    // Splash Screen (Solid Cyan Brand Color)
    if (isSplash) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cyan-600 font-sans animate-in fade-in duration-500">
                <div className="relative">
                    <svg width="120" height="120" viewBox="0 0 100 100" className="overflow-visible">
                        <path
                            id={uniqueId}
                            d="M20,50 Q35,20 50,50 T80,50"
                            fill="none"
                            stroke={finalColor}
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
                        <circle r="3" fill={finalColor}>
                            <animateMotion dur="3s" repeatCount="indefinite">
                                <mpath href={`#${uniqueId}`} />
                            </animateMotion>
                        </circle>
                    </svg>
                </div>
                <div className="mt-6 text-center">
                    <span className="text-white font-[200] text-xl tracking-[0.5em] uppercase animate-pulse drop-shadow-md">
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

    // Sidebar Version (Vertical Layout: Icon + Text)
    if (isSidebar) {
        return (
            <div className={cn("flex flex-col items-center justify-between gap-1", className)}>
                {/* Logo Graphic: Wider and flatter to match text width */}
                <div className="w-48 h-12">
                    <svg width="100%" height="100%" viewBox="0 25 100 50" className="overflow-visible" preserveAspectRatio="xMidYMid meet">
                        <path
                            id={uniqueId}
                            d="M5,50 Q25,20 50,50 T95,50"
                            fill="none"
                            stroke={finalColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            className="drop-shadow-sm"
                        >
                            <animate
                                attributeName="d"
                                values="M5,50 Q25,20 50,50 T95,50; M5,50 Q25,80 50,50 T95,50; M5,50 Q25,20 50,50 T95,50"
                                dur="4s"
                                repeatCount="indefinite"
                            />
                        </path>
                        <circle r="3" fill={finalColor}>
                            <animateMotion dur="4s" repeatCount="indefinite">
                                <mpath href={`#${uniqueId}`} />
                            </animateMotion>
                        </circle>
                    </svg>
                </div>
                {/* Text matches the visual width of the wave */}
                <span className="text-lg font-[200] tracking-[0.5em] text-cyan-800 uppercase font-sans ml-2">
                    EduFlow
                </span>
            </div>
        );
    }

    // Icon Only Version
    return (
        <div className={cn("flex items-center justify-center", className)}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="overflow-visible">
                <path
                    id={uniqueId}
                    d="M20,50 Q35,20 50,50 T80,50"
                    fill="none"
                    stroke={finalColor}
                    strokeWidth="6"
                    strokeLinecap="round"
                >
                    <animate
                        attributeName="d"
                        values="M20,50 Q35,20 50,50 T80,50; M20,50 Q35,80 50,50 T80,50; M20,50 Q35,20 50,50 T80,50"
                        dur="4s"
                        repeatCount="indefinite"
                    />
                </path>
                <circle r="6" fill={finalColor}>
                    <animateMotion dur="4s" repeatCount="indefinite">
                        <mpath href={`#${uniqueId}`} />
                    </animateMotion>
                </circle>
            </svg>
        </div>
    );
}
