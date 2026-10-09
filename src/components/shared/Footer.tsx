
export default function Footer() {
  return (
    <footer className="flex h-16 items-center border-t border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex w-full flex-col items-center justify-between gap-1 text-xs text-slate-500 sm:flex-row dark:text-slate-400">
        <p>
          © {new Date().getFullYear()} Bridge. All rights reserved.
        </p>
        <p>Workspace Management System</p>
      </div>
    </footer>
  );
}