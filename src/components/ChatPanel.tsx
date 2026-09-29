import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Send } from 'lucide-react';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

interface ChatPanelProps {
  socket: Socket;
  roomId: string;
  currentUserId: string;
  currentUserName: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  socket,
  roomId,
  currentUserId,
  currentUserName
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const handleChatMessage = (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    };

    const handlePlayerJoined = (data: { player: { name: string } }) => {
      setMessages(prev => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          senderId: 'system',
          senderName: 'System',
          text: `${data.player.name} joined the room.`,
          timestamp: new Date().toISOString(),
          isSystem: true
        }
      ]);
    };

    const handlePlayerLeft = (data: { name: string }) => {
      setMessages(prev => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          senderId: 'system',
          senderName: 'System',
          text: `${data.name} left the room.`,
          timestamp: new Date().toISOString(),
          isSystem: true
        }
      ]);
    };

    socket.on('CHAT_MESSAGE', handleChatMessage);
    socket.on('PLAYER_JOINED', handlePlayerJoined);
    socket.on('PLAYER_LEFT', handlePlayerLeft);

    return () => {
      socket.off('CHAT_MESSAGE', handleChatMessage);
      socket.off('PLAYER_JOINED', handlePlayerJoined);
      socket.off('PLAYER_LEFT', handlePlayerLeft);
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputVal.trim();
    if (!text) return;

    socket.emit('CHAT_MESSAGE', {
      roomId,
      text
    });

    setInputVal('');
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col bg-slate-900 border-t border-slate-700 h-44 w-full text-slate-200">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 text-xs font-mono">
        {messages.length === 0 && (
          <div className="text-slate-500 italic text-[11px] py-1">
            Room chat active. Coordinate moves or say hello!
          </div>
        )}
        {messages.map((m) => {
          if (m.isSystem) {
            return (
              <div key={m.id} className="text-slate-400 italic text-[11px]">
                ℹ️ {m.text}
              </div>
            );
          }

          const isMe = m.senderId === currentUserId;

          return (
            <div key={m.id} className="flex items-baseline space-x-2">
              <span className="text-[10px] text-slate-500">{formatTime(m.timestamp)}</span>
              <span className={`font-semibold ${isMe ? 'text-blue-400' : 'text-emerald-400'}`}>
                {m.senderName}:
              </span>
              <span className="text-slate-200 break-words flex-1 font-sans">{m.text}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSendMessage} className="flex items-center px-3 py-2 bg-slate-800 border-t border-slate-700 space-x-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Type a message to your puzzle partner..."
          maxLength={500}
          className="flex-1 bg-slate-900 text-slate-100 placeholder-slate-500 px-3 py-1.5 text-xs rounded border border-slate-700 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!inputVal.trim()}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs flex items-center space-x-1 transition"
        >
          <span>Send</span>
          <Send className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
};
