import { useEffect } from 'react'

const Reciever = () => {

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    socket.onopen = () => {
      console.log('connection established');
      socket.send(JSON.stringify({ type: "reciever" }));
    }

    if(!socket) return;

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "createOffer") {
        const pc = new RTCPeerConnection();
        pc.setRemoteDescription(message.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.send(JSON.stringify({
          type: 'createAnswer',
          sdp: pc.localDescription
        }));
      }
    }
  }, [])

  return (
    <div>
      <p>Reciver</p>
    </div>
  )
}

export default Reciever