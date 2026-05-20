import useSocket from './hooks/useSocket';
import JoinPage from './pages/JoinPage';
import ChatPage from './pages/ChatPage';

export default function App() {
  const {
    connected,
    nickname,
    roomId,
    messages,
    users,
    typingUsers,
    joinRoom,
    sendMessage,
    emitTyping
  } = useSocket();

  if (!roomId) {
    return <JoinPage onJoin={joinRoom} connected={connected} />;
  }

  return (
    <ChatPage
      roomId={roomId}
      nickname={nickname}
      messages={messages}
      users={users}
      typingUsers={typingUsers}
      onSend={sendMessage}
      onTyping={emitTyping}
      onLeave={() => window.location.reload()}
    />
  );
}
