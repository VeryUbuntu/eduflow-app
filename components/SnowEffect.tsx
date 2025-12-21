"use client";

import React, { useEffect, useRef } from 'react';

/**
 * SnowEffect Component
 * A high-performance, subtle "Let it snow" effect using HTML5 Canvas.
 * Particles simulate gravity, wind drift, and oscillation for a natural look.
 */
const SnowEffect = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Snowflake[] = [];
        const particleCount = 120; // Subtle enough not to clutter

        class Snowflake {
            x: number;
            y: number;
            radius: number;
            speedY: number;
            speedX: number;
            opacity: number;
            swing: number;
            swingStep: number;

            constructor(w: number, h: number) {
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.radius = Math.random() * 2 + 1; // Different sizes for depth
                this.speedY = Math.random() * 0.8 + 0.4;
                this.speedX = Math.random() * 0.4 - 0.2; // Gentle horizontal drift
                this.opacity = Math.random() * 0.4 + 0.2; // Semi-transparent
                this.swing = Math.random() * 2; // Oscillation amplitude
                this.swingStep = 0.01 + Math.random() * 0.02; // Oscillation frequency
            }

            update(w: number, h: number) {
                this.y += this.speedY;
                this.x += this.speedX + Math.sin(this.y * this.swingStep) * 0.5;

                // Reset if off-screen
                if (this.y > h) {
                    this.y = -10;
                    this.x = Math.random() * w;
                }
                if (this.x > w) this.x = 0;
                if (this.x < 0) this.x = w;
            }

            draw(ctx: CanvasRenderingContext2D) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
                ctx.fill();
                ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
                ctx.shadowBlur = 4;
            }
        }

        const init = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            canvas.width = w;
            canvas.height = h;

            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Snowflake(w, h));
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p) => {
                p.update(canvas.width, canvas.height);
                p.draw(ctx);
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        // Handle resize
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // Re-init particles on resize to avoid gaps
            init();
        };

        window.addEventListener('resize', handleResize);
        init();
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none"
            style={{
                zIndex: 5, // Above background, below interactive cards
                filter: 'blur(0.3px)'
            }}
        />
    );
};

export default SnowEffect;
