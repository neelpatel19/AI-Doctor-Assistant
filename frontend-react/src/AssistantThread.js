import React from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  LoaderIcon,
  PencilIcon,
  RefreshCwIcon,
  SquareIcon,
} from "lucide-react";
import {
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useThread,
  useMessage,
} from "@assistant-ui/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import "@assistant-ui/react-markdown/styles/dot.css";

// ─── Local stand-ins for shadcn components ───────────────────────────────────

const Button = React.forwardRef(function Button(
  { className = "", variant = "default", size, children, ...props },
  ref
) {
  return (
    <button ref={ref} className={className} data-variant={variant} data-size={size} {...props}>
      {children}
    </button>
  );
});

const TooltipIconButton = React.forwardRef(function TooltipIconButton(
  { tooltip, className = "", children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      title={tooltip}
      className={
        "inline-flex items-center justify-center rounded-full border border-border bg-transparent p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none transition-colors " +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
});

function MarkdownText(props) {
  return <MarkdownTextPrimitive {...props} />;
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

// ─── Thread ───────────────────────────────────────────────────────────────────

export function AssistantThread() {
  return (
    <ThreadPrimitive.Root
      className="flex h-full flex-col bg-background text-sm"
      style={{
        "--thread-max-width": "44rem",
        "--accent-color": "#0ea5e9",
        "--accent-foreground": "#000000",
      }}
    >
      <ThreadPrimitive.Viewport className="relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll scroll-smooth px-4 pt-4">
        <ThreadPrimitive.If empty>
          <ThreadWelcome />
        </ThreadPrimitive.If>

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            EditComposer,
            AssistantMessage,
          }}
        />

        <div className="sticky bottom-0 mx-auto mt-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 overflow-visible rounded-t-3xl bg-background pb-4">
          <ThreadScrollToBottom />
          <Composer />
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}

// ─── Welcome ──────────────────────────────────────────────────────────────────

function ThreadWelcome() {
  return (
    <div className="mx-auto my-auto flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col">
      <div className="flex w-full flex-grow flex-col items-center justify-center">
        <div className="flex size-full flex-col justify-center px-8">
          <div className="text-2xl font-semibold text-foreground">Hello there!</div>
          <div className="text-2xl text-muted-foreground/65">
            Describe your symptoms and I’ll ask follow-up questions to help.
          </div>
        </div>
      </div>
      <div className="grid w-full gap-2 pb-4 md:grid-cols-2">
        <ThreadPrimitive.Suggestion prompt="I have headache and fever" asChild>
          <button className="h-auto w-full flex-col items-start justify-start gap-1 border border-border rounded-2xl px-5 py-4 text-left text-sm bg-transparent hover:bg-muted transition-colors flex">
            <span className="font-medium text-foreground">I have headache</span>
            <span className="text-muted-foreground">and fever</span>
          </button>
        </ThreadPrimitive.Suggestion>
        <ThreadPrimitive.Suggestion prompt="I have chest pain and shortness of breath" asChild>
          <button className="h-auto w-full flex-col items-start justify-start gap-1 border border-border rounded-2xl px-5 py-4 text-left text-sm bg-transparent hover:bg-muted transition-colors flex">
            <span className="font-medium text-foreground">Chest pain</span>
            <span className="text-muted-foreground">and shortness of breath</span>
          </button>
        </ThreadPrimitive.Suggestion>
      </div>
    </div>
  );
}

// ─── Composer ─────────────────────────────────────────────────────────────────

function Composer() {
  return (
    <ComposerPrimitive.Root className="relative flex w-full flex-col">
      <div className="flex w-full flex-col rounded-2xl border border-border bg-muted px-1 pt-2 outline-none transition-shadow focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
        <ComposerPrimitive.Input
          placeholder="Describe your symptoms..."
          className="mb-1 max-h-32 min-h-14 w-full resize-none bg-transparent px-4 pt-2 pb-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-0"
          rows={1}
          autoFocus
          aria-label="Message input"
        />
        <ComposerAction />
      </div>
    </ComposerPrimitive.Root>
  );
}

function ComposerAction() {
  const isRunning = useThread((s) => s.isRunning);

  return (
    <div className="relative mx-2 mb-2 flex items-center justify-end">
      {!isRunning && (
        <ComposerPrimitive.Send asChild>
          <TooltipIconButton
            tooltip="Send message"
            type="submit"
            className="size-8 rounded-full border-0 text-black"
            style={{
              backgroundColor: "var(--accent-color)",
              color: "var(--accent-foreground)",
            }}
            aria-label="Send message"
          >
            <ArrowUpIcon className="size-4" />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      )}

      {isRunning && (
        <ComposerPrimitive.Cancel asChild>
          <TooltipIconButton
            tooltip="Stop generating"
            type="button"
            className="size-8 rounded-full border-0"
            style={{
              backgroundColor: "var(--accent-color)",
              color: "var(--accent-foreground)",
            }}
            aria-label="Stop generating"
          >
            <SquareIcon className="size-3 fill-current" />
          </TooltipIconButton>
        </ComposerPrimitive.Cancel>
      )}
    </div>
  );
}

// ─── Scroll to bottom ─────────────────────────────────────────────────────────

function ThreadScrollToBottom() {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        className="absolute -top-12 z-10 self-center rounded-full border border-border bg-background p-4 disabled:invisible"
      >
        <ArrowDownIcon className="size-4" />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
}

// ─── User message ─────────────────────────────────────────────────────────────

function UserMessage() {
  return (
    <MessagePrimitive.Root
      className="mx-auto grid w-full max-w-[var(--thread-max-width)] auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-2 py-3 animate-in fade-in slide-in-from-bottom-1 duration-150"
      data-role="user"
    >
      <div className="relative col-start-2 min-w-0">
        <div className="rounded-2xl bg-muted px-4 py-2.5 break-words text-foreground">
          <MessagePrimitive.Parts />
        </div>
        <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 pr-2">
          <UserActionBar />
        </div>
      </div>
      <BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
    </MessagePrimitive.Root>
  );
}

function UserActionBar() {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="flex flex-col items-end"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit" className="p-2">
          <PencilIcon className="size-4" />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
}

// ─── Edit composer ────────────────────────────────────────────────────────────

function EditComposer() {
  return (
    <MessagePrimitive.Root className="mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col px-2 py-3">
      <ComposerPrimitive.Root className="ml-auto flex w-full max-w-[85%] flex-col rounded-2xl bg-muted">
        <ComposerPrimitive.Input
          className="min-h-14 w-full resize-none bg-transparent p-4 text-foreground text-sm outline-none"
          autoFocus
        />
        <div className="mx-3 mb-3 flex items-center gap-2 self-end">
          <ComposerPrimitive.Cancel asChild>
            <button className="h-8 px-3 text-sm rounded-md border border-border bg-transparent text-muted-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <button className="h-8 px-3 text-sm rounded-md bg-accent text-accent-foreground hover:opacity-90 transition-opacity">
              Update
            </button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  );
}

// ─── Assistant message ────────────────────────────────────────────────────────

function AssistantMessage() {
  const isRunning = useThread((s) => s.isRunning);
  const contentLength = useMessage((m) => m.message?.content?.length ?? 0);
  const isThinking = isRunning && contentLength === 0;

  return (
    <MessagePrimitive.Root
      className="relative mx-auto w-full max-w-[var(--thread-max-width)] py-3 animate-in fade-in slide-in-from-bottom-1 duration-150"
      data-role="assistant"
    >
      <div className="break-words px-2 leading-relaxed text-foreground">
        <MessagePrimitive.Parts
          components={{
            Text: MarkdownText,
          }}
        />
        <MessageError />
        {isThinking && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <LoaderIcon className="size-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}
      </div>

      <div className="mt-1 ml-2 flex min-h-6 items-center">
        <BranchPicker />
        <AssistantActionBar />
      </div>
    </MessagePrimitive.Root>
  );
}

function MessageError() {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-destructive text-sm">
        <ErrorPrimitive.Message className="line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
}

// ─── Assistant action bar ─────────────────────────────────────────────────────

function AssistantActionBar() {
  const isCopied = useMessage((m) => m.message?.isCopied ?? false);

  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="-ml-1 flex gap-1 text-muted-foreground"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip={isCopied ? "Copied!" : "Copy"}>
          {isCopied ? (
            <CheckIcon className="size-4" />
          ) : (
            <CopyIcon className="size-4" />
          )}
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Regenerate">
          <RefreshCwIcon className="size-4" />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
}

// ─── Branch picker ────────────────────────────────────────────────────────────

function BranchPicker({ className, ...rest }) {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "mr-2 -ml-2 inline-flex items-center text-xs text-muted-foreground",
        className
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous">
          <ChevronLeftIcon className="size-4" />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="font-medium mx-1">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next">
          <ChevronRightIcon className="size-4" />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
}
