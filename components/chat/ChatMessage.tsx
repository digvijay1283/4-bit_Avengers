"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Base64 audio string or URL returned by the chatbot API */
  audio?: string;
}

interface ChatMessageProps {
  message: Message;
  autoPlay?: boolean;
}


/** Strip markdown syntax so TTS reads clean prose */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")   // bold
    .replace(/\*(.+?)\*/g, "$1")        // italic
    .replace(/^#{1,6}\s+/gm, "")        // headings
    .replace(/^[-•]\s+/gm, "")          // bullet points
    .replace(/^\d+[.)]\s+/gm, "")       // numbered list
    .trim();
}

function SpeakButton({ text, audio, autoPlay }: { text: string; audio?: string; autoPlay?: boolean }) {
  const [speaking, setSpeaking] = useState(false);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const didAutoPlay = useRef(false);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (uttRef.current) { window.speechSynthesis.cancel(); uttRef.current = null; }
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  function stop() {
    if (uttRef.current) { window.speechSynthesis.cancel(); uttRef.current = null; }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setSpeaking(false);
  }

  function startTTS() {
    const utt = new SpeechSynthesisUtterance(stripMarkdown(text));
    utt.rate = 1;
    utt.pitch = 1;
    utt.onend = () => { setSpeaking(false); uttRef.current = null; };
    utt.onerror = () => { setSpeaking(false); uttRef.current = null; };
    uttRef.current = utt;
    window.speechSynthesis.speak(utt);
    setSpeaking(true);
  }

  function startPlaying() {
    if (audio && audio.trim() !== "") {
      const src = audio.startsWith("data:") || audio.startsWith("http")
        ? audio
        : `data:audio/mp3;base64,${audio}`;
      const el = new Audio(src);
      audioRef.current = el;
      el.onended = () => { audioRef.current = null; setSpeaking(false); };
      el.onerror = () => { audioRef.current = null; startTTS(); };
      el.play().catch(() => { audioRef.current = null; startTTS(); });
      setSpeaking(true);
    } else {
      startTTS();
    }
  }

  function toggle() {
    if (speaking) { stop(); return; }
    startPlaying();
  }

  // Auto-play: fires when autoPlay flips to true.
  // Calls startPlaying() directly — no stale closure through toggle().
  useEffect(() => {
    if (!autoPlay || didAutoPlay.current) return;
    didAutoPlay.current = true;
    // 150 ms lets the bubble render before audio begins
    const t = setTimeout(() => startPlaying(), 150);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay]);

  return (
    <button
      onClick={toggle}
      title={speaking ? "Stop speaking" : "Read aloud"}
      className={[
        "mt-2 flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        speaking
          ? "border-[#106534] bg-[#D1FAE5] text-[#106534]"
          : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#106534] hover:text-[#106534]",
      ].join(" ")}
    >
      {speaking ? (
        <>
          <VolumeX className="h-3.5 w-3.5" />
          Stop
        </>
      ) : (
        <>
          <Volume2 className="h-3.5 w-3.5" />
          Listen
        </>
      )}
    </button>
  );
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

export default function ChatMessage({ message, autoPlay }: ChatMessageProps) {
  const isUser = message.role === "user";
  const blocks = parseContent(message.content);

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
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
      {!isUser && <SpeakButton text={message.content} audio={message.audio} autoPlay={autoPlay} />}
    </div>
  );
}
