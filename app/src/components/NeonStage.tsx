import React from 'react';

/**
 * Neon viewfinder frame around the 3D stage.
 * Conic-gradient border spins for a traveling cyan→magenta light.
 * Corner L-brackets mirror the benchmark product shot.
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
      <div className="neon-stage__glow" aria-hidden />
      <div className="neon-stage__border" aria-hidden />
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
