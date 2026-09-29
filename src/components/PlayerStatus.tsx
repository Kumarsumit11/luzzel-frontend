import React from 'react';
import { Users, Crown, Shield } from 'lucide-react';

interface PlayerInfo {
  id: string;
  name: string;
  isHost: boolean;
  cameraOn?: boolean;
  micOn?: boolean;
}

interface PlayerStatusProps {
  players: Record<string, PlayerInfo>;
  currentUserId: string;
}

export const PlayerStatus: React.FC<PlayerStatusProps> = ({ players, currentUserId }) => {
  const playerList = Object.values(players);

  return (
    <div className="flex items-center space-x-3 text-xs">
      <div className="flex items-center space-x-1.5 text-slate-300">
        <Users className="w-3.5 h-3.5 text-blue-400" />
        <span className="font-medium">{playerList.length} / 2 Players</span>
      </div>

      <div className="flex items-center space-x-2">
        {playerList.map((player) => {
          const isMe = player.id === currentUserId;

          return (
            <div
              key={player.id}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] border ${
                isMe
                  ? 'bg-blue-950/60 border-blue-600 text-blue-200'
                  : 'bg-slate-800 border-slate-600 text-slate-200'
              }`}
            >
              {player.isHost ? (
                <Crown className="w-3 h-3 text-amber-400" />
              ) : (
                <Shield className="w-3 h-3 text-slate-400" />
              )}
              <span>{player.name} {isMe ? '(You)' : ''}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
