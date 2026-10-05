import React, { useState, useEffect, useRef } from "react"
import { Socket } from "socket.io-client"
import { MessageCircle, Send } from "lucide-react"

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  text: string
  timestamp: string
  isSystem?: boolean
}

interface ChatPanelProps {
  socket: Socket
  roomId: string
  currentUserId: string
  currentUserName: string
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  socket,
  roomId,
  currentUserId,
  currentUserName,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputVal, setInputVal] = useState("")
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    const handleChatMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg])
    }

    const handlePlayerJoined = (data: { player: { name: string } }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          senderId: "system",
          senderName: "System",
          text: `${data.player.name} joined the room.`,
          timestamp: new Date().toISOString(),
          isSystem: true,
        },
      ])
    }

    const handlePlayerLeft = (data: { name: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          senderId: "system",
          senderName: "System",
          text: `${data.name} left the room.`,
          timestamp: new Date().toISOString(),
          isSystem: true,
        },
      ])
    }

    socket.on("CHAT_MESSAGE", handleChatMessage)
    socket.on("PLAYER_JOINED", handlePlayerJoined)
    socket.on("PLAYER_LEFT", handlePlayerLeft)

    return () => {
      socket.off("CHAT_MESSAGE", handleChatMessage)
      socket.off("PLAYER_JOINED", handlePlayerJoined)
      socket.off("PLAYER_LEFT", handlePlayerLeft)
    }
  }, [socket])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    const text = inputVal.trim()
    if (!text) return

    socket.emit("CHAT_MESSAGE", {
      roomId,
      text,
    })

    setInputVal("")
  }

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch {
      return ""
    }
  }

  return (
    <section className="flex h-48 w-full flex-col border-t-[3px] border-[#20201e] bg-[#fffaf0] text-[#20201e] sm:h-52">
      <div className="flex items-center justify-between border-b-2 border-[#20201e] bg-[#ffd84d] px-3 py-1.5 sm:px-4">
        <div className="flex items-center gap-2 text-xs font-black">
          <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-[#20201e] bg-white">
            <MessageCircle className="h-3.5 w-3.5" />
          </span>
          Puzzle chatter
        </div>
        <span className="rounded-full border-2 border-[#20201e] bg-[#8edb91] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
          Live
        </span>
      </div>

      {/* Messages List */}
      <div
        className="flex-1 space-y-2 overflow-y-auto px-3 py-2 text-xs sm:px-4"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="mx-auto flex max-w-sm items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#b8ad99] bg-white/70 px-3 py-2 text-center text-[11px] font-bold text-[#777168]">
            <MessageCircle className="h-4 w-4 shrink-0" />
            Chat is ready. Plan your next move or say hello.
          </div>
        )}
        {messages.map((m) => {
          if (m.isSystem) {
            return (
              <div
                key={m.id}
                className="mx-auto w-fit rounded-full border border-[#20201e] bg-[#e9dfcc] px-2.5 py-1 text-center text-[10px] font-bold text-[#625d54]"
              >
                {m.text}
              </div>
            )
          }

          const isMe = m.senderId === currentUserId

          return (
            <div
              key={m.id}
              className={`flex items-end gap-2 ${
                isMe ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[82%] rounded-2xl border-2 border-[#20201e] px-3 py-1.5 shadow-[2px_2px_0_#20201e] ${
                  isMe
                    ? "rounded-br-sm bg-[#70c8ff]"
                    : "rounded-bl-sm bg-[#8edb91]"
                }`}
              >
                <div className="mb-0.5 flex items-center gap-2">
                  <span className="text-[10px] font-black">
                    {isMe ? "You" : m.senderName}
                  </span>
                  <span className="text-[9px] font-bold text-[#625d54]">
                    {formatTime(m.timestamp)}
                  </span>
                </div>
                <p className="break-words text-[11px] font-semibold leading-relaxed">
                  {m.text}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 border-t-2 border-[#20201e] bg-[#f5ebd4] px-2 py-2 sm:px-3"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Message your puzzle pal..."
          maxLength={500}
          aria-label="Chat message"
          className="min-w-0 flex-1 rounded-xl border-2 border-[#20201e] bg-white px-3 py-2 text-xs font-semibold text-[#20201e] shadow-[2px_2px_0_#d7ccb8] outline-none placeholder:text-[#9a9387] focus:-translate-y-0.5 focus:shadow-[3px_3px_0_#70c8ff]"
        />
        <button
          type="submit"
          disabled={!inputVal.trim()}
          aria-label="Send message"
          className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl border-2 border-[#20201e] bg-[#ff6f91] px-3 py-2 text-xs font-black shadow-[3px_3px_0_#20201e] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#20201e] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
        >
          <span className="hidden sm:inline">Send</span>
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </section>
  )
}

export default ChatPanel
