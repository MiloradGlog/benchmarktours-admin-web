export interface AIChatSession {
  id: string;
  user_id: string;
  tour_id?: number;
  title?: string;
  started_at: string;
  ended_at?: string;
  message_count: number;
  tokens_used: number;
  total_cost: number;
  status: 'active' | 'ended' | 'error';
  metadata?: Record<string, any>;
}

export interface AIConversationMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  function_name?: string;
  function_args?: any;
  function_result?: any;
  tokens_used?: number;
  created_at: string;
}

export interface ProposedChange {
  activityId: number;
  activityName: string;
  tourId: number;
  oldStartTime: string;
  oldEndTime: string;
  newStartTime: string;
  newEndTime: string;
  reason?: string;
  conflicts?: Array<{
    activityName: string;
    overlap: string;
  }>;
}

export interface ProposedChangeDetail {
  entityType: 'activity' | 'tour';
  entityId: number;
  field: string;
  oldValue: any;
  newValue: any;
  description: string;
}

export interface ChatContext {
  currentDate: string;
  userRole: string;
  tourInfo?: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
  };
}

export interface ChatRequest {
  sessionId: string;
  message: string;
  context?: ChatContext;
}

export interface ChatResponse {
  type: 'message' | 'approval_required' | 'error';
  message: string;
  proposedChanges?: ProposedChange[];
  confirmationToken?: string;
  error?: string;
  sessionId: string;
}

export interface ApprovalRequest {
  confirmationToken: string;
  approved: boolean;
  rejectionReason?: string;
}

export interface ApprovalResponse {
  success: boolean;
  message: string;
  appliedChanges?: ProposedChangeDetail[];
  error?: string;
}