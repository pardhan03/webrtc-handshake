import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Lobby from './components/Lobby';
import Sender from './components/Sender';
import Receiver from './components/Reciever'; // imported from Reciever.tsx

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Lobby page Gateway */}
        <Route path="/" element={<Lobby />} />
        
        {/* Sender Studio */}
        <Route path="/sender" element={<Sender />} />
        
        {/* Receiver Viewer Terminal (Both casing formats to prevent breaks) */}
        <Route path="/receiver" element={<Receiver />} />
        <Route path="/Reciever" element={<Receiver />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
