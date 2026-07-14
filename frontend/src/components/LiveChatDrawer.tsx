import { useState, useEffect, useRef } from 'react'
import { X, Send, Shield, MessageSquare, Wifi, WifiOff, ChevronDown } from 'lucide-react'
import { supabase, IS_MOCK_MODE } from '../lib/supabaseClient'

// ─── Types ──────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string
  case_id: string
  sender_role: 'citizen' | 'police' | 'admin' | 'medical' | 'authority'
  sender_name: string
  content: string
  created_at: string
}

interface LiveChatDrawerProps {
  caseId: string
  senderRole: 'citizen' | 'police' | 'admin' | 'medical' | 'authority'
  senderName: string
  onClose: () => void
}

// ─── In-memory mock message store (shared across instances) ─────────────────
const mockMessageStore: Record<string, ChatMessage[]> = {}
const mockListeners: Array<(msg: ChatMessage) => void> = []

function getMockMessages(caseId: string): ChatMessage[] {
  if (!mockMessageStore[caseId]) {
    mockMessageStore[caseId] = [
      {
        id: 'seed-1',
        case_id: caseId,
        sender_role: 'authority',
        sender_name: 'Cdr. Priya Sharma',
        content: 'Emergency acknowledged. Units are being dispatched to your location. Stay calm and keep the area clear.',
        created_at: new Date(Date.now() - 4 * 60000).toISOString()
      },
      {
        id: 'seed-2',
        case_id: caseId,
        sender_role: 'citizen',
        sender_name: 'Reporter',
        content: 'Thank you. The child is conscious but frightened. I am keeping bystanders away.',
        created_at: new Date(Date.now() - 3 * 60000).toISOString()
      },
      {
        id: 'seed-3',
        case_id: caseId,
        sender_role: 'authority',
        sender_name: 'Cdr. Priya Sharma',
        content: 'Good. Ambulance ETA is approximately 8 minutes. Do not move the child unless there is immediate danger.',
        created_at: new Date(Date.now() - 90000).toISOString()
      }
    ]
  }
  return mockMessageStore[caseId]
}

function addMockMessage(msg: ChatMessage) {
  if (!mockMessageStore[msg.case_id]) mockMessageStore[msg.case_id] = []
  mockMessageStore[msg.case_id].push(msg)
  mockListeners.forEach(fn => fn(msg))
}

function subscribeMock(_caseId: string, listener: (msg: ChatMessage) => void) {
  mockListeners.push(listener)
  return () => {
    const idx = mockListeners.indexOf(listener)
    if (idx > -1) mockListeners.splice(idx, 1)
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function roleColor(role: ChatMessage['sender_role']) {
  switch (role) {
    case 'citizen': return 'text-sky-400'
    case 'police': return 'text-blue-400'
    case 'medical': return 'text-emerald-400'
    case 'admin': return 'text-purple-400'
    default: return 'text-amber-400'  // authority
  }
}

function roleLabel(role: ChatMessage['sender_role']) {
  switch (role) {
    case 'citizen': return 'Citizen Reporter'
    case 'police': return 'Police Command'
    case 'medical': return 'Medical Dispatch'
    case 'admin': return 'Admin'
    default: return 'Authority'
  }
}

function roleIcon(role: ChatMessage['sender_role']) {
  if (role === 'citizen') return '👤'
  if (role === 'police') return '🚔'
  if (role === 'medical') return '🏥'
  return '🛡️'
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function LiveChatDrawer({ caseId, senderRole, senderName, onClose }: LiveChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [connected, setConnected] = useState(false)
  const [unread, setUnread] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Load & subscribe ────────────────────────────────────────────────────
  useEffect(() => {
    if (IS_MOCK_MODE) {
      setMessages(getMockMessages(caseId))
      setConnected(true)
      const unsub = subscribeMock(caseId, (msg) => {
        if (msg.sender_role !== senderRole || msg.sender_name !== senderName) {
          setMessages(prev => [...prev, msg])
          if (isMinimized) setUnread(u => u + 1)
        }
      })
      return unsub
    }

    // Supabase real-time path
    const loadHistory = async () => {
      const { data } = await supabase
        .from('case_messages')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: true })
      if (data) setMessages(data as ChatMessage[])
      setConnected(true)
    }
    loadHistory()

    const channel = supabase
      .channel(`case_chat_${caseId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'case_messages',
        filter: `case_id=eq.${caseId}`
      }, (payload: { new: ChatMessage }) => {
        const newMsg = payload.new as ChatMessage
        if (newMsg.sender_name !== senderName) {
          setMessages(prev => [...prev, newMsg])
          if (isMinimized) setUnread(u => u + 1)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [caseId])

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMinimized) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isMinimized])

  // ── Clear unread on expand ───────────────────────────────────────────────
  useEffect(() => {
    if (!isMinimized) setUnread(0)
  }, [isMinimized])

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      case_id: caseId,
      sender_role: senderRole,
      sender_name: senderName,
      content: input.trim(),
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, newMsg])
    setInput('')
    inputRef.current?.focus()

    if (IS_MOCK_MODE) {
      addMockMessage(newMsg)

      // Simulate authority auto-reply after a delay (only if citizen sent)
      if (senderRole === 'citizen') {
        setTimeout(() => {
          const replies = [
            'Understood. Units are maintaining course to your position.',
            'Message received. Stay with the child and keep reporting any changes.',
            'Command acknowledges. Drone visual confirmed — heat signature locked.',
            'Dispatch updated. ETA revised to 5 minutes.',
          ]
          const reply: ChatMessage = {
            id: `auto-${Date.now()}`,
            case_id: caseId,
            sender_role: 'authority',
            sender_name: 'Cdr. Priya Sharma',
            content: replies[Math.floor(Math.random() * replies.length)],
            created_at: new Date().toISOString()
          }
          addMockMessage(reply)
        }, 1500 + Math.random() * 1500)
      }
    } else {
      // Post to Supabase
      await supabase.from('case_messages').insert([{
        case_id: newMsg.case_id,
        sender_role: newMsg.sender_role,
        sender_name: newMsg.sender_name,
        content: newMsg.content,
        created_at: newMsg.created_at
      }])
    }

    setSending(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const caseShort = caseId.slice(0, 8).toUpperCase()

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col"
      style={{
        width: '360px',
        boxShadow: '0 0 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
        borderRadius: '16px',
        background: 'linear-gradient(145deg, #0d1117 0%, #0f1623 100%)',
        border: '1px solid rgba(255,255,255,0.07)'
      }}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        style={{
          borderBottom: isMinimized ? 'none' : '1px solid rgba(255,255,255,0.06)',
          borderRadius: isMinimized ? '16px' : '16px 16px 0 0',
          background: 'linear-gradient(90deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.1) 100%)'
        }}
        onClick={() => setIsMinimized(m => !m)}
      >
        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30">
          <MessageSquare className="w-4 h-4 text-blue-400" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] text-white font-bold flex items-center justify-center">
              {unread}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-[12px] leading-none truncate">
            Live Case Channel — #{caseShort}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            {connected
              ? <Wifi className="w-2.5 h-2.5 text-emerald-400" />
              : <WifiOff className="w-2.5 h-2.5 text-slate-500" />}
            <span className={`text-[9px] font-medium ${connected ? 'text-emerald-400' : 'text-slate-500'}`}>
              {connected ? 'Live · Encrypted Channel' : 'Connecting…'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ChevronDown
            className="w-4 h-4 text-slate-400 transition-transform duration-200"
            style={{ transform: isMinimized ? 'rotate(0deg)' : 'rotate(180deg)' }}
          />
          <button
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition"
            onClick={(e) => { e.stopPropagation(); onClose() }}
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      {!isMinimized && (
        <>
          {/* Message Feed */}
          <div
            className="flex-1 overflow-y-auto scrollbar px-3 py-3 space-y-3"
            style={{ minHeight: '260px', maxHeight: '320px' }}
          >
            {messages.map((msg) => {
              const isSelf = msg.sender_name === senderName && msg.sender_role === senderRole
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isSelf ? 'flex-row-reverse' : 'flex-row'} items-end`}
                >
                  {/* Avatar */}
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 border"
                    style={{
                      background: isSelf ? 'rgba(59,130,246,0.2)' : 'rgba(139,92,246,0.2)',
                      borderColor: isSelf ? 'rgba(59,130,246,0.4)' : 'rgba(139,92,246,0.4)'
                    }}
                  >
                    {roleIcon(msg.sender_role)}
                  </div>

                  {/* Bubble */}
                  <div className={`flex flex-col gap-1 max-w-[72%] ${isSelf ? 'items-end' : 'items-start'}`}>
                    {!isSelf && (
                      <span className={`text-[8.5px] font-bold uppercase tracking-wide ${roleColor(msg.sender_role)}`}>
                        {roleLabel(msg.sender_role)} · {msg.sender_name}
                      </span>
                    )}
                    <div
                      className="px-3 py-2 rounded-2xl text-[11.5px] leading-relaxed"
                      style={{
                        background: isSelf
                          ? 'linear-gradient(135deg, #1d4ed8, #2563eb)'
                          : 'rgba(255,255,255,0.05)',
                        border: isSelf ? 'none' : '1px solid rgba(255,255,255,0.07)',
                        color: isSelf ? '#fff' : '#cbd5e1',
                        borderBottomRightRadius: isSelf ? '4px' : '16px',
                        borderBottomLeftRadius: isSelf ? '16px' : '4px',
                        boxShadow: isSelf
                          ? '0 2px 12px rgba(37,99,235,0.4)'
                          : '0 1px 4px rgba(0,0,0,0.2)'
                      }}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[8px] text-slate-600 px-1">{formatTime(msg.created_at)}</span>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />

          {/* ── Quick Replies (Authority Side) ──────────────────────────── */}
          {senderRole !== 'citizen' && (
            <div className="px-3 py-2 flex gap-2 overflow-x-auto scrollbar-none">
              {['Units dispatched', 'ETA 5 min', 'Drone visual locked', 'Stay at location'].map(q => (
                <button
                  key={q}
                  className="shrink-0 text-[9.5px] px-2.5 py-1 rounded-full border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 transition"
                  onClick={() => setInput(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          {senderRole === 'citizen' && (
            <div className="px-3 py-2 flex gap-2 overflow-x-auto scrollbar-none">
              {['Child is stable', 'Crowd is forming', 'Ambulance has arrived', 'Need more help'].map(q => (
                <button
                  key={q}
                  className="shrink-0 text-[9.5px] px-2.5 py-1 rounded-full border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 transition"
                  onClick={() => setInput(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* ── Input Bar ──────────────────────────────────────────────── */}
          <div
            className="flex items-center gap-2 px-3 py-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderRadius: '0 0 16px 16px' }}
          >
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <Shield className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type a message…"
                className="flex-1 bg-transparent text-white text-[11.5px] outline-none placeholder:text-slate-600"
              />
            </div>
            <button
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
              disabled={!input.trim() || sending}
              onClick={handleSend}
              style={{
                background: input.trim()
                  ? 'linear-gradient(135deg, #2563eb, #4f46e5)'
                  : 'rgba(255,255,255,0.05)',
                boxShadow: input.trim() ? '0 2px 12px rgba(37,99,235,0.5)' : 'none'
              }}
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
