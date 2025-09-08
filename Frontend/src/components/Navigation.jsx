import React, { useState } from 'react'
import { assets } from '../assets/assets_frontend/assets'
import { NavLink, useNavigate } from 'react-router-dom'
const Navigation = () => {
    const navigate = useNavigate();
    const [showMenu,setShowMenu] = useState(false);
    const [token,setToken] = useState(true);

    const [open, setOpen] = useState(false);
  return (
    <nav>
        <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-grey-400'>
            <img onClick={()=>navigate('/')} className='w-44 cursor-pointer' src={assets.logo} alt=''/>
            <ul className='hidden md:flex items-center gap-5 font-medium'>
                <NavLink to='/'>
                    <li className='py-1'>Home</li>
                    <hr className='border-none outline-none h-0.5 w-3/5 m-auto bg-primary hidden'/>
                </NavLink>
                <NavLink to='/doctors'>
                    <li className='py-1'>All Doctors</li>
                    <hr className='border-none outline-none h-0.5 w-3/5 m-auto bg-primary hidden'/>
                </NavLink>
                <NavLink to='/about'>
                    <li className='py-1'>About</li>
                    <hr className='border-none outline-none h-0.5 w-3/5 m-auto bg-primary hidden'/>
                </NavLink>
                <NavLink to='/contact'>
                    <li className='py-1'>Contact</li>
                    <hr className='border-none outline-none h-0.5 w-3/5 m-auto bg-primary hidden'/>
                </NavLink>
            </ul>
            <div className='flex items-center gap-4 '>
                {
                    token 
                    ? <div className='flex items-center gap-2 cursor-pointer group relative' onClick={() => setOpen(prev => !prev)}>
                        <img className='w-8 rounded-full' src={assets.profile_pic} alt=''/>
                        <img className='w-2.5' src={assets.dropdown_icon} alt=''/>
                        <div className={`absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20  ${open ? 'block' : 'hidden'} sm:group-hover:block`}>
                            <div className='min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4'>
                                <p onClick={(e)=>{ e.stopPropagation(); setOpen(false); navigate('/my-profile')}} className='hover:text-black cursor-pointer'>My Profile</p>
                                <p onClick={(e)=>{ e.stopPropagation(); setOpen(false); navigate('/my-appointments')}} className='hover:text-black cursor-pointer'>My Appointments</p>
                                <p onClick={(e)=>{ e.stopPropagation(); setOpen(false); setToken(false)}} className='hover:text-black cursor-pointer'>Logout</p>
                            </div>
                        </div>
                    </div>
                    : <button onClick={()=>navigate('/login')} className='bg-primary  cursor-pointer text-white px-8 py-3 rounded-full font-light hidden md:block'>Create account</button>
                }
                <img onClick={() => setShowMenu(true)} className='w-6 md:hidden' src={assets.menu_icon} alt='' />
                {/*----- Mobile menu -----*/}
                <div className={`${showMenu ? 'fixed w-full' : 'h-0 w-0'} md:hidden right-0 top-0 bottom-0 overflow-hidden bg-white z-20 transition-all duration-150`}>
                      <div className='flex items-center justify-between px-5 py-6'>
                          <img className='w-36' src={assets.logo} alt='' />
                          <img src={assets.cross_icon} className='w-7' onClick={() => setShowMenu(false)} alt='' />
                      </div>
                      <ul className='flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium'>
                         <NavLink onClick={() => setShowMenu(false)} to='/'><p className='px-4 py-2 rounded inline-block'>HOME</p></NavLink>
                           <NavLink onClick={() => setShowMenu(false)} to='/doctors'><p className='px-4 py-2 rounded inline-block'>ALL DOCTORS</p></NavLink>
                          <NavLink onClick={() => setShowMenu(false)} to='/about'><p className='px-4 py-2 rounded inline-block'>ABOUT</p></NavLink>
                          <NavLink onClick={() => setShowMenu(false)} to='/contact'><p className='px-4 py-2 rounded inline-block'>CONTACT</p></NavLink>
                      </ul>
                </div>
            </div>
        </div>
    </nav>
  )
}

export default Navigation


{/* ---previous code --- */}
                    {/*// <div className='flex items-center gap-2 cursor-pointer group relative'>
                    //     <img className='w-8 rounded-full' src={assets.profile_pic} alt=''/>
                    //     <img className='w-2.5' src={assets.dropdown_icon} alt=''/>
                    //     <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block'>
                    //         <div className='min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4'>
                    //             <p onClick={()=>navigate('/my-profile')} className='hover:text-black cursor-pointer'>My Profile</p>
                    //             <p onClick={()=>navigate('/my-appointments')} className='hover:text-black cursor-pointer'>My Appointments</p>
                    //             <p onClick={()=>setToken(false)} className='hover:text-black cursor-pointer'>Logout</p>
                    //         </div>
                    //     </div>
                    // </div>*/}