import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Image
        src={`${basePath}/images/logo.png`}
        alt="Lost drone"
        width={150}
        height={150}
        priority
      />

      <h1 className="mt-6 text-5xl font-bold">404</h1>

      <h2 className="mt-2 text-2xl font-semibold">Drone Lost Signal</h2>

      <p className="mt-3 max-w-md text-muted-foreground">
        Looks like your drone flew into unknown territory. <br />
        Let's get you back to base.
      </p>

      <Button className="mt-8 rounded-lg bg-primary px-5 py-3 text-primary-foreground transition hover:opacity-90">
        <Link href="/">Return to Base</Link>
      </Button>

      <div className="mt-6 flex w-full max-w-sm items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button className="mt-6 rounded-lg bg-primary px-5 py-3 text-primary-foreground transition hover:opacity-90">
        <Link href="/editor">Create a level yourself</Link>
      </Button>
    </div>
  );
}
