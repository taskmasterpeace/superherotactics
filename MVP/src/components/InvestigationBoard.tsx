/**
 * Investigation Board - Detective-style cork board for connecting clues
 *
 * Features:
 * - Drag & drop articles and clues onto the board
 * - Draw connections between items with colored strings
 * - Pattern detection that unlocks hidden investigations
 * - Persistent board state
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useGameStore } from '../stores/enhancedGameStore'
import {
  BoardItem,
  BoardConnection,
  ConnectionType,
  InvestigationPattern,
  InvestigationBoard as BoardType,
  CONNECTION_COLORS,
  CONNECTION_LABELS,
  INVESTIGATION_PATTERNS,
  createBoard,
  createArticleItem,
  createNoteItem,
  createConnection,
  detectPatterns,
  getNearPatterns,
} from '../data/investigationPatterns'

// =============================================================================
// BOARD ITEM COMPONENT
// =============================================================================

interface BoardItemCardProps {
  item: BoardItem
  isSelected: boolean
  isConnecting: boolean
  onSelect: (id: string) => void
  onDragEnd: (id: string, position: { x: number; y: number }) => void
  onRemove: (id: string) => void
}

function BoardItemCard({
  item,
  isSelected,
  isConnecting,
  onSelect,
  onDragEnd,
  onRemove,
}: BoardItemCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return // Only left click
    e.preventDefault()
    setIsDragging(true)
    const rect = cardRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !cardRef.current) return
      const parent = cardRef.current.parentElement
      if (!parent) return

      const parentRect = parent.getBoundingClientRect()
      const newX = e.clientX - parentRect.left - dragOffset.x
      const newY = e.clientY - parentRect.top - dragOffset.y

      // Clamp to parent bounds
      const maxX = parentRect.width - 200
      const maxY = parentRect.height - 120
      const clampedX = Math.max(0, Math.min(newX, maxX))
      const clampedY = Math.max(0, Math.min(newY, maxY))

      cardRef.current.style.left = `${clampedX}px`
      cardRef.current.style.top = `${clampedY}px`
    },
    [isDragging, dragOffset]
  )

  const handleMouseUp = useCallback(() => {
    if (isDragging && cardRef.current) {
      const left = parseInt(cardRef.current.style.left) || item.position.x
      const top = parseInt(cardRef.current.style.top) || item.position.y
      onDragEnd(item.id, { x: left, y: top })
    }
    setIsDragging(false)
  }, [isDragging, item.id, item.position, onDragEnd])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const typeColors = {
    article: 'bg-yellow-100 border-yellow-400',
    clue: 'bg-blue-100 border-blue-400',
    note: 'bg-green-100 border-green-400',
  }

  const typeIcons = {
    article: '📰',
    clue: '🔍',
    note: '📝',
  }

  return (
    <div
      ref={cardRef}
      className={`absolute w-48 p-3 rounded shadow-lg cursor-move select-none transition-shadow
        ${typeColors[item.type]} border-2
        ${isSelected ? 'ring-2 ring-red-500 shadow-xl z-20' : 'z-10'}
        ${isConnecting ? 'hover:ring-2 hover:ring-yellow-400' : ''}
        ${isDragging ? 'opacity-80 shadow-2xl z-30' : ''}`}
      style={{
        left: item.position.x,
        top: item.position.y,
        transform: 'rotate(-1deg)',
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(item.id)
      }}
    >
      {/* Push pin */}
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 shadow-md border border-red-800" />

      {/* Remove button */}
      <button
        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-500 text-white text-xs hover:bg-red-500 flex items-center justify-center"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(item.id)
        }}
      >
        ×
      </button>

      {/* Content */}
      <div className="text-xs">
        <div className="font-bold text-gray-800 mb-1 flex items-center gap-1">
          <span>{typeIcons[item.type]}</span>
          <span className="truncate">{item.title}</span>
        </div>
        <p className="text-gray-600 text-[10px] line-clamp-3">{item.summary}</p>
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1 py-0.5 bg-gray-200 rounded text-[8px] text-gray-600"
              >
                #{tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-[8px] text-gray-500">+{item.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// CONNECTION LINE COMPONENT (SVG)
// =============================================================================

interface ConnectionLineProps {
  connection: BoardConnection
  items: BoardItem[]
  isSelected: boolean
  onSelect: (id: string) => void
  onRemove: (id: string) => void
}

function ConnectionLine({ connection, items, isSelected, onSelect, onRemove }: ConnectionLineProps) {
  const fromItem = items.find((i) => i.id === connection.fromId)
  const toItem = items.find((i) => i.id === connection.toId)

  if (!fromItem || !toItem) return null

  // Calculate center points of items
  const fromX = fromItem.position.x + 96 // Half of 192px width
  const fromY = fromItem.position.y + 60 // Approximate center
  const toX = toItem.position.x + 96
  const toY = toItem.position.y + 60

  // Calculate midpoint for label
  const midX = (fromX + toX) / 2
  const midY = (fromY + toY) / 2

  return (
    <g onClick={() => onSelect(connection.id)} style={{ cursor: 'pointer' }}>
      {/* String effect - multiple lines for thickness */}
      <line
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke={connection.color}
        strokeWidth={isSelected ? 4 : 3}
        strokeDasharray={connection.connectionType === 'custom' ? '5,5' : 'none'}
        opacity={0.8}
      />
      {/* Highlight on hover */}
      <line
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke="transparent"
        strokeWidth={12}
        className="hover:stroke-white hover:opacity-30"
      />

      {/* Connection type label */}
      {connection.label && (
        <g transform={`translate(${midX}, ${midY})`}>
          <rect
            x={-40}
            y={-10}
            width={80}
            height={20}
            fill="white"
            stroke={connection.color}
            strokeWidth={1}
            rx={4}
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fill={connection.color}
          >
            {connection.label}
          </text>
        </g>
      )}

      {/* Remove button at midpoint when selected */}
      {isSelected && (
        <g
          transform={`translate(${midX + 45}, ${midY - 15})`}
          onClick={(e) => {
            e.stopPropagation()
            onRemove(connection.id)
          }}
          style={{ cursor: 'pointer' }}
        >
          <circle r={8} fill="#ef4444" />
          <text textAnchor="middle" dominantBaseline="middle" fontSize={12} fill="white">
            ×
          </text>
        </g>
      )}
    </g>
  )
}

// =============================================================================
// PATTERN DETECTION PANEL
// =============================================================================

interface PatternPanelProps {
  board: BoardType
  onPatternUnlock: (pattern: InvestigationPattern) => void
}

function PatternPanel({ board, onPatternUnlock }: PatternPanelProps) {
  const [newPatterns, setNewPatterns] = useState<InvestigationPattern[]>([])
  const [nearPatterns, setNearPatterns] = useState<ReturnType<typeof getNearPatterns>>([])

  useEffect(() => {
    // Check for new patterns
    const detected = detectPatterns(board)
    setNewPatterns(detected)

    // Get near patterns for hints
    const near = getNearPatterns(board)
    setNearPatterns(near.slice(0, 3)) // Show top 3 closest
  }, [board])

  if (newPatterns.length === 0 && nearPatterns.length === 0) {
    return null
  }

  return (
    <div className="absolute bottom-4 right-4 w-72 bg-gray-900/95 rounded-lg p-4 text-white shadow-xl">
      {/* New patterns detected */}
      {newPatterns.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-400 animate-pulse">⚠️</span>
            <span className="font-bold text-yellow-400">PATTERN DETECTED!</span>
          </div>
          {newPatterns.map((pattern) => (
            <div
              key={pattern.id}
              className="bg-yellow-900/50 border border-yellow-500 rounded p-3 mb-2"
            >
              <div className="font-bold text-yellow-300">{pattern.name}</div>
              <div className="text-xs text-gray-300 mb-2">{pattern.description}</div>
              <button
                className="w-full py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-sm font-bold"
                onClick={() => onPatternUnlock(pattern)}
              >
                Unlock Investigation
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Near patterns (hints) */}
      {nearPatterns.length > 0 && newPatterns.length === 0 && (
        <div>
          <div className="text-xs text-gray-400 mb-2">Possible Patterns:</div>
          {nearPatterns.map(({ pattern, matchedTags, missingTags }) => (
            <div key={pattern.id} className="mb-2 text-xs">
              <div className="text-gray-300">{pattern.name}</div>
              <div className="flex gap-1 flex-wrap mt-1">
                {matchedTags.map((tag) => (
                  <span key={tag} className="px-1 bg-green-700/50 text-green-300 rounded">
                    ✓ {tag}
                  </span>
                ))}
                {missingTags.map((tag) => (
                  <span key={tag} className="px-1 bg-red-700/50 text-red-300 rounded">
                    ? {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// ITEM PANEL (Articles/Clues to add)
// =============================================================================

interface ItemPanelProps {
  isOpen: boolean
  onClose: () => void
  onAddItem: (item: BoardItem) => void
}

function ItemPanel({ isOpen, onClose, onAddItem }: ItemPanelProps) {
  const { newsArticles = [] } = useGameStore()
  const [noteText, setNoteText] = useState('')
  const [noteTags, setNoteTags] = useState('')

  if (!isOpen) return null

  const handleAddArticle = (article: any) => {
    const item = createArticleItem(
      {
        id: article.id,
        headline: article.headline || article.title,
        summary: article.summary || article.content?.substring(0, 100),
        tags: article.tags || article.categories || [],
      },
      { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 }
    )
    onAddItem(item)
  }

  const handleAddNote = () => {
    if (!noteText.trim()) return
    const tags = noteTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t)
    const item = createNoteItem(
      noteText,
      { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      tags
    )
    onAddItem(item)
    setNoteText('')
    setNoteTags('')
  }

  return (
    <div className="absolute top-0 left-0 w-64 h-full bg-gray-800 text-white p-4 overflow-y-auto shadow-xl z-40">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">Add to Board</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          ✕
        </button>
      </div>

      {/* Add Note */}
      <div className="mb-4 p-3 bg-gray-700 rounded">
        <h4 className="text-sm font-bold mb-2">📝 Add Note</h4>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Your theory or observation..."
          className="w-full p-2 text-xs bg-gray-600 rounded text-white placeholder-gray-400 mb-2"
          rows={3}
        />
        <input
          type="text"
          value={noteTags}
          onChange={(e) => setNoteTags(e.target.value)}
          placeholder="Tags (comma separated)"
          className="w-full p-2 text-xs bg-gray-600 rounded text-white placeholder-gray-400 mb-2"
        />
        <button
          onClick={handleAddNote}
          className="w-full py-1 bg-green-600 hover:bg-green-500 rounded text-sm"
        >
          Add Note
        </button>
      </div>

      {/* News Articles */}
      <div>
        <h4 className="text-sm font-bold mb-2">📰 News Articles</h4>
        {newsArticles.length === 0 ? (
          <p className="text-xs text-gray-400">No articles available</p>
        ) : (
          <div className="space-y-2">
            {newsArticles.slice(0, 10).map((article: any) => (
              <div
                key={article.id}
                className="p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                onClick={() => handleAddArticle(article)}
              >
                <div className="text-xs font-bold truncate">
                  {article.headline || article.title}
                </div>
                <div className="text-[10px] text-gray-400">Click to add</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// CONNECTION TYPE SELECTOR
// =============================================================================

interface ConnectionSelectorProps {
  position: { x: number; y: number }
  onSelect: (type: ConnectionType) => void
  onCancel: () => void
}

function ConnectionSelector({ position, onSelect, onCancel }: ConnectionSelectorProps) {
  const types: ConnectionType[] = ['suspect', 'location', 'method', 'timing', 'motive', 'evidence']

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onCancel} />

      {/* Selector */}
      <div
        className="absolute z-50 bg-gray-800 rounded-lg p-2 shadow-xl"
        style={{ left: position.x, top: position.y }}
      >
        <div className="text-xs text-gray-400 mb-2">Connection Type:</div>
        <div className="grid grid-cols-2 gap-1">
          {types.map((type) => (
            <button
              key={type}
              className="px-2 py-1 text-xs rounded hover:opacity-80 text-white"
              style={{ backgroundColor: CONNECTION_COLORS[type] }}
              onClick={() => onSelect(type)}
            >
              {CONNECTION_LABELS[type]}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

// =============================================================================
// MAIN INVESTIGATION BOARD COMPONENT
// =============================================================================

export function InvestigationBoard() {
  // Local board state (will be connected to store later)
  const [board, setBoard] = useState<BoardType>(() => createBoard('Main Board'))
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [showItemPanel, setShowItemPanel] = useState(false)
  const [connectionSelector, setConnectionSelector] = useState<{
    position: { x: number; y: number }
    toId: string
  } | null>(null)

  const boardRef = useRef<HTMLDivElement>(null)

  // Handle item selection for connecting
  const handleItemSelect = (itemId: string) => {
    if (connectingFrom) {
      if (connectingFrom !== itemId) {
        // Show connection type selector
        const item = board.items.find((i) => i.id === itemId)
        if (item) {
          setConnectionSelector({
            position: { x: item.position.x + 200, y: item.position.y },
            toId: itemId,
          })
        }
      } else {
        // Clicked same item, cancel connecting
        setConnectingFrom(null)
      }
    } else {
      setSelectedItem(itemId)
      setSelectedConnection(null)
    }
  }

  // Create connection with selected type
  const handleCreateConnection = (type: ConnectionType) => {
    if (connectingFrom && connectionSelector) {
      const newConnection = createConnection(
        connectingFrom,
        connectionSelector.toId,
        type,
        CONNECTION_LABELS[type]
      )
      setBoard((prev) => ({
        ...prev,
        connections: [...prev.connections, newConnection],
        lastModified: Date.now(),
      }))
    }
    setConnectingFrom(null)
    setConnectionSelector(null)
  }

  // Move item
  const handleItemDragEnd = (itemId: string, position: { x: number; y: number }) => {
    setBoard((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, position } : item
      ),
      lastModified: Date.now(),
    }))
  }

  // Remove item
  const handleRemoveItem = (itemId: string) => {
    setBoard((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== itemId),
      connections: prev.connections.filter(
        (c) => c.fromId !== itemId && c.toId !== itemId
      ),
      lastModified: Date.now(),
    }))
    setSelectedItem(null)
  }

  // Remove connection
  const handleRemoveConnection = (connectionId: string) => {
    setBoard((prev) => ({
      ...prev,
      connections: prev.connections.filter((c) => c.id !== connectionId),
      lastModified: Date.now(),
    }))
    setSelectedConnection(null)
  }

  // Add item from panel
  const handleAddItem = (item: BoardItem) => {
    setBoard((prev) => ({
      ...prev,
      items: [...prev.items, item],
      lastModified: Date.now(),
    }))
  }

  // Unlock investigation from pattern
  const handlePatternUnlock = (pattern: InvestigationPattern) => {
    setBoard((prev) => ({
      ...prev,
      detectedPatterns: [...prev.detectedPatterns, pattern.id],
      unlockedInvestigations: [...prev.unlockedInvestigations, pattern.unlocksInvestigationId],
      lastModified: Date.now(),
    }))
    // TODO: Actually create the investigation in the store
    alert(`Investigation unlocked: ${pattern.name}!\nReward: $${pattern.reward.cash}, Fame +${pattern.reward.fame}`)
  }

  // Clear board
  const handleClearBoard = () => {
    if (confirm('Clear all items and connections from the board?')) {
      setBoard((prev) => ({
        ...prev,
        items: [],
        connections: [],
        lastModified: Date.now(),
      }))
    }
  }

  // Click on empty board area
  const handleBoardClick = () => {
    setSelectedItem(null)
    setSelectedConnection(null)
    if (connectingFrom) {
      setConnectingFrom(null)
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">🔍 Investigation Board</h1>
          <span className="text-sm text-gray-400">
            {board.items.length} items • {board.connections.length} connections
          </span>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm"
            onClick={() => setShowItemPanel(true)}
          >
            + Add Item
          </button>
          {selectedItem && (
            <button
              className={`px-3 py-1 rounded text-white text-sm ${
                connectingFrom ? 'bg-yellow-600' : 'bg-green-600 hover:bg-green-500'
              }`}
              onClick={() => setConnectingFrom(connectingFrom ? null : selectedItem)}
            >
              {connectingFrom ? '🔗 Click target...' : '🔗 Connect'}
            </button>
          )}
          <button
            className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-white text-sm"
            onClick={handleClearBoard}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Board Canvas */}
      <div
        ref={boardRef}
        className="flex-1 relative overflow-hidden"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23403020' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundColor: '#8B7355', // Cork board color
        }}
        onClick={handleBoardClick}
      >
        {/* SVG layer for connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {board.connections.map((conn) => (
            <ConnectionLine
              key={conn.id}
              connection={conn}
              items={board.items}
              isSelected={selectedConnection === conn.id}
              onSelect={setSelectedConnection}
              onRemove={handleRemoveConnection}
            />
          ))}
        </svg>

        {/* Board items */}
        {board.items.map((item) => (
          <BoardItemCard
            key={item.id}
            item={item}
            isSelected={selectedItem === item.id}
            isConnecting={!!connectingFrom && connectingFrom !== item.id}
            onSelect={handleItemSelect}
            onDragEnd={handleItemDragEnd}
            onRemove={handleRemoveItem}
          />
        ))}

        {/* Empty state */}
        {board.items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-600">
              <div className="text-6xl mb-4">📌</div>
              <div className="text-xl font-bold">Empty Board</div>
              <div className="text-sm mt-2">
                Click "Add Item" to pin articles and notes
              </div>
              <div className="text-sm">
                Connect items to discover patterns
              </div>
            </div>
          </div>
        )}

        {/* Pattern detection panel */}
        <PatternPanel board={board} onPatternUnlock={handlePatternUnlock} />

        {/* Connection type selector */}
        {connectionSelector && (
          <ConnectionSelector
            position={connectionSelector.position}
            onSelect={handleCreateConnection}
            onCancel={() => {
              setConnectionSelector(null)
              setConnectingFrom(null)
            }}
          />
        )}
      </div>

      {/* Item Panel (slide in from left) */}
      <ItemPanel
        isOpen={showItemPanel}
        onClose={() => setShowItemPanel(false)}
        onAddItem={handleAddItem}
      />

      {/* Instructions */}
      {connectingFrom && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse">
          Click another item to create connection
        </div>
      )}
    </div>
  )
}

export default InvestigationBoard
