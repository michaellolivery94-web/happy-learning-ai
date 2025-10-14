import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/contexts/ProgressContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { GradeSelector } from '@/components/GradeSelector';
import { Send, Bot, User, Sparkles, RefreshCw } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const motivationalQuotes = [
  "Keep going, you're doing great! Nzuri sana! 🌟",
  "Every question brings you closer to mastery! Hongera! 📚",
  "Learning is a journey, not a race! Endelea! 🚀",
  "You're making amazing progress! Vizuri! 🎓",
  "Curiosity is the key to knowledge! 🔑",
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Habari! I'm Happy, your friendly CBC tutor! 😊 I'm here to help you learn using the Kenyan Competency-Based Curriculum. What would you like to explore today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { incrementQuestions, checkLessonCompletion, progress, setGradeAndSubject } = useProgress();

  const [randomQuote] = useState(
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
  );

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleGradeSubjectChange = useCallback(
    (grade: string, subject: string) => {
      setGradeAndSubject(grade, subject);
      toast({
        title: 'Learning Path Updated',
        description: `Now focusing on ${grade} - ${subject}`,
      });
    },
    [setGradeAndSubject, toast]
  );

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    incrementQuestions();
    checkLessonCompletion();

    try {
      // Sliding window: send only last 12 messages to reduce token usage
      // This prevents the conversation from becoming too long and costly
      const recentMessages = messages.slice(-12);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            messages: [...recentMessages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            grade: progress.grade,
            subject: progress.subject,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response from Happy');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      // Add placeholder for assistant message that will be filled via streaming
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          // Process each line from the streaming response
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  assistantMessage += content;
                  // Update the last message with accumulated content
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content = assistantMessage;
                    return newMessages;
                  });
                }
              } catch (parseError) {
                console.warn('JSON parse error:', parseError);
              }
            }
          }
        }
      }

      // Persist conversation to Supabase (debounced via context, but also save complete history)
      if (user && assistantMessage) {
        await supabase.from('chat_history').upsert(
          {
            user_id: user.id,
            grade: progress.grade,
            subject: progress.subject,
            messages: JSON.stringify([...messages, userMessage, { role: 'assistant', content: assistantMessage }]),
          },
          { onConflict: 'user_id' }
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response from Happy. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      // Remove the empty assistant message placeholder on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, incrementQuestions, checkLessonCompletion, progress, user, toast]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const retryLastMessage = useCallback(() => {
    if (messages.length > 1 && messages[messages.length - 1].role === 'user') {
      const lastUserMessage = messages[messages.length - 1].content;
      setInput(lastUserMessage);
      setMessages((prev) => prev.slice(0, -1));
    }
  }, [messages]);


  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-screen">
      <div className="container mx-auto px-4 py-4 max-w-5xl flex-1 flex flex-col min-h-0">
        <Card className="mb-4">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  Chat with Happy
                </h1>
                <p className="text-sm text-muted-foreground">
                  Your CBC learning companion - Ask questions, explore topics!
                </p>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Grade:</span>
                  <span className="text-primary">{progress.grade}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Subject:</span>
                  <span className="text-primary">{progress.subject}</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="mb-4">
          <GradeSelector
            onSelectionChange={handleGradeSubjectChange}
            initialGrade={progress.grade}
            initialSubject={progress.subject}
            compact
          />
        </div>

      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 animate-fade-in ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-accent-foreground" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  <span className="ml-2 text-sm text-muted-foreground">Happy is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4 bg-background">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything... (Enter to send, Shift+Enter for new line)"
              disabled={loading}
              className="flex-1 min-h-[60px] max-h-[120px] resize-none"
              aria-label="Chat input"
            />
            <div className="flex gap-2">
              {messages.length > 1 && (
                <Button
                  onClick={retryLastMessage}
                  disabled={loading}
                  variant="outline"
                  size="icon"
                  title="Retry last message"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                size="icon"
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">{randomQuote}</p>
        </div>
      </Card>
      </div>
    </div>
  );
}
