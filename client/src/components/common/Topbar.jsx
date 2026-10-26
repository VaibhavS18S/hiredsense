import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Bell, Plus, CheckCircle2, AlertCircle, Building2, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

export const Topbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.success) {
        setNotifications(res.data || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (e) {
      // silent
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/talent-pool?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read', {});
      setUnreadCount(0);
      fetchNotifications();
    } catch (e) {}
  };

  return (
    <header className="h-16 bg-[#FDFCFA] border-b border-border px-6 flex items-center justify-between z-10 sticky top-0">
      {/* Global Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4 h-4 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidates, skills, jobs... (Press Enter)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F7F7F4] border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-ink placeholder:text-ink-subtle focus:outline-none focus:border-forest-500 focus:bg-white transition-all"
          />
        </form>
      </div>

      {/* Organization Badge & Actions */}
      <div className="flex items-center gap-3">
        {/* Organization Name Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-sage-50 border border-sage-200 rounded-lg text-xs text-forest-800 font-medium">
          <Building2 className="w-3.5 h-3.5 text-forest-600" />
          <span>{user?.organization?.name || 'Vanguard Talent'}</span>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-sage-50 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-dropdown border border-border p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-border mb-2">
                <span className="text-xs font-semibold text-ink">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-forest-600 hover:text-forest-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-ink-subtle">
                    No recent notifications
                  </div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n._id}
                      className={`p-2.5 rounded-lg text-xs transition-colors ${
                        n.read ? 'bg-transparent text-ink-muted' : 'bg-sage-50 text-ink font-medium border border-sage-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-ink text-[11px]">{n.title}</span>
                        <span className="text-[10px] text-ink-subtle">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-muted leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 mt-2 border-t border-border text-center">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifMenu(false)}
                  className="text-xs text-forest-600 hover:text-forest-800 font-medium"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick Action: Upload */}
        <Link
          to="/screening/upload"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F2F4F0] hover:bg-sage-100 border border-border rounded-lg text-xs font-medium text-ink transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Upload Resumes</span>
        </Link>

        {/* Quick Action: New Job */}
        <Link
          to="/jobs/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Post Job</span>
        </Link>
      </div>
    </header>
  );
};
