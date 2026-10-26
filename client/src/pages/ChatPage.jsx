import { useEffect, useState } from 'react';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import TypingIndicator from '../components/TypingIndicator';

export default function ChatPage({
  roomId,
  nickname,
  messages,
  users,
  typingUsers,
  onSend,
  onTyping,
  onLeave
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [roomId]);

  function copyWithSelection() {
    const input = document.createElement('textarea');
    input.value = roomId;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    document.body.appendChild(input);
    input.select();
    const copiedOk = document.execCommand('copy');
    input.remove();
    if (!copiedOk) throw new Error('copy failed');
  }

  async function copyRoomId() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(roomId);
      } else {
        copyWithSelection();
      }
      setCopied(true);
    } catch {
      try {
        copyWithSelection();
        setCopied(true);
      } catch {
        setCopied(false);
        return;
      }
    }
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-100 truncate" title={roomId}>
            #{roomId}
          </h2>
          <p className="text-xs text-gray-500">
            {users.length} {users.length === 1 ? 'user' : 'users'} online
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={copyRoomId}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {copied ? 'Copied' : 'Copy ID'}
          </button>
          <span className="text-xs text-indigo-400 font-medium bg-indigo-950/50 px-3 py-1 rounded-full">
            {nickname}
          </span>
          <button
            type="button"
            onClick={onLeave}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Messages */}
      <MessageList messages={messages} nickname={nickname} />

      {/* Typing indicator */}
      <TypingIndicator typingUsers={typingUsers} currentNickname={nickname} />

      {/* Input */}
      <MessageInput onSend={onSend} onTyping={onTyping} />
    </div>
  );
}
