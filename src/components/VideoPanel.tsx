import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, User } from 'lucide-react';
import { WebRTCManager } from '../webrtc/WebRTCManager';

interface VideoPanelProps {
  webrtcManager: WebRTCManager | null;
  remotePlayerName?: string;
  isPeerConnected: boolean;
  onLeaveCall?: () => void;
}

export const VideoPanel: React.FC<VideoPanelProps> = ({
  webrtcManager,
  remotePlayerName = 'Partner',
  isPeerConnected,
  onLeaveCall
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [hasLocalVideo, setHasLocalVideo] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Initializing');

  useEffect(() => {
    if (!webrtcManager) return;

    webrtcManager.onLocalStream = (stream) => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        setHasLocalVideo(stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled);
      }
    };

    webrtcManager.onRemoteStream = (stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        setHasRemoteVideo(stream.getVideoTracks().length > 0);
      }
    };

    webrtcManager.onConnectionStateChange = (state) => {
      setConnectionStatus(state);
      if (state === 'connected') {
        setHasRemoteVideo(true);
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        setHasRemoteVideo(false);
      }
    };

    webrtcManager.onError = (msg) => {
      console.warn('[VideoPanel] WebRTC note:', msg);
    };

    return () => {
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };
  }, [webrtcManager]);

  const toggleCamera = () => {
    if (webrtcManager) {
      const active = webrtcManager.toggleVideo();
      setIsCameraOn(active);
      setHasLocalVideo(active);
    }
  };

  const toggleMic = () => {
    if (webrtcManager) {
      const active = webrtcManager.toggleAudio();
      setIsMicOn(active);
    }
  };

  return (
    <div className="flex flex-col bg-slate-800 border-l border-slate-700 w-72 h-full text-slate-100 select-none">
      {/* Panel Header */}
      <div className="px-3 py-2 border-b border-slate-700 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-200">Live Video</span>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
            connectionStatus === 'connected'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
              : 'bg-amber-950 text-amber-300 border border-amber-700'
          }`}
        >
          {connectionStatus}
        </span>
      </div>

      {/* Videos Section */}
      <div className="flex-1 flex flex-col p-2 space-y-2 overflow-y-auto">
        {/* Remote Video Container */}
        <div className="relative flex-1 min-h-[140px] bg-slate-900 rounded border border-slate-700 overflow-hidden flex items-center justify-center">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${hasRemoteVideo && isPeerConnected ? 'block' : 'hidden'}`}
          />
          {(!hasRemoteVideo || !isPeerConnected) && (
            <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
              <User className="w-8 h-8 text-slate-500 mb-1" />
              <span className="text-xs font-medium">{remotePlayerName}</span>
              <span className="text-[10px] text-slate-500">
                {isPeerConnected ? 'Connecting video...' : 'Waiting for partner...'}
              </span>
            </div>
          )}
          <span className="absolute bottom-1.5 left-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-slate-300">
            {remotePlayerName}
          </span>
        </div>

        {/* Local Video Container (Mirrored Preview) */}
        <div className="relative h-28 bg-slate-900 rounded border border-slate-700 overflow-hidden flex items-center justify-center">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover scale-x-[-1] ${hasLocalVideo && isCameraOn ? 'block' : 'hidden'}`}
          />
          {(!hasLocalVideo || !isCameraOn) && (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <User className="w-6 h-6 text-slate-500 mb-0.5" />
              <span className="text-[11px]">Camera Off</span>
            </div>
          )}
          <span className="absolute bottom-1.5 left-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-slate-300">
            You (Local)
          </span>
        </div>
      </div>

      {/* Media Controls Bar */}
      <div className="p-2 border-t border-slate-700 flex items-center justify-around bg-slate-850">
        <button
          onClick={toggleMic}
          title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
          className={`p-2 rounded-full transition ${
            isMicOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleCamera}
          title={isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
          className={`p-2 rounded-full transition ${
            isCameraOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {isCameraOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
        </button>

        {onLeaveCall && (
          <button
            onClick={onLeaveCall}
            title="Leave Call"
            className="p-2 bg-red-600 hover:bg-red-700 rounded-full text-white transition"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
