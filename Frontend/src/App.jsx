import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Doctor from './pages/Doctor'
import Login from './pages/Login'
import About from './pages/About'
import Contact from './pages/Contact'
import Myprofile from './pages/Myprofile'
import MyAppointments from './pages/MyAppointments'
import Appointment from './pages/Appointment'
import Navigation from './components/Navigation'
import Footer from './components/Footer'

const App = () => {
  return (
    <div className='mx-4 sm:mx-[10%]'>
      <Navigation/>
      <Routes>
        <Route path='/home' element={<Home/>} />
        <Route path='/doctors' element={<Doctor/>} />
        <Route path='/doctors/:speciality' element={<Doctor/>} />
        <Route path='/' element={<Login/>} />
        <Route path='/about' element={<About/>} />
        <Route path='/contact' element={<Contact/>} />
        <Route path='/my-profile' element={<Myprofile/>} />
        <Route path='/my-appointments' element={<MyAppointments/>} />
        <Route path='/appointment/:docId' element={<Appointment/>} />
      </Routes>
      <Footer/>
    </div>
  )
}

export default App