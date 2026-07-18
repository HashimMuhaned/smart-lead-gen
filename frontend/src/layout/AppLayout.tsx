import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";

interface AppLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AppLayout({ title, subtitle, children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-paper-50">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 px-5 lg:px-8 py-6 pb-24 lg:pb-8">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
