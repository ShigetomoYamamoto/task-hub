import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* PC sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main area — each page renders its own <Header> with the page-specific title */}
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
