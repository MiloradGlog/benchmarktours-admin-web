import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, X, Loader2, Check, XCircle, ChevronDown, Sparkles, Calendar } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { ApprovalRequest, ChatResponse, ProposedChange } from '@/types/ai';
import { Tour } from '@/types/api';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface AIFloatingChatProps {
  selectedTour?: Tour;
  onTourChange?: () => void;
}

export const AIFloatingChat: React.FC<AIFloatingChatProps> = ({ selectedTour, onTourChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant' | 'system'; content: string }>>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [proposedChanges, setProposedChanges] = useState<ProposedChange[] | null>(null);
  const [confirmationToken, setConfirmationToken] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !sessionId) {
      createSession();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedTour && isOpen) {
      // Add a system message when tour context changes
      setMessages(prev => [
        ...prev,
        {
          role: 'system',
          content: `📍 Now working with tour: "${selectedTour.name}" (${format(new Date(selectedTour.start_date), 'MMM dd')} - ${format(new Date(selectedTour.end_date), 'MMM dd, yyyy')})`
        }
      ]);
    }
  }, [selectedTour, isOpen]);

  const createSession = async () => {
    try {
      const response = await aiService.createSession(selectedTour?.id);
      setSessionId(response.sessionId);

      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: selectedTour
          ? `Hello! I'm your AI assistant for managing the "${selectedTour.name}" tour schedule. How can I help you today? For example, you can ask me to:\n\n• Delay all activities by 30 minutes\n• Move morning activities to the afternoon\n• Adjust specific activity times\n• Check for scheduling conflicts`
          : `Hello! I'm your AI tour management assistant. I can help you manage tour schedules using natural language. Select a tour to get started, or ask me any questions about tour management.`
      }]);
    } catch (error) {
      console.error('Failed to create session:', error);
      setMessages([{
        role: 'system',
        content: '❌ Failed to start AI session. Please try again.'
      }]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !sessionId) return;

    const userMessage = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setProposedChanges(null);
    setConfirmationToken(null);

    try {
      const context = {
        currentDate: new Date().toISOString(),
        userRole: user?.role || 'Admin',
        tourInfo: selectedTour ? {
          id: selectedTour.id,
          name: selectedTour.name,
          startDate: selectedTour.start_date,
          endDate: selectedTour.end_date,
          status: selectedTour.status
        } : undefined
      };

      const response: ChatResponse = await aiService.sendMessage(sessionId, userMessage, context);

      if (response.type === 'approval_required' && response.proposedChanges) {
        setProposedChanges(response.proposedChanges);
        setConfirmationToken(response.confirmationToken || null);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.message
        }]);
      } else if (response.type === 'error') {
        setMessages(prev => [...prev, {
          role: 'system',
          content: `❌ Error: ${response.error}`
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.message
        }]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        role: 'system',
        content: '❌ Failed to send message. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async (approved: boolean) => {
    if (!confirmationToken || !sessionId) return;

    setIsLoading(true);
    try {
      const request: ApprovalRequest = {
        confirmationToken,
        approved,
        rejectionReason: approved ? undefined : 'Changes rejected by user'
      };

      const response = await aiService.approveChanges(request);

      if (response.success) {
        setMessages(prev => [...prev, {
          role: 'system',
          content: approved
            ? '✅ Changes have been successfully applied to the schedule.'
            : '❌ Changes have been rejected.'
        }]);

        if (approved && onTourChange) {
          onTourChange();
        }
      } else {
        setMessages(prev => [...prev, {
          role: 'system',
          content: `❌ Failed to ${approved ? 'apply' : 'reject'} changes: ${response.message}`
        }]);
      }
    } catch (error) {
      console.error('Failed to process approval:', error);
      setMessages(prev => [...prev, {
        role: 'system',
        content: '❌ Failed to process your response. Please try again.'
      }]);
    } finally {
      setProposedChanges(null);
      setConfirmationToken(null);
      setIsLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    return format(new Date(timeString), 'HH:mm');
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          size="icon"
        >
          <div className="relative">
            <Bot className="h-7 w-7 text-white" />
            <Sparkles className="h-3 w-3 text-yellow-300 absolute -top-1 -right-1" />
          </div>
        </Button>
      )}

      {/* Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl h-[600px] p-0 flex flex-col">
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Bot className="h-8 w-8" />
                  <Sparkles className="h-3 w-3 text-yellow-300 absolute -top-1 -right-1" />
                </div>
                <div>
                  <DialogTitle className="text-white">AI Tour Assistant</DialogTitle>
                  {selectedTour && (
                    <p className="text-sm text-white/80 mt-1 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {selectedTour.name}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          {/* Messages Area */}
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : message.role === 'system'
                        ? 'bg-muted italic'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {/* Proposed Changes Card */}
              {proposedChanges && proposedChanges.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Proposed Schedule Changes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {proposedChanges.map((change, index) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <p className="font-medium text-sm">{change.activityName}</p>
                        <div className="mt-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <span>Old:</span>
                            <span className="line-through">
                              {formatTime(change.oldStartTime)} - {formatTime(change.oldEndTime)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>New:</span>
                            <span className="font-medium text-green-600">
                              {formatTime(change.newStartTime)} - {formatTime(change.newEndTime)}
                            </span>
                          </div>
                          {change.reason && (
                            <p className="mt-1 text-xs italic">{change.reason}</p>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end space-x-2 pt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproval(false)}
                        disabled={isLoading}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproval(true)}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder={selectedTour
                  ? "e.g., 'Delay all morning activities by 30 minutes'"
                  : "Select a tour to manage its schedule..."
                }
                disabled={isLoading || !sessionId}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim() || !sessionId}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {!selectedTour && (
              <p className="text-xs text-amber-600 mt-2">
                💡 Tip: Select a tour card to manage its schedule with AI
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};