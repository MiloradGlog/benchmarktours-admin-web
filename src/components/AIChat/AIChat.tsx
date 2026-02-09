import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Clock, Check, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { aiService } from '../../services/aiService';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

interface ProposedChange {
  activityId: number;
  activityName: string;
  oldStartTime: string;
  newStartTime: string;
  oldEndTime: string;
  newEndTime: string;
}

interface AIChatProps {
  tourId: number;
  onScheduleUpdate?: () => void;
}

export const AIChat: React.FC<AIChatProps> = ({ tourId, onScheduleUpdate }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [proposedChanges, setProposedChanges] = useState<ProposedChange[] | null>(null);
  const [confirmationToken, setConfirmationToken] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Create a new chat session when component mounts
    createSession();
  }, [tourId]);

  const createSession = async () => {
    try {
      const response = await aiService.createSession(tourId);
      setSessionId(response.sessionId);
    } catch (error) {
      console.error('Failed to create chat session:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !sessionId || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setProposedChanges(null);
    setConfirmationToken(null);

    try {
      const context = tourId ? {
        currentDate: new Date().toISOString(),
        userRole: user?.role || 'Admin',
        tourInfo: undefined // Will be fetched by backend if needed
      } : undefined;

      const response = await aiService.sendMessage(sessionId, userMessage.content, context, tourId);

      if (response.type === 'approval_required') {
        setProposedChanges(response.proposedChanges);
        setConfirmationToken(response.confirmationToken);
      }

      const responseContent = response.message || response.error || 'No response';
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: typeof responseContent === 'string'
          ? responseContent
          : JSON.stringify(responseContent, null, 2),
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: 'Failed to send message. Please try again.',
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async (approved: boolean) => {
    if (!confirmationToken) return;

    setIsLoading(true);
    try {
      const response = await aiService.approveChanges({
        confirmationToken,
        approved,
        rejectionReason: !approved ? 'User rejected the changes' : undefined,
      });

      const resultMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: response.message || (approved ? 'Changes approved and applied successfully' : 'Changes rejected'),
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, resultMessage]);
      setProposedChanges(null);
      setConfirmationToken(null);

      // Refresh the calendar if changes were approved
      if (approved && onScheduleUpdate) {
        onScheduleUpdate();
      }
    } catch (error) {
      console.error('Failed to process approval:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: 'Failed to process approval. Please try again.',
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Tokyo'
    }).format(date);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Tokyo'
    }).format(date);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold">AI Schedule Assistant</h2>
        </div>
        {sessionId && (
          <span className="text-xs text-gray-500">Session: {sessionId.slice(0, 8)}...</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <Bot className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>Hello! I'm your AI schedule assistant.</p>
            <p className="text-sm mt-2">
              I can help you adjust tour schedules. Try saying something like:
            </p>
            <p className="text-sm mt-2 italic">
              "We're running 30 minutes late for all activities starting from 2 PM today"
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.role === 'system'
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-gray-100'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && <Bot className="w-4 h-4 mt-1" />}
                {message.role === 'user' && <User className="w-4 h-4 mt-1" />}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">
                    {typeof message.content === 'string'
                      ? message.content
                      : JSON.stringify(message.content, null, 2)}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {format(message.createdAt, 'h:mm a')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Proposed Changes */}
        {proposedChanges && proposedChanges.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Proposed Schedule Changes</h3>
            <div className="space-y-2">
              {proposedChanges.map((change, index) => (
                <div key={index} className="bg-white p-3 rounded border border-blue-100">
                  <p className="font-medium text-sm">{change.activityName}</p>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div>
                      <p className="text-gray-500">Current:</p>
                      <p>
                        {formatTime(change.oldStartTime)} - {formatTime(change.oldEndTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">New:</p>
                      <p className="font-medium text-blue-600">
                        {formatTime(change.newStartTime)} - {formatTime(change.newEndTime)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => handleApproval(true)}
                disabled={isLoading}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Check className="w-4 h-4 mr-2" />
                Approve Changes
              </button>
              <button
                onClick={() => handleApproval(false)}
                disabled={isLoading}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <X className="w-4 h-4 mr-2" />
                Reject Changes
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type your message..."
            disabled={!sessionId || isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={!sessionId || isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          AI-powered schedule management. All changes require approval.
        </p>
      </div>
    </div>
  );
};