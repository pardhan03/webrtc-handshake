import React, { useEffect } from 'react'

const Reciever = () => {

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    socket.onopen = () => {
      console.log('connection established');
      socket.send(JSON.stringify({ type: "reciever" }));
    }
  }, [])

  return (
    <div>
      <p>Reciver</p>
    </div>
  )
}

export default Reciever