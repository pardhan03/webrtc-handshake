import React, { useEffect, useState } from 'react'

const Sender = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    setSocket(socket);
    socket.onopen = () => {
      console.log('connection established');
      socket.send(JSON.stringify({ type: "sender"}));
    }
  }, []);

  async function startSendVideo() {
    const pc = new RTCPeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket?.send(JSON.stringify({
      type: "create-offer",
      sdp: pc.localDescription
    }))
  }

  return (
    <div>
      <p>Sender</p>
      <button>Send video</button>
    </div>
  )
}

export default Sender