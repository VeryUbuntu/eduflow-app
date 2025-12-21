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
        const particleCount = 280; // Increased for better density

        class Snowflake {
            x: number;
            y: number;
            radius: number;
            speedY: number;
            speedX: number;
            opacity: number;
            swing: number;
            swingStep: number;
            glow: number;

            constructor(w: number, h: number) {
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.radius = Math.random() * 2.5 + 0.5; // More varied sizes
                this.speedY = Math.random() * 1.2 + 0.3;
                this.speedX = Math.random() * 0.6 - 0.3;
                this.opacity = Math.random() * 0.5 + 0.3; // Higher opacity baseline
                this.swing = Math.random() * 3;
                this.swingStep = 0.01 + Math.random() * 0.02;
                this.glow = Math.random() * 5 + 2;
            }

            update(w: number, h: number) {
                this.y += this.speedY;
                this.x += this.speedX + Math.sin(this.y * this.swingStep) * 0.8;

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

                // Use a slight blue-ish white for better contrast on light backgrounds
                ctx.fillStyle = `rgba(240, 249, 255, ${this.opacity})`;

                // Stronger glow effect
                ctx.shadowColor = 'rgba(186, 230, 253, 0.8)';
                ctx.shadowBlur = this.glow;

                ctx.fill();

                // Reset shadow for next particle to prevent accumulation
                ctx.shadowBlur = 0;
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
