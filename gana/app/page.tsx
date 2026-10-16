import Link from "next/link";
import { DemoModeBanner } from "@/components/shared/DemoModeBanner";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { AppShell } from "@/components/layout/AppShell";

export default function HomePage() {
  return (
    <AppShell headerTitle="AI Enablement Hub" hideSidebar={true}>
      <DemoModeBanner />
      <SectionHeader title="AI Enablement Hub" description="Centralized platform for AI tool selection, prompt governance, cost optimization, and adoption analytics." />
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <a href="/dashboard" className="card p-6 border border-border rounded-xl hover:border-primary transition-colors">
          <h3 className="font-semibold text-foreground mb-2">Dashboard</h3>
          <p className="text-sm text-muted-foreground">Executive overview of AI tool adoption, usage, and costs.</p>
        </a>
        <a href="/tools" className="card p-6 border border-border rounded-xl hover:border-primary transition-colors">
          <h3 className="font-semibold text-foreground mb-2">AI Tool Finder</h3>
          <p className="text-sm text-muted-foreground">Browse, search, and filter approved AI tools by category.</p>
        </a>
        <a href="/tools/recommend" className="card p-6 border border-border rounded-xl hover:border-primary transition-colors">
          <h3 className="font-semibold text-foreground mb-2">Recommendation Wizard</h3>
          <p className="text-sm text-muted-foreground">Get AI tool recommendations based on your task and data classification.</p>
        </a>
        <a href="/prompts" className="card p-6 border border-border rounded-xl hover:border-primary transition-colors">
          <h3 className="font-semibold text-foreground mb-2">Prompt Library</h3>
          <p className="text-sm text-muted-foreground">Discover and copy vetted prompt templates for common tasks.</p>
        </a>
        <a href="/knowledge" className="card p-6 border border-border rounded-xl hover:border-primary transition-colors">
          <h3 className="font-semibold text-foreground mb-2">Knowledge Center</h3>
          <p className="text-sm text-muted-foreground">Published governance documents and usage guidance.</p>
        </a>
        <a href="/token-lab" className="card p-6 border border-border rounded-xl hover:border-primary transition-colors">
          <h3 className="font-semibold text-foreground mb-2">Token & Cost Lab</h3>
          <p className="text-sm text-muted-foreground">Estimate AI token costs using current pricing profiles.</p>
        </a>
      </div>
      <div className="mt-8 max-w-5xl mx-auto">
        <SectionHeader title="Getting started" />
        <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
          <li>Start at the <Link href="/dashboard">dashboard</Link> for an overview of your AI environment.</li>
          <li>Use the <Link href="/tools">AI Tool Finder</Link> to browse approved tools and their capabilities.</li>
          <li>Run the <Link href="/tools/recommend">recommendation wizard</Link> to find tools suited to your task.</li>
          <li>Explore the <Link href="/prompts">prompt library</Link> for reusable prompt templates.</li>
          <li>Estimate costs in the <Link href="/token-lab">Token & Cost Lab</Link> before adopting a new model.</li>
        </ul>
      </div>
    </AppShell>
  );
}
