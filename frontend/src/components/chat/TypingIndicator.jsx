import React from 'react';

const TypingIndicator = ({ isVisible, userName }) => {
  if (!isVisible) return null;

  return (
    <div className="flex justify-start p-4">
      <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-4 py-2">
        <div className="flex space-x-1">
          <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
          <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
          <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
        </div>
        <span className="text-xs text-gray-600 ml-2">
          {userName} is typing...
        </span>
      </div>
    </div>
  );
};

export default TypingIndicator;

