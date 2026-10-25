const COLOR: Record<string, string> = { HIGH: 'var(--danger)', MEDIUM: 'var(--warn)', LOW: 'var(--ok)' };
export function RiskMeter({ score, level }: { score: number; level: string }) {
  const R = 78, C = 2 * Math.PI * R, pct = Math.max(0, Math.min(100, score));
  return (
    <div className="meter" role="img" aria-label={`Risk score ${pct} out of 100, ${level.toLowerCase()} risk`}>
      <svg width="190" height="190" viewBox="0 0 190 190">
        <circle cx="95" cy="95" r={R} fill="none" stroke="#1b221d" strokeWidth="10" />
        <circle cx="95" cy="95" r={R} fill="none" stroke={COLOR[level] || 'var(--sage)'} strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.22,.61,.36,1)' }} />
      </svg>
      <div className="val"><div><b>{pct}</b><span>{level} risk</span></div></div>
    </div>
  );
}
