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
  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-gray-100">#{roomId}</h2>
          <p className="text-xs text-gray-500">
            {users.length} {users.length === 1 ? 'user' : 'users'} online
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-indigo-400 font-medium bg-indigo-950/50 px-3 py-1 rounded-full">
            {nickname}
          </span>
          <button
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
