import React from 'react'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'

// Spinner Loading State
export function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <Loader2 className={`animate-spin text-yellow-400 ${sizes[size]} ${className}`} />
  )
}

// Full Screen Loading Overlay
export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"
        />
        <p className="text-white text-lg font-medium">{message}</p>
      </div>
    </motion.div>
  )
}

// Card/Panel Loading State
export function LoadingCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      <div className="h-6 bg-gray-700 rounded w-3/4 mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-700/50 rounded w-full mb-2" />
      ))}
    </div>
  )
}

// Skeleton Loader for lists
export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <div className="w-12 h-12 bg-gray-700 rounded-lg animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse" />
            <div className="h-3 bg-gray-700/50 rounded w-3/4 animate-pulse" />
          </div>
          <div className="w-16 h-8 bg-gray-700 rounded animate-pulse" />
        </motion.div>
      ))}
    </div>
  )
}

// Inline Loading Button
export function LoadingButton({
  loading,
  children,
  onClick,
  className = '',
  disabled = false
}: {
  loading: boolean
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`relative inline-flex items-center justify-center gap-2 transition-all ${className} ${
        loading || disabled ? 'opacity-70 cursor-not-allowed' : ''
      }`}
    >
      {loading && <LoadingSpinner size="sm" />}
      <span className={loading ? 'opacity-70' : ''}>{children}</span>
    </button>
  )
}

// Empty State
export function EmptyState({
  icon,
  title,
  description,
  action
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-gray-500 mb-4">
        {icon || <AlertCircle size={48} />}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-gray-400 text-sm mb-4 max-w-md">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} />
          {action.label}
        </button>
      )}
    </div>
  )
}

// Progress Loader with text
export function ProgressLoader({
  progress,
  message,
  showPercentage = true
}: {
  progress: number
  message?: string
  showPercentage?: boolean
}) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400">{message || 'Loading...'}</span>
        {showPercentage && (
          <span className="text-sm font-mono text-yellow-400">{Math.round(progress)}%</span>
        )}
      </div>
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
        <motion.div
          className="h-full bg-gradient-to-r from-yellow-500 to-green-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  )
}

// Suspense Fallback component
export function SuspenseFallback({ message = 'Loading component...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-400">{message}</p>
      </div>
    </div>
  )
}

export default {
  LoadingSpinner,
  LoadingOverlay,
  LoadingCard,
  SkeletonList,
  LoadingButton,
  EmptyState,
  ProgressLoader,
  SuspenseFallback
}
