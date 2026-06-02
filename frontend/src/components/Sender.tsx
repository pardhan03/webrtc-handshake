import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Radio, 
  Video, 
  VideoOff, 
  ArrowLeft, 
  Terminal, 
  Activity, 
  Globe, 
  StopCircle,
  Play,
  RotateCw
} from 'lucide-react';

interface LogEntry {
  time: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

const Sender = () => {
  const navigate = useNavigate();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState<'offline' | 'ready' | 'loading' | 'live'>('offline');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const addLog = (text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0];
    setLogs(prev => [{ time: timeString, text, type }, ...prev]);
  };

  // Re-establish socket if needed
  const connectWebSocket = () => {
    setStatus('loading');
    addLog('Connecting to signaling server at ws://localhost:8080...', 'info');
    
    const ws = new WebSocket('ws://localhost:8080');
    
    ws.onopen = () => {
      console.log('connection established');
      ws.send(JSON.stringify({ type: "sender" }));
      setSocket(ws);
      setStatus('ready');
      addLog('Connection established. Registered as BROADCASTER.', 'success');
    };

    ws.onclose = () => {
      setSocket(null);
      setStatus('offline');
      addLog('Disconnected from signaling server.', 'warning');
    };

    ws.onerror = (error) => {
      console.error(error);
      setStatus('offline');
      addLog('Signaling server connection error. Make sure backend is running.', 'error');
    };
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      // Clean up WebRTC and sockets on unmount
      stopBroadcast();
      if (socket) {
        socket.close();
      }
    };
  }, []);

  async function startSendVideo() {
    if (!socket) {
      addLog('Cannot start broadcast: Signaling server offline.', 'error');
      return;
    }

    try {
      setStatus('loading');
      addLog('Requesting user media (camera)...', 'info');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false, // audio false as in original
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.error("Video play error:", e));
      }

      addLog('Camera preview active. Initializing RTCPeerConnection...', 'success');
      
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      pcRef.current = pc;

      addLog('PeerConnection created. Attaching video tracks...', 'info');
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        pc.addTrack(videoTrack, stream);
      } else {
        throw new Error("No video tracks found in stream");
      }

      pc.onnegotiationneeded = async () => {
        addLog('Negotiation needed: Creating SDP Offer...', 'info');
        try {
          const offer = await pc.createOffer(); //sdp
          await pc.setLocalDescription(offer);
          addLog('Local SDP set. Sending CreateOffer to receiver...', 'success');
          socket.send(JSON.stringify({
            type: "createOffer",
            sdp: pc.localDescription
          }));
        } catch (err: any) {
          addLog(`Negotiation error: ${err.message}`, 'error');
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addLog('New ICE candidate discovered. Trickling to peer...', 'info');
          socket.send(JSON.stringify({
            type: 'iceCandidate',
            candidate: event.candidate,
          }));
        }
      };

      pc.onconnectionstatechange = () => {
        addLog(`ICE Connection State: ${pc.iceConnectionState}`, 'info');
        if (pc.iceConnectionState === 'connected') {
          setStatus('live');
          addLog('P2P Connection ESTABLISHED. You are fully LIVE!', 'success');
        } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          setStatus('ready');
          addLog('P2P Connection lost or disconnected.', 'warning');
        }
      };

      // Handle signaling messages
      socket.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data?.type === "createAnswer") {
          addLog('Remote SDP Answer received. Applying to PeerConnection...', 'info');
          try {
            await pc.setRemoteDescription(data.sdp);
            addLog('Remote SDP Answer successfully set.', 'success');
            setStatus('live');
          } catch (err: any) {
            addLog(`Error setting remote description: ${err.message}`, 'error');
          }
        } else if (data?.type === "iceCandidate") {
          addLog('Remote ICE candidate received. Injecting...', 'info');
          try {
            await pc.addIceCandidate(data.candidate);
          } catch (err: any) {
            addLog(`Error adding remote candidate: ${err.message}`, 'error');
          }
        }
      };

    } catch (err: any) {
      console.error(err);
      setStatus('ready');
      addLog(`Failed to start stream: ${err.message || err}`, 'error');
    }
  }

  function stopBroadcast() {
    addLog('Stopping stream and cleaning up connections...', 'warning');
    
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStatus('ready');
    setIsVideoEnabled(true);
    addLog('Broadcast terminated. Studio set to standby.', 'info');
  }

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        addLog(`Camera ${videoTrack.enabled ? 'Enabled' : 'Disabled'}`, 'info');
      }
    }
  };

  return (
    <div className="studio-layout">
      <div className="grid-bg"></div>
      
      {/* HEADER NAVBAR */}
      <header className="glass-panel studio-nav">
        <Link to="/" className="logo-link">
          <Radio size={24} className="logo-icon spin-slow" />
          <span>NEXUS <span style={{ color: 'var(--primary)' }}>STUDIO</span></span>
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {status === 'offline' && (
            <button onClick={connectWebSocket} className="btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              <RotateCw size={14} style={{ marginRight: '4px' }} /> Reconnect WS
            </button>
          )}
          <div className={`status-badge ${status}`}>
            <span className="indicator"></span>
            {status}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="studio-grid">
        {/* LEFT COLUMN: STREAM VIEWPORT */}
        <div className="video-stage-container">
          <div className="video-stage" style={{ '--glow-color': 'var(--primary)' } as React.CSSProperties}>
            <div className="ambient-glow"></div>
            
            {/* Native Video Stream */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="video-stream-el"
              style={{ display: streamRef.current ? 'block' : 'none' }}
            />

            {/* Visual Placeholder Overlay */}
            {!streamRef.current && (
              <div className="video-overlay-placeholder">
                <div className="waves-icon-wrapper">
                  <div className="waves-circle"></div>
                  <div className="waves-circle"></div>
                  <div className="waves-circle"></div>
                  <Radio size={36} color="var(--primary)" />
                </div>
                <h3>Studio Standby</h3>
                <p>Initialize your local media capture feed and establish connection to go live.</p>
              </div>
            )}

            {/* Video Controls (Floating HUD) */}
            {streamRef.current && (
              <div className="hud-controls">
                <button 
                  onClick={toggleVideo} 
                  className={`hud-btn ${isVideoEnabled ? 'active' : ''}`}
                  title={isVideoEnabled ? "Disable Camera" : "Enable Camera"}
                >
                  {isVideoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
                </button>
                
                <div className="hud-divider"></div>
                
                <button 
                  onClick={stopBroadcast} 
                  className="hud-btn danger-btn"
                  title="Stop Streaming"
                >
                  <StopCircle size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Quick Action Bar under the stage */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => navigate('/')} className="btn-outline">
              <ArrowLeft size={16} /> Lobby
            </button>

            {status === 'ready' && (
              <button onClick={startSendVideo} className="btn-primary animate-pulse-glow">
                <Play size={16} /> Start Broadcasting
              </button>
            )}

            {status === 'loading' && (
              <button className="btn-primary" disabled style={{ opacity: 0.7 }}>
                <RotateCw size={16} className="spin-slow" /> Connecting...
              </button>
            )}

            {status === 'live' && (
              <button onClick={stopBroadcast} className="btn-danger">
                <StopCircle size={16} /> Stop Stream
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CONTROLS & DIAGNOSTICS */}
        <div className="sidebar-panel">
          {/* STATS PANEL */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div className="card-title-bar">
              <h3>
                <Activity size={18} /> Broadcast Stats
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>P2P WebRTC</span>
            </div>

            <div className="stats-grid">
              <div className="stat-item">
                <div className="label">Protocol</div>
                <div className="value">WebRTC</div>
              </div>
              <div className="stat-item">
                <div className="label">Target Mode</div>
                <div className="value" style={{ color: 'var(--primary)' }}>Sender</div>
              </div>
              <div className="stat-item">
                <div className="label">Video Resolution</div>
                <div className="value">{streamRef.current ? '1280x720 (HD)' : 'N/A'}</div>
              </div>
              <div className="stat-item">
                <div className="label">Video State</div>
                <div className={`value ${streamRef.current ? 'success-text' : ''}`}>
                  {streamRef.current ? 'Capturing' : 'Idle'}
                </div>
              </div>
              <div className="stat-item">
                <div className="label">Latency</div>
                <div className="value" style={{ color: status === 'live' ? 'var(--success)' : '' }}>
                  {status === 'live' ? '~30 ms' : 'N/A'}
                </div>
              </div>
              <div className="stat-item">
                <div className="label">Encryption</div>
                <div className="value">{status === 'live' ? 'SRTP (P2P)' : 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* TELEMETRY LOGS */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            <div className="card-title-bar">
              <h3>
                <Terminal size={18} /> signaling console
              </h3>
              <button 
                onClick={() => setLogs([])} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Clear
              </button>
            </div>
            
            <div className="connection-logs">
              {logs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 'auto' }}>
                  No signaling logged yet.
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`log-entry ${log.type}`}>
                    <span className="time">[{log.time}]</span>
                    <span className="text">{log.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* HOW TO USE GUIDE */}
          <div className="glass-panel instruction-box">
            <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Globe size={14} color="var(--primary)" /> Broadcaster Instructions
            </h4>
            <ol>
              <li>Click <strong>Start Broadcasting</strong> to request camera permissions.</li>
              <li>Open a separate tab and navigate to the <strong>Viewer Terminal (/receiver)</strong>.</li>
              <li>A direct peer connection will negotiate via the signaling server automatically.</li>
            </ol>
          </div>
        </div>
      </div>

      <footer className="studio-footer">
        NEXUS BROADCAST SYSTEM // SECURE TUNNEL // WS SIGNALS
      </footer>
    </div>
  );
};

export default Sender;