import React from 'react';
import { motion } from 'framer-motion';
import {
  Battery, Wifi, Signal, Clock, Mail, Newspaper, Map, Users,
  ShoppingBag, Landmark, Calendar, Heart, Search, GraduationCap,
  Building2, Phone, MessageSquare, Settings, Power, Volume2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =============================================================================
// DEVICE STATUS BAR
// =============================================================================

interface DeviceStatusBarProps {
  time?: string;
  batteryLevel?: number;
  signalStrength?: number;
  wifiConnected?: boolean;
  carrier?: string;
  className?: string;
}

export const DeviceStatusBar: React.FC<DeviceStatusBarProps> = ({
  time,
  batteryLevel = 85,
  signalStrength = 4,
  wifiConnected = true,
  carrier = 'HERO-NET',
  className,
}) => {
  const currentTime = time || new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return (
    <div className={cn(
      'flex items-center justify-between px-4 py-1.5 text-xs font-bold',
      'bg-black text-white border-b-2 border-black',
      className
    )}>
      {/* Left - Carrier & Signal */}
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              className={cn(
                'w-1 rounded-sm',
                bar <= signalStrength ? 'bg-primary' : 'bg-gray-600'
              )}
              style={{ height: `${bar * 3 + 4}px` }}
            />
          ))}
        </div>
        <span className="text-primary">{carrier}</span>
      </div>

      {/* Center - Time */}
      <div className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        <span className="font-mono">{currentTime}</span>
      </div>

      {/* Right - WiFi & Battery */}
      <div className="flex items-center gap-2">
        {wifiConnected && <Wifi className="w-4 h-4 text-primary" />}
        <div className="flex items-center gap-1">
          <div className="relative w-6 h-3 border-2 border-white rounded-sm">
            <div
              className={cn(
                'absolute left-0.5 top-0.5 bottom-0.5 rounded-sm',
                batteryLevel > 20 ? 'bg-primary' : 'bg-destructive'
              )}
              style={{ width: `${Math.min(batteryLevel, 100) * 0.8}%` }}
            />
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0.5 h-1.5 bg-white rounded-r-sm" />
          </div>
          <span className="text-[10px]">{batteryLevel}%</span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// APP ICON
// =============================================================================

interface AppIconProps {
  icon: React.ReactNode;
  label: string;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'destructive';
  badge?: number;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const colorMap = {
  primary: 'bg-primary hover:bg-primary-hover',
  secondary: 'bg-secondary hover:opacity-90',
  accent: 'bg-accent hover:opacity-90',
  success: 'bg-success hover:opacity-90',
  warning: 'bg-warning hover:opacity-90',
  destructive: 'bg-destructive hover:opacity-90',
};

export const AppIcon: React.FC<AppIconProps> = ({
  icon,
  label,
  color = 'primary',
  badge,
  onClick,
  disabled = false,
  className,
}) => {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={disabled ? undefined : onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all',
        'focus:outline-none focus:ring-2 focus:ring-primary',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className={cn(
        'relative w-14 h-14 rounded-xl border-2 border-black flex items-center justify-center',
        'shadow-retro-sm transition-shadow',
        !disabled && 'hover:shadow-retro',
        colorMap[color]
      )}>
        <span className="text-white">{icon}</span>
        {badge !== undefined && badge > 0 && (
          <div className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-destructive border-2 border-black flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">
              {badge > 99 ? '99+' : badge}
            </span>
          </div>
        )}
      </div>
      <span className="text-xs font-semibold text-center truncate w-16">
        {label}
      </span>
    </motion.button>
  );
};

// =============================================================================
// RETRO PHONE
// =============================================================================

interface RetroPhoneProps {
  children: React.ReactNode;
  statusBar?: boolean;
  time?: string;
  onHomePress?: () => void;
  onBackPress?: () => void;
  className?: string;
  screenClassName?: string;
}

export const RetroPhone: React.FC<RetroPhoneProps> = ({
  children,
  statusBar = true,
  time,
  onHomePress,
  onBackPress,
  className,
  screenClassName,
}) => {
  return (
    <div className={cn(
      'relative inline-flex flex-col',
      'bg-gradient-to-b from-gray-800 to-gray-900',
      'border-4 border-black rounded-[2.5rem]',
      'shadow-[8px_8px_0_0_#000]',
      'p-3',
      className
    )}>
      {/* Top Speaker/Camera area */}
      <div className="flex justify-center items-center gap-3 py-2 px-8">
        <div className="w-2 h-2 rounded-full bg-gray-700 border border-gray-600" />
        <div className="w-16 h-1.5 rounded-full bg-gray-700 border border-gray-600" />
        <div className="w-2 h-2 rounded-full bg-gray-700 border border-gray-600" />
      </div>

      {/* Screen */}
      <div className={cn(
        'relative flex flex-col overflow-hidden',
        'bg-background border-2 border-black rounded-2xl',
        'min-h-[480px] w-[280px]',
        screenClassName
      )}>
        {statusBar && <DeviceStatusBar time={time} />}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-center items-center gap-6 py-3">
        {onBackPress && (
          <button
            onClick={onBackPress}
            className="w-8 h-8 rounded-full bg-gray-700 border-2 border-black flex items-center justify-center hover:bg-gray-600 transition-colors"
          >
            <span className="text-white text-lg">‹</span>
          </button>
        )}
        <button
          onClick={onHomePress}
          className="w-12 h-12 rounded-full bg-gray-700 border-2 border-black flex items-center justify-center hover:bg-gray-600 transition-colors shadow-retro-sm"
        >
          <div className="w-5 h-5 rounded-sm border-2 border-white" />
        </button>
        {onBackPress && (
          <button
            onClick={() => {}}
            className="w-8 h-8 rounded-full bg-gray-700 border-2 border-black flex items-center justify-center hover:bg-gray-600 transition-colors"
          >
            <span className="text-white text-lg">≡</span>
          </button>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// RETRO LAPTOP
// =============================================================================

interface RetroLaptopProps {
  children: React.ReactNode;
  statusBar?: boolean;
  time?: string;
  title?: string;
  onPowerPress?: () => void;
  className?: string;
  screenClassName?: string;
}

export const RetroLaptop: React.FC<RetroLaptopProps> = ({
  children,
  statusBar = true,
  time,
  title = 'HERO-OS v2.7',
  onPowerPress,
  className,
  screenClassName,
}) => {
  return (
    <div className={cn('inline-flex flex-col items-center', className)}>
      {/* Screen/Lid */}
      <div className={cn(
        'relative flex flex-col',
        'bg-gradient-to-b from-gray-700 to-gray-800',
        'border-4 border-black rounded-t-2xl',
        'shadow-[8px_8px_0_0_#000]',
        'p-4'
      )}>
        {/* Camera */}
        <div className="flex justify-center mb-2">
          <div className="w-2 h-2 rounded-full bg-gray-900 border border-gray-600">
            <div className="w-1 h-1 rounded-full bg-green-500 m-0.5 animate-pulse" />
          </div>
        </div>

        {/* Screen Bezel */}
        <div className={cn(
          'relative flex flex-col overflow-hidden',
          'bg-background border-2 border-black rounded-lg',
          'min-h-[400px] min-w-[600px]',
          screenClassName
        )}>
          {/* OS Title Bar */}
          {statusBar && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-surface border-b-2 border-black">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive border border-black" />
                  <div className="w-3 h-3 rounded-full bg-warning border border-black" />
                  <div className="w-3 h-3 rounded-full bg-success border border-black" />
                </div>
                <span className="text-xs font-bold text-primary ml-2">{title}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Wifi className="w-4 h-4" />
                <Volume2 className="w-4 h-4" />
                <span className="font-mono font-bold">
                  {time || new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </span>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>

        {/* Brand */}
        <div className="flex justify-center mt-2">
          <span className="text-xs font-bold text-gray-500 tracking-widest">HERO-TECH</span>
        </div>
      </div>

      {/* Keyboard/Base */}
      <div className={cn(
        'relative flex flex-col items-center',
        'bg-gradient-to-b from-gray-600 to-gray-700',
        'border-4 border-t-0 border-black rounded-b-xl',
        'w-full px-8 py-4',
        'shadow-[8px_8px_0_0_#000]'
      )}>
        {/* Keyboard hint */}
        <div className="w-full flex flex-col gap-1">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex justify-center gap-1">
              {Array.from({ length: 12 - row }).map((_, i) => (
                <div
                  key={i}
                  className="w-6 h-4 bg-gray-800 rounded-sm border border-gray-900"
                />
              ))}
            </div>
          ))}
          {/* Spacebar */}
          <div className="flex justify-center mt-1">
            <div className="w-32 h-4 bg-gray-800 rounded-sm border border-gray-900" />
          </div>
        </div>

        {/* Trackpad */}
        <div className="w-24 h-16 mt-3 bg-gray-800 rounded-lg border-2 border-gray-900" />

        {/* Power button */}
        {onPowerPress && (
          <button
            onClick={onPowerPress}
            className="absolute top-2 right-4 p-1.5 rounded-full bg-gray-800 border border-gray-900 hover:bg-gray-700 transition-colors"
          >
            <Power className="w-3 h-3 text-primary" />
          </button>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// APP GRID - Preset apps for the game
// =============================================================================

interface AppGridProps {
  onAppClick: (appId: string) => void;
  notifications?: Record<string, number>;
  className?: string;
}

const defaultApps = [
  { id: 'email', label: 'Email', icon: <Mail className="w-7 h-7" />, color: 'primary' as const },
  { id: 'news', label: 'News', icon: <Newspaper className="w-7 h-7" />, color: 'secondary' as const },
  { id: 'maps', label: 'Maps', icon: <Map className="w-7 h-7" />, color: 'success' as const },
  { id: 'dossiers', label: 'Dossiers', icon: <Users className="w-7 h-7" />, color: 'accent' as const },
  { id: 'shop', label: 'Shop', icon: <ShoppingBag className="w-7 h-7" />, color: 'warning' as const },
  { id: 'bank', label: 'Bank', icon: <Landmark className="w-7 h-7" />, color: 'primary' as const },
  { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-7 h-7" />, color: 'secondary' as const },
  { id: 'medical', label: 'Medical', icon: <Heart className="w-7 h-7" />, color: 'destructive' as const },
  { id: 'intel', label: 'Intel', icon: <Search className="w-7 h-7" />, color: 'accent' as const },
  { id: 'training', label: 'Training', icon: <GraduationCap className="w-7 h-7" />, color: 'success' as const },
  { id: 'base', label: 'Base', icon: <Building2 className="w-7 h-7" />, color: 'primary' as const },
  { id: 'comms', label: 'Comms', icon: <MessageSquare className="w-7 h-7" />, color: 'secondary' as const },
];

export const AppGrid: React.FC<AppGridProps> = ({
  onAppClick,
  notifications = {},
  className,
}) => {
  return (
    <div className={cn(
      'grid grid-cols-4 gap-2 p-4',
      className
    )}>
      {defaultApps.map((app) => (
        <AppIcon
          key={app.id}
          icon={app.icon}
          label={app.label}
          color={app.color}
          badge={notifications[app.id]}
          onClick={() => onAppClick(app.id)}
        />
      ))}
    </div>
  );
};

// =============================================================================
// PHONE HOME SCREEN
// =============================================================================

interface PhoneHomeScreenProps {
  onAppClick: (appId: string) => void;
  notifications?: Record<string, number>;
  wallpaper?: string;
}

export const PhoneHomeScreen: React.FC<PhoneHomeScreenProps> = ({
  onAppClick,
  notifications = {},
  wallpaper,
}) => {
  return (
    <div
      className="flex-1 flex flex-col"
      style={wallpaper ? {
        backgroundImage: `url(${wallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : undefined}
    >
      {/* App Grid */}
      <div className="flex-1 p-3">
        <div className="grid grid-cols-4 gap-3">
          {defaultApps.slice(0, 8).map((app) => (
            <AppIcon
              key={app.id}
              icon={app.icon}
              label={app.label}
              color={app.color}
              badge={notifications[app.id]}
              onClick={() => onAppClick(app.id)}
            />
          ))}
        </div>
      </div>

      {/* Dock */}
      <div className="flex justify-center gap-4 p-3 bg-surface/80 backdrop-blur-sm border-t-2 border-black">
        <AppIcon
          icon={<Phone className="w-6 h-6" />}
          label="Comms"
          color="success"
          onClick={() => onAppClick('comms')}
        />
        <AppIcon
          icon={<Mail className="w-6 h-6" />}
          label="Email"
          color="primary"
          badge={notifications['email']}
          onClick={() => onAppClick('email')}
        />
        <AppIcon
          icon={<Map className="w-6 h-6" />}
          label="Maps"
          color="secondary"
          onClick={() => onAppClick('maps')}
        />
        <AppIcon
          icon={<Settings className="w-6 h-6" />}
          label="Settings"
          color="accent"
          onClick={() => onAppClick('settings')}
        />
      </div>
    </div>
  );
};

// =============================================================================
// LAPTOP DESKTOP
// =============================================================================

interface LaptopDesktopProps {
  onAppClick: (appId: string) => void;
  notifications?: Record<string, number>;
  wallpaper?: string;
}

export const LaptopDesktop: React.FC<LaptopDesktopProps> = ({
  onAppClick,
  notifications = {},
  wallpaper,
}) => {
  return (
    <div
      className="flex-1 flex flex-col min-h-full"
      style={wallpaper ? {
        backgroundImage: `url(${wallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : {
        background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(270 40% 15%) 100%)'
      }}
    >
      {/* Desktop Icons */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-6 gap-4">
          {defaultApps.map((app) => (
            <AppIcon
              key={app.id}
              icon={app.icon}
              label={app.label}
              color={app.color}
              badge={notifications[app.id]}
              onClick={() => onAppClick(app.id)}
            />
          ))}
        </div>
      </div>

      {/* Taskbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface border-t-2 border-black">
        {/* Start Button */}
        <button
          onClick={() => onAppClick('start')}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground font-bold text-sm border-2 border-black rounded-lg shadow-retro-sm hover:shadow-retro transition-shadow"
        >
          <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
            <div className="bg-white rounded-sm" />
            <div className="bg-white rounded-sm" />
            <div className="bg-white rounded-sm" />
            <div className="bg-white rounded-sm" />
          </div>
          START
        </button>

        {/* Quick Launch */}
        <div className="flex items-center gap-2">
          {defaultApps.slice(0, 4).map((app) => (
            <button
              key={app.id}
              onClick={() => onAppClick(app.id)}
              className="p-2 rounded-lg hover:bg-surface-light transition-colors relative"
            >
              {React.cloneElement(app.icon as React.ReactElement, { className: 'w-5 h-5 text-foreground' })}
              {notifications[app.id] && notifications[app.id] > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive border border-black flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">{notifications[app.id]}</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* System Tray */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Wifi className="w-4 h-4" />
          <Volume2 className="w-4 h-4" />
          <div className="flex items-center gap-1 px-2 py-1 bg-card rounded border border-black">
            <Clock className="w-3 h-3" />
            <span className="font-mono font-bold text-foreground">
              {new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
