"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";

export default function MarkdownRenderer({ children }) {
  const codeBg = "#282a36";

  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Headings
        h1: ({ children, ...props }) => (
          <h1 className="text-4xl font-bold" {...props}>
            {children}
          </h1>
        ),
        h2: ({ children, ...props }) => (
          <h2 className="text-3xl font-semibold" {...props}>
            {children}
          </h2>
        ),
        h3: ({ children, ...props }) => (
          <h3 className="text-2xl font-semibold" {...props}>
            {children}
          </h3>
        ),

        // Text
        p: ({ children, ...props }) => (
          <p className="leading-7 whitespace-pre-line" {...props}>
            {children}
          </p>
        ),

        ul: ({ children, ...props }) => (
          <ul className="list-disc pl-6 space-y-1" {...props}>
            {children}
          </ul>
        ),
        ol: ({ children, ...props }) => (
          <ol className="list-decimal pl-6 space-y-1" {...props}>
            {children}
          </ol>
        ),
        blockquote: ({ children, ...props }) => (
          <blockquote
            className="border-l-4 pl-4 italic my-4 opacity-90"
            {...props}
          >
            {children}
          </blockquote>
        ),

        // Table spacing
        table: ({ children }) => (
          <div className="overflow-x-auto my-6">
            <table className="min-w-full text-left border-collapse">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="px-6 py-3 border-b font-semibold bg-gray-200 dark:bg-gray-800">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-6 py-3 border-b">{children}</td>
        ),

        // Code
        code({ inline, className, children: codeChildren, ...props }) {
          const match = /language-(\w+)/.exec(className || "");

          // Block code with language -> syntax highlighting
          if (!inline && match) {
            return (
              <div className="my-6">
                <SyntaxHighlighter
                  style={dracula}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: "0.5rem",
                    padding: "1rem",
                    background: codeBg,
                  }}
                  {...props}
                >
                  {String(codeChildren).replace(/\n$/, "")}
                </SyntaxHighlighter>
              </div>
            );
          }

          // Inline code
          return (
            <code
              className="px-2 py-1 rounded text-sm font-mono"
              style={{ background: codeBg, color: "#f8f8f2" }}
              {...props}
            >
              {codeChildren}
            </code>
          );
        },
        // Links
        a: ({ children, href, ...props }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="
      text-blue-600 dark:text-blue-400
      underline underline-offset-4
      hover:text-blue-500 dark:hover:text-blue-300
      transition-colors
    "
            {...props}
          >
            {children}
          </a>
        ),
      }}
    >
      {children}
    </Markdown>
  );
}
