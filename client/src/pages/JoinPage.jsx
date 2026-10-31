import { useState } from 'react';
import { createRandomRoomId } from '../utils/roomId';

export default function JoinPage({ onJoin, connected }) {
  const [roomId, setRoomId] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!roomId.trim()) return;
    onJoin(roomId.trim());
  }

  function handleRandom() {
    onJoin(createRandomRoomId());
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-linear-to-r/srgb from-indigo-400 to-purple-400 bg-clip-text text-transparent">
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
            maxLength={64}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-5 py-3.5 text-sm text-gray-100 placeholder:text-gray-600 outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={!roomId.trim() || !connected}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl py-3.5 text-sm font-semibold transition-colors"
          >
            {connected ? 'Join / Create Room' : 'Connecting...'}
          </button>
          <button
            type="button"
            onClick={handleRandom}
            disabled={!connected}
            className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-800 disabled:text-gray-600 text-gray-200 rounded-xl py-3.5 text-sm font-semibold transition-colors"
          >
            {connected ? 'Create random room' : 'Connecting...'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs mt-6">
          No sign-up required. Random room ids are unguessable, and old messages are deleted automatically.
        </p>
      </div>
    </div>
  );
}
