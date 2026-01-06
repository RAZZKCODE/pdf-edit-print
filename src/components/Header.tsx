import { FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-md">
            <FileText className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-foreground">PDFCraft</h1>
            <p className="text-xs text-muted-foreground">Unlock • Crop • Print</p>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            How it Works
          </a>
        </nav>

        <Button variant="accent" size="sm" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Get Started
        </Button>
      </div>
    </header>
  );
};

export default Header;
