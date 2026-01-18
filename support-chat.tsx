import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bot, User, Send, UserCircle, Loader2, Plus, MessageSquare } from "lucide-react";
import type { ChatSession, ChatMessage } from "@shared/schema";

export default function SupportChat() {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: sessions, isLoading: sessionsLoading } = useQuery<ChatSession[]>({
    queryKey: ["/api/chat/sessions"],
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/sessions", activeSessionId, "messages"],
    enabled: !!activeSessionId,
  });

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/chat/sessions", { mode: "ai" });
      return res.json();
    },
    onSuccess: (session: ChatSession) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
      setActiveSessionId(session.id);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/chat/sessions/${activeSessionId}/messages`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions", activeSessionId, "messages"] });
      setMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const requestHumanMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/chat/sessions/${activeSessionId}/request-human`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions", activeSessionId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
      toast({
        title: "Request Submitted",
        description: "You'll be connected with a human agent shortly.",
      });
    },
  });

  useEffect(() => {
    if (sessions && sessions.length > 0 && !activeSessionId) {
      const activeSession = sessions.find(s => s.status === "active");
      if (activeSession) {
        setActiveSessionId(activeSession.id);
      }
    }
  }, [sessions, activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeSessionId) return;
    sendMessageMutation.mutate(message.trim());
  };

  const activeSession = sessions?.find(s => s.id === activeSessionId);

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case "ai": return "AI Assistant";
      case "waiting": return "Waiting for Agent";
      case "human": return "Human Agent";
      default: return mode;
    }
  };

  const getModeVariant = (mode: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (mode) {
      case "ai": return "default";
      case "waiting": return "secondary";
      case "human": return "outline";
      default: return "default";
    }
  };

  if (sessionsLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-support-title">Support Chat</h1>
          <p className="text-muted-foreground">Get help from our AI assistant or connect with a human agent</p>
        </div>
        <Button
          onClick={() => createSessionMutation.mutate()}
          disabled={createSessionMutation.isPending}
          data-testid="button-new-chat"
        >
          {createSessionMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          New Chat
        </Button>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <Card className="w-64 flex-shrink-0 hidden md:flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Chat History</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-2">
            {sessions?.length === 0 ? (
              <p className="text-sm text-muted-foreground p-2">No chats yet</p>
            ) : (
              <div className="space-y-1">
                {sessions?.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`w-full text-left p-2 rounded-md text-sm hover-elevate ${
                      activeSessionId === session.id ? "bg-accent" : ""
                    }`}
                    data-testid={`button-session-${session.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="truncate">Chat #{session.id}</span>
                    </div>
                    <Badge variant={getModeVariant(session.mode)} className="mt-1 text-xs">
                      {getModeLabel(session.mode)}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex-1 flex flex-col min-h-0">
          {!activeSessionId ? (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Bot className="h-16 w-16 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-semibold text-lg">Start a Conversation</h3>
                  <p className="text-muted-foreground">
                    Click "New Chat" to start talking with our AI assistant
                  </p>
                </div>
                <Button onClick={() => createSessionMutation.mutate()} data-testid="button-start-chat">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Start Chat
                </Button>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader className="pb-2 border-b">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {activeSession?.mode === "ai" ? (
                      <Bot className="h-5 w-5" />
                    ) : (
                      <UserCircle className="h-5 w-5" />
                    )}
                    <CardTitle className="text-lg">
                      {activeSession?.mode === "ai" ? "AI Assistant" : "Support Agent"}
                    </CardTitle>
                    <Badge variant={getModeVariant(activeSession?.mode || "ai")}>
                      {getModeLabel(activeSession?.mode || "ai")}
                    </Badge>
                  </div>
                  {activeSession?.mode === "ai" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => requestHumanMutation.mutate()}
                      disabled={requestHumanMutation.isPending}
                      data-testid="button-request-human"
                    >
                      {requestHumanMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <UserCircle className="h-4 w-4 mr-2" />
                      )}
                      Talk to Human
                    </Button>
                  )}
                </div>
                <CardDescription>
                  {activeSession?.mode === "ai" 
                    ? "Ask questions about credit repair, disputes, or your account"
                    : activeSession?.mode === "waiting"
                    ? "Please wait while we connect you with an agent"
                    : "You're now chatting with a support agent"}
                </CardDescription>
              </CardHeader>

              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-12 w-3/4 ml-auto" />
                    <Skeleton className="h-12 w-3/4" />
                  </div>
                ) : messages?.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages?.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        data-testid={`message-${msg.id}`}
                      >
                        {msg.role !== "user" && (
                          <div className="flex-shrink-0">
                            {msg.role === "assistant" ? (
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Bot className="h-4 w-4 text-primary" />
                              </div>
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                                <UserCircle className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        )}
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.createdAt!).toLocaleTimeString()}
                          </p>
                        </div>
                        {msg.role === "user" && (
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                              <User className="h-4 w-4 text-primary-foreground" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      activeSession?.mode === "waiting"
                        ? "Waiting for agent..."
                        : "Type your message..."
                    }
                    disabled={sendMessageMutation.isPending || activeSession?.mode === "waiting"}
                    className="flex-1"
                    data-testid="input-message"
                  />
                  <Button
                    type="submit"
                    disabled={!message.trim() || sendMessageMutation.isPending || activeSession?.mode === "waiting"}
                    data-testid="button-send"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
