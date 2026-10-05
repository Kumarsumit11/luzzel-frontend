import React from "react"
import { Users, Crown, Shield } from "lucide-react"

interface PlayerInfo {
  id: string
  name: string
  isHost: boolean
  cameraOn?: boolean
  micOn?: boolean
}

interface PlayerStatusProps {
  players: Record<string, PlayerInfo>
  currentUserId: string
}

export const PlayerStatus: React.FC<PlayerStatusProps> = ({
  players,
  currentUserId,
}) => {
  const playerList = Object.values(players)

  return (
    <div className="flex min-w-0 items-center gap-2 text-xs">
      <div className="flex shrink-0 items-center gap-1.5 rounded-full border-2 border-[#20201e] bg-[#ffd84d] px-2 py-1 font-black shadow-[2px_2px_0_#20201e]">
        <Users className="h-3.5 w-3.5" />
        <span>{playerList.length}/2</span>
        <span className="hidden sm:inline">players</span>
      </div>

      <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto pb-0.5">
        {playerList.map((player) => {
          const isMe = player.id === currentUserId

          return (
            <div
              key={player.id}
              title={`${player.name}${isMe ? " (You)" : ""}`}
              className={`flex shrink-0 items-center gap-1 rounded-full border-2 border-[#20201e] px-2 py-1 text-[10px] font-black shadow-[2px_2px_0_#20201e] ${
                isMe ? "bg-[#70c8ff]" : "bg-[#8edb91]"
              }`}
            >
              {player.isHost ? (
                <Crown className="h-3 w-3 fill-[#ffd84d]" />
              ) : (
                <Shield className="h-3 w-3" />
              )}
              <span className="max-w-20 truncate">{player.name}</span>
              {isMe && <span className="hidden md:inline">(You)</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PlayerStatus
