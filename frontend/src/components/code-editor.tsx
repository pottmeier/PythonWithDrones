"use client";

interface CodeEditorProps {
  code: string;
  setCode: (value: string) => void;
}

export function CodeEditor({ code, setCode }: CodeEditorProps) {
  return (
    <div className="flex flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 rounded-md border mb-2">
      <div className="select-none text-gray-500 dark:text-gray-400 p-4 text-right font-mono leading-relaxed border-r border-gray-300 dark:border-gray-700">
        {code.split("\n").map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="none"
        className="flex-1 p-4 bg-transparent focus:outline-none font-mono resize-none leading-relaxed"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            e.preventDefault();
            const textarea = e.currentTarget as HTMLTextAreaElement;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;

            const newValue =
              code.substring(0, start) + "\t" + code.substring(end);
            setCode(newValue);

            requestAnimationFrame(() => {
              textarea.selectionStart = textarea.selectionEnd = start + 1;
            });
          }
        }}
        placeholder="Start coding..."
      />
    </div>
  );
}
