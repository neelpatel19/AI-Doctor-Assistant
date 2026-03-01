import React, { useRef, useMemo } from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
} from "@assistant-ui/react";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Stable session id per app load so backend gets same session for follow-ups
function useSessionId() {
  const ref = useRef(null);
  if (ref.current === null) {
    ref.current = `ui-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
  return ref.current;
}

// Adapter that calls FastAPI /api/chat with full conversation for medical follow-ups
function useChatModelAdapter() {
  const sessionId = useSessionId();

  return useMemo(
    () => ({
      async run({ messages, abortSignal }) {
        const toPlainMessages = (msgs) =>
          msgs
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({
              role: m.role,
              content: (m.content || [])
                .filter((part) => part.type === "text" && typeof part.text === "string")
                .map((part) => part.text)
                .join(" ")
                .trim(),
            }))
            .filter((m) => m.content.length > 0);

        const plainMessages = toPlainMessages(messages);
        const lastUser = [...plainMessages].reverse().find((m) => m.role === "user");
        if (!lastUser) return { content: [] };

        const lastUserIndex = plainMessages.lastIndexOf(lastUser);
        // Previous turns only (backend adds current message itself)
        const conversation_history = plainMessages.slice(0, lastUserIndex).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        let response;
        try {
          response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: lastUser.content,
              session_id: sessionId,
              conversation_history,
            }),
            signal: abortSignal,
          });
        } catch (err) {
          if (err.name === "AbortError") throw err;
          return {
            content: [
              {
                type: "text",
                text:
                  "Could not connect to the AI Doctor backend. Start the server with: uvicorn app.main:app --reload --port 8000",
              },
            ],
          };
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          return {
            content: [
              {
                type: "text",
                text:
                  "The server could not process your request. " +
                  (errorText ? `Details: ${errorText}` : `HTTP ${response.status}`),
              },
            ],
          };
        }

        const data = await response.json();
        return {
          content: [{ type: "text", text: data.reply ?? "" }],
        };
      },
    }),
    [sessionId]
  );
}

export function MyRuntimeProvider({ children }) {
  const chatModelAdapter = useChatModelAdapter();
  const runtime = useLocalRuntime(chatModelAdapter, {});

  return (
    <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>
  );
}
