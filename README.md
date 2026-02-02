# WebRTC Handshake – Offer/Answer Flow

This project demonstrates the core WebRTC connection flow between two browsers using the Offer–Answer model and a signaling server.

The goal of this project is to clearly explain and implement how two peers establish a WebRTC connection by exchanging session descriptions.

---

## 🚀 What This Project Covers

- Creating an RTCPeerConnection
- Generating an Offer and Answer
- Setting Local Description and Remote Description
- Exchanging SDP data using a signaling server
- Understanding the complete WebRTC handshake lifecycle

This project focuses on connection logic rather than media streaming to keep the fundamentals clear.

---

## 🔁 WebRTC Connection Flow

1. Browser A creates an RTCPeerConnection
2. Browser A creates an Offer
3. Browser A sets the Local Description
4. The Offer is sent to Browser B via a signaling server
5. Browser B receives the Offer
6. Browser B sets the Remote Description
7. Browser B creates an Answer
8. Browser B sets the Local Description
9. The Answer is sent back to Browser A via the signaling server
10. Browser A receives the Answer and sets the Remote Description

Once this process is complete, the peer-to-peer connection is established.

---

## 🧠 Why This Project?

- Learn WebRTC fundamentals
- Understand the difference between signaling and peer connections
- Prepare for frontend and full-stack interviews
- Serve as a foundation for building:
  - Video calling applications
  - Audio chat apps
  - Screen sharing tools
  - Real-time collaboration platforms

---

## 🛠️ Tech Stack

- JavaScript
- WebRTC APIs
- Signaling Server (WebSocket / Mocked signaling)
- HTML & CSS

---

## 📌 Future Enhancements

- ICE candidate exchange
- Audio and video streaming
- Multi-peer support
- UI visualization for each signaling step
