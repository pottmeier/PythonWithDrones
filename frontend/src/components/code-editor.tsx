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
    <div className="flex flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 rounded-md border mb-2">
      <div
        className="select-none text-gray-500 dark:text-gray-400 p-4 text-right font-mono text-md leading-snug border-r border-gray-300 dark:border-gray-700"
        style={{ fontFamily: '"Fira Code", monospace' }}
      >
        {code.split("\n").map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <Editor
        value={code}
        onValueChange={setCode}
        highlight={(code) => highlight(code, languages.python)}
        padding={16}
        textareaId="code-editor"
        textareaClassName="focus:outline-none"
        className="flex-1 font-mono text-md leading-snug"
        placeholder="Start coding..."
        style={{
          background: "transparent",
          fontFamily: '"Fira Code", monospace',
        }}
        tabSize={2}
        insertSpaces={true}
      />
    </div>
  );
}
