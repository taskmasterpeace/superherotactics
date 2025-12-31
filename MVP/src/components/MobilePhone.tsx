/**
 * MobilePhone Component - Retro UI Version
 *
 * A NeoBrutalism styled phone that:
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
  ChevronLeft,
  GripHorizontal,
  Star,
  Inbox,
} from 'lucide-react';
import { RetroButton, RetroBadge } from './ui';
import { getAllEmails, getUnreadCount as getEmailUnreadCount, markEmailRead, Email } from '../data/emailSystem';

// Message types that appear on the phone
const PHONE_MESSAGE_TYPES = ['idle_warning', 'call_incoming', 'arrival', 'handler'];

export const MobilePhone: React.FC = () => {
  const { notifications, markNotificationRead, dismissNotification } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isVibrating, setIsVibrating] = useState(false);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'messages' | 'email'>('messages');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  // Filter phone-relevant notifications
  const phoneMessages = useMemo(() => {
    return notifications.filter(n =>
      PHONE_MESSAGE_TYPES.includes(n.type) && !n.dismissed
    );
  }, [notifications]);

  const unreadCount = phoneMessages.filter(n => !n.read).length;

  // Email data
  const emails = useMemo(() => getAllEmails(), [isOpen, activeTab]);
  const emailUnreadCount = getEmailUnreadCount();

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
      case 'call_incoming': return <Phone className="w-4 h-4 text-success" />;
      case 'idle_warning': return <MessageSquare className="w-4 h-4 text-warning" />;
      case 'arrival': return <MapPin className="w-4 h-4 text-secondary" />;
      case 'handler': return <User className="w-4 h-4 text-primary" />;
      default: return <Mail className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Get badge variant for message type
  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'call_incoming': return 'success';
      case 'idle_warning': return 'warning';
      case 'arrival': return 'secondary';
      case 'handler': return 'primary';
      default: return 'default';
    }
  };

  // Format time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Phone Icon Button - NeoBrutalism Style - DRAGGABLE */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        whileDrag={{ scale: 1.05 }}
        className="fixed bottom-32 left-4 z-40 cursor-grab active:cursor-grabbing"
        animate={isVibrating ? {
          x: [0, -3, 3, -3, 3, -2, 2, 0],
          rotate: [0, -4, 4, -4, 4, -2, 2, 0],
        } : {}}
        transition={{ duration: 0.4, repeat: isVibrating ? 2 : 0 }}
      >
        <div className="relative">
          {/* Drag handle */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black/80 rounded-full px-2 py-0.5 border border-gray-600">
            <GripHorizontal className="w-4 h-3 text-gray-400" />
          </div>

          {/* Phone body - Retro Style */}
          <button
            onClick={() => setIsOpen(true)}
            className={`
              w-16 h-24 rounded-2xl
              bg-gradient-to-b from-gray-700 to-gray-800
              border-3 border-black
              shadow-retro
              flex flex-col items-center justify-center gap-1
              hover:shadow-retro-hover hover:-translate-y-1
              transition-all cursor-pointer
              ${isVibrating ? 'shadow-[6px_6px_0_0_hsl(var(--primary))]' : ''}
            `}
          >
            {/* Top speaker */}
            <div className="w-6 h-1 rounded-full bg-gray-900 border border-gray-600" />

            {/* Screen */}
            <div className={`
              w-12 h-14 rounded-lg border-2 border-black
              ${unreadCount > 0 ? 'bg-primary/20' : 'bg-surface'}
              flex items-center justify-center
            `}>
              <Smartphone className={`w-6 h-6 ${unreadCount > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>

            {/* Home button */}
            <div className="w-4 h-4 rounded-full bg-gray-900 border-2 border-black" />
          </button>

          {/* Unread badge - Retro Style */}
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-destructive text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-black shadow-retro-sm"
            >
              {unreadCount}
            </motion.div>
          )}

          {/* Vibration glow */}
          {isVibrating && (
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-primary"
              animate={{ opacity: [1, 0, 1, 0] }}
              transition={{ duration: 0.3, repeat: 3 }}
            />
          )}
        </div>
      </motion.div>

      {/* Phone Modal - NeoBrutalism Style */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Phone Interface */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-4 right-4 z-50"
            >
              {/* Phone Frame - Retro Device Style */}
              <div className="bg-gradient-to-b from-gray-700 to-gray-800 rounded-[2rem] border-4 border-black shadow-retro-lg p-3">
                {/* Top Speaker/Camera */}
                <div className="flex justify-center items-center gap-2 py-2">
                  <div className="w-2 h-2 rounded-full bg-gray-900 border border-gray-600" />
                  <div className="w-12 h-1.5 rounded-full bg-gray-900 border border-gray-600" />
                  <div className="w-2 h-2 rounded-full bg-gray-900 border border-gray-600" />
                </div>

                {/* Screen */}
                <div className="w-80 bg-background border-2 border-black rounded-2xl overflow-hidden">
                  {/* Status Bar */}
                  <div className="bg-black text-white px-4 py-1.5 flex justify-between items-center text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4].map((bar) => (
                          <div
                            key={bar}
                            className="w-1 bg-primary rounded-sm"
                            style={{ height: `${bar * 3 + 4}px` }}
                          />
                        ))}
                      </div>
                      <span className="text-primary">HERO-NET</span>
                    </div>
                    <span className="font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Header */}
                  <div className="bg-surface px-4 py-3 flex justify-between items-center border-b-2 border-black">
                    {selectedEmail ? (
                      <button
                        onClick={() => setSelectedEmail(null)}
                        className="text-foreground font-bold flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                        Back
                      </button>
                    ) : (
                      <h2 className="text-foreground font-bold flex items-center gap-2">
                        {activeTab === 'messages' ? (
                          <>
                            <MessageSquare className="w-5 h-5 text-primary" />
                            Messages
                            {unreadCount > 0 && (
                              <RetroBadge variant="destructive" size="sm">
                                {unreadCount}
                              </RetroBadge>
                            )}
                          </>
                        ) : (
                          <>
                            <Mail className="w-5 h-5 text-primary" />
                            Email
                            {emailUnreadCount > 0 && (
                              <RetroBadge variant="destructive" size="sm">
                                {emailUnreadCount}
                              </RetroBadge>
                            )}
                          </>
                        )}
                      </h2>
                    )}
                    <RetroButton
                      variant="ghost"
                      size="icon"
                      shadow="none"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="w-5 h-5" />
                    </RetroButton>
                  </div>

                  {/* Content Area */}
                  <div className="max-h-96 overflow-y-auto bg-background">
                    {activeTab === 'messages' ? (
                      /* Messages List */
                      phoneMessages.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-surface border-2 border-black flex items-center justify-center shadow-retro-sm">
                            <Smartphone className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <p className="text-muted-foreground font-semibold">No messages</p>
                          <p className="text-sm text-muted-foreground/60 mt-1">You're all caught up!</p>
                        </div>
                      ) : (
                        <div className="divide-y-2 divide-black/20">
                          {phoneMessages.map((msg) => (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`p-4 cursor-pointer transition-colors ${
                                msg.read ? 'bg-background' : 'bg-primary/5'
                              } hover:bg-surface`}
                              onClick={() => {
                                if (!msg.read) markNotificationRead(msg.id);
                              }}
                            >
                              <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className={`
                                  w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center shadow-retro-sm
                                  ${msg.type === 'call_incoming' ? 'bg-success' :
                                    msg.type === 'idle_warning' ? 'bg-warning' :
                                    msg.type === 'arrival' ? 'bg-secondary' : 'bg-primary'}
                                `}>
                                  {getMessageIcon(msg.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start gap-2">
                                    <p className={`font-bold text-sm ${msg.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                                      {msg.characterName || 'System'}
                                    </p>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                                      <Clock className="w-3 h-3" />
                                      {formatTime(msg.realTimestamp)}
                                    </span>
                                  </div>

                                  <p className={`text-sm mt-1 ${msg.read ? 'text-muted-foreground' : 'text-foreground/80'}`}>
                                    {msg.message}
                                  </p>

                                  {msg.location && (
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {msg.location}
                                    </p>
                                  )}

                                  {/* Call Actions */}
                                  {msg.type === 'call_incoming' && !msg.read && (
                                    <div className="mt-3 flex gap-2">
                                      <RetroButton
                                        variant="success"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markNotificationRead(msg.id);
                                        }}
                                      >
                                        <Phone className="w-3 h-3" /> Answer
                                      </RetroButton>
                                      <RetroButton
                                        variant="destructive"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          dismissNotification(msg.id);
                                        }}
                                      >
                                        Decline
                                      </RetroButton>
                                    </div>
                                  )}

                                  {/* Unread indicator */}
                                  {!msg.read && msg.type !== 'call_incoming' && (
                                    <div className="flex justify-end mt-2">
                                      <div className="w-2 h-2 bg-primary rounded-full" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )
                    ) : selectedEmail ? (
                      /* Email Detail View */
                      <div className="p-4">
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{selectedEmail.from.avatar || '📧'}</span>
                            <div>
                              <p className="font-bold text-foreground">{selectedEmail.from.name}</p>
                              <p className="text-xs text-muted-foreground">{selectedEmail.from.email}</p>
                            </div>
                          </div>
                          <h3 className="font-bold text-lg text-foreground mb-1">{selectedEmail.subject}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(selectedEmail.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-surface border-2 border-black rounded-lg p-3 shadow-retro-sm">
                          <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">{selectedEmail.body}</pre>
                        </div>
                        {selectedEmail.replyOptions && selectedEmail.replyOptions.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {selectedEmail.replyOptions.map((option) => (
                              <RetroButton
                                key={option.id}
                                variant={option.id === 'accept' ? 'success' : option.id === 'decline' ? 'destructive' : 'default'}
                                size="sm"
                                onClick={() => {
                                  // Handle reply action
                                  setSelectedEmail(null);
                                }}
                              >
                                {option.label}
                              </RetroButton>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Email List */
                      emails.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-surface border-2 border-black flex items-center justify-center shadow-retro-sm">
                            <Inbox className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <p className="text-muted-foreground font-semibold">No emails</p>
                          <p className="text-sm text-muted-foreground/60 mt-1">Your inbox is empty</p>
                        </div>
                      ) : (
                        <div className="divide-y-2 divide-black/20">
                          {emails.map((email) => (
                            <motion.div
                              key={email.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`p-4 cursor-pointer transition-colors ${
                                email.read ? 'bg-background' : 'bg-primary/5'
                              } hover:bg-surface`}
                              onClick={() => {
                                if (!email.read) markEmailRead(email.id);
                                setSelectedEmail(email);
                              }}
                            >
                              <div className="flex items-start gap-3">
                                {/* Avatar */}
                                <div className={`
                                  w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center shadow-retro-sm text-lg
                                  ${email.priority === 'urgent' ? 'bg-destructive' :
                                    email.category === 'mission_briefing' ? 'bg-warning' :
                                    email.category === 'intel_report' ? 'bg-secondary' : 'bg-surface'}
                                `}>
                                  {email.from.avatar || '📧'}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start gap-2">
                                    <p className={`font-bold text-sm truncate ${email.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                                      {email.from.name}
                                    </p>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      {email.starred && <Star className="w-3 h-3 text-warning fill-warning" />}
                                      <span className="text-xs text-muted-foreground">
                                        {formatTime(email.timestamp)}
                                      </span>
                                    </div>
                                  </div>

                                  <p className={`text-sm font-semibold truncate ${email.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                                    {email.subject}
                                  </p>

                                  <p className="text-xs text-muted-foreground truncate mt-1">
                                    {email.body.split('\n')[0]}
                                  </p>

                                  <div className="flex items-center gap-2 mt-2">
                                    <RetroBadge variant={
                                      email.priority === 'urgent' ? 'destructive' :
                                      email.category === 'mission_briefing' ? 'warning' :
                                      'secondary'
                                    } size="sm">
                                      {email.category.replace('_', ' ')}
                                    </RetroBadge>
                                    {!email.read && (
                                      <div className="w-2 h-2 bg-primary rounded-full" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )
                    )}
                  </div>

                  {/* Bottom Nav */}
                  <div className="bg-surface px-2 py-2 flex justify-around border-t-2 border-black">
                    <button
                      className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                        activeTab === 'messages' ? 'bg-primary/10' : 'hover:bg-surface-light'
                      }`}
                      onClick={() => { setActiveTab('messages'); setSelectedEmail(null); }}
                    >
                      <MessageSquare className={`w-5 h-5 ${activeTab === 'messages' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-xs mt-1 ${activeTab === 'messages' ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>Messages</span>
                      {unreadCount > 0 && activeTab !== 'messages' && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
                      )}
                    </button>
                    <button className="flex flex-col items-center p-2 rounded-lg hover:bg-surface-light transition-colors opacity-50 cursor-not-allowed">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs mt-1 text-muted-foreground">Calls</span>
                    </button>
                    <button
                      className={`flex flex-col items-center p-2 rounded-lg transition-colors relative ${
                        activeTab === 'email' ? 'bg-primary/10' : 'hover:bg-surface-light'
                      }`}
                      onClick={() => { setActiveTab('email'); setSelectedEmail(null); }}
                    >
                      <Mail className={`w-5 h-5 ${activeTab === 'email' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-xs mt-1 ${activeTab === 'email' ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>Email</span>
                      {emailUnreadCount > 0 && activeTab !== 'email' && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                      )}
                    </button>
                    <button className="flex flex-col items-center p-2 rounded-lg hover:bg-surface-light transition-colors opacity-50 cursor-not-allowed">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs mt-1 text-muted-foreground">Contacts</span>
                    </button>
                  </div>
                </div>

                {/* Home Button */}
                <div className="flex justify-center py-3">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-12 h-12 rounded-full bg-gray-900 border-2 border-black flex items-center justify-center hover:bg-gray-800 transition-colors shadow-retro-sm"
                  >
                    <div className="w-5 h-5 rounded-sm border-2 border-white" />
                  </button>
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
