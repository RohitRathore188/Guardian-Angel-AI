import React, { createContext, useContext, useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Info, X, Zap } from 'lucide-react'

export interface NotificationItem {
  id: string
  caseId: string
  title: string
  body: string
  category: 'Emergency' | 'AI' | 'Hospital' | 'Police' | 'Volunteer' | 'NGO' | 'Child Welfare' | 'Admin' | 'System'
  priority: 'critical' | 'high' | 'medium' | 'low'
  read: boolean
  timestamp: Date
  actionPath?: string
  actionLabel?: string
}

interface ToastItem {
  id: string
  title: string
  body: string
  type: 'emergency' | 'success' | 'warning' | 'info'
}

interface NotificationContextProps {
  notifications: NotificationItem[]
  unreadCount: number
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotification: (id: string) => void
  triggerToast: (title: string, body: string, type: ToastItem['type']) => void
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const unreadCount = notifications.filter((n) => !n.read).length

  // Toast trigger
  const triggerToast = (title: string, body: string, type: ToastItem['type']) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { id, title, body, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }

  // Add Notification
  const addNotification = (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: NotificationItem = {
      ...item,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      read: false
    }

    setNotifications((prev) => [newNotif, ...prev])

    // Automatically trigger corresponding toast type based on priority
    let toastType: ToastItem['type'] = 'info'
    if (newNotif.priority === 'critical') toastType = 'emergency'
    else if (newNotif.priority === 'high') toastType = 'warning'
    else if (newNotif.category === 'System') toastType = 'success'

    triggerToast(newNotif.title, newNotif.body, toastType)
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  // Inject initial mock notifications for system feedback
  useEffect(() => {
    addNotification({
      caseId: 'system-startup',
      title: '🚨 Central Dispatch Core Active',
      body: 'Intelligent multi-agency coordination system initialized.',
      category: 'System',
      priority: 'low'
    })
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        triggerToast
      }}
    >
      {children}

      {/* Floating Animated Toast Container */}
      <div className="fixed bottom-4 right-4 z-[99999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        <style>{`
          @keyframes toast-slide-in {
            0% { transform: translateX(120%); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
          }
          .toast-card {
            animation: toast-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}</style>

        {toasts.map((t) => {
          let border = 'border-blue-500/30'
          let bg = 'bg-dark-900/95'
          let icon = <Info className="w-4 h-4 text-blue-400" />
          
          if (t.type === 'emergency') {
            border = 'border-red-500/50'
            bg = 'bg-red-950/95 shadow-red-900/20 shadow-lg'
            icon = <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
          } else if (t.type === 'warning') {
            border = 'border-orange-500/40'
            bg = 'bg-orange-950/90'
            icon = <Zap className="w-4 h-4 text-orange-400" />
          } else if (t.type === 'success') {
            border = 'border-green-500/40'
            bg = 'bg-green-950/90'
            icon = <CheckCircle className="w-4 h-4 text-green-400" />
          }

          return (
            <div
              key={t.id}
              className={`toast-card pointer-events-auto border rounded-xl p-4 flex gap-3 backdrop-blur-md text-white shadow-2xl transition-all ${border} ${bg}`}
            >
              <div className="mt-0.5 flex-shrink-0">{icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold">{t.title}</p>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{t.body}</p>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
                className="text-slate-400 hover:text-white flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
