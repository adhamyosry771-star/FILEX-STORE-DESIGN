import React, { useEffect, useRef } from 'react';

interface SnowEffectProps {
  isActive: boolean;
}

interface SnowflakeParticle {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  angle: number;
  angleSpeed: number;
  swayDistance: number;
  opacity: number;
  isCrystal: boolean;
  spin: number;
  spinSpeed: number;
}

export const SnowEffect: React.FC<SnowEffectProps> = ({ isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Create 100 particles with realistic distribution
    const count = Math.min(130, Math.floor((width * height) / 9000));
    const particles: SnowflakeParticle[] = [];

    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 3.5 + 1.2;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height - height, // Spread out initially
        radius,
        speedY: Math.random() * 2.2 + 1.2 + (radius * 0.3), // Bigger falls slightly faster
        speedX: (Math.random() - 0.5) * 0.8,
        angle: Math.random() * Math.PI * 2,
        angleSpeed: Math.random() * 0.03 + 0.01,
        swayDistance: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.6 + 0.4,
        isCrystal: Math.random() > 0.75 && radius > 2.8, // 25% larger ones drawn as cute snowflake crystals
        spin: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 0.03,
      });
    }

    // Draw helper for 6-point snowflake crystal
    const drawCrystal = (c: CanvasRenderingContext2D, x: number, y: number, r: number, angle: number, alpha: number) => {
      c.save();
      c.translate(x, y);
      c.rotate(angle);
      c.strokeStyle = `rgba(235, 248, 255, ${alpha})`;
      c.lineWidth = Math.max(1, r * 0.28);
      c.beginPath();

      for (let i = 0; i < 3; i++) {
        c.rotate(Math.PI / 3);
        c.moveTo(-r, 0);
        c.lineTo(r, 0);

        // Little branch accents
        const b = r * 0.45;
        const o = r * 0.55;
        c.moveTo(o, 0);
        c.lineTo(o + b * 0.5, b * 0.6);
        c.moveTo(o, 0);
        c.lineTo(o + b * 0.5, -b * 0.6);

        c.moveTo(-o, 0);
        c.lineTo(-o - b * 0.5, b * 0.6);
        c.moveTo(-o, 0);
        c.lineTo(-o - b * 0.5, -b * 0.6);
      }

      c.stroke();
      c.restore();
    };

    let wind = 0;
    let windTarget = 0;
    let windTimer = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle dynamic wind gust shifts periodically
      windTimer++;
      if (windTimer > 200) {
        windTarget = (Math.random() - 0.5) * 1.2;
        windTimer = 0;
      }
      wind += (windTarget - wind) * 0.01;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.angle += p.angleSpeed;
        p.spin += p.spinSpeed;
        p.y += p.speedY;
        p.x += Math.sin(p.angle) * p.swayDistance + p.speedX + wind;

        // Wrap around bottom
        if (p.y > height + 15) {
          p.y = -15;
          p.x = Math.random() * width;
        }

        // Wrap around sides
        if (p.x > width + 20) {
          p.x = -20;
        } else if (p.x < -20) {
          p.x = width + 20;
        }

        if (p.isCrystal) {
          drawCrystal(ctx, p.x, p.y, p.radius * 2.2, p.spin, p.opacity);
        } else {
          // Soft glowing round snowflake
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 1.6);
          grad.addColorStop(0, `rgba(255, 255, 255, ${p.opacity})`);
          grad.addColorStop(0.5, `rgba(215, 240, 255, ${p.opacity * 0.7})`);
          grad.addColorStop(1, 'rgba(180, 220, 255, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[60] select-none"
      style={{ touchAction: 'none' }}
    />
  );
};
