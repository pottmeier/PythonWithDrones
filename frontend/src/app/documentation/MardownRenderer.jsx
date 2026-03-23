"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";

export default function MarkdownRenderer({ children }) {
  const codeBg = "#282a36";

  // --- TOC LOGIC ---
  const headings = typeof children === "string" 
    ? children
        .split("\n")
        .filter((line) => line.match(/^###?\s/))
        .map((line) => {
          const level = line.startsWith("###") ? 3 : 2;
          const text = line.replace(/^###?\s/, "").replace(/[#*`]/g, "").trim();
          const id = text
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]/g, "");
          return { text, level, id };
        })
    : [];

  return (
    // Changed to md:flex-row-reverse to put TOC on the right
    <div className="flex flex-col md:flex-row-reverse gap-12 relative">
      
      {/* 1. RIGHT SIDEBAR TABLE OF CONTENTS */}
      {headings.length > 0 && (
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 p-4 border-l border-gray-200 dark:border-gray-800">
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4 opacity-50">
              On this page
            </h4>
            <ul className="space-y-3">
              {headings.map((heading, i) => (
                <li 
                  key={i} 
                  style={{ marginLeft: heading.level === 3 ? "1rem" : "0" }}
                >
                  <a
                    href={`#${heading.id}`}
                    className="text-sm text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors block"
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}

      {/* 2. MAIN CONTENT (Left side) */}
      <div className="flex-1 min-w-0 max-w-4xl">
        <Markdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSlug]}
          components={{
            h1: ({ node, ...props }) => (
              <h1 className="text-4xl font-bold mb-8" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-3xl font-semibold mt-12 mb-4 border-b pb-2" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-2xl font-semibold mt-8 mb-3" {...props} />
            ),
            p: ({ children, ...props }) => (
              <p className="leading-7 mb-4 whitespace-pre-line text-gray-800 dark:text-gray-200" {...props}>
                {children}
              </p>
            ),
            ul: ({ children, ...props }) => (
              <ul className="list-disc pl-6 space-y-2 mb-4" {...props}>
                {children}
              </ul>
            ),
            ol: ({ children, ...props }) => (
              <ol className="list-decimal pl-6 space-y-2 mb-4" {...props}>
                {children}
              </ol>
            ),
            blockquote: ({ children, ...props }) => (
              <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 italic my-6 text-gray-600 dark:text-gray-400" {...props}>
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-6 border rounded-lg">
                <table className="min-w-full text-left border-collapse">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="px-6 py-3 border-b font-semibold bg-gray-50 dark:bg-gray-900">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-6 py-3 border-b">{children}</td>
            ),
            code({ inline, className, children: codeChildren, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
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
                        padding: "1.25rem",
                        background: codeBg,
                        fontSize: "0.9rem"
                      }}
                      {...props}
                    >
                      {String(codeChildren).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  </div>
                );
              }
              return (
                <code
                  className="px-1.5 py-0.5 rounded text-sm font-mono"
                  style={{ background: codeBg, color: "#f8f8f2" }}
                  {...props}
                >
                  {codeChildren}
                </code>
              );
            },
            a: ({ children, href, ...props }) => (
              <a
                href={href}
                className="text-blue-600 dark:text-blue-400 underline underline-offset-4 hover:opacity-80 transition-opacity"
                {...props}
              >
                {children}
              </a>
            ),
          }}
        >
          {children}
        </Markdown>
      </div>
    </div>
  );
}
