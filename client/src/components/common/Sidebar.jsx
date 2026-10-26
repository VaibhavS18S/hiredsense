import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  FileCheck2,
  UploadCloud,
  Users,
  GitCompare,
  KanbanSquare,
  Sparkles,
  CalendarCheck2,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Jobs', path: '/jobs', icon: Briefcase },
    { name: 'Screening', path: '/screening', icon: FileCheck2 },
    { name: 'Upload Resumes', path: '/screening/upload', icon: UploadCloud },
    { name: 'Candidates', path: '/candidates', icon: Users },
    { name: 'Compare Studio', path: '/compare', icon: GitCompare },
    { name: 'Pipeline', path: '/pipeline', icon: KanbanSquare },
    { name: 'Talent Pool', path: '/talent-pool', icon: Sparkles },
    { name: 'Interviews', path: '/interviews', icon: CalendarCheck2 },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const settingsItems = [
    { name: 'Settings', path: '/settings/profile', icon: Settings },
  ];

  return (
    <aside
      className={`relative bg-[#FDFCFA] border-r border-border transition-all duration-200 flex flex-col z-20 ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <NavLink to="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-forest-500 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
            H
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-editorial text-lg font-semibold tracking-tight text-ink leading-tight">
                HireSense<span className="text-forest-600 font-sans text-xs ml-1 font-semibold uppercase tracking-widest">AI</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-ink-subtle">Talent Intelligence</span>
            </div>
          )}
        </NavLink>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md text-ink-subtle hover:text-ink hover:bg-sage-100 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <div className="px-2 mb-1.5">
          {!isCollapsed && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
              Recruitment Core
            </span>
          )}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-sage-100 text-forest-700 shadow-sm border border-sage-200'
                  : 'text-ink-muted hover:text-ink hover:bg-sage-50'
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-forest-600' : 'text-ink-muted'}`} />
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}

        <div className="pt-4 px-2 mb-1.5">
          {!isCollapsed && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
              Governance & Setup
            </span>
          )}
        </div>
        {settingsItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith('/settings');
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-sage-100 text-forest-700 shadow-sm border border-sage-200'
                  : 'text-ink-muted hover:text-ink hover:bg-sage-50'
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-forest-600' : 'text-ink-muted'}`} />
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-border bg-[#FAFAF8]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-forest-100 text-forest-700 font-semibold text-xs flex items-center justify-center shrink-0 border border-forest-200">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-ink truncate">{user?.name || 'Recruiter'}</span>
                <span className="text-[10px] text-ink-subtle truncate capitalize">{user?.role?.replace('_', ' ') || 'Talent Lead'}</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={logout}
              className="p-1.5 text-ink-subtle hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
