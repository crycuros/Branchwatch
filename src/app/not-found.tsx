import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col items-center justify-center p-6 text-center font-sans">
      <h2 className="text-3xl font-bold tracking-tight">404 — Page Not Found</h2>
      <p className="mt-2 text-sm text-neutral-400">
        The branch or page you requested does not exist.
      </p>
      <Link
        href="/"
        className="mt-6 px-4 py-2 rounded-lg bg-white text-neutral-900 font-medium text-xs hover:bg-neutral-200 transition-colors"
      >
        Return to Workspace
      </Link>
    </div>
  );
}
