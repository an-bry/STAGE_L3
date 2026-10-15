import { type ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface AppShellProps {
  title: string;
  breadcrumb?: string[];
  children: ReactNode;
  actions?: ReactNode;
}

export default function AppShell({ title, breadcrumb, children, actions }: AppShellProps) {
  return (
    <div className="min-h-screen flex bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} breadcrumb={breadcrumb} />
        {actions && (
          <div className="bg-card border-b border-line px-6 py-3 flex items-center justify-end gap-2">
            {actions}
          </div>
        )}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}