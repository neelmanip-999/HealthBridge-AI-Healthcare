import React from 'react';

const MessageBubble = ({ 
  message, 
  isCurrentUser, 
  showAvatar, 
  showTimestamp, 
  currentUserType 
}) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatFullTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getInitials = (message) => {
    // For now, we'll use generic initials based on sender type
    return message.senderType === 'Doctor' ? 'Dr.' : 'P';
  };

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex max-w-xs lg:max-w-md ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {showAvatar && !isCurrentUser && (
          <div className="flex-shrink-0 mr-3">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                {getInitials(message)}
              </span>
            </div>
          </div>
        )}

        {/* Message Content */}
        <div className={`${isCurrentUser ? 'ml-3' : 'mr-3'}`}>
          {/* Sender Name (only for received messages) */}
          {showAvatar && !isCurrentUser && (
            <div className="text-xs text-gray-500 mb-1 px-3">
              {message.senderType === 'Doctor' ? 'Dr.' : ''} {message.senderType}
            </div>
          )}

          {/* Message Bubble */}
          <div
            className={`relative px-4 py-2 rounded-lg ${
              isCurrentUser
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-900 border border-gray-200'
            } shadow-sm`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.message}
            </p>

            {/* Message Status */}
            {isCurrentUser && (
              <div className="flex items-center justify-end mt-1">
                <div className="text-xs opacity-70">
                  {formatTime(message.timestamp)}
                  {message.read ? (
                    <span className="ml-1">✓✓</span>
                  ) : (
                    <span className="ml-1">✓</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Timestamp */}
          {showTimestamp && (
            <div className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
              <span title={formatFullTime(message.timestamp)}>
                {formatTime(message.timestamp)}
              </span>
            </div>
          )}
        </div>

        {/* Avatar for sent messages */}
        {showAvatar && isCurrentUser && (
          <div className="flex-shrink-0 ml-3">
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-xs font-medium text-primary-600">
                {currentUserType === 'Doctor' ? 'Dr.' : 'Me'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;

