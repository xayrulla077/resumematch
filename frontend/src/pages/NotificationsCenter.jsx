import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Loader2,
  MessageSquare,
  Briefcase,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { notificationsAPI } from '../lib/api';
import { formatDistanceToNow } from 'date-fns';
import { uz } from 'date-fns/locale';

const NotificationsCenter = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'application', 'job', 'interview', 'system'

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await notificationsAPI.getAll();
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Load notifications error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Mark all read error:', error);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    // Filter by read status
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  }).filter(n => {
    // Filter by type
    if (typeFilter === 'all') return true;
    return n.notification_type === typeFilter;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'application':
        return <Briefcase className="w-5 h-5" />;
      case 'job':
        return <Bell className="w-5 h-5" />;
      case 'interview':
        return <Calendar className="w-5 h-5" />;
      case 'message':
        return <MessageSquare className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'application':
        return 'bg-blue-500/20 text-blue-500';
      case 'job':
        return 'bg-green-500/20 text-green-500';
      case 'interview':
        return 'bg-purple-500/20 text-purple-500';
      case 'message':
        return 'bg-pink-500/20 text-pink-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: uz });
    } catch {
      return '';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center relative">
            <Bell className="w-7 h-7 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black text-[var(--text-main)]">
              Notifications
            </h1>
            <p className="text-[var(--text-muted)] font-medium">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2"
          >
            <CheckCheck className="w-5 h-5" />
            Mark All Read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              filter === 'all' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-main)]'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              filter === 'unread' 
                ? 'bg-red-500 text-white' 
                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-main)]'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              filter === 'read' 
                ? 'bg-green-500 text-white' 
                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-main)]'
            }`}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-main)] font-bold focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Types</option>
          <option value="application">Applications</option>
          <option value="job">Jobs</option>
          <option value="interview">Interviews</option>
          <option value="message">Messages</option>
        </select>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div 
              key={notification.id}
              className={`bg-[var(--bg-surface)] border rounded-[2rem] p-6 transition-all ${
                notification.is_read 
                  ? 'border-[var(--border-main)] opacity-70' 
                  : 'border-indigo-500/30 shadow-lg shadow-indigo-500/5'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getNotificationColor(notification.notification_type)}`}>
                  {getNotificationIcon(notification.notification_type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-black text-[var(--text-main)]">
                        {notification.title}
                      </h3>
                      <p className="text-[var(--text-muted)] mt-1">
                        {notification.message}
                      </p>
                      <p className="text-sm text-[var(--text-muted)] mt-2 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-2 hover:bg-indigo-500/10 text-indigo-500 rounded-xl transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2rem] p-12 text-center">
            <BellOff className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
            <h3 className="text-xl font-black text-[var(--text-main)] mb-2">No Notifications</h3>
            <p className="text-[var(--text-muted)]">
              {filter === 'unread' 
                ? 'You have no unread notifications' 
                : filter === 'read' 
                  ? 'You have no read notifications'
                  : 'No notifications yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsCenter;