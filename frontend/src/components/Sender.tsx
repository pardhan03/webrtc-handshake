import { useEffect, useState } from 'react'

const Sender = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    setSocket(socket);
    socket.onopen = () => {
      console.log('connection established');
      socket.send(JSON.stringify({ type: "sender" }));
    }
    setSocket(socket);
  }, []);

  async function startSendVideo() {
    if (!socket) return;

    const pc = new RTCPeerConnection(); // crreat an offer

    pc.onnegotiationneeded = async () => {
      const offer = await pc.createOffer(); //sdp
      await pc.setLocalDescription(offer);
      socket?.send(JSON.stringify({
        type: "createOffer",
        sdp: pc.localDescription
      }))
    }

    if (!pc) return;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send(JSON.stringify({
          type: 'iceCandidate',
          candidate: event.candidate,
        }))
      }
    }

    // trickle ice candidate
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data?.type === "createAnswer") {
        pc.setRemoteDescription(data.sdp);
      } else if (data?.type == "iceCandidate") {
        pc.addIceCandidate(data.candidate)
      }
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    })
    pc.addTrack(stream.getVideoTracks()[0]);
  }

  return (
    <div>
      <p>Sender</p>
      <button onClick={startSendVideo}>Send video</button>
    </div>
  )
}

export default Sender