import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Tv, 
  ArrowLeft, 
  Terminal, 
  Activity, 
  Volume2, 
  VolumeX, 
  Maximize, 
  RotateCw,
  HelpCircle
} from 'lucide-react';

interface LogEntry {
  time: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

const Receiver = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'offline' | 'ready' | 'loading' | 'live'>('offline');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const addLog = (text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0];
    setLogs(prev => [{ time: timeString, text, type }, ...prev]);
  };

  const connectWebSocket = () => {
    setStatus('loading');
    addLog('Connecting to signaling server at ws://localhost:8080...', 'info');

    const socket = new WebSocket('ws://localhost:8080');
    setSocket(socket);
    let pc: RTCPeerConnection | null = null;

    socket.onopen = () => {
      console.log('connection established');
      socket.send(JSON.stringify({ type: "receiver" }));
      setStatus('ready');
      addLog('Connection established. Registered as VIEWER. Standing by for broadcaster signal...', 'success');
    };

    socket.onclose = () => {
      setStatus('offline');
      addLog('Signaling server disconnected.', 'warning');
      cleanupPeer();
    };

    socket.onerror = () => {
      setStatus('offline');
      addLog('Signaling server connection error. Make sure backend is running.', 'error');
    };

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "createOffer") {
        setStatus('loading');
        addLog('SDP Offer received from broadcaster. Starting WebRTC handshake...', 'info');
        
        try {
          pc = new RTCPeerConnection({
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          });
          pcRef.current = pc;

          // ontrack MUST be registered BEFORE setRemoteDescription
          pc.ontrack = (event) => {
            console.log('track received');
            addLog('Media track detected. Attaching to viewer layout...', 'success');
            if (videoRef.current) {
              videoRef.current.srcObject = new MediaStream([event.track]);
              videoRef.current.play()
                .then(() => {
                  setStatus('live');
                  addLog('Stream active! Rendering frames in real-time.', 'success');
                })
                .catch(e => {
                  console.error("Playback failed", e);
                  addLog(`Autoplay prevented. Please interact with screen.`, 'warning');
                });
            }
          };

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              addLog('Gathered local ICE candidate. sending to broadcaster...', 'info');
              socket.send(JSON.stringify({
                type: 'iceCandidate',
                candidate: event.candidate,
              }));
            }
          };

          pc.onconnectionstatechange = () => {
            addLog(`ICE Connection State changed: ${pc?.iceConnectionState}`, 'info');
            if (pc?.iceConnectionState === 'connected') {
              setStatus('live');
            } else if (pc?.iceConnectionState === 'disconnected' || pc?.iceConnectionState === 'failed') {
              setStatus('ready');
              addLog('P2P connection disconnected. Waiting for new broadcast...', 'warning');
            }
          };

          addLog('Applying Remote SDP Offer description...', 'info');
          await pc.setRemoteDescription(message.sdp);
          
          addLog('Generating SDP Answer handshake...', 'info');
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          addLog('SDP Answer generated. sending answer to broadcaster...', 'success');
          socket.send(JSON.stringify({
            type: 'createAnswer',
            sdp: pc.localDescription
          }));

        } catch (err: any) {
          console.error(err);
          setStatus('ready');
          addLog(`Handshake failed: ${err.message}`, 'error');
          cleanupPeer();
        }

      } else if (message.type === "iceCandidate") {
        if (pc) {
          addLog('Broadcaster ICE candidate received. Injecting into peer...', 'info');
          try {
            await pc.addIceCandidate(message.candidate);
          } catch (err: any) {
            addLog(`Error adding ICE candidate: ${err.message}`, 'error');
          }
        }
      }
    };
  };

  const cleanupPeer = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      cleanupPeer();
      if (socket) {
        socket.close();
      }
    };
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
      addLog(`Audio output ${videoRef.current.muted ? 'muted' : 'unmuted'}`, 'info');
    }
  };

  const requestFullscreen = () => {
    if (videoRef.current) {
      videoRef.current.requestFullscreen().catch(err => {
        addLog(`Fullscreen error: ${err.message}`, 'error');
      });
    }
  };

  return (
    <div className="studio-layout">
      <div className="grid-bg"></div>
      
      {/* NAVBAR */}
      <header className="glass-panel studio-nav">
        <Link to="/" className="logo-link">
          <Tv size={24} className="logo-icon spin-slow" style={{ color: 'var(--secondary)' }} />
          <span>NEXUS <span style={{ color: 'var(--secondary)' }}>TERMINAL</span></span>
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {status === 'offline' && (
            <button onClick={connectWebSocket} className="btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              <RotateCw size={14} style={{ marginRight: '4px' }} /> Connect Signaling
            </button>
          )}
          <div className={`status-badge ${status}`} style={{
            background: status === 'live' ? 'rgba(6, 182, 212, 0.15)' : '',
            color: status === 'live' ? '#22d3ee' : '',
            borderColor: status === 'live' ? 'rgba(6, 182, 212, 0.3)' : ''
          }}>
            <span className="indicator" style={{
              backgroundColor: status === 'live' ? 'var(--secondary)' : '',
              animation: status === 'live' ? 'pulse-glow 1.5s infinite' : ''
            }}></span>
            {status === 'live' ? 'Live Stream' : status}
          </div>
        </div>
      </header>

      {/* WORKSPACE GRID */}
      <div className="studio-grid">
        {/* VIEWPORT COLUMN */}
        <div className="video-stage-container">
          <div className="video-stage" style={{ '--glow-color': 'var(--secondary)' } as React.CSSProperties}>
            <div className="ambient-glow"></div>
            
            {/* Native Video Stream */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted={isMuted}
              className="video-stream-el"
              style={{ display: status === 'live' ? 'block' : 'none' }}
            />

            {/* Awaiting Broadcaster Placeholder */}
            {status !== 'live' && (
              <div className="video-overlay-placeholder">
                <div className="waves-icon-wrapper">
                  <div className="waves-circle" style={{ borderColor: 'rgba(6, 182, 212, 0.3)' }}></div>
                  <div className="waves-circle" style={{ borderColor: 'rgba(99, 102, 241, 0.2)' }}></div>
                  <div className="waves-circle" style={{ borderColor: 'rgba(236, 72, 153, 0.15)' }}></div>
                  <Tv size={36} color="var(--secondary)" className={status === 'ready' ? 'spin-slow' : ''} />
                </div>
                <h3>
                  {status === 'offline' && 'Signaling Server Offline'}
                  {status === 'ready' && 'Awaiting Incoming Feed'}
                  {status === 'loading' && 'Establishing Connection'}
                </h3>
                <p>
                  {status === 'offline' && 'Establish websocket signal tunnel using the reconnect utility.'}
                  {status === 'ready' && 'We are currently standing by. Open the Broadcaster Studio in another tab to begin.'}
                  {status === 'loading' && 'Performing cryptographic peer negotiation handshake...'}
                </p>
              </div>
            )}

            {/* Video Controls HUD Overlay */}
            {status === 'live' && (
              <div className="hud-controls">
                <button 
                  onClick={toggleMute} 
                  className={`hud-btn ${!isMuted ? 'active secondary-theme' : ''}`}
                  title={isMuted ? "Unmute Audio" : "Mute Audio"}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                
                <div className="hud-divider"></div>
                
                <button 
                  onClick={requestFullscreen} 
                  className="hud-btn"
                  title="Fullscreen View"
                >
                  <Maximize size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Bottom Back Button */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => navigate('/')} className="btn-outline">
              <ArrowLeft size={16} /> Lobby
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {status === 'live' ? '⚡ Render Engine: Webkit / Canvas' : '📶 Connection Pipeline: Pending'}
            </span>
          </div>
        </div>

        {/* SIDEBAR COL */}
        <div className="sidebar-panel">
          {/* STATS PANEL */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div className="card-title-bar">
              <h3>
                <Activity size={18} style={{ color: 'var(--secondary)' }} /> Feed Diagnostics
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Viewer Stats</span>
            </div>

            <div className="stats-grid">
              <div className="stat-item">
                <div className="label">Protocol</div>
                <div className="value">WebRTC</div>
              </div>
              <div className="stat-item">
                <div className="label">Target Mode</div>
                <div className="value" style={{ color: 'var(--secondary)' }}>Receiver</div>
              </div>
              <div className="stat-item">
                <div className="label">Resolution</div>
                <div className="value">{status === 'live' ? 'Dynamic HD' : 'N/A'}</div>
              </div>
              <div className="stat-item">
                <div className="label">State</div>
                <div className={`value ${status === 'live' ? 'success-text' : ''}`}>
                  {status === 'live' ? 'Receiving' : status === 'ready' ? 'Listening' : 'Offline'}
                </div>
              </div>
              <div className="stat-item">
                <div className="label">Delay Jitter</div>
                <div className="value" style={{ color: status === 'live' ? 'var(--success)' : '' }}>
                  {status === 'live' ? '< 10 ms' : 'N/A'}
                </div>
              </div>
              <div className="stat-item">
                <div className="label">Decryption</div>
                <div className="value">{status === 'live' ? 'SRTP / DTLS' : 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* TELEMETRY CONSOLE */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            <div className="card-title-bar">
              <h3>
                <Terminal size={18} style={{ color: 'var(--secondary)' }} /> Handshake Logs
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

          {/* GUIDE */}
          <div className="glass-panel instruction-box" style={{ background: 'rgba(6, 182, 212, 0.03)', borderColor: 'rgba(6, 182, 212, 0.2)' }}>
            <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <HelpCircle size={14} color="var(--secondary)" /> Handshake Tutorial
            </h4>
            <ol>
              <li>Open <strong>Broadcaster Studio</strong> at `/sender` in another window or device.</li>
              <li>Click <strong>Start Broadcasting</strong> to send an offer signal.</li>
              <li>This Terminal will catch the SDP offer automatically, generate a secure answer, and stream will play instantly.</li>
            </ol>
          </div>
        </div>
      </div>

      <footer className="studio-footer">
        NEXUS TERMINAL SYSTEM // SECURE TUNNEL // WS SIGNALS
      </footer>
    </div>
  );
};

export default Receiver;