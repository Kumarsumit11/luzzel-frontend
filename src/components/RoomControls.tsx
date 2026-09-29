import React, { useState } from 'react';
import { Copy, Check, RotateCcw, LogOut } from 'lucide-react';

interface RoomControlsProps {
  roomCode: string;
  isHost: boolean;
  onResetPuzzle?: () => void;
  onLeaveRoom: () => void;
}

export const RoomControls: React.FC<RoomControlsProps> = ({
  roomCode,
  isHost,
  onResetPuzzle,
  onLeaveRoom
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?room=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center space-x-2 text-xs">
      {/* Room Code Display */}
      <div className="flex items-center bg-slate-800 border border-slate-700 rounded px-2.5 py-1">
        <span className="text-slate-400 mr-1.5 font-mono text-[11px]">Room:</span>
        <span className="font-mono font-bold tracking-wider text-amber-300">{roomCode}</span>
        <button
          onClick={handleCopyLink}
          title="Copy invite link"
          className="ml-2 p-1 text-slate-400 hover:text-white transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Host Controls */}
      {isHost && onResetPuzzle && (
        <button
          onClick={onResetPuzzle}
          title="Reset puzzle pieces"
          className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      )}

      {/* Leave Room Button */}
      <button
        onClick={onLeaveRoom}
        className="flex items-center space-x-1 px-2.5 py-1 bg-red-700/80 hover:bg-red-700 text-white rounded transition"
      >
        <LogOut className="w-3 h-3" />
        <span>Leave</span>
      </button>
    </div>
  );
};
