import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Sender from './components/Sender'
import Reciever from './components/Reciever'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/sender' element={<Sender />}/>
        <Route path='Reciever' element={<Reciever />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
