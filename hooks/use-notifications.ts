import { useState, useEffect, useCallback } from 'react'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  action?: string
  actionDetails?: Record<string, any>
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isConnected, setIsConnected] = useState(true)

  const addNotification = useCallback((
    type: Notification['type'],
    title: string,
    message: string,
    action?: string,
    actionDetails?: Record<string, any>
  ) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date(),
      action,
      actionDetails,
    }

    setNotifications((prev) => [notification, ...prev].slice(0, 50))

    // Auto-remove after 5 seconds (unless it's an error)
    if (type !== 'error') {
      const timer = setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id)
        )
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  // Fetch real-time events (polling approach)
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) return

        const response = await fetch('/api/audit-logs?limit=5', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          setIsConnected(true)
        }
      } catch (error) {
        setIsConnected(false)
      }
    }

    // Poll every 30 seconds for new audit logs
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  return {
    notifications,
    addNotification,
    removeNotification,
    isConnected,
  }
}

// Notification display component
export function NotificationCenter() {
  const { notifications, removeNotification } = useNotifications()

  return (
    <div className="fixed bottom-4 right-4 z-50 max-h-96 overflow-y-auto space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg text-white max-w-md animate-in fade-in slide-in-from-right ${
            notification.type === 'success'
              ? 'bg-green-600'
              : notification.type === 'error'
              ? 'bg-red-600'
              : notification.type === 'warning'
              ? 'bg-yellow-600'
              : 'bg-blue-600'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold">{notification.title}</p>
              <p className="text-sm opacity-90">{notification.message}</p>
              {notification.action && (
                <p className="text-xs mt-1 opacity-75">
                  Action: {notification.action}
                </p>
              )}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-2 text-white hover:opacity-75"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
