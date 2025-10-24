import { Button } from "@/components/ui/button";
import { CodeEditor } from "./code-editor";

interface CodeCardProps {
  code: string;
  setCode: (value: string) => void;
}

export function CodeCard({ code, setCode }: CodeCardProps) {
  return (
    <div className="flex-[2] bg-white dark:bg-gray-800 border rounded-md p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-2">Code</h2>
      <CodeEditor code={code} setCode={setCode} />
      <div className="mt-2 flex space-x-2 self-end">
        <Button className="text-md cursor-pointer">Run</Button>
        <Button className="text-md cursor-pointer">Submit</Button>
      </div>
    </div>
  );
}
