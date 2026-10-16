"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api-client";
import { DemoModeBanner } from "@/components/shared/DemoModeBanner";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { PageHeader } from "@/components/layout/PageHeader";
import { FeedbackControl } from "@/components/shared/FeedbackControl";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function AssistantPage() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [lastRating, setLastRating] = React.useState<"helpful" | "not_helpful" | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setLastRating(undefined);

    try {
      const result = await apiFetch("/api/v1/assistant/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });
      const assistantMsg: ChatMessage = { role: "assistant", content: result.text };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err.message ?? "Request failed"}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell headerTitle="Knowledge Assistant" breadcrumbs={[{ label: "Knowledge Assistant", href: "/assistant" }]}>
      <DemoModeBanner />
      <SectionHeader title="Knowledge Assistant" description="Ask questions about AI tools, policies, and guidance. Powered by the configured AI provider (demo mode uses mock responses)." />
      <div className="card border border-border rounded-xl h-[600px] flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm mt-10">
              Start a conversation to get help with AI tool selection, policies, or usage guidance.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start gap-3">
              <div className="bg-muted p-3 rounded-lg animate-pulse w-24 h-10" />
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-background">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about AI tools, pricing, policies..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              Send
            </Button>
          </div>
        </form>
      </div>
      {messages.length > 0 && (
        <div className="mt-4 p-4 rounded-lg border border-border bg-background">
          <SectionHeader title="Was this helpful?" />
          <FeedbackControl onRating={(r) => setLastRating(r)} currentRating={lastRating} />
          {lastRating && (
            <p className="mt-2 text-xs text-muted-foreground">
              Thank you for your feedback. This helps improve the assistant.
            </p>
          )}
        </div>
      )}
    </AppShell>
  );
}
