import { Link } from 'react-router-dom';
import { Radio, Tv, Sparkles, Activity, Shield, Cpu } from 'lucide-react';

const Lobby = () => {
  return (
    <div className="lobby-container">
      <div className="grid-bg"></div>
      
      <header className="lobby-header">
        <span className="badge">
          <Sparkles size={12} className="spin-slow" style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} /> 
          Next-Gen WebRTC Protocol
        </span>
        <h1>NEXUS STREAM</h1>
        <p>
          Ultra-low latency, secure peer-to-peer media broadcasting powered by WebRTC. Stream direct from your camera without intermediate media servers.
        </p>
      </header>

      <div className="lobby-grid">
        {/* SENDER CARD */}
        <div className="glass-panel lobby-card" style={{ 
          '--card-accent-glow': 'rgba(99, 102, 241, 0.4)', 
          '--card-color': '#6366f1',
          '--card-color-rgb': '99, 102, 241'
        } as React.CSSProperties}>
          <div>
            <div className="card-icon-wrapper">
              <Radio size={28} />
            </div>
            <h2>Broadcaster Studio</h2>
            <p>
              Initiate a high-definition real-time broadcast. Instantly capture your camera stream and create a secure direct peer connection.
            </p>
            <ul className="features-list">
              <li>
                <Activity size={14} /> Full camera viewport preview
              </li>
              <li>
                <Shield size={14} /> Direct P2P encryption
              </li>
              <li>
                <Cpu size={14} /> Low CPU overhead compression
              </li>
            </ul>
          </div>
          <Link to="/sender" className="btn-primary">
            <Radio size={18} />
            Go Live Now
          </Link>
        </div>

        {/* RECEIVER CARD */}
        <div className="glass-panel lobby-card" style={{ 
          '--card-accent-glow': 'rgba(6, 182, 212, 0.4)', 
          '--card-color': '#06b6d4',
          '--card-color-rgb': '6, 182, 212'
        } as React.CSSProperties}>
          <div>
            <div className="card-icon-wrapper">
              <Tv size={28} />
            </div>
            <h2>Viewer Terminal</h2>
            <p>
              Tune in to an active live broadcast. Automatically establish handshakes to receive incoming video tracks with zero delays.
            </p>
            <ul className="features-list">
              <li>
                <Activity size={14} /> Instant sub-second latency rendering
              </li>
              <li>
                <Shield size={14} /> Auto-negotiating handshake
              </li>
              <li>
                <Cpu size={14} /> Hardware accelerated decoding
              </li>
            </ul>
          </div>
          <Link to="/receiver" className="btn-secondary">
            <Tv size={18} />
            Join Stream
          </Link>
        </div>
      </div>

      <footer className="studio-footer" style={{ marginTop: '5rem' }}>
        Designed with ⚡ and WebRTC Handshakes
      </footer>
    </div>
  );
};

export default Lobby;
