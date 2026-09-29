import { Socket } from 'socket.io-client';
import { getRTCConfiguration } from './webrtcConfig';

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private socket: Socket;
  private roomId: string;
  private pendingCandidates: RTCIceCandidateInit[] = [];

  public onLocalStream?: (stream: MediaStream) => void;
  public onRemoteStream?: (stream: MediaStream) => void;
  public onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  public onError?: (message: string) => void;

  constructor(socket: Socket, roomId: string) {
    this.socket = socket;
    this.roomId = roomId;
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on('WEBRTC_OFFER', async (data: { senderSocketId: string; offer: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] Received OFFER from peer');
      await this.handleOffer(data.offer);
    });

    this.socket.on('WEBRTC_ANSWER', async (data: { senderSocketId: string; answer: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] Received ANSWER from peer');
      await this.handleAnswer(data.answer);
    });

    this.socket.on('WEBRTC_ICE_CANDIDATE', async (data: { senderSocketId: string; candidate: RTCIceCandidateInit }) => {
      await this.handleIceCandidate(data.candidate);
    });
  }

  public async startLocalStream(): Promise<MediaStream | null> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('WebRTC mediaDevices is not supported in this browser environment.');
      }

      try {
        // Attempt both video and audio
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } },
          audio: true
        });
      } catch (err: any) {
        console.warn('[WebRTC] Could not get video+audio, trying audio only...', err.name);
        try {
          // Fallback to audio only
          this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (audioErr: any) {
          console.warn('[WebRTC] Audio also failed or denied. Proceeding without media tracks.', audioErr.name);
          // Return empty media stream so UI doesn't crash
          this.localStream = new MediaStream();
          this.onError?.('Camera and microphone permissions were denied or unavailable.');
        }
      }

      if (this.onLocalStream && this.localStream) {
        this.onLocalStream(this.localStream);
      }

      return this.localStream;
    } catch (err: any) {
      console.error('[WebRTC] getUserMedia failed:', err);
      this.onError?.(err.message || 'Media stream error');
      return null;
    }
  }

  private createPeerConnection(): RTCPeerConnection {
    if (this.peerConnection) {
      return this.peerConnection;
    }

    const config = getRTCConfiguration();
    const pc = new RTCPeerConnection(config);
    this.peerConnection = pc;

    // Add local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Remote track handler
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind);
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
        if (this.onRemoteStream) {
          this.onRemoteStream(this.remoteStream);
        }
      }
      this.remoteStream.addTrack(event.track);
    };

    // ICE candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('WEBRTC_ICE_CANDIDATE', {
          roomId: this.roomId,
          candidate: event.candidate.toJSON()
        });
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state changed to:', pc.connectionState);
      this.onConnectionStateChange?.(pc.connectionState);
    };

    return pc;
  }

  public async initiateCall() {
    try {
      console.log('[WebRTC] Initiating call (creating offer)...');
      const pc = this.createPeerConnection();

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);

      this.socket.emit('WEBRTC_OFFER', {
        roomId: this.roomId,
        offer: {
          type: offer.type,
          sdp: offer.sdp
        }
      });
    } catch (err: any) {
      console.error('[WebRTC] Error initiating call:', err);
      this.onError?.('Failed to initiate video call.');
    }
  }

  public async handleOffer(offer: RTCSessionDescriptionInit) {
    try {
      const pc = this.createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Process any buffered ICE candidates
      while (this.pendingCandidates.length > 0) {
        const candidate = this.pendingCandidates.shift();
        if (candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this.socket.emit('WEBRTC_ANSWER', {
        roomId: this.roomId,
        answer: {
          type: answer.type,
          sdp: answer.sdp
        }
      });
    } catch (err: any) {
      console.error('[WebRTC] Error handling offer:', err);
    }
  }

  public async handleAnswer(answer: RTCSessionDescriptionInit) {
    try {
      if (!this.peerConnection) return;
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

      // Process any buffered ICE candidates
      while (this.pendingCandidates.length > 0) {
        const candidate = this.pendingCandidates.shift();
        if (candidate) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }
    } catch (err: any) {
      console.error('[WebRTC] Error handling answer:', err);
    }
  }

  public async handleIceCandidate(candidate: RTCIceCandidateInit) {
    try {
      if (this.peerConnection && this.peerConnection.remoteDescription) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        // Queue candidates until remote description is set
        this.pendingCandidates.push(candidate);
      }
    } catch (err: any) {
      console.error('[WebRTC] Error adding ICE candidate:', err);
    }
  }

  public toggleVideo(): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.socket.emit('VIDEO_STATE', {
        roomId: this.roomId,
        cameraOn: videoTrack.enabled
      });
      return videoTrack.enabled;
    }
    return false;
  }

  public toggleAudio(): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.socket.emit('AUDIO_STATE', {
        roomId: this.roomId,
        micOn: audioTrack.enabled
      });
      return audioTrack.enabled;
    }
    return false;
  }

  public cleanup() {
    this.socket.off('WEBRTC_OFFER');
    this.socket.off('WEBRTC_ANSWER');
    this.socket.off('WEBRTC_ICE_CANDIDATE');

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.pendingCandidates = [];
  }
}
