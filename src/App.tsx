import { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Room } from './pages/Room';
import { getSocket } from './socket/socket';

export function App() {
  const [currentView, setCurrentView] = useState<'home' | 'room'>('home');
  const [roomData, setRoomData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Player session ID stored across reloads
  const [playerId] = useState<string>(() => {
    let id = sessionStorage.getItem('luzzel_player_id');
    if (!id) {
      id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      sessionStorage.setItem('luzzel_player_id', id);
    }
    return id;
  });

  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('luzzel_player_name') || '';
  });

  const socket = getSocket();

  useEffect(() => {
    const handleConnectError = (err: any) => {
      console.warn('Socket connection error:', err);
    };
    socket.on('connect_error', handleConnectError);
    return () => {
      socket.off('connect_error', handleConnectError);
    };
  }, [socket]);

  // Handle Room Creation
  const handleCreateRoom = (puzzleId: string, name: string) => {
    setErrorMessage(null);
    setIsLoading(true);
    setPlayerName(name);

    socket.emit(
      'ROOM_CREATE',
      { puzzleId, playerName: name, playerId },
      (response: any) => {
        setIsLoading(false);
        if (response && response.success) {
          setRoomData(response.room);
          setCurrentView('room');
          // Update URL without full reload
          window.history.pushState({}, '', `/?room=${response.roomCode}`);
        } else {
          setErrorMessage(response?.error || 'Failed to create room. Please try again.');
        }
      }
    );
  };

  // Handle Room Join
  const handleJoinRoom = (roomCode: string, name: string) => {
    setErrorMessage(null);
    setIsLoading(true);
    setPlayerName(name);

    socket.emit(
      'ROOM_JOIN',
      { roomCode, playerName: name, playerId },
      (response: any) => {
        setIsLoading(false);
        if (response && response.success) {
          setRoomData(response.room);
          setCurrentView('room');
          window.history.pushState({}, '', `/?room=${response.roomCode}`);
        } else {
          setErrorMessage(response?.error || 'Failed to join room. Room might be full or invalid.');
        }
      }
    );
  };

  // Handle Leaving Room
  const handleLeaveRoom = () => {
    socket.emit('ROOM_LEAVE', {});
    setRoomData(null);
    setCurrentView('home');
    window.history.pushState({}, '', '/');
  };

  return (
    <div className="w-full h-full min-h-screen">
      {currentView === 'home' || !roomData ? (
        <Home
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          errorMessage={errorMessage}
          isLoading={isLoading}
        />
      ) : (
        <Room
          socket={socket}
          roomId={roomData.id}
          roomCode={roomData.roomCode}
          currentUserId={playerId}
          currentUserName={playerName}
          initialRoomData={roomData}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </div>
  );
}

export default App;
