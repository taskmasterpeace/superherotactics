/**
 * MobilePhone Component - Retro UI Version
 *
 * A NeoBrutalism styled phone that:
 * - Vibrates when new messages arrive
 * - Shows unread count badge
 * - Expands to show messages when clicked
 * - Contacts system for gameplay services (JA2 style)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/enhancedGameStore';
import {
  Smartphone,
  X,
  MessageSquare,
  Phone,
  PhoneCall,
  PhoneOutgoing,
  Mail,
  User,
  MapPin,
  Clock,
  ChevronLeft,
  GripHorizontal,
  Star,
  Inbox,
  Lock,
  Unlock,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { RetroButton, RetroBadge } from './ui';
import { getAllEmails, getUnreadCount as getEmailUnreadCount, markEmailRead, archiveEmail, Email, EmailReplyOption, EmailAttachment, ATTACHMENT_DIMENSIONS } from '../data/emailSystem';
import { EventBus } from '../data/eventBus';
import toast from 'react-hot-toast';
import { Paperclip, FileText, Image, MapIcon, Shield, ZoomIn, ZoomOut } from 'lucide-react';
import {
  CONTACTS,
  Contact,
  getContactCooldownRemaining,
  isContactUnlocked,
} from '../data/contactsSystem';
import { FactionType, FACTION_NAMES, FACTION_ICONS, getStandingLabel } from '../data/factionSystem';
import { CharacterPortrait } from './CharacterPortrait';
import { getMood } from '../data/moodSystem';

// Message types that appear on the phone
const PHONE_MESSAGE_TYPES = ['idle_warning', 'call_incoming', 'arrival', 'handler'];

// Contact enriched with live unlock/cooldown status (shape of contactsWithStatus entries)
type ContactStatus = Contact & {
  unlocked: boolean;
  currentStanding: number;
  standingNeeded: number;
  cooldownRemaining: number;
  canUse: boolean;
};

// Session call log entry (Calls tab)
interface CallLogEntry {
  id: string;
  contactId: string;
  alias: string;
  icon: string;
  day: number;
  minutes: number;
}

// Contact effect types that navigate the player away from the phone
const NAV_EFFECT_TYPES: string[] = ['shop_access', 'heal_bonus'];

// Format in-game minutes-since-midnight as HH:MM
const formatGameClock = (minutes: number): string => {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// Diegetic line the contact says when you call them
const getCallLine = (contact: Contact): string => {
  const shopEffect = contact.effects.find(e => e.type === 'shop_access');
  if (shopEffect) {
    switch (shopEffect.value) {
      case 'black_market':
        return 'Got what you need. Meet me at the market — ask for the back room.';
      case 'weapon_mods':
        return "Bench is open. Bring your hardware and I'll make it sing.";
      case 'military_gear':
        return 'Requisition cleared. Come see what fell off the truck.';
      default:
        return 'Got what you need. Come see me.';
    }
  }
  if (contact.effects.some(e => e.type === 'heal_bonus')) {
    return 'Bring your wounded around back. No names, no charts, no questions.';
  }
  return "I'm ready when you are.";
};

// Plain-words summary of what a shop_access perk actually unlocks
const getShopUnlockMessage = (shopType: string): string => {
  switch (shopType) {
    case 'black_market':
      return 'Black Market unlocked — Equipment Shop now shows illegal weapons and restricted gear.';
    case 'weapon_mods':
      return 'Weapon Mods unlocked — Equipment Shop now offers weapon modifications.';
    case 'military_gear':
      return 'Military Hardware unlocked — Equipment Shop now stocks military-grade weapons and armor.';
    default:
      return `New gear access unlocked — check the Equipment Shop (${shopType.replace(/_/g, ' ')}).`;
  }
};

export const MobilePhone: React.FC = () => {
  const {
    notifications,
    markNotificationRead,
    dismissNotification,
    factionStandings,
    budget,
    modifyBudget,
    gameTime,
    setCurrentView,
    addNotification,
    characters,
    startCharacterCall,
    callLog,
  } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isVibrating, setIsVibrating] = useState(false);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'messages' | 'email' | 'contacts' | 'calls'>('messages');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactLastUsed, setContactLastUsed] = useState<Map<string, number>>(new Map());
  const [activeCall, setActiveCall] = useState<ContactStatus | null>(null);
  const [callHistory, setCallHistory] = useState<CallLogEntry[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<EmailAttachment | null>(null);
  const [attachmentZoomed, setAttachmentZoomed] = useState(false);

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

  // Contacts data - compute unlock status from faction standings
  const contactsWithStatus = useMemo(() => {
    // Build a map of faction type -> standing
    const standingMap = new Map<FactionType, number>();
    factionStandings.forEach(fs => {
      const current = standingMap.get(fs.factionType) ?? -100;
      // Use the best standing across all countries for that faction type
      if (fs.standing > current) {
        standingMap.set(fs.factionType, fs.standing);
      }
    });

    return CONTACTS.map(contact => {
      const standing = standingMap.get(contact.factionType) ?? 0;
      const unlocked = isContactUnlocked(contact, standing);
      const currentHour = (gameTime?.day ?? 0) * 24 + (gameTime?.hour ?? 0);
      const cooldownRemaining = getContactCooldownRemaining(
        contact,
        contactLastUsed.get(contact.id) ?? null,
        currentHour
      );

      return {
        ...contact,
        unlocked,
        currentStanding: standing,
        standingNeeded: Math.max(0, contact.requiredStanding - standing),
        cooldownRemaining,
        canUse: unlocked && cooldownRemaining === 0 && budget >= contact.baseCost,
      };
    }).sort((a, b) => {
      // Unlocked first, then by faction, then by required standing
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      return a.requiredStanding - b.requiredStanding;
    });
  }, [factionStandings, contactLastUsed, gameTime, budget]);

  const unlockedContactsCount = contactsWithStatus.filter(c => c.unlocked).length;

  // Calls tab shows BOTH service-contact calls (local session) and character
  // calls (store log, includes incoming), newest first.
  const mergedCallHistory = useMemo(() => {
    const contactCalls = callHistory.map(c => ({ ...c, direction: 'outgoing' as const, isCharacter: false }));
    const charCalls = (callLog || []).map(l => ({
      id: l.id,
      contactId: l.callerId,
      alias: l.callerName,
      icon: l.direction === 'incoming' ? '📲' : '📞',
      day: l.day,
      minutes: l.minutes,
      direction: l.direction,
      isCharacter: true,
    }));
    return [...contactCalls, ...charCalls]
      .sort((a, b) => (b.day * 1440 + b.minutes) - (a.day * 1440 + a.minutes));
  }, [callHistory, callLog]);

  // Consume a contact's service: pay, start cooldown, log the call, fire effects
  const executeContactEffects = (contact: ContactStatus) => {
    // Deduct cost
    if (contact.baseCost > 0) {
      modifyBudget(-contact.baseCost, `Used contact: ${contact.alias}`);
    }

    // Record usage time
    const currentHour = (gameTime?.day ?? 0) * 24 + (gameTime?.hour ?? 0);
    setContactLastUsed(prev => new Map(prev).set(contact.id, currentHour));

    // Log the call for the Calls tab (session history)
    setCallHistory(prev => [
      {
        id: `call-${Date.now()}-${contact.id}`,
        contactId: contact.id,
        alias: contact.alias,
        icon: contact.icon,
        day: gameTime?.day ?? 1,
        minutes: gameTime?.minutes ?? 0,
      },
      ...prev,
    ]);

    // Process contact effects
    contact.effects.forEach(effect => {
      switch (effect.type) {
        case 'shop_access':
          // Navigate to shop with specific filter
          addNotification({
            type: 'handler',
            title: `${contact.alias} connected`,
            message: getShopUnlockMessage(effect.value as string),
            priority: 'medium',
          });
          setIsOpen(false);
          setSelectedContact(null);
          // Store the shop type for filtering (using sessionStorage for now)
          sessionStorage.setItem('activeShopType', effect.value as string);
          setCurrentView('equipment-shop');
          break;

        case 'heal_bonus':
          addNotification({
            type: 'handler',
            title: `${contact.alias} is ready`,
            message: `Healing bonus active: ${effect.description}`,
            priority: 'medium',
          });
          setIsOpen(false);
          setSelectedContact(null);
          sessionStorage.setItem('healingBonus', String(effect.value));
          setCurrentView('hospital');
          break;

        case 'intel':
          // Provide intel as notification
          addNotification({
            type: 'handler',
            title: `Intel from ${contact.alias}`,
            message: getIntelMessage(effect.value as string),
            priority: 'high',
          });
          break;

        case 'travel':
          addNotification({
            type: 'handler',
            title: `${contact.alias} on standby`,
            message: `Fast travel available: ${effect.description}`,
            priority: 'medium',
          });
          sessionStorage.setItem('fastTravelEnabled', 'true');
          break;

        case 'reputation':
          addNotification({
            type: 'handler',
            title: `${contact.alias} worked their magic`,
            message: effect.description,
            priority: 'high',
          });
          // Store reputation effect for processing
          sessionStorage.setItem('reputationEffect', effect.value as string);
          break;

        case 'discount':
          addNotification({
            type: 'handler',
            title: `${contact.alias} hooked you up`,
            message: `Discount active: ${effect.description}`,
            priority: 'medium',
          });
          sessionStorage.setItem('activeDiscount', String(effect.value));
          break;

        case 'unlock':
          addNotification({
            type: 'handler',
            title: `${contact.alias} opened doors`,
            message: effect.description,
            priority: 'high',
          });
          sessionStorage.setItem(`unlock_${effect.value}`, 'true');
          break;
      }
    });

    setSelectedContact(null);
  };

  // Handle using a contact service.
  // Contacts whose effects navigate away (shop/hospital) get an in-phone call
  // screen first — nothing is paid or consumed until the player picks GO NOW.
  const handleUseContact = (contact: ContactStatus) => {
    if (!contact.canUse) return;

    const navigatesAway = contact.effects.some(e => NAV_EFFECT_TYPES.includes(e.type));
    if (navigatesAway) {
      setActiveCall(contact);
      return;
    }

    executeContactEffects(contact);
  };

  // Handle email reply action
  const handleEmailReply = (email: Email, option: EmailReplyOption) => {
    const store = useGameStore.getState();
    const countryCode = store.selectedCountry || 'US';

    // Process effects
    if (option.effect) {
      // Reputation effect - modify faction standing
      if (option.effect.reputation) {
        // Apply to primary faction based on email category
        const factionMap: Record<string, FactionType> = {
          mission_briefing: 'government',
          intel_report: 'police',
          contact: 'underworld',
          news_tip: 'media',
          admin: 'government',
          personal: 'media',
        };
        const faction = factionMap[email.category] || 'government';
        store.modifyFactionStanding(faction, countryCode, option.effect.reputation, `Email response: ${option.label}`);
      }

      // Trigger mission acceptance
      if (option.effect.triggersMission && email.actionable?.missionId) {
        EventBus.emit({
          type: 'mission:accepted',
          data: {
            missionId: email.actionable.missionId,
            source: 'email',
          },
        });
        toast.success(`Mission accepted: ${email.subject.replace('MISSION: ', '')}`);
      }
    }

    // Show confirmation toast
    toast(option.response, {
      icon: option.id === 'accept' ? '✅' : option.id === 'decline' ? '❌' : '📧',
      duration: 3000,
    });

    // Archive the email after reply
    archiveEmail(email.id);
    setSelectedEmail(null);
  };

  // Get intel message based on intel type
  const getIntelMessage = (intelType: string): string => {
    switch (intelType) {
      case 'full_map':
        return 'Enemy positions revealed on next mission.';
      case 'enemy_stats':
        return 'Enemy loadouts and capabilities now visible.';
      case 'patrol_routes':
        return 'Patrol patterns uploaded to your tactical display.';
      case 'police_response':
        return 'Police scanner active - you\'ll know when they\'re coming.';
      case 'upcoming_events':
        return 'Got word on some opportunities coming up...';
      default:
        return 'Intel received.';
    }
  };

  // Hang up any pending call screen when the phone closes (effect stays unconsumed)
  useEffect(() => {
    if (!isOpen) {
      setActiveCall(null);
    }
  }, [isOpen]);

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

                {/* Screen - true 9:16 portrait, same height on every tab (guarded for short viewports) */}
                <div className="w-[340px] h-[min(604px,72vh)] bg-background border-2 border-black rounded-2xl overflow-hidden flex flex-col">
                  {/* Status Bar */}
                  <div className="flex-shrink-0 bg-black text-white px-4 py-1.5 flex justify-between items-center text-xs font-bold">
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
                  <div className="flex-shrink-0 bg-surface px-4 py-3 flex justify-between items-center border-b-2 border-black">
                    {selectedEmail || selectedContact || activeCall ? (
                      <button
                        onClick={() => { setSelectedEmail(null); setSelectedContact(null); setActiveCall(null); }}
                        className="text-foreground font-bold flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                        {activeCall ? 'Hang Up' : 'Back'}
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
                        ) : activeTab === 'contacts' ? (
                          <>
                            <User className="w-5 h-5 text-primary" />
                            Contacts
                            <RetroBadge variant="secondary" size="sm">
                              {unlockedContactsCount}/{CONTACTS.length}
                            </RetroBadge>
                          </>
                        ) : activeTab === 'calls' ? (
                          <>
                            <Phone className="w-5 h-5 text-primary" />
                            Calls
                            {callHistory.length > 0 && (
                              <RetroBadge variant="secondary" size="sm">
                                {callHistory.length}
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

                  {/* Content Area - flexes to fill the 9:16 screen on every tab */}
                  <div className="flex-1 min-h-0 overflow-y-auto bg-background">
                    {activeCall ? (
                      /* In-Phone Call Screen - shown before navigation effects fire */
                      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-20 h-20 rounded-2xl bg-surface border-2 border-black flex items-center justify-center shadow-retro text-4xl mb-3"
                        >
                          {activeCall.icon}
                        </motion.div>
                        <div className="flex items-center gap-2 mb-1">
                          <PhoneCall className="w-4 h-4 text-success animate-pulse" />
                          <span className="text-xs font-bold text-success uppercase tracking-wider">Connected</span>
                        </div>
                        <h3 className="font-bold text-lg text-foreground">{activeCall.alias}</h3>
                        <RetroBadge variant="secondary" size="sm" className="mt-1">
                          {FACTION_ICONS[activeCall.factionType]} {FACTION_NAMES[activeCall.factionType]}
                        </RetroBadge>

                        <div className="mt-4 w-full bg-surface border-2 border-black rounded-lg p-3 shadow-retro-sm">
                          <p className="text-sm text-foreground italic">
                            "{getCallLine(activeCall)}"
                          </p>
                        </div>

                        <div className="mt-5 w-full flex flex-col gap-2">
                          <RetroButton
                            variant="success"
                            className="w-full"
                            onClick={() => {
                              const contact = activeCall;
                              setActiveCall(null);
                              if (contact) executeContactEffects(contact);
                            }}
                          >
                            GO NOW -&gt;
                          </RetroButton>
                          <RetroButton
                            variant="ghost"
                            className="w-full"
                            onClick={() => setActiveCall(null)}
                          >
                            LATER
                          </RetroButton>
                        </div>
                      </div>
                    ) : activeTab === 'messages' ? (
                      /* Messages List */
                      phoneMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
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
                    ) : activeTab === 'email' ? (
                      /* Email Tab */
                      selectedEmail ? (
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

                          {/* Attachments */}
                          {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-muted-foreground font-semibold mb-2 flex items-center gap-1">
                                <Paperclip className="w-3 h-3" />
                                ATTACHMENTS ({selectedEmail.attachments.length})
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {selectedEmail.attachments.map((attachment) => (
                                  <button
                                    key={attachment.id}
                                    onClick={() => setSelectedAttachment(attachment)}
                                    className="flex items-center gap-2 px-3 py-2 bg-surface border-2 border-black rounded-lg shadow-retro-sm hover:bg-primary/10 transition-colors"
                                  >
                                    {attachment.type === 'photo' && <Image className="w-4 h-4 text-secondary" />}
                                    {attachment.type === 'dossier' && <User className="w-4 h-4 text-warning" />}
                                    {attachment.type === 'map' && <MapPin className="w-4 h-4 text-primary" />}
                                    {attachment.type === 'document' && <FileText className="w-4 h-4 text-muted-foreground" />}
                                    {attachment.type === 'intel' && <Shield className="w-4 h-4 text-destructive" />}
                                    <span className="text-xs font-semibold">{attachment.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedEmail.replyOptions && selectedEmail.replyOptions.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {selectedEmail.replyOptions.map((option) => (
                                <RetroButton
                                  key={option.id}
                                  variant={option.id === 'accept' ? 'success' : option.id === 'decline' ? 'destructive' : 'default'}
                                  size="sm"
                                  onClick={() => handleEmailReply(selectedEmail, option)}
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
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
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
                    )
                    ) : activeTab === 'contacts' ? (
                      /* Contacts Tab */
                      selectedContact ? (
                        /* Contact Detail View */
                      <div className="p-4">
                        <div className="text-center mb-4">
                          <div className="w-16 h-16 mx-auto mb-2 rounded-xl bg-surface border-2 border-black flex items-center justify-center shadow-retro-sm text-3xl">
                            {selectedContact.icon}
                          </div>
                          <h3 className="font-bold text-lg text-foreground">{selectedContact.alias}</h3>
                          <p className="text-xs text-muted-foreground">{selectedContact.name}</p>
                          <RetroBadge variant="secondary" size="sm" className="mt-1">
                            {FACTION_ICONS[selectedContact.factionType]} {FACTION_NAMES[selectedContact.factionType]}
                          </RetroBadge>
                        </div>

                        <div className="bg-surface border-2 border-black rounded-lg p-3 shadow-retro-sm mb-3">
                          <p className="text-sm text-foreground mb-2">{selectedContact.description}</p>
                          <div className="border-t border-black/20 pt-2 mt-2">
                            <p className="font-bold text-sm text-primary">{selectedContact.serviceName}</p>
                            <p className="text-xs text-muted-foreground">{selectedContact.serviceDescription}</p>
                          </div>
                        </div>

                        {/* Service Info */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-surface border-2 border-black rounded-lg p-2 text-center">
                            <DollarSign className="w-4 h-4 mx-auto text-warning" />
                            <p className="text-xs font-bold">{selectedContact.baseCost > 0 ? `$${selectedContact.baseCost}` : 'FREE'}</p>
                          </div>
                          <div className="bg-surface border-2 border-black rounded-lg p-2 text-center">
                            <Clock className="w-4 h-4 mx-auto text-secondary" />
                            <p className="text-xs font-bold">{selectedContact.cooldownHours > 0 ? `${selectedContact.cooldownHours}h CD` : 'No CD'}</p>
                          </div>
                        </div>

                        {/* Use Service Button */}
                        {(() => {
                          const c = contactsWithStatus.find(x => x.id === selectedContact.id);
                          if (!c) return null;

                          if (!c.unlocked) {
                            return (
                              <div className="bg-destructive/10 border-2 border-destructive rounded-lg p-3 text-center">
                                <Lock className="w-5 h-5 mx-auto text-destructive mb-1" />
                                <p className="text-sm font-bold text-destructive">LOCKED</p>
                                <p className="text-xs text-muted-foreground">Need +{c.standingNeeded} {FACTION_NAMES[c.factionType]} standing</p>
                              </div>
                            );
                          }

                          if (c.cooldownRemaining > 0) {
                            return (
                              <div className="bg-warning/10 border-2 border-warning rounded-lg p-3 text-center">
                                <Clock className="w-5 h-5 mx-auto text-warning mb-1" />
                                <p className="text-sm font-bold text-warning">ON COOLDOWN</p>
                                <p className="text-xs text-muted-foreground">{c.cooldownRemaining}h remaining</p>
                              </div>
                            );
                          }

                          if (budget < c.baseCost) {
                            return (
                              <div className="bg-destructive/10 border-2 border-destructive rounded-lg p-3 text-center">
                                <AlertCircle className="w-5 h-5 mx-auto text-destructive mb-1" />
                                <p className="text-sm font-bold text-destructive">INSUFFICIENT FUNDS</p>
                                <p className="text-xs text-muted-foreground">Need ${c.baseCost - budget} more</p>
                              </div>
                            );
                          }

                          return (
                            <RetroButton
                              variant="success"
                              className="w-full"
                              onClick={() => handleUseContact(c)}
                            >
                              <Phone className="w-4 h-4" />
                              Call {c.alias}
                              {c.baseCost > 0 && <span className="ml-1 opacity-80">(-${c.baseCost})</span>}
                            </RetroButton>
                          );
                        })()}
                      </div>
                    ) : (
                      /* Contacts List — your team first, then service contacts */
                      <div>
                        {/* YOUR TEAM — ring an operative for a mood-driven check-in */}
                        {characters.filter((c: any) => c.status !== 'dead').length > 0 && (
                          <div>
                            <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Your Team
                            </div>
                            <div className="divide-y-2 divide-black/10">
                              {characters.filter((c: any) => c.status !== 'dead').map((char: any) => {
                                const mood = getMood(char);
                                return (
                                  <div
                                    key={char.id}
                                    className="p-3 px-4 cursor-pointer bg-background hover:bg-surface transition-colors"
                                    onClick={() => { startCharacterCall(char.id); setIsOpen(false); }}
                                    title={`Call ${char.name || char.realName}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <CharacterPortrait character={char} size={36} />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-foreground truncate">
                                          {char.name || char.realName}
                                        </p>
                                        <div className="flex items-center gap-2">
                                          <span
                                            className="text-[10px] font-bold uppercase"
                                            style={{ color: mood.color }}
                                          >
                                            {mood.emoji} {mood.label}
                                          </span>
                                          <span className="text-[10px] text-muted-foreground">{char.status}</span>
                                        </div>
                                      </div>
                                      <PhoneCall className="w-4 h-4 text-success flex-shrink-0" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-t-2 border-black/20">
                              Services
                            </div>
                          </div>
                        )}
                      {contactsWithStatus.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                          <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-surface border-2 border-black flex items-center justify-center shadow-retro-sm">
                            <User className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <p className="text-muted-foreground font-semibold">No contacts</p>
                          <p className="text-sm text-muted-foreground/60 mt-1">Build faction reputation to unlock</p>
                        </div>
                      ) : (
                        <div className="divide-y-2 divide-black/20">
                          {contactsWithStatus.map((contact) => (
                            <motion.div
                              key={contact.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`p-4 cursor-pointer transition-colors ${
                                contact.unlocked ? 'bg-background hover:bg-surface' : 'bg-black/5'
                              }`}
                              onClick={() => setSelectedContact(contact)}
                            >
                              <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className={`
                                  w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center shadow-retro-sm text-lg
                                  ${contact.unlocked ? 'bg-surface' : 'bg-gray-300 opacity-50'}
                                `}>
                                  {contact.unlocked ? contact.icon : <Lock className="w-4 h-4 text-muted-foreground" />}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start gap-2">
                                    <p className={`font-bold text-sm ${contact.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                                      {contact.unlocked ? contact.alias : '???'}
                                    </p>
                                    {contact.unlocked ? (
                                      <Unlock className="w-3 h-3 text-success flex-shrink-0" />
                                    ) : (
                                      <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                    )}
                                  </div>

                                  <p className="text-xs text-muted-foreground truncate">
                                    {contact.unlocked ? contact.serviceName : `Req: ${contact.requiredStanding} ${FACTION_NAMES[contact.factionType]}`}
                                  </p>

                                  <div className="flex items-center gap-2 mt-1">
                                    <RetroBadge
                                      variant={contact.unlocked ? 'secondary' : 'default'}
                                      size="sm"
                                    >
                                      {FACTION_ICONS[contact.factionType]} {FACTION_NAMES[contact.factionType]}
                                    </RetroBadge>
                                    {contact.unlocked && contact.baseCost > 0 && (
                                      <span className="text-xs text-warning font-bold">${contact.baseCost}</span>
                                    )}
                                    {contact.unlocked && contact.cooldownRemaining > 0 && (
                                      <span className="text-xs text-muted-foreground">{contact.cooldownRemaining}h CD</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                      </div>
                    )
                    ) : activeTab === 'calls' ? (
                      /* Calls Tab - contact + character call history */
                      mergedCallHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                          <div className="w-16 h-16 mb-3 rounded-xl bg-surface border-2 border-black flex items-center justify-center shadow-retro-sm">
                            <Phone className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <p className="text-muted-foreground font-semibold">No calls yet</p>
                          <p className="text-sm text-muted-foreground/60 mt-1">Call a contact or an operative from the Contacts tab</p>
                        </div>
                      ) : (
                        <div className="divide-y-2 divide-black/20">
                          {mergedCallHistory.map((call: any) => (
                            <motion.div
                              key={call.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="p-4 flex items-center gap-3 cursor-pointer hover:bg-surface transition-colors"
                              onClick={() => {
                                if (call.isCharacter) {
                                  // Tap a character entry to ring them again
                                  startCharacterCall(call.contactId);
                                  setIsOpen(false);
                                  return;
                                }
                                const contact = contactsWithStatus.find(c => c.id === call.contactId);
                                if (contact) {
                                  setActiveTab('contacts');
                                  setSelectedContact(contact);
                                }
                              }}
                            >
                              {call.isCharacter ? (
                                <CharacterPortrait
                                  character={characters.find((c: any) => c.id === call.contactId) || { realName: call.alias }}
                                  size={40}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center shadow-retro-sm text-lg bg-surface">
                                  {call.icon}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center gap-2">
                                  <p className="font-bold text-sm text-foreground truncate">{call.alias}</p>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                                    {call.direction === 'incoming' ? (
                                      <><PhoneCall className="w-3 h-3 text-secondary" /> Incoming</>
                                    ) : (
                                      <><PhoneOutgoing className="w-3 h-3 text-success" /> Outgoing</>
                                    )}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Day {call.day} · {formatGameClock(call.minutes)}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )
                    ) : null}
                  </div>

                  {/* Bottom Nav */}
                  <div className="flex-shrink-0 bg-surface px-2 py-2 flex justify-around border-t-2 border-black">
                    <button
                      className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                        activeTab === 'messages' ? 'bg-primary/10' : 'hover:bg-surface-light'
                      }`}
                      onClick={() => { setActiveTab('messages'); setSelectedEmail(null); setActiveCall(null); }}
                    >
                      <MessageSquare className={`w-5 h-5 ${activeTab === 'messages' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-xs mt-1 ${activeTab === 'messages' ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>Messages</span>
                      {unreadCount > 0 && activeTab !== 'messages' && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
                      )}
                    </button>
                    <button
                      className={`flex flex-col items-center p-2 rounded-lg transition-colors relative ${
                        activeTab === 'calls' ? 'bg-primary/10' : 'hover:bg-surface-light'
                      }`}
                      onClick={() => { setActiveTab('calls'); setSelectedEmail(null); setSelectedContact(null); setActiveCall(null); }}
                    >
                      <Phone className={`w-5 h-5 ${activeTab === 'calls' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-xs mt-1 ${activeTab === 'calls' ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>Calls</span>
                    </button>
                    <button
                      className={`flex flex-col items-center p-2 rounded-lg transition-colors relative ${
                        activeTab === 'email' ? 'bg-primary/10' : 'hover:bg-surface-light'
                      }`}
                      onClick={() => { setActiveTab('email'); setSelectedEmail(null); setActiveCall(null); }}
                    >
                      <Mail className={`w-5 h-5 ${activeTab === 'email' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-xs mt-1 ${activeTab === 'email' ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>Email</span>
                      {emailUnreadCount > 0 && activeTab !== 'email' && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                      )}
                    </button>
                    <button
                      className={`flex flex-col items-center p-2 rounded-lg transition-colors relative ${
                        activeTab === 'contacts' ? 'bg-primary/10' : 'hover:bg-surface-light'
                      }`}
                      onClick={() => { setActiveTab('contacts'); setSelectedEmail(null); setSelectedContact(null); setActiveCall(null); }}
                    >
                      <User className={`w-5 h-5 ${activeTab === 'contacts' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-xs mt-1 ${activeTab === 'contacts' ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>Contacts</span>
                      {unlockedContactsCount > 0 && activeTab !== 'contacts' && (
                        <div className="absolute top-1 right-1 min-w-[14px] h-[14px] bg-success rounded-full text-[10px] text-white font-bold flex items-center justify-center">
                          {unlockedContactsCount}
                        </div>
                      )}
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

      {/* Attachment Viewer Modal */}
      <AnimatePresence>
        {selectedAttachment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setSelectedAttachment(null);
              setAttachmentZoomed(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] bg-background border-4 border-black rounded-xl shadow-retro overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-surface border-b-2 border-black px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedAttachment.type === 'photo' && <Image className="w-5 h-5 text-secondary" />}
                  {selectedAttachment.type === 'dossier' && <User className="w-5 h-5 text-warning" />}
                  {selectedAttachment.type === 'map' && <MapPin className="w-5 h-5 text-primary" />}
                  {selectedAttachment.type === 'document' && <FileText className="w-5 h-5 text-muted-foreground" />}
                  {selectedAttachment.type === 'intel' && <Shield className="w-5 h-5 text-destructive" />}
                  <span className="font-bold">{selectedAttachment.name}</span>
                  <RetroBadge variant="secondary" size="sm">{selectedAttachment.type.toUpperCase()}</RetroBadge>
                  <RetroBadge variant="default" size="sm">{selectedAttachment.aspectRatio}</RetroBadge>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAttachmentZoomed(!attachmentZoomed)}
                    className="p-2 hover:bg-surface-light rounded-lg transition-colors"
                  >
                    {attachmentZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAttachment(null);
                      setAttachmentZoomed(false);
                    }}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className={`p-4 overflow-auto ${attachmentZoomed ? 'max-h-[80vh]' : 'max-h-[60vh]'}`}>
                {selectedAttachment.imageUrl ? (
                  <div className="flex flex-col items-center gap-4">
                    <div
                      className="border-2 border-black rounded-lg overflow-hidden shadow-retro-sm"
                      style={{
                        width: attachmentZoomed
                          ? ATTACHMENT_DIMENSIONS[selectedAttachment.aspectRatio].width
                          : Math.min(400, ATTACHMENT_DIMENSIONS[selectedAttachment.aspectRatio].width),
                        aspectRatio: selectedAttachment.aspectRatio === 'a4'
                          ? '595/842'
                          : selectedAttachment.aspectRatio.replace(':', '/'),
                      }}
                    >
                      <img
                        src={selectedAttachment.imageUrl}
                        alt={selectedAttachment.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {selectedAttachment.caption && (
                      <p className="text-sm text-muted-foreground text-center italic">
                        {selectedAttachment.caption}
                      </p>
                    )}
                  </div>
                ) : (
                  /* Placeholder for attachments without images */
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div
                      className="border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center bg-surface/50"
                      style={{
                        width: Math.min(300, ATTACHMENT_DIMENSIONS[selectedAttachment.aspectRatio].width),
                        aspectRatio: selectedAttachment.aspectRatio === 'a4'
                          ? '595/842'
                          : selectedAttachment.aspectRatio.replace(':', '/'),
                      }}
                    >
                      {selectedAttachment.type === 'photo' && <Image className="w-16 h-16 text-muted-foreground/30" />}
                      {selectedAttachment.type === 'dossier' && <User className="w-16 h-16 text-muted-foreground/30" />}
                      {selectedAttachment.type === 'map' && <MapPin className="w-16 h-16 text-muted-foreground/30" />}
                      {selectedAttachment.type === 'document' && <FileText className="w-16 h-16 text-muted-foreground/30" />}
                      {selectedAttachment.type === 'intel' && <Shield className="w-16 h-16 text-muted-foreground/30" />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Image pending generation ({ATTACHMENT_DIMENSIONS[selectedAttachment.aspectRatio].width}x{ATTACHMENT_DIMENSIONS[selectedAttachment.aspectRatio].height})
                    </p>
                    {selectedAttachment.caption && (
                      <p className="text-sm text-foreground font-semibold">
                        {selectedAttachment.caption}
                      </p>
                    )}
                    {/* Display data if available */}
                    {selectedAttachment.data && typeof selectedAttachment.data === 'object' && (
                      <div className="w-full max-w-md bg-surface border-2 border-black rounded-lg p-4 shadow-retro-sm">
                        <p className="text-xs text-muted-foreground font-semibold mb-2">ATTACHMENT DATA</p>
                        <pre className="text-xs text-foreground font-mono whitespace-pre-wrap">
                          {JSON.stringify(selectedAttachment.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobilePhone;
