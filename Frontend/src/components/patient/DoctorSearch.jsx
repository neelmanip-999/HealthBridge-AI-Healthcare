import React, { useState } from 'react';
import api from '../../services/api';

export default function DoctorSearch(){
  const [q,setQ]=useState(''); const [doctors,setDoctors]=useState([]);
  const search = async (e)=>{ e.preventDefault(); try{ const res = await api.get('/doctors/search',{ params:{ q } }); setDoctors(res.data); }catch(err){ alert(err.response?.data?.message || 'Search failed'); } };
  return (
    <div>
      <h3 className="font-semibold mb-2">Find Doctors</h3>
      <form onSubmit={search} className="flex gap-2 mb-3">
        <input value={q} onChange={e=>setQ(e.target.value)} className="flex-1 p-2 border rounded" placeholder="specialization or city" />
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Search</button>
      </form>
      <div>
        {doctors.map(d=>(
          <div key={d._id} className="p-3 border rounded mb-2">
            <div className="font-semibold">{d.name} — {d.doctorDetails?.specialization}</div>
            <div>Fee: ₹{d.doctorDetails?.consultationFee}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
