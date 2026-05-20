import { useState } from 'react';

export default function JoinPage({ onJoin, connected }) {
  const [roomId, setRoomId] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!roomId.trim()) return;
    onJoin(roomId.trim());
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            GhostChat
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Anonymous. Instant. Ephemeral.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={roomId}
            onChange={e => setRoomId(e.target.value)}
            placeholder="Enter room ID..."
            maxLength={30}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-5 py-3.5 text-sm text-gray-100 placeholder-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={!roomId.trim() || !connected}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl py-3.5 text-sm font-semibold transition-colors"
          >
            {connected ? 'Join / Create Room' : 'Connecting...'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs mt-6">
          No sign-up required. Everything is anonymous.
        </p>
      </div>
    </div>
  );
}
