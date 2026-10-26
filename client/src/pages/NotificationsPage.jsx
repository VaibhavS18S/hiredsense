import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Check,
  AlertCircle,
} from 'lucide-react';
import { api } from '../api/client';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      if (res.success) {
        setNotifications(res.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (e) {}
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read', {});
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {}
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            System Alerts & Recruitment Updates
          </span>
          <h1 className="font-editorial text-3xl font-bold text-ink mt-0.5">
            Notifications Center
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Real-time notifications for batch screening completions, candidate stage changes, and interview alerts.
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border text-ink-muted hover:text-ink hover:bg-sage-50 rounded-lg text-xs font-medium transition-colors shadow-subtle self-start sm:self-auto"
        >
          <Check className="w-3.5 h-3.5 text-forest-600" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-forest-500 text-white'
              : 'bg-white border border-border text-ink-muted hover:text-ink'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-forest-500 text-white'
              : 'bg-white border border-border text-ink-muted hover:text-ink'
          }`}
        >
          Unread ({notifications.filter((n) => !n.read).length})
        </button>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-ink-muted">Loading notifications...</div>
        ) : filtered.length === 0 ? (
          <div className="surface-card rounded-2xl p-12 text-center text-xs text-ink-muted">
            <Bell className="w-8 h-8 text-ink-subtle mx-auto mb-2" />
            No notifications found in this view.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item._id}
              className={`surface-card rounded-2xl p-4 transition-all flex items-start justify-between gap-4 ${
                item.read ? 'opacity-80' : 'border-forest-300 ring-1 ring-forest-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    item.type === 'batch_completed'
                      ? 'bg-forest-100 text-forest-700'
                      : item.type === 'stage_change'
                      ? 'bg-sage-100 text-forest-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-xs text-ink">{item.title}</span>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-forest-500" />
                    )}
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed">{item.message}</p>
                  <span className="text-[10px] text-ink-subtle mt-1.5 block">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.link && (
                  <Link
                    to={item.link}
                    className="p-1.5 text-forest-600 hover:text-forest-800 hover:bg-sage-100 rounded-md transition-colors text-xs font-semibold flex items-center gap-1"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
                {!item.read && (
                  <button
                    onClick={() => markRead(item._id)}
                    className="p-1.5 text-ink-subtle hover:text-forest-700 rounded-md transition-colors"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
