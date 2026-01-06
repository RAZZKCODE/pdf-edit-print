import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrintPreviewProps {
  imageData: string;
  onClose: () => void;
  onPrint: () => void;
}

const PrintPreview = ({ imageData, onClose, onPrint }: PrintPreviewProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print PDF Selection</title>
            <style>
              body {
                margin: 0;
                padding: 20mm;
                display: flex;
                justify-content: center;
                align-items: flex-start;
              }
              img {
                max-width: 100%;
                height: auto;
              }
              @media print {
                body {
                  padding: 0;
                }
              }
            </style>
          </head>
          <body>
            <img src="${imageData}" alt="Print selection" />
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
    onPrint();
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = imageData;
    link.download = "pdf-selection.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card rounded-2xl border border-border shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-display font-semibold text-lg text-foreground">
            Print Preview
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Preview */}
        <div className="p-6 overflow-auto max-h-[60vh] bg-muted/30">
          <div 
            ref={printRef}
            className="bg-card rounded-lg shadow-lg p-8 mx-auto inline-block"
          >
            <img 
              src={imageData} 
              alt="Selection preview" 
              className="max-w-full h-auto"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
          <Button variant="secondary" onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button variant="hero" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Print Now
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PrintPreview;
