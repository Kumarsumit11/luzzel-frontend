import React, { useEffect, useState, useRef, useCallback } from "react"
import { Socket } from "socket.io-client"
import { PuzzleBoard } from "../components/PuzzleBoard"
import { VideoPanel } from "../components/VideoPanel"
import { ChatPanel } from "../components/ChatPanel"
import { RoomControls } from "../components/RoomControls"
import { PlayerStatus } from "../components/PlayerStatus"
import { WebRTCManager } from "../webrtc/WebRTCManager"
import { PuzzleInstance } from "../puzzle/puzzleTypes"
import { createPuzzleInstance } from "../puzzle/puzzleGenerator"
import { getPuzzleById } from "../data/puzzles"

interface RoomPageProps {
  socket: Socket
  roomId: string
  roomCode: string
  currentUserId: string
  currentUserName: string
  initialRoomData: any
  onLeaveRoom: () => void
}

export const Room: React.FC<RoomPageProps> = ({
  socket,
  roomId: _roomId,
  roomCode,
  currentUserId,
  currentUserName,
  initialRoomData,
  onLeaveRoom,
}) => {
  const [room, setRoom] = useState<any>(initialRoomData)
  const [puzzleInstance, setPuzzleInstance] = useState<PuzzleInstance | null>(
    null,
  )
  const [loadingPuzzle, setLoadingPuzzle] = useState(true)
  const [webrtcManager, setWebrtcManager] = useState<WebRTCManager | null>(null)
  const puzzleInitializedRef = useRef(false)

  const players = room?.players || {}
  const playerList = Object.values(players)
  const myPlayer =
    (socket.id ? players[socket.id] : undefined) ||
    playerList.find((p: any) => p.id === currentUserId)
  const isHost = myPlayer?.isHost ?? false

  // Remote partner details
  const remotePlayer = playerList.find(
    (p: any) => p.id !== currentUserId,
  ) as any
  const isPeerConnected = !!remotePlayer

  // Initialize WebRTC
  useEffect(() => {
    const manager = new WebRTCManager(socket, roomCode)
    setWebrtcManager(manager)

    // Request media devices
    manager.startLocalStream()

    return () => {
      manager.cleanup()
    }
  }, [socket, roomCode])

  // When a second player joins, initiate call if host
  useEffect(() => {
    if (isPeerConnected && isHost && webrtcManager) {
      // Slight delay to allow peer socket to attach listeners
      const timer = setTimeout(() => {
        webrtcManager.initiateCall()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [isPeerConnected, isHost, webrtcManager])

  // Generate / Load Puzzle Instance
  const initPuzzle = useCallback(
    async (stateOverride?: any) => {
      try {
        setLoadingPuzzle(true)
        const puzzleDef = getPuzzleById(room?.puzzleId || "waterfall")

        // Calculate workspace size
        const workspaceWidth = Math.max(800, window.innerWidth - 300)
        const workspaceHeight = Math.max(500, window.innerHeight - 240)

        const instance = await createPuzzleInstance(
          puzzleDef,
          workspaceWidth,
          workspaceHeight,
        )

        // If server or host already provided scattered pieces, apply them
        if (stateOverride && stateOverride.pieces) {
          const overrideMap = new Map(
            stateOverride.pieces.map((p: any) => [p.id, p]),
          )
          instance.pieces = instance.pieces.map((p) => {
            const over = overrideMap.get(p.id) as any
            return over
              ? { ...p, x: over.x, y: over.y, groupId: over.groupId }
              : p
          })
        } else if (isHost && !puzzleInitializedRef.current) {
          // Send initial scatter state to server
          puzzleInitializedRef.current = true
          socket.emit("PUZZLE_STATE", {
            roomId: roomCode,
            puzzleId: puzzleDef.id,
            pieces: instance.pieces,
          })
        }

        setPuzzleInstance(instance)
      } catch (err) {
        console.error("[Room] Failed to initialize puzzle:", err)
      } finally {
        setLoadingPuzzle(false)
      }
    },
    [room?.puzzleId, roomCode, isHost, socket],
  )

  useEffect(() => {
    if (room?.puzzleState) {
      initPuzzle(room.puzzleState)
    } else {
      initPuzzle()
    }
  }, [initPuzzle, room?.puzzleState])

  // Socket room events
  useEffect(() => {
    const handleRoomState = (updatedRoom: any) => {
      setRoom(updatedRoom)
    }

    const handlePlayerJoined = (_data: any) => {
      // Peer joined; if host, trigger WebRTC offer
      if (isHost && webrtcManager) {
        setTimeout(() => webrtcManager.initiateCall(), 500)
      }
    }

    const handlePlayerLeft = (_data: any) => {
      // If peer left, handle WebRTC reset
    }

    const handlePuzzleReset = () => {
      initPuzzle()
    }

    socket.on("ROOM_STATE", handleRoomState)
    socket.on("PLAYER_JOINED", handlePlayerJoined)
    socket.on("PLAYER_LEFT", handlePlayerLeft)
    socket.on("PUZZLE_RESET", handlePuzzleReset)

    return () => {
      socket.off("ROOM_STATE", handleRoomState)
      socket.off("PLAYER_JOINED", handlePlayerJoined)
      socket.off("PLAYER_LEFT", handlePlayerLeft)
      socket.off("PUZZLE_RESET", handlePuzzleReset)
    }
  }, [socket, isHost, webrtcManager, initPuzzle])

  const handleResetPuzzle = () => {
    socket.emit("PUZZLE_RESET", { roomId: roomCode })
    initPuzzle()
  }

  return (
    <div className="flex h-dvh w-screen flex-col overflow-hidden bg-[#f5ebd4] font-['Trebuchet_MS',Arial,sans-serif] text-[#20201e]">
      {/* Top Header Bar */}
      <header className="z-10 flex shrink-0 items-center justify-between gap-2 border-b-[3px] border-[#20201e] bg-[#fffaf0] px-2 py-2 shadow-[0_3px_0_rgba(32,32,30,.12)] sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <span className="-rotate-2 rounded-lg border-2 border-[#20201e] bg-[#ff6f91] px-2 py-1 text-sm font-black tracking-tight shadow-[2px_2px_0_#20201e] sm:text-base">
            LUZZEL
          </span>
          <PlayerStatus players={players} currentUserId={currentUserId} />
        </div>

        <RoomControls
          roomCode={roomCode}
          isHost={isHost}
          onResetPuzzle={handleResetPuzzle}
          onLeaveRoom={onLeaveRoom}
        />
      </header>

      {/* Main Workspace (Split: Puzzle Board on left, Video on right) */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Left: Jigsaw Puzzle Canvas Workspace */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#e9dfcc]">
          {loadingPuzzle || !puzzleInstance ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-sm font-black text-[#625d54]">
              <div className="relative h-14 w-14 animate-[spin_2.4s_linear_infinite] rounded-2xl border-[3px] border-[#20201e] bg-[#ffd84d] shadow-[4px_4px_0_#20201e]">
                <div className="absolute -right-2 top-4 h-5 w-5 rounded-full border-[3px] border-[#20201e] bg-[#ffd84d]" />
              </div>
              <span className="rounded-full border-2 border-[#20201e] bg-[#fffaf0] px-4 py-2 shadow-[2px_2px_0_#20201e]">
                Cutting out your puzzle pieces...
              </span>
            </div>
          ) : (
            <PuzzleBoard
              socket={socket}
              roomId={roomCode}
              puzzleInstance={puzzleInstance}
              isCompleted={room?.status === "COMPLETED"}
            />
          )}
        </div>

        {/* Right: Video & Audio Panel */}
        <VideoPanel
          webrtcManager={webrtcManager}
          remotePlayerName={remotePlayer?.name || "Waiting for Partner"}
          isPeerConnected={isPeerConnected}
        />
      </div>

      {/* Bottom: Text Chat Panel */}
      <footer className="shrink-0">
        <ChatPanel
          socket={socket}
          roomId={roomCode}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
        />
      </footer>
    </div>
  )
}

export default Room
