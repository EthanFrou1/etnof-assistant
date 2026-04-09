export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AiCompletionRequest {
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  systemPrompt?: string;
}

export interface AiCompletionResponse {
  content: string | null;
  toolCalls: ToolCall[];
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
}

export interface IAIProvider {
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;
}
