export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatMessageProps {
  message: Message;
}

type Block =
  | { type: "heading"; content: string }
  | { type: "paragraph"; content: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

function formatInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function parseContent(content: string): Block[] {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const blocks: Block[] = [];
  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  const flushList = () => {
    if (!listType || listItems.length === 0) return;
    if (listType === "ul") {
      blocks.push({ type: "ul", items: listItems });
    } else {
      blocks.push({ type: "ol", items: listItems });
    }
    listType = null;
    listItems = [];
  };

  for (const line of lines) {
    const unorderedMatch = line.match(/^[-•]\s+(.+)$/);
    const orderedMatch = line.match(/^\d+[.)]\s+(.+)$/);
    const headingMatch = line.match(/^\*\*(.+)\*\*:?$/);
    const colonHeading = line.endsWith(":") && line.length <= 70;

    if (unorderedMatch) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listItems.push(unorderedMatch[1]);
      continue;
    }

    if (orderedMatch) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listItems.push(orderedMatch[1]);
      continue;
    }

    flushList();

    if (headingMatch) {
      blocks.push({ type: "heading", content: headingMatch[1] });
      continue;
    }

    if (colonHeading) {
      blocks.push({ type: "heading", content: line.slice(0, -1) });
      continue;
    }

    blocks.push({ type: "paragraph", content: line });
  }

  flushList();
  return blocks;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const blocks = parseContent(message.content);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "rounded-br-md bg-[#106534] text-white"
            : "rounded-bl-md border border-[#E2E8F0] bg-[#F1F5F9] text-[#1E293B]",
        ].join(" ")}
      >
        {blocks.map((block, index) => {
          if (block.type === "heading") {
            return (
              <h4 key={index} className="mb-2 text-sm font-semibold tracking-tight">
                {formatInline(block.content)}
              </h4>
            );
          }

          if (block.type === "paragraph") {
            return (
              <p key={index} className="mb-2 last:mb-0">
                {formatInline(block.content)}
              </p>
            );
          }

          if (block.type === "ul") {
            return (
              <ul key={index} className="mb-2 ml-4 list-disc space-y-1 last:mb-0">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{formatInline(item)}</li>
                ))}
              </ul>
            );
          }

          return (
            <ol key={index} className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{formatInline(item)}</li>
              ))}
            </ol>
          );
        })}
      </div>
    </div>
  );
}
