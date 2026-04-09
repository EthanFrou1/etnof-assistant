import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi, ChatMessage } from '@/api/ai.api';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { useSpeechToText, useTextToSpeech } from '@/hooks/useSpeech';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Trash2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AssistantPage() {
  const { messages, addMessage, clearMessages } = useChatStore();
  const [input, setInput] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Ref to always have the latest messages/mutate without stale closures
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const mutateRef = useRef<((msgs: ChatMessage[]) => void) | null>(null);

  const { isSpeaking, isSupported: ttsSupported, speak, stop: stopSpeaking } = useTextToSpeech();

  const { isListening, isSupported: sttSupported, startListening, stopListening } = useSpeechToText({
    onResult: (transcript) => {
      const userMessage: ChatMessage = { role: 'user', content: transcript };
      addMessage(userMessage);
      mutateRef.current?.([...messagesRef.current.slice(0, -1), userMessage]);
    },
  });

  const chatMutation = useMutation({
    mutationFn: (newMessages: ChatMessage[]) =>
      aiApi.chat({ salonId: user?.salonId ?? '', messages: newMessages }),
    onSuccess: (data) => {
      addMessage({ role: 'assistant', content: data.content });
      if (voiceEnabled && ttsSupported) speak(data.content);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: () => {
      const msg = 'Une erreur est survenue. Veuillez réessayer.';
      addMessage({ role: 'assistant', content: msg });
      if (voiceEnabled && ttsSupported) speak(msg);
    },
  });

  mutateRef.current = chatMutation.mutate;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    addMessage(userMessage);
    const newMessages = [...messages, userMessage];
    setInput('');
    chatMutation.mutate(newMessages);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      if (isSpeaking) stopSpeaking();
      startListening();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Assistant IA</h1>
          <p className="text-sm text-muted-foreground">
            Posez vos questions sur les disponibilités, rendez-vous et clients
          </p>
        </div>
        <div className="flex items-center gap-2">
          {ttsSupported && (
            <Button
              variant={voiceEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setVoiceEnabled((v) => !v); if (isSpeaking) stopSpeaking(); }}
              className="gap-1.5"
              title={voiceEnabled ? 'Désactiver la voix' : 'Activer la voix'}
            >
              {voiceEnabled
                ? <Volume2 className="h-3.5 w-3.5" />
                : <VolumeX className="h-3.5 w-3.5" />}
              {voiceEnabled ? 'Voix activée' : 'Voix désactivée'}
            </Button>
          )}
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { clearMessages(); stopSpeaking(); }}
              className="gap-1 text-muted-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Nouvelle conversation
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-lg border bg-card p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <Bot className="h-12 w-12 opacity-20" />
            <p className="text-sm">Commencez par poser une question...</p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {[
                "Qui est disponible demain à 14h ?",
                "Quels sont les services proposés ?",
                "Montre les RDV d'aujourd'hui",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="rounded-full border px-3 py-1 text-xs hover:bg-accent transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            {sttSupported && (
              <p className="text-xs text-muted-foreground/60 mt-2">
                Ou cliquez sur le micro pour parler
              </p>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {msg.role === 'assistant' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[75%] rounded-lg px-4 py-2 text-sm',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground',
              )}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-muted rounded-lg px-4 py-2 text-sm text-muted-foreground animate-pulse">
              En train de réfléchir...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex gap-2">
        {sttSupported && (
          <Button
            variant={isListening ? 'destructive' : 'outline'}
            size="icon"
            onClick={handleMicClick}
            disabled={chatMutation.isPending}
            title={isListening ? "Arrêter l'écoute" : 'Parler'}
            className={cn(isListening && 'animate-pulse')}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? 'Parlez maintenant...' : 'Posez votre question...'}
          disabled={chatMutation.isPending || isListening}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={!input.trim() || chatMutation.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
