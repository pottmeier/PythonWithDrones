"use client";

import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-python";
import 'prismjs/themes/prism-tomorrow.css';

interface CodeEditorProps {
  code: string;
  setCode: (value: string) => void;
}

export function CodeEditor({ code, setCode }: CodeEditorProps) {
  return (
    <div className="relative flex-1 w-full h-full min-h-0 bg-gray-50 dark:bg-gray-900 overflow-hidden">
      
      {/* 
        1. THE SCROLLABLE PARENT 
        This div stays fixed size and handles the scrollbars.
      */}
      <div className="absolute inset-0 overflow-auto">
        
        {/* 
          2. THE GROWING WRAPPER
          min-h-full: Ensures it fills the screen if code is short.
          flex: Puts line numbers and code side-by-side.
          
          CRITICAL: This div grows TALLER than the screen when you type many lines.
          Because it holds both columns, they stretch together.
        */}
        <div className="min-h-full flex items-stretch">
          
          {/* 3. LINE NUMBERS */}
          <div
            className="shrink-0 text-right bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 text-gray-400 select-none"
            style={{
              fontFamily: '"Fira Code", monospace',
              fontSize: 14,
              lineHeight: '21px',
              padding: '16px 8px', // Matches Editor padding
              width: '48px',
            }}
          >
            {code.split("\n").map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* 4. THE EDITOR */}
          <Editor
            value={code}
            onValueChange={setCode}
            highlight={(code) => highlight(code, languages.python)}
            padding={16}
            textareaId="code-editor"
            className="flex-1"
            textareaClassName="focus:outline-none"
            style={{
              fontFamily: '"Fira Code", monospace',
              fontSize: 14,
              lineHeight: '21px',
              backgroundColor: "transparent",
              minHeight: "100%", // Ensures it stretches to match line numbers
            }}
          />
        </div>
      </div>
    </div>
  );
}