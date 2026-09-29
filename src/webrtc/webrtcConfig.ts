export interface RTCConfigurationWithTurn {
  iceServers: RTCIceServer[];
}

export function getRTCConfiguration(): RTCConfiguration {
  const iceServers: RTCIceServer[] = [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302'
      ]
    }
  ];

  // Optional TURN server from environment variables
  const turnUrl = import.meta.env.VITE_TURN_SERVER_URL;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME;
  const turnPassword = import.meta.env.VITE_TURN_PASSWORD;

  if (turnUrl) {
    const turnConfig: RTCIceServer = {
      urls: turnUrl
    };
    if (turnUsername && turnPassword) {
      turnConfig.username = turnUsername;
      turnConfig.credential = turnPassword;
    }
    iceServers.push(turnConfig);
  }

  return {
    iceServers,
    iceCandidatePoolSize: 2
  };
}
