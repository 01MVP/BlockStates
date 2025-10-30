import React, { useState, useEffect, useRef, ChangeEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { Socket } from "socket.io-client";
import { Message } from "@/lib/types";
import { ColorArr } from "@/lib/constants";
import clsx from "classnames";
import useMediaQuery from "@/hooks/useMediaQuery";

const ChatBoxMessage = ({ message }: { message: Message }) => {
  return (
    <div className="chat-message text-white">
      {message.player ? (
        <span
          style={{
            paddingLeft: 10,
            color: ColorArr[message.player.color],
          }}
        >
          {message.player.username}
        </span>
      ) : (
        <span className="text-white">[system]</span>
      )}
      &nbsp;
      <span className="text-white">{message.content}</span>
      &nbsp;
      {message.target && (
        <>
          <span
            style={{
              color: ColorArr[message.target.color],
            }}
          >
            {message.target.username}
          </span>
          <span className="text-white">.</span>
        </>
      )}
      <br />
    </div>
  );
};

interface ChatBoxProp {
  socket: Socket | null;
  messages: Message[];
}

export default React.memo(function ChatBox({ socket, messages }: ChatBoxProp) {
  const [inputValue, setInputValue] = useState("");
  const [isExpand, setIsExpand] = useState(false);
  const textFieldRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isSmallScreen = useMediaQuery("(max-width: 600px)");

  // Debug: log socket status
  useEffect(() => {
    console.log("[ChatBox] Socket status:", socket ? "connected" : "not connected");
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isExpand]);

  useEffect(() => {
    setIsExpand(!isSmallScreen);
  }, [isSmallScreen]);

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleGlobalKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && textFieldRef.current && document.activeElement !== textFieldRef.current) {
      event.preventDefault();
      textFieldRef.current.focus();
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSendMessage = () => {
    if (inputValue.trim() !== "") {
      setInputValue("");
      if (socket) socket.emit("player_message", inputValue);
    }
  };

  return (
    <div
      className={clsx(
        "fixed bottom-0 right-0 z-tooltip flex flex-col rounded-tl-2xl border-2 border-border-main bg-[#212936]/95 text-sm text-white shadow-2xl backdrop-blur-md transition-all",
        "md:w-[350px] md:h-[40vh]",
        "sm:w-[60%]",
        isExpand
          ? "h-[40vh] w-[320px] md:w-[350px]"
          : "h-[12vh] w-[260px] opacity-80 md:w-[300px]",
      )}
      onClick={() => {
        if (!isExpand) setIsExpand(true);
      }}
    >
      <div
        onClick={(e) => {
          if (isExpand) {
            e.stopPropagation(); // Prevent triggering parent's onClick
            setIsExpand(false);
          }
        }}
        className={clsx(
          "flex-1 overflow-y-auto px-4 py-3 transition-all",
          !isExpand && "cursor-pointer",
        )}
      >
        {messages.map((message, index) => (
          <ChatBoxMessage key={index} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-white/10" />
      <div className="flex items-center px-4 py-2">
        <input
          className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60 focus:border-player-2 focus:outline-none focus:ring-2 focus:ring-player-2/40 disabled:opacity-50"
          placeholder={socket ? "开始聊天，回车发送" : "等待连接..."}
          value={inputValue}
          onChange={handleInputChange}
          ref={textFieldRef}
          onKeyDown={handleInputKeyDown}
          disabled={!socket}
        />
      </div>
    </div>
  );
});
