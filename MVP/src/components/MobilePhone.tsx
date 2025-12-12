/**
 * MobilePhone Component
 *
 * A small phone icon that:
 * - Vibrates when new messages arrive
 * - Shows unread count badge
 * - Expands to show messages when clicked
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/enhancedGameStore';
import {
  Smartphone,
  X,
  MessageSquare,
  Phone,
  Mail,
  User,
  MapPin,
  Clock,
} from 'lucide-react';

// Message types that appear on the phone
const PHONE_MESSAGE_TYPES = ['idle_warning', 'call_incoming', 'arrival', 'handler'];

export const MobilePhone: React.FC = () => {
  const { notifications, markNotificationRead, dismissNotification } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isVibrating, setIsVibrating] = useState(false);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);

  // Filter phone-relevant notifications
  const phoneMessages = useMemo(() => {
    return notifications.filter(n =>
      PHONE_MESSAGE_TYPES.includes(n.type) && !n.dismissed
    );
  }, [notifications]);

  const unreadCount = phoneMessages.filter(n => !n.read).length;

  // Vibrate effect when new message arrives
  useEffect(() => {
    if (phoneMessages.length > lastNotificationCount && !isOpen) {
      setIsVibrating(true);
      const timer = setTimeout(() => setIsVibrating(false), 1000);
      return () => clearTimeout(timer);
    }
    setLastNotificationCount(phoneMessages.length);
  }, [phoneMessages.length, lastNotificationCount, isOpen]);

  // Get icon for message type
  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'call_incoming': return <Phone className="w-4 h-4 text-green-400" />;
      case 'idle_warning': return <MessageSquare className="w-4 h-4 text-yellow-400" />;
      case 'arrival': return <MapPin className="w-4 h-4 text-blue-400" />;
      case 'handler': return <User className="w-4 h-4 text-purple-400" />;
      default: return <Mail className="w-4 h-4 text-gray-400" />;
    }
  };

  // Format time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Phone Icon Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40"
        animate={isVibrating ? {
          x: [0, -2, 2, -2, 2, -1, 1, 0],
          rotate: [0, -3, 3, -3, 3, -1, 1, 0],
        } : {}}
        transition={{ duration: 0.4, repeat: isVibrating ? 2 : 0 }}
      >
        <div className="relative">
          {/* Phone body */}
          <div className={`
            w-14 h-20 rounded-xl
            bg-gradient-to-b from-gray-800 to-gray-900
            border-2 ${unreadCount > 0 ? 'border-green-500' : 'border-gray-600'}
            shadow-lg flex flex-col items-center justify-center
            hover:border-green-400 transition-all cursor-pointer
            ${isVibrating ? 'shadow-green-500/50 shadow-xl' : ''}
          `}>
            {/* Screen */}
            <div className={`
              w-10 h-14 rounded-lg
              ${unreadCount > 0 ? 'bg-green-900/50' : 'bg-gray-700/50'}
              flex items-center justify-center
            `}>
              <Smartphone className={`w-6 h-6 ${unreadCount > 0 ? 'text-green-400' : 'text-gray-400'}`} />
            </div>

            {/* Home button */}
            <div className="w-3 h-3 rounded-full bg-gray-600 mt-1"></div>
          </div>

          {/* Unread badge */}
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
            >
              {unreadCount}
            </motion.div>
          )}

          {/* Vibration glow */}
          {isVibrating && (
            <motion.div
              className="absolute inset-0 rounded-xl bg-green-500/30"
              animate={{ opacity: [0.5, 0, 0.5, 0] }}
              transition={{ duration: 0.3, repeat: 3 }}
            />
          )}
        </div>
      </motion.button>

      {/* Phone Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Phone Interface */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 100 }}
              className="fixed bottom-4 right-4 z-50 w-80 max-h-[80vh] flex flex-col"
            >
              {/* Phone Frame */}
              <div className="bg-gray-900 rounded-3xl border-4 border-gray-800 overflow-hidden shadow-2xl">
                {/* Status Bar */}
                <div className="bg-gray-800 px-4 py-2 flex justify-between items-center text-xs text-gray-400">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <div className="flex items-center gap-2">
                    <span>SHT Network</span>
                    <div className="flex gap-0.5">
                      <div className="w-1 h-2 bg-green-500 rounded-sm"></div>
                      <div className="w-1 h-3 bg-green-500 rounded-sm"></div>
                      <div className="w-1 h-4 bg-green-500 rounded-sm"></div>
                      <div className="w-1 h-5 bg-green-500 rounded-sm"></div>
                    </div>
                  </div>
                </div>

                {/* Header */}
                <div className="bg-gray-800/50 px-4 py-3 flex justify-between items-center border-b border-gray-700">
                  <h2 className="text-white font-bold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-400" />
                    Messages
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-xs px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Messages List */}
                <div className="max-h-96 overflow-y-auto bg-gray-900">
                  {phoneMessages.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Smartphone className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No messages</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-800">
                      {phoneMessages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 cursor-pointer transition-colors ${
                            msg.read ? 'bg-gray-900' : 'bg-gray-800/50'
                          } hover:bg-gray-800`}
                          onClick={() => {
                            if (!msg.read) markNotificationRead(msg.id);
                          }}
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={`
                              w-10 h-10 rounded-full flex items-center justify-center
                              ${msg.type === 'call_incoming' ? 'bg-green-900' :
                                msg.type === 'idle_warning' ? 'bg-yellow-900' :
                                msg.type === 'arrival' ? 'bg-blue-900' : 'bg-purple-900'}
                            `}>
                              {getMessageIcon(msg.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <p className={`font-bold text-sm ${msg.read ? 'text-gray-400' : 'text-white'}`}>
                                  {msg.characterName || 'System'}
                                </p>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(msg.realTimestamp)}
                                </span>
                              </div>

                              <p className={`text-sm mt-1 ${msg.read ? 'text-gray-500' : 'text-gray-300'}`}>
                                {msg.message}
                              </p>

                              {msg.location && (
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {msg.location}
                                </p>
                              )}

                              {/* Call indicator */}
                              {msg.type === 'call_incoming' && !msg.read && (
                                <div className="mt-2 flex gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markNotificationRead(msg.id);
                                    }}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded-full text-xs font-bold flex items-center gap-1"
                                  >
                                    <Phone className="w-3 h-3" /> Answer
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      dismissNotification(msg.id);
                                    }}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded-full text-xs font-bold"
                                  >
                                    Decline
                                  </button>
                                </div>
                              )}

                              {/* Unread indicator */}
                              {!msg.read && msg.type !== 'call_incoming' && (
                                <div className="w-2 h-2 bg-green-500 rounded-full absolute right-4 top-1/2 -translate-y-1/2"></div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Nav (decorative) */}
                <div className="bg-gray-800 px-4 py-3 flex justify-around border-t border-gray-700">
                  <button className="text-green-400 flex flex-col items-center">
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-xs mt-1">Messages</span>
                  </button>
                  <button className="text-gray-500 flex flex-col items-center hover:text-gray-300">
                    <Phone className="w-5 h-5" />
                    <span className="text-xs mt-1">Calls</span>
                  </button>
                  <button className="text-gray-500 flex flex-col items-center hover:text-gray-300">
                    <Mail className="w-5 h-5" />
                    <span className="text-xs mt-1">Email</span>
                  </button>
                  <button className="text-gray-500 flex flex-col items-center hover:text-gray-300">
                    <User className="w-5 h-5" />
                    <span className="text-xs mt-1">Contacts</span>
                  </button>
                </div>

                {/* Home Bar */}
                <div className="bg-gray-900 h-2 flex justify-center items-center pb-2">
                  <div className="w-24 h-1 bg-gray-700 rounded-full"></div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobilePhone;
