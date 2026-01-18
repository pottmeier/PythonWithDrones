"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface TaskCardProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function TaskCard({ title, description, children }: TaskCardProps) {
  return (
    <div className="flex-[1] min-h-[50vh] bg-transparent flex flex-col">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
        {title}
      </h2>

      {description && (
        <div className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">
          <ReactMarkdown 
            rehypePlugins={[rehypeRaw]} 
            components={{
              // 1. Force styling for Headers (### -> h3)
              h3: ({node, ...props}) => (
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2 block" {...props} />
              ),
              h2: ({node, ...props}) => (
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-3 block" {...props} />
              ),
              h1: ({node, ...props}) => (
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-4 block" {...props} />
              ),
              // 2. Force styling for Paragraphs (add spacing)
              p: ({node, ...props}) => (
                <p className="mb-4" {...props} />
              ),
              // 3. Force styling for Lists
              ul: ({node, ...props}) => (
                <ul className="list-disc list-inside mb-4 ml-2" {...props} />
              ),
              li: ({node, ...props}) => (
                <li className="mb-1" {...props} />
              ),
              // 4. Force styling for Code Snippets (`code`)
              code: ({node, ...props}) => (
                <span className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200" {...props} />
              )
            }}
          >
            {description}
          </ReactMarkdown>
        </div>
      )}

      {children}
    </div>
  );
}