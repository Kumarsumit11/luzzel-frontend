import React, { useEffect, useRef, useState } from "react"
import { Camera, CameraOff, Mic, MicOff, PhoneOff, User } from "lucide-react"
import { WebRTCManager } from "../webrtc/WebRTCManager"

interface VideoPanelProps {
  webrtcManager: WebRTCManager | null
  remotePlayerName?: string
  isPeerConnected: boolean
  onLeaveCall?: () => void
}

export const VideoPanel: React.FC<VideoPanelProps> = ({
  webrtcManager,
  remotePlayerName = "Partner",
  isPeerConnected,
  onLeaveCall,
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)

  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isMicOn, setIsMicOn] = useState(true)
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false)
  const [hasLocalVideo, setHasLocalVideo] = useState(false)
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Initializing")

  useEffect(() => {
    if (!webrtcManager) return

    webrtcManager.onLocalStream = (stream) => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        setHasLocalVideo(
          stream.getVideoTracks().length > 0 &&
            stream.getVideoTracks()[0].enabled,
        )
      }
    }

    webrtcManager.onRemoteStream = (stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream
        setHasRemoteVideo(stream.getVideoTracks().length > 0)
      }
    }

    webrtcManager.onConnectionStateChange = (state) => {
      setConnectionStatus(state)
      if (state === "connected") {
        setHasRemoteVideo(true)
      } else if (
        state === "disconnected" ||
        state === "failed" ||
        state === "closed"
      ) {
        setHasRemoteVideo(false)
      }
    }

    webrtcManager.onError = (msg) => {
      console.warn("[VideoPanel] WebRTC note:", msg)
    }

    return () => {
      if (localVideoRef.current) localVideoRef.current.srcObject = null
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    }
  }, [webrtcManager])

  const toggleCamera = () => {
    if (webrtcManager) {
      const active = webrtcManager.toggleVideo()
      setIsCameraOn(active)
      setHasLocalVideo(active)
    }
  }

  const toggleMic = () => {
    if (webrtcManager) {
      const active = webrtcManager.toggleAudio()
      setIsMicOn(active)
    }
  }

  return (
    <aside className="flex h-44 w-full shrink-0 select-none flex-col border-t-[3px] border-[#20201e] bg-[#f5ebd4] text-[#20201e] lg:h-full lg:w-72 lg:border-l-[3px] lg:border-t-0">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b-2 border-[#20201e] bg-[#a88cff] px-3 py-1.5 text-xs">
        <span className="font-black">Puzzle pals</span>
        <span
          className={`rounded-full border-2 border-[#20201e] px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${
            connectionStatus === "connected" ? "bg-[#8edb91]" : "bg-[#ffd84d]"
          }`}
        >
          {connectionStatus}
        </span>
      </div>

      {/* Videos Section */}
      <div className="flex min-h-0 flex-1 gap-2 overflow-hidden p-2 lg:flex-col">
        {/* Remote Video Container */}
        <div className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden rounded-xl border-2 border-[#20201e] bg-[#d9cfbc] shadow-[2px_2px_0_#20201e] lg:min-h-36">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`h-full w-full object-cover ${
              hasRemoteVideo && isPeerConnected ? "block" : "hidden"
            }`}
          />
          {(!hasRemoteVideo || !isPeerConnected) && (
            <div className="flex flex-col items-center justify-center p-2 text-center text-[#625d54]">
              <span className="mb-1 grid h-8 w-8 place-items-center rounded-full border-2 border-[#20201e] bg-[#fffaf0]">
                <User className="h-4 w-4" />
              </span>
              <span className="max-w-28 truncate text-[11px] font-black">
                {remotePlayerName}
              </span>
              <span className="hidden text-[9px] font-bold text-[#777168] sm:inline">
                {isPeerConnected
                  ? "Connecting video..."
                  : "Waiting for partner..."}
              </span>
            </div>
          )}
          <span className="absolute bottom-1.5 left-2 max-w-[85%] truncate rounded-full border border-[#20201e] bg-[#fffaf0]/90 px-1.5 py-0.5 text-[9px] font-black">
            {remotePlayerName}
          </span>
        </div>

        {/* Local Video Container (Mirrored Preview) */}
        <div className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden rounded-xl border-2 border-[#20201e] bg-[#d9cfbc] shadow-[2px_2px_0_#20201e] lg:h-28 lg:flex-none">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full scale-x-[-1] object-cover ${
              hasLocalVideo && isCameraOn ? "block" : "hidden"
            }`}
          />
          {(!hasLocalVideo || !isCameraOn) && (
            <div className="flex flex-col items-center justify-center text-[#625d54]">
              <span className="mb-1 grid h-7 w-7 place-items-center rounded-full border-2 border-[#20201e] bg-[#fffaf0]">
                <User className="h-3.5 w-3.5" />
              </span>
              <span className="text-[10px] font-black">Camera off</span>
            </div>
          )}
          <span className="absolute bottom-1.5 left-2 rounded-full border border-[#20201e] bg-[#70c8ff]/90 px-1.5 py-0.5 text-[9px] font-black">
            You
          </span>
        </div>
      </div>

      {/* Media Controls Bar */}
      <div className="flex items-center justify-center gap-2 border-t-2 border-[#20201e] bg-[#fffaf0] p-1.5 lg:p-2">
        <button
          onClick={toggleMic}
          title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
          aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}
          className={`grid h-8 w-8 place-items-center rounded-full border-2 border-[#20201e] shadow-[2px_2px_0_#20201e] transition hover:-translate-y-0.5 active:translate-y-0 active:shadow-none ${
            isMicOn ? "bg-[#70c8ff]" : "bg-[#ff6f91]"
          }`}
        >
          {isMicOn ? (
            <Mic className="h-3.5 w-3.5" />
          ) : (
            <MicOff className="h-3.5 w-3.5" />
          )}
        </button>

        <button
          onClick={toggleCamera}
          title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
          aria-label={isCameraOn ? "Turn camera off" : "Turn camera on"}
          className={`grid h-8 w-8 place-items-center rounded-full border-2 border-[#20201e] shadow-[2px_2px_0_#20201e] transition hover:-translate-y-0.5 active:translate-y-0 active:shadow-none ${
            isCameraOn ? "bg-[#ffd84d]" : "bg-[#ff6f91]"
          }`}
        >
          {isCameraOn ? (
            <Camera className="h-3.5 w-3.5" />
          ) : (
            <CameraOff className="h-3.5 w-3.5" />
          )}
        </button>

        {onLeaveCall && (
          <button
            onClick={onLeaveCall}
            title="Leave Call"
            aria-label="Leave call"
            className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#20201e] bg-[#ff6f91] shadow-[2px_2px_0_#20201e] transition hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
          >
            <PhoneOff className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </aside>
  )
}

export default VideoPanel
