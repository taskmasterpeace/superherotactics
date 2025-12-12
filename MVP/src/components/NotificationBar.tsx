/**
 * NotificationBar Component
 *
 * Displays notifications at the top of the screen.
 * Shows arrival messages, alerts, handler messages, etc.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/enhancedGameStore';
import { GameNotification, NotificationType } from '../types';
import {
  Bell,
  X,
  MapPin,
  AlertTriangle,
  Phone,
  Mail,
  Globe,
  Skull,
  Heart,
  User,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';

// Icon mapping for notification types
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'arrival': return <MapPin className="w-4 h-4" />;
    case 'departure': return <MapPin className="w-4 h-4" />;
    case 'status_change': return <User className="w-4 h-4" />;
    case 'mission': return <AlertTriangle className="w-4 h-4" />;
    case 'combat': return <AlertTriangle className="w-4 h-4" />;
    case 'injury': return <Heart className="w-4 h-4" />;
    case 'death': return <Skull className="w-4 h-4" />;
    case 'idle_warning': return <Bell className="w-4 h-4" />;
    case 'call_incoming': return <Phone className="w-4 h-4" />;
    case 'email': return <Mail className="w-4 h-4" />;
    case 'world_event': return <Globe className="w-4 h-4" />;
    case 'handler': return <User className="w-4 h-4" />;
    default: return <Bell className="w-4 h-4" />;
  }
};

// Color mapping for priorities
const getPriorityColors = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-600 border-red-400 text-white';
    case 'high': return 'bg-orange-600 border-orange-400 text-white';
    case 'medium': return 'bg-blue-600 border-blue-400 text-white';
    case 'low': return 'bg-gray-600 border-gray-400 text-gray-100';
    default: return 'bg-gray-600 border-gray-400 text-gray-100';
  }
};

// Individual notification item
const NotificationItem: React.FC<{
  notification: GameNotification;
  onDismiss: () => void;
  onRead: () => void;
}> = ({ notification, onDismiss, onRead }) => {
  const timeAgo = React.useMemo(() => {
    const seconds = Math.floor((Date.now() - notification.realTimestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }, [notification.realTimestamp]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className={`flex items-start gap-3 p-3 rounded-lg border ${getPriorityColors(notification.priority)} ${
        notification.read ? 'opacity-60' : ''
      }`}
      onClick={() => !notification.read && onRead()}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getNotificationIcon(notification.type)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold text-sm truncate">{notification.title}</p>
          <span className="text-xs opacity-70 flex-shrink-0">{timeAgo}</span>
        </div>
        <p className="text-xs opacity-90 line-clamp-2">{notification.message}</p>
        {notification.characterName && (
          <p className="text-xs opacity-70 mt-1">
            <User className="w-3 h-3 inline mr-1" />
            {notification.characterName}
          </p>
        )}
        {notification.location && (
          <p className="text-xs opacity-70">
            <MapPin className="w-3 h-3 inline mr-1" />
            {notification.location}
          </p>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="flex-shrink-0 p-1 hover:bg-black/20 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

// Main NotificationBar component
export const NotificationBar: React.FC = () => {
  const { notifications, dismissNotification, markNotificationRead, clearAllNotifications, getUnreadCount } = useGameStore();
  const [isExpanded, setIsExpanded] = useState(false);

  // Get visible notifications (not dismissed)
  const visibleNotifications = notifications.filter(n => !n.dismissed);
  const unreadCount = visibleNotifications.filter(n => !n.read).length;

  // Show latest notification in collapsed mode
  const latestNotification = visibleNotifications[0];

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-2xl mx-auto p-2 pointer-events-auto">
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            // Collapsed mode - show latest notification as banner
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative"
            >
              {latestNotification && (
                <div
                  className={`flex items-center gap-3 p-3 rounded-lg border shadow-lg cursor-pointer ${getPriorityColors(latestNotification.priority)}`}
                  onClick={() => setIsExpanded(true)}
                >
                  <div className="flex-shrink-0">
                    {getNotificationIcon(latestNotification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{latestNotification.title}</p>
                    <p className="text-xs opacity-90 truncate">{latestNotification.message}</p>
                  </div>

                  {unreadCount > 1 && (
                    <div className="flex-shrink-0 bg-white/20 rounded-full px-2 py-0.5">
                      <span className="text-xs font-bold">+{unreadCount - 1}</span>
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissNotification(latestNotification.id);
                    }}
                    className="flex-shrink-0 p-1 hover:bg-black/20 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <ChevronDown className="w-4 h-4 flex-shrink-0" />
                </div>
              )}
            </motion.div>
          ) : (
            // Expanded mode - show all notifications
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-900/95 backdrop-blur rounded-lg border border-gray-700 shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-yellow-400" />
                  <span className="font-bold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearAllNotifications}
                    className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                    title="Clear all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notification list */}
              <div className="max-h-80 overflow-y-auto p-2 space-y-2">
                <AnimatePresence>
                  {visibleNotifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onDismiss={() => dismissNotification(notification.id)}
                      onRead={() => markNotificationRead(notification.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NotificationBar;
