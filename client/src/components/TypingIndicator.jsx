export default function TypingIndicator({ typingUsers, currentNickname }) {
  const others = Object.keys(typingUsers).filter(n => n !== currentNickname);
  if (others.length === 0) return null;

  const text = others.length === 1
    ? `${others[0]} is typing...`
    : others.length === 2
      ? `${others[0]} and ${others[1]} are typing...`
      : `${others[0]} and ${others.length - 1} others are typing...`;

  return (
    <p className="text-xs text-gray-500 italic px-4 py-1 animate-fade-in">{text}</p>
  );
}
