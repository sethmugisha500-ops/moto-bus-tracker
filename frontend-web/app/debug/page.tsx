// app/debug/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DebugPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    
    if (user) {
      try {
        setUserData(JSON.parse(user));
      } catch {
        setUserData({ error: 'Invalid JSON' });
      }
    }
    setToken(t);
  }, []);

  const clearAndLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#080C09] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Debug Info</h1>
        
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 mb-2">Token</h2>
          <p className="text-xs text-green-500 break-all">{token || '❌ No token'}</p>
        </div>
        
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 mb-2">User Data</h2>
          <pre className="text-xs text-gray-300 whitespace-pre-wrap">
            {JSON.stringify(userData, null, 2)}
          </pre>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={clearAndLogout}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition"
          >
            Clear Storage & Logout
          </button>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
