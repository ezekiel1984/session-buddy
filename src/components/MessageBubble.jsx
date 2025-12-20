
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Copy, Zap, CheckCircle2, AlertCircle, Loader2, ChevronRight } from 'lucide-react'; // Clock is imported but not used in outline or component, keeping it just in case
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// FunctionDisplay component - created based on outline's usage and common patterns for tool calls
const FunctionDisplay = ({ toolCall }) => {
  const [isOpen, setIsOpen] = useState(false);

  const iconMap = {
    pending: <Loader2 className="h-4 w-4 animate-spin text-blue-400" />,
    success: <CheckCircle2 className="h-4 w-4 text-green-400" />,
    error: <AlertCircle className="h-4 w-4 text-red-400" />,
    calling: <Zap className="h-4 w-4 text-yellow-400" />, // For when the tool is actively being called
  };

  // Determine status - default to 'calling' if not explicitly set
  const status = toolCall.status || 'calling';

  let argsParsed = {};
  try {
    if (toolCall.function?.arguments) {
      argsParsed = JSON.parse(toolCall.function.arguments);
    }
  } catch (e) {
    argsParsed = { raw: toolCall.function.arguments }; // Fallback for invalid JSON
  }

  return (
    <div className="bg-[#141416] border border-gray-800 rounded-xl p-3 text-gray-100 text-sm mt-1">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-2">
          {iconMap[status] || <Zap className="h-4 w-4 text-yellow-400" />}
          <span className="font-medium">
            {toolCall.function?.name || 'Tool Call'}
          </span>
          {status === 'pending' && <span className="text-gray-400 text-xs">(pending)</span>}
        </div>
        <ChevronRight className={cn("h-4 w-4 text-gray-400 transition-transform", isOpen && "rotate-90")} />
      </div>
      {isOpen && (
        <div className="mt-2 text-xs">
          {toolCall.function?.arguments && (
            <div className="mt-2">
              <h4 className="font-semibold text-gray-300">Arguments:</h4>
              <pre className="bg-[#0A0A0B] text-gray-300 rounded-lg p-2 overflow-x-auto mt-1">
                {JSON.stringify(argsParsed, null, 2)}
              </pre>
            </div>
          )}
          {status === 'success' && toolCall.output && (
            <div className="mt-2">
              <h4 className="font-semibold text-gray-300">Output:</h4>
              <pre className="bg-[#0A0A0B] text-gray-300 rounded-lg p-2 overflow-x-auto mt-1">
                {typeof toolCall.output === 'object' && toolCall.output !== null ? JSON.stringify(toolCall.output, null, 2) : String(toolCall.output)}
              </pre>
            </div>
          )}
          {status === 'error' && toolCall.error_message && (
            <div className="mt-2 text-red-400">
              <h4 className="font-semibold text-red-300">Error:</h4>
              <pre className="bg-[#0A0A0B] text-red-300 rounded-lg p-2 overflow-x-auto mt-1">
                {toolCall.error_message}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user' || message.sender === 'user';
  
  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-7 w-7 rounded-lg bg-[#25A55F]/10 flex items-center justify-center mt-0.5 flex-shrink-0">
          <div className="h-1.5 w-1.5 rounded-full bg-[#25A55F]" />
        </div>
      )}
      <div className={cn("max-w-[85%]", isUser && "flex flex-col items-end")}>
        {message.content || message.text ? (
          <div className={cn(
            "rounded-2xl px-4 py-2.5",
            isUser ? "bg-[#25A55F] text-white" : "bg-[#141416] border border-gray-800 text-gray-100"
          )}>
            {isUser ? (
              <p className="text-sm leading-relaxed">{message.content || message.text}</p>
            ) : (
              <ReactMarkdown 
                className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                components={{
                  code: ({ inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <div className="relative group/code">
                        <pre className="bg-[#0A0A0B] text-gray-100 rounded-lg p-3 overflow-x-auto my-2">
                          <code className={className} {...props}>{children}</code>
                        </pre>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover/code:opacity-100 bg-gray-800 hover:bg-gray-700"
                          onClick={() => {
                            navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                            toast.success('Code copied');
                          }}
                        >
                          <Copy className="h-3 w-3 text-gray-400" />
                        </Button>
                      </div>
                    ) : (
                      <code className="px-1 py-0.5 rounded bg-[#0A0A0B] text-[#25A55F] text-xs">
                        {children}
                      </code>
                    );
                  },
                  a: ({ children, ...props }) => (
                    <a {...props} target="_blank" rel="noopener noreferrer" className="text-[#25A55F] hover:underline">{children}</a>
                  ),
                  p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                  h1: ({ children }) => <h1 className="text-lg font-semibold my-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-semibold my-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold my-2">{children}</h3>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-gray-700 pl-3 my-2 text-gray-400">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {message.content || message.text}
              </ReactMarkdown>
            )}
          </div>
        ) : null}
        
        {message.tool_calls?.length > 0 && (
          <div className="space-y-1">
            {message.tool_calls.map((toolCall, idx) => (
              <FunctionDisplay key={idx} toolCall={toolCall} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
