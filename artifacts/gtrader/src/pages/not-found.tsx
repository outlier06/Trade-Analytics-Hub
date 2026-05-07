import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
      <p className="text-xl font-semibold text-foreground mb-2">Page not found</p>
      <p className="text-sm text-muted-foreground mb-6">The page you're looking for doesn't exist.</p>
      <Link href="/"><Button>Go to Dashboard</Button></Link>
    </div>
  );
}
