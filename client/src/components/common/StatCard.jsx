import React from 'react';

export const StatCard = ({ title, value, subtext, trend, trendPositive = true, icon: Icon, badge }) => {
  return (
    <div className="surface-card rounded-xl p-5 hover:border-forest-300 transition-colors duration-150">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center text-forest-700">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-2xl lg:text-3xl font-semibold tracking-tight text-ink font-mono">
          {value}
        </span>
        {badge && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-sage-100 text-forest-700 border border-sage-200 font-medium">
            {badge}
          </span>
        )}
      </div>

      {(subtext || trend) && (
        <div className="mt-2.5 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`font-medium ${
                trendPositive ? 'text-forest-600' : 'text-amber-600'
              }`}
            >
              {trend}
            </span>
          )}
          {subtext && <span className="text-ink-subtle">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
