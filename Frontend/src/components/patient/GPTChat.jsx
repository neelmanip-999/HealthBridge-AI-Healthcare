import React, { useState } from 'react';
import api from '../../services/api';

export default function GPTChat(){
  const [message,setMessage]=useState(''); const [history,setHistory]=useState([]); const [loading,setLoading]=useState(false);
  const send = async (e)=>{ e.preventDefault(); if(!message.trim()) return; setLoading(true); try{ const res = await api.post('/gpt/chat',{ message, conversationHistory: history }); const responseText = res.data.response; setHistory([...history, { role:'user', content: message }, { role:'assistant', content: responseText }]); setMessage(''); }catch(err){ alert(err.response?.data?.message || 'GPT error'); } finally{ setLoading(false); } };
  return (
    <div className="p-4 border rounded">
      <div className="mb-2 font-semibold">Ask health questions (informational only)</div>
      <div className="mb-4 max-h-64 overflow-auto p-2 bg-gray-50">
        {history.map((m,i)=>(
          <div key={i} className={`mb-2 ${m.role==='user' ? 'text-right' : 'text-left'}`}>
            <div className="inline-block p-2 rounded bg-white shadow">{m.content}</div>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Describe symptoms or ask" className="flex-1 p-2 border rounded"/>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading ? '...' : 'Send'}</button>
      </form>
    </div>
  );
}
