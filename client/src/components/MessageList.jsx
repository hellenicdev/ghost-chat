import { useRef, useEffect } from 'react';

export default function MessageList({ messages, nickname }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
      {messages.length === 0 && (
        <p className="text-center text-gray-500 mt-8">No messages yet. Start the conversation!</p>
      )}
      {messages.map((msg, i) => {
        const isOwn = msg.nickname === nickname;
        return (
          <div
            key={i}
            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                isOwn
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : 'bg-gray-800 text-gray-100 rounded-bl-md'
              }`}
            >
              {!isOwn && (
                <p className="text-xs text-indigo-400 font-medium mb-1">{msg.nickname}</p>
              )}
              <p className="text-sm leading-relaxed break-words">{msg.message}</p>
              {msg.timestamp && (
                <p className={`text-xs mt-1 ${isOwn ? 'text-indigo-200' : 'text-gray-500'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
