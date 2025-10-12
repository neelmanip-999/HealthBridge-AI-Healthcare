import React from 'react';
import MessageBubble from './MessageBubble';

const MessageList = ({ messages, currentUserId, currentUserType }) => {
  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Start a conversation
          </h3>
          <p className="text-gray-600">
            Send your first message to begin chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {messages.map((message, index) => {
        const isCurrentUser = message.senderId === currentUserId;
        const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
        const showTimestamp = index === messages.length - 1 || 
          new Date(message.timestamp).getDate() !== new Date(messages[index + 1].timestamp).getDate();

        return (
          <MessageBubble
            key={message._id}
            message={message}
            isCurrentUser={isCurrentUser}
            showAvatar={showAvatar}
            showTimestamp={showTimestamp}
            currentUserType={currentUserType}
          />
        );
      })}
    </div>
  );
};

export default MessageList;

