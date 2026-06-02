import { useEffect } from 'react'

const Reciever = () => {

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    socket.onopen = () => {
      console.log('connection established');
      socket.send(JSON.stringify({ type: "reciever" }));
    }

    if (!socket) return;

    socket.onmessage = async (event) => {
      let pc: RTCPeerConnection | null = null;
      const message = JSON.parse(event.data);
      if (message.type === "createOffer") {
        pc = new RTCPeerConnection();
        pc.setRemoteDescription(message.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (!pc) return;

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.send(JSON.stringify({
              type: 'iceCandidate',
              candidate: event.candidate,
            }))
          }
        };

        socket.send(JSON.stringify({
          type: 'createAnswer',
          sdp: pc.localDescription
        }));
      } else if (message?.type == "iceCandidate") {
        if (pc !== null) {
          // @ts-ignore
          pc.addIceCandidate(message.candidate)
        }
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