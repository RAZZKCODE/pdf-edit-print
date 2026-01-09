import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Unlock, 
  Crop, 
  Printer, 
  Shield, 
  Zap, 
  Eye,
  ArrowRight,
  FileText,
  Download
} from "lucide-react";
import Header from "@/components/Header";
import FileUpload from "@/components/FileUpload";
import PDFViewer from "@/components/PDFViewer";
import PrintPreview from "@/components/PrintPreview";
import FeatureCard from "@/components/FeatureCard";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>("");
  const workspaceRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    setIsProcessing(true);
    // Simulate processing time
    setTimeout(() => {
      setSelectedFile(file);
      setIsProcessing(false);
      // Scroll to workspace
      workspaceRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 1500);
  }, []);

  const handlePrint = useCallback((imageData: string | null, pageNumber: number) => {
    // For full page print without crop, trigger native print
    if (!imageData) {
      window.print();
      return;
    }

    // Show print preview with cropped image
    setPreviewImage(imageData);
    setShowPreview(true);
  }, []);

  const handleDownloadFull = useCallback(() => {
    if (!selectedFile) return;
    
    const url = URL.createObjectURL(selectedFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [selectedFile]);

  const features = [
    {
      icon: Unlock,
      title: "Unlock Protected PDFs",
      description: "Remove restrictions from password-protected documents instantly. Supports all major encryption types.",
    },
    {
      icon: Crop,
      title: "Live Crop Selection",
      description: "Select any rectangular area on your PDF with precision. Drag and resize to get the perfect crop.",
    },
    {
      icon: Printer,
      title: "Direct Printing",
      description: "Print your cropped selection or full pages directly to any connected printer with one click.",
    },
    {
      icon: Download,
      title: "Download Options",
      description: "Download full PDF or cropped selections in high resolution PNG format.",
    },
  ];

  const benefits = [
    { icon: Shield, text: "Secure processing" },
    { icon: Zap, text: "Lightning fast" },
    { icon: Eye, text: "Privacy focused" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <FileText className="w-4 h-4" />
              Professional PDF Tools
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Unlock, Crop & Print
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Your PDFs Instantly
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              The all-in-one PDF toolkit that lets you remove restrictions, select specific areas, 
              and print exactly what you need. No downloads, no hassle.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border shadow-sm"
                >
                  <benefit.icon className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-foreground">{benefit.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* File Upload */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
          </motion.div>
        </div>
      </section>

      {/* PDF Viewer Section */}
      <AnimatePresence>
        {selectedFile && (
          <section ref={workspaceRef} className="container mx-auto px-4 py-12">
            <PDFViewer 
              file={selectedFile} 
              onPrint={handlePrint} 
              onDownloadFull={handleDownloadFull}
            />
          </section>
        )}
      </AnimatePresence>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Simple steps to unlock, crop, and print your PDFs with precision
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              step={index + 1}
              delay={index * 0.15}
            />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative bg-card rounded-3xl border border-border p-12 text-center overflow-hidden"
        >
          <div className="relative z-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Upload your first PDF and experience the easiest way to unlock, crop, and print documents.
            </p>
            <Button 
              variant="default" 
              size="lg" 
              className="gap-2"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Upload Your PDF
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 PDFCraft. All rights reserved.</p>
        </div>
      </footer>

      {/* Print Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <PrintPreview
            imageData={previewImage}
            onClose={() => setShowPreview(false)}
            onPrint={() => setShowPreview(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
