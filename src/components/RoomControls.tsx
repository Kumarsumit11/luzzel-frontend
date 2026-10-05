import React, { useState } from "react"
import { Copy, Check, RotateCcw, LogOut } from "lucide-react"

interface RoomControlsProps {
  roomCode: string
  isHost: boolean
  onResetPuzzle?: () => void
  onLeaveRoom: () => void
}

export const RoomControls: React.FC<RoomControlsProps> = ({
  roomCode,
  isHost,
  onResetPuzzle,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?room=${roomCode}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5 text-xs sm:gap-2">
      {/* Room Code Display */}
      <div className="flex min-h-9 items-center rounded-xl border-2 border-[#20201e] bg-white px-2 shadow-[2px_2px_0_#20201e] sm:px-2.5">
        <span className="mr-1.5 hidden text-[10px] font-black uppercase tracking-wide text-[#777168] sm:inline">
          Room
        </span>
        <span className="font-mono text-xs font-black tracking-wider text-[#20201e]">
          {roomCode}
        </span>
        <button
          onClick={handleCopyLink}
          title="Copy invite link"
          aria-label={copied ? "Invite link copied" : "Copy invite link"}
          className="ml-1.5 grid h-6 w-6 place-items-center rounded-md text-[#625d54] transition hover:bg-[#ffd84d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a88cff]"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-[#29934d]" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Host Controls */}
      {isHost && onResetPuzzle && (
        <button
          onClick={onResetPuzzle}
          title="Reset puzzle pieces"
          aria-label="Reset puzzle"
          className="flex min-h-9 items-center gap-1 rounded-xl border-2 border-[#20201e] bg-[#70c8ff] px-2 font-black shadow-[2px_2px_0_#20201e] transition hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#20201e] active:translate-y-0 active:shadow-none sm:px-2.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      )}

      {/* Leave Room Button */}
      <button
        onClick={onLeaveRoom}
        aria-label="Leave room"
        className="flex min-h-9 items-center gap-1 rounded-xl border-2 border-[#20201e] bg-[#ff6f91] px-2 font-black shadow-[2px_2px_0_#20201e] transition hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#20201e] active:translate-y-0 active:shadow-none sm:px-2.5"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Leave</span>
      </button>
    </div>
  )
}

export default RoomControls
