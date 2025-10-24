interface TestCardProps {
  title: string;
  children?: React.ReactNode;
}

export function TestCard({ title, children }: TestCardProps) {
  return (
    <div className="flex-[1] bg-white dark:bg-gray-800 border rounded-md p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 rounded-md border p-4 font-mono mb-13">
        {children}
      </div>
    </div>
  );
}
