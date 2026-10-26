import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-[#F7F7F4] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-forest-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            H
          </div>
          <span className="font-editorial text-2xl font-bold tracking-tight text-ink">
            HireSense<span className="text-forest-600 font-sans text-xs ml-1 font-semibold uppercase tracking-widest">AI</span>
          </span>
        </Link>
        <p className="text-xs text-ink-muted uppercase tracking-wider font-medium">
          Talent Acquisition & Resume Intelligence Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 border border-border rounded-2xl shadow-card">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
