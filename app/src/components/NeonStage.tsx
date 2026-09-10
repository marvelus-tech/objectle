import React from 'react';

/**
 * Neon viewfinder frame around the 3D stage.
 *
 * Technique: a spinning conic-gradient sits behind an inset inner panel.
 * The parent's padding creates the thin neon rim — no mask-composite needed
 * (mask-composite is flaky across browsers and was disappearing on record).
 */
export default function NeonStage({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`neon-stage ${className}`.trim()}>
      <div className="neon-stage__spin" aria-hidden />
      <div className="neon-stage__inner">
        <span className="neon-stage__corner neon-stage__corner--tl" aria-hidden />
        <span className="neon-stage__corner neon-stage__corner--tr" aria-hidden />
        <span className="neon-stage__corner neon-stage__corner--bl" aria-hidden />
        <span className="neon-stage__corner neon-stage__corner--br" aria-hidden />
        {children}
      </div>
    </div>
  );
}
