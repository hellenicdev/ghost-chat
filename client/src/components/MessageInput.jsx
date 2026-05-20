import { useState, useRef } from 'react';

export default function MessageInput({ onSend, onTyping }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText('');
    onTyping(false);
    inputRef.current?.focus();
  }

  function handleChange(e) {
    setText(e.target.value);
    onTyping(e.target.value.length > 0);
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-800 px-4 py-3">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleChange}
          placeholder="Type a message..."
          maxLength={500}
          className="flex-1 bg-gray-800 text-gray-100 rounded-full px-5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
        >
          Send
        </button>
      </div>
    </form>
  );
}
