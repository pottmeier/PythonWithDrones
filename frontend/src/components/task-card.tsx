interface TaskCardProps {
  title: string;
  children?: React.ReactNode;
}

export function TaskCard({ title, children }: TaskCardProps) {
  return (
    <div className="flex-[1] min-h-[50vh] bg-white dark:bg-gray-800 border rounded-md p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      {children}
    </div>
  );
}
