import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Cpu, FileText, Calculator, BookOpen, MessageCircle, FlaskConical, BarChart, Settings } from "lucide-react";

const NAV = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "AI Tool Finder", href: "/tools", icon: Cpu },
  { name: "Prompt Library", href: "/prompts", icon: FileText },
  { name: "Token & Cost Lab", href: "/token-lab", icon: Calculator },
  { name: "Knowledge Center", href: "/knowledge", icon: BookOpen },
  { name: "Knowledge Assistant", href: "/assistant", icon: MessageCircle },
  { name: "Evaluation Lab", href: "/evaluations", icon: FlaskConical },
  { name: "Analytics", href: "/analytics", icon: BarChart },
  { name: "Admin Settings", href: "/admin", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="flex h-full w-[256px] shrink-0 border-r border-border bg-sidebar flex-col">
      <div className="flex items-center gap-2 mb-8 p-4">
        <div className="h-6 w-6 rounded bg-primary p-0.5">
          <span className="block text-[10px] font-bold text-primary-foreground text-center leading-none">A</span>
        </div>
        <span className="text-sm font-semibold text-sidebar-foreground">AI Hub</span>
      </div>

      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Button
              key={item.name}
              asChild
              variant={active ? "default" : "ghost"}
              className={[
                "w-full justify-start text-left text-sm font-medium",
                active ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              ].join(" ")}
            >
              <Link href={item.href} onClick={() => router.push(item.href)}>
                <item.icon className="mr-3 size-4 shrink-0" />
                {item.name}
              </Link>
            </Button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Button asChild variant="outline" className="w-full justify-start text-left text-sm">
          <Link href="/admin" onClick={() => router.push("/admin")}>
            <Settings className="mr-3 size-4 shrink-0" />
            Admin Settings
          </Link>
        </Button>
      </div>
    </aside>
  );
}
