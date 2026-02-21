import Link from "next/link";
import { APP_NAME, ROUTES } from "@/constants";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={ROUTES.HOME} className="text-xl font-bold tracking-tight">
          {APP_NAME}
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <Link
            href={ROUTES.HOME}
            className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Home
          </Link>
          <Link
            href={ROUTES.DASHBOARD}
            className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
