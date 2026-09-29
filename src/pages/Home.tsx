import React, { useState, useEffect } from 'react';
import { PUZZLES } from '../data/puzzles';

interface HomeProps {
  onCreateRoom: (puzzleId: string, playerName: string) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  errorMessage?: string | null;
  isLoading?: boolean;
}

export const Home: React.FC<HomeProps> = ({
  onCreateRoom,
  onJoinRoom,
  errorMessage,
  isLoading = false
}) => {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('luzzel_player_name') || '';
  });
  const [roomCode, setRoomCode] = useState('');
  const [selectedPuzzleId, setSelectedPuzzleId] = useState(PUZZLES[0].id);

  // Auto-detect ?room=ABC123 in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code) {
      setRoomCode(code.toUpperCase());
      setMode('join');
    }
  }, []);

  const handleNameChange = (val: string) => {
    setPlayerName(val);
    localStorage.setItem('luzzel_player_name', val);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    onCreateRoom(selectedPuzzleId, playerName.trim());
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCode.trim()) return;
    onJoinRoom(roomCode.trim().toUpperCase(), playerName.trim());
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-md shadow-xl text-slate-100">
        {/* App Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold tracking-wider text-white">LUZZEL</h1>
          <p className="text-xs text-slate-400 mt-1">Real-Time 2-Player Collaborative Jigsaw Puzzle</p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-900/60 border border-red-700 text-red-200 text-xs rounded">
            {errorMessage}
          </div>
        )}

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-700 mb-5">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition ${
              mode === 'create'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Room
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition ${
              mode === 'join'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Join Room
          </button>
        </div>

        {/* Player Name Input (Common to both modes) */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Your Name
          </label>
          <input
            type="text"
            required
            maxLength={25}
            value={playerName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Enter your display name"
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* CREATE ROOM FORM */}
        {mode === 'create' ? (
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Select Puzzle
              </label>
              <select
                value={selectedPuzzleId}
                onChange={(e) => setSelectedPuzzleId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {PUZZLES.map((puzzle) => (
                  <option key={puzzle.id} value={puzzle.id}>
                    {puzzle.title} ({puzzle.rows * puzzle.columns} pieces)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading || !playerName.trim()}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded transition"
            >
              {isLoading ? 'Creating Room...' : 'Create Room'}
            </button>
          </form>
        ) : (
          /* JOIN ROOM FORM */
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Room Code
              </label>
              <input
                type="text"
                required
                maxLength={10}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC123"
                className="w-full uppercase font-mono tracking-widest bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !playerName.trim() || !roomCode.trim()}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded transition"
            >
              {isLoading ? 'Joining Room...' : 'Join Room'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
