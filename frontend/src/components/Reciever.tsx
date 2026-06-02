import { useEffect, useRef } from 'react'

const Receiver = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    let pc: RTCPeerConnection | null = null;

    socket.onopen = () => {
      console.log('connection established');
      socket.send(JSON.stringify({ type: "receiver" }));
    }

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "createOffer") {
        pc = new RTCPeerConnection();

        // ontrack MUST be registered BEFORE setRemoteDescription
        pc.ontrack = (event) => {
          console.log('track received');
          if (videoRef.current) {
            videoRef.current.srcObject = new MediaStream([event.track]);
            videoRef.current.play();
          }
        }

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.send(JSON.stringify({
              type: 'iceCandidate',
              candidate: event.candidate,
            }))
          }
        }

        await pc.setRemoteDescription(message.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.send(JSON.stringify({
          type: 'createAnswer',
          sdp: pc.localDescription
        }));

      } else if (message.type === "iceCandidate") {
        if (pc) {
          await pc.addIceCandidate(message.candidate);
        }
      }
    }
  }, [])

  return (
    <div>
      <p>Receiver</p>
      <video ref={videoRef} autoPlay playsInline />
    </div>
  )
}

export default Receiver