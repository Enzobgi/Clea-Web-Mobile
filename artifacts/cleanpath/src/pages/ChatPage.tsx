import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Link } from "wouter";
import {
  Brain,
  Heart,
  ListChecks,
  LoaderCircle,
  MessageCircle,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { ChatMode } from "@/types/domain";
import { useAppStore } from "@/store/useAppStore";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type SupportChatMode = Exclude<ChatMode, "urgence">;

const MODES: Array<{ id: SupportChatMode; label: string; icon: typeof Heart }> = [
  { id: "ecoute", label: "Écoute", icon: Heart },
  { id: "envie", label: "Envie forte", icon: ShieldAlert },
  { id: "plan", label: "Plan d'action", icon: ListChecks },
  { id: "comprendre", label: "Comprendre", icon: Brain },
  { id: "discussion", label: "Préparer une discussion", icon: MessageCircle },
];

const SUGGESTIONS: Record<SupportChatMode, string[]> = {
  ecoute: ["J’ai besoin de parler", "Je me sens anxieux", "Ma journée a été difficile"],
  envie: ["J’ai une envie forte maintenant", "Aide-moi pendant dix minutes", "Je veux contacter un proche"],
  plan: ["Aide-moi à passer une soirée calme", "Je veux préparer demain", "J’ai besoin d’une petite action"],
  comprendre: ["Pourquoi cette envie revient-elle ?", "Aide-moi à identifier le déclencheur", "Qu’est-ce qui m’a aidé cette semaine ?"],
  discussion: ["Je veux parler à mon médecin", "Aide-moi à demander du soutien", "Je dois expliquer une rechute"],
};

const WELCOME_MESSAGE: UIMessage = {
  id: "cleanpath-welcome",
  role: "assistant",
  parts: [{
    type: "text",
    text: "Bonjour. Je peux t’écouter, t’aider à traverser une envie ou préparer une prochaine étape. **De quoi as-tu besoin maintenant ?**",
  }],
};

function getText(message: UIMessage): string {
  return message.parts
    .filter(part => part.type === "text")
    .map(part => part.text)
    .join("");
}

export default function ChatPage() {
  const { chatMemory, setChatMemory, settings } = useAppStore();
  const [mode, setMode] = useState<SupportChatMode>("ecoute");
  const [input, setInput] = useState("");
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const initialMessages = useMemo<UIMessage[]>(() => {
    if (!settings.chatMemoryEnabled) return [WELCOME_MESSAGE];
    const saved = chatMemory
      .filter(item => item.label === "chat:user" || item.label === "chat:assistant")
      .slice(-20)
      .map(item => ({
        id: item.id,
        role: item.label === "chat:user" ? "user" as const : "assistant" as const,
        parts: [{ type: "text" as const, text: item.value }],
      }));
    return saved.length > 0 ? saved : [WELCOME_MESSAGE];
  }, [chatMemory, settings.chatMemoryEnabled]);

  const transport = useMemo(() => new DefaultChatTransport({
    api: "/api/chat",
    credentials: "include",
    prepareSendMessagesRequest: ({ id, messages, trigger, messageId, body }) => ({
      body: {
        ...body,
        id,
        messages,
        trigger,
        messageId,
        mode: modeRef.current,
      },
    }),
  }), []);

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    error,
    clearError,
    stop,
  } = useChat({
    id: "cleanpath-support",
    messages: initialMessages,
    transport,
  });

  const isSending = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!settings.chatMemoryEnabled || status !== "ready") return;
    const storedMessages = messages
      .filter(message => message.id !== WELCOME_MESSAGE.id)
      .map(message => ({
        id: message.id,
        label: message.role === "user" ? "chat:user" : "chat:assistant",
        value: getText(message),
        createdAt: new Date().toISOString(),
      }))
      .filter(item => item.value.trim())
      .slice(-20);
    setChatMemory(storedMessages);
  }, [messages, settings.chatMemoryEnabled, status]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;
    clearError();
    setInput("");
    void sendMessage({ text });
  };

  const useSuggestion = (text: string) => {
    if (isSending) return;
    clearError();
    void sendMessage({ text });
  };

  const clearConversation = () => {
    stop();
    clearError();
    setMessages([WELCOME_MESSAGE]);
    setChatMemory([]);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-12">
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-medium">Chat</h1>
            <p className="text-muted-foreground">Un soutien immédiat, sans diagnostic ni jugement.</p>
          </div>
          <Badge variant="secondary" className="shrink-0 gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Assistant IA
          </Badge>
        </div>
      </header>

      <Alert className="border-destructive/30 bg-destructive/5">
        <ShieldAlert className="h-4 w-4 text-destructive" />
        <AlertTitle>En cas de danger immédiat</AlertTitle>
        <AlertDescription>
          Appelle le 112. Le chatbot ne contacte jamais les secours ou un proche à ta place.
        </AlertDescription>
      </Alert>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {MODES.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            type="button"
            size="sm"
            variant={mode === id ? "default" : "outline"}
            className="shrink-0"
            onClick={() => setMode(id)}
          >
            <Icon className="mr-2 h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Conversation className="h-[min(52dvh,520px)] min-h-[360px]">
            <ConversationContent className="gap-5 p-4 sm:p-5">
              {messages.map(message => (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    {message.parts.map((part, index) => (
                      part.type === "text" ? (
                        message.role === "assistant" ? (
                          <MessageResponse
                            key={`${message.id}-${index}`}
                            isAnimating={isSending && message.id === messages.at(-1)?.id}
                          >
                            {part.text}
                          </MessageResponse>
                        ) : (
                          <p key={`${message.id}-${index}`} className="whitespace-pre-wrap">{part.text}</p>
                        )
                      ) : null
                    ))}
                  </MessageContent>
                </Message>
              ))}
              {status === "submitted" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  CleanPath réfléchit...
                </div>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="border-t bg-muted/20 p-3 sm:p-4">
            {error && (
              <Alert variant="destructive" className="mb-3">
                <AlertTitle>Le chat n’a pas pu répondre</AlertTitle>
                <AlertDescription>
                  Réessaie dans un instant. Le mode SOS reste disponible immédiatement.
                </AlertDescription>
              </Alert>
            )}

            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {SUGGESTIONS[mode].map(suggestion => (
                <Button
                  key={suggestion}
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-auto shrink-0 whitespace-normal py-2 text-left"
                  disabled={isSending}
                  onClick={() => useSuggestion(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>

            <form onSubmit={submit} className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={event => setInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={2}
                maxLength={1200}
                placeholder={mode === "envie" ? "Dis-moi ce qui se passe maintenant..." : "Écris ce dont tu as besoin..."}
                aria-label="Message au chatbot"
                disabled={isSending}
                className="min-h-[52px] resize-none"
              />
              <Button
                type="submit"
                size="icon"
                className="h-[52px] w-[52px] shrink-0"
                disabled={!input.trim() || isSending}
                aria-label="Envoyer le message"
              >
                {isSending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {settings.chatMemoryEnabled
            ? "La conversation est mémorisée et synchronisée avec ton compte."
            : "La mémoire du chat est désactivée dans les paramètres."}
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={clearConversation}>
          <Trash2 className="mr-2 h-4 w-4" />
          Effacer la conversation
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/urgence">
          <Button className="w-full" variant="destructive">
            <ShieldAlert className="mr-2 h-4 w-4" />
            Ouvrir le mode SOS
          </Button>
        </Link>
        <Link href="/journal">
          <Button className="w-full" variant="outline">Écrire dans mon journal</Button>
        </Link>
      </div>
    </div>
  );
}
