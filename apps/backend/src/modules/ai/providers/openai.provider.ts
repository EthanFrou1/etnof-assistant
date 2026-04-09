import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  IAIProvider,
  AiCompletionRequest,
  AiCompletionResponse,
  ChatMessage,
} from './ai-provider.interface';

@Injectable()
export class OpenAIProvider implements IAIProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor(private configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('ai.openai.apiKey'),
    });
    this.model = this.configService.get<string>('ai.openai.model', 'gpt-4o');
    this.maxTokens = this.configService.get<number>('ai.openai.maxTokens', 2048);
    this.temperature = this.configService.get<number>('ai.openai.temperature', 0.2);
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const messages: OpenAI.ChatCompletionMessageParam[] = request.messages.map((m) =>
      this.toOpenAIMessage(m),
    );

    if (request.systemPrompt) {
      messages.unshift({ role: 'system', content: request.systemPrompt });
    }

    this.logger.debug(`OpenAI request: model=${this.model}, messages=${messages.length}`);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      tools: request.tools?.map((t) => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      })),
      tool_choice: request.tools?.length ? 'auto' : undefined,
    });

    const choice = response.choices[0];
    const toolCalls = (choice.message.tool_calls || []).map((tc) => ({
      id: tc.id,
      type: 'function' as const,
      function: { name: tc.function.name, arguments: tc.function.arguments },
    }));

    return {
      content: choice.message.content,
      toolCalls,
      finishReason:
        choice.finish_reason === 'tool_calls'
          ? 'tool_calls'
          : choice.finish_reason === 'stop'
          ? 'stop'
          : 'length',
    };
  }

  private toOpenAIMessage(msg: ChatMessage): OpenAI.ChatCompletionMessageParam {
    if (msg.role === 'tool') {
      return { role: 'tool', content: msg.content, tool_call_id: msg.toolCallId! };
    }
    if (msg.role === 'assistant' && msg.toolCalls?.length) {
      return {
        role: 'assistant',
        content: msg.content,
        tool_calls: msg.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.function.name, arguments: tc.function.arguments },
        })),
      };
    }
    return { role: msg.role as 'system' | 'user' | 'assistant', content: msg.content };
  }
}
