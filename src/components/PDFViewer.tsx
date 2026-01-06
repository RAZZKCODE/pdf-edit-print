import { useState, useRef, useCallback, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Crop, 
  Printer,
  RotateCcw,
  Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PDFViewerProps {
  file: File;
  onPrint: (cropArea: CropArea | null, pageNumber: number) => void;
}

const PDFViewer = ({ file, onPrint }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [isCropMode, setIsCropMode] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const nextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
      setCropArea(null);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setCropArea(null);
    }
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => setScale(1);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isCropMode || !pageRef.current) return;
    
    const rect = pageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setStartPos({ x, y });
    setCropArea({ x, y, width: 0, height: 0 });
  }, [isCropMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !pageRef.current) return;
    
    const rect = pageRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const x = Math.min(startPos.x, currentX);
    const y = Math.min(startPos.y, currentY);
    const width = Math.abs(currentX - startPos.x);
    const height = Math.abs(currentY - startPos.y);
    
    setCropArea({ x, y, width, height });
  }, [isDrawing, startPos]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCrop = () => {
    setCropArea(null);
    setIsCropMode(false);
  };

  const handlePrint = () => {
    onPrint(cropArea, currentPage);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm font-medium text-foreground min-w-[80px] text-center">
            {currentPage} / {numPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextPage}
            disabled={currentPage >= numPages}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={zoomOut}>
            <ZoomOut className="w-5 h-5" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="ghost" size="icon" onClick={zoomIn}>
            <ZoomIn className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={resetZoom}>
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isCropMode ? "accent" : "secondary"}
            size="sm"
            onClick={() => setIsCropMode(!isCropMode)}
            className="gap-2"
          >
            <Crop className="w-4 h-4" />
            {isCropMode ? "Cropping" : "Crop Mode"}
          </Button>
          
          {cropArea && cropArea.width > 10 && cropArea.height > 10 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCrop}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Clear
            </Button>
          )}

          <Button
            variant="hero"
            size="sm"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="w-4 h-4" />
            Print {cropArea && cropArea.width > 10 ? "Selection" : "Page"}
          </Button>
        </div>
      </div>

      {/* PDF Container */}
      <div 
        ref={containerRef}
        className="relative overflow-auto bg-muted/20 p-8"
        style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}
      >
        <div className="flex justify-center">
          <div 
            ref={pageRef}
            className={`relative ${isCropMode ? "cursor-crosshair" : ""}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center h-96">
                  <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                className="shadow-xl rounded-lg overflow-hidden"
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>

            {/* Crop Overlay */}
            {cropArea && cropArea.width > 0 && cropArea.height > 0 && (
              <>
                {/* Dimmed overlay */}
                <div 
                  className="absolute inset-0 bg-foreground/40 pointer-events-none"
                  style={{
                    clipPath: `polygon(
                      0% 0%, 
                      0% 100%, 
                      ${cropArea.x}px 100%, 
                      ${cropArea.x}px ${cropArea.y}px, 
                      ${cropArea.x + cropArea.width}px ${cropArea.y}px, 
                      ${cropArea.x + cropArea.width}px ${cropArea.y + cropArea.height}px, 
                      ${cropArea.x}px ${cropArea.y + cropArea.height}px, 
                      ${cropArea.x}px 100%, 
                      100% 100%, 
                      100% 0%
                    )`
                  }}
                />
                {/* Crop selection border */}
                <div
                  className="absolute border-2 border-accent bg-accent/10 pointer-events-none"
                  style={{
                    left: cropArea.x,
                    top: cropArea.y,
                    width: cropArea.width,
                    height: cropArea.height,
                  }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-1 bg-accent text-accent-foreground text-xs rounded font-medium whitespace-nowrap">
                    {Math.round(cropArea.width)} × {Math.round(cropArea.height)} px
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PDFViewer;
