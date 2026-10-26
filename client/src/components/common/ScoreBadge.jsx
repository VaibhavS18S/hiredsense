import React from 'react';

export const ScoreBadge = ({ score, size = 'md', showLabel = false }) => {
  if (score === null || score === undefined) {
    return <span className="text-xs text-ink-subtle italic">Unscreened</span>;
  }

  const numScore = Math.round(Number(score));

  let colorClasses = 'bg-forest-50 text-forest-700 border-forest-200';
  let dotColor = 'bg-forest-500';

  if (numScore < 65) {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (numScore < 75) {
    colorClasses = 'bg-sage-100 text-ink-light border-sage-300';
    dotColor = 'bg-forest-400';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-semibold',
  }[size] || 'text-xs px-2.5 py-1';

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono tracking-tight font-medium ${colorClasses} ${sizeClasses}`}
      title={`AI Match Score: ${numScore}%`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{numScore}%</span>
      {showLabel && <span className="font-sans text-[11px] opacity-75">match</span>}
    </div>
  );
};
