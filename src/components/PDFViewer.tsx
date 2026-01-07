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
  Maximize2,
  Download,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PasswordModal from "@/components/PasswordModal";
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
  onPrint: (imageData: string | null, pageNumber: number) => void;
  onDownloadFull: () => void;
}

const PDFViewer = ({ file, onPrint, onDownloadFull }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [isCropMode, setIsCropMode] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState<string>("");
  const [pdfKey, setPdfKey] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const passwordCallbackRef = useRef<((password: string) => void) | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setShowPasswordModal(false);
    setPasswordError("");
    passwordCallbackRef.current = null;
  };

  const handlePasswordSubmit = (enteredPassword: string) => {
    if (passwordCallbackRef.current) {
      passwordCallbackRef.current(enteredPassword);
      setShowPasswordModal(false);
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setPasswordError("");
    passwordCallbackRef.current = null;
  };

  const onPassword = (callback: (password: string) => void, reason: number) => {
    // reason: 1 = need password, 2 = incorrect password
    if (reason === 2) {
      setPasswordError("Incorrect password. Please try again.");
    }
    passwordCallbackRef.current = callback;
    setShowPasswordModal(true);
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

  // Store canvas reference when PDF page renders
  useEffect(() => {
    const checkForCanvas = () => {
      if (pageRef.current) {
        const canvas = pageRef.current.querySelector('canvas');
        if (canvas) {
          canvasRef.current = canvas;
        }
      }
    };
    
    const timer = setTimeout(checkForCanvas, 500);
    return () => clearTimeout(timer);
  }, [currentPage, scale, file]);

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

  const extractCroppedImage = useCallback((): string | null => {
    if (!cropArea || !canvasRef.current || !pageRef.current) return null;

    const sourceCanvas = canvasRef.current;
    const pageRect = pageRef.current.getBoundingClientRect();
    const canvasRect = sourceCanvas.getBoundingClientRect();

    // Calculate the offset of the canvas within the page container
    const offsetX = canvasRect.left - pageRect.left;
    const offsetY = canvasRect.top - pageRect.top;

    // Adjust crop coordinates relative to the canvas
    const adjustedX = cropArea.x - offsetX;
    const adjustedY = cropArea.y - offsetY;

    // Calculate the scale factor between displayed size and actual canvas size
    const scaleX = sourceCanvas.width / canvasRect.width;
    const scaleY = sourceCanvas.height / canvasRect.height;

    // Apply scale to get actual pixel coordinates
    const sourceX = Math.max(0, adjustedX * scaleX);
    const sourceY = Math.max(0, adjustedY * scaleY);
    const sourceWidth = Math.min(cropArea.width * scaleX, sourceCanvas.width - sourceX);
    const sourceHeight = Math.min(cropArea.height * scaleY, sourceCanvas.height - sourceY);

    if (sourceWidth <= 0 || sourceHeight <= 0) return null;

    // Create a new canvas for the cropped image at full resolution
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = sourceWidth;
    croppedCanvas.height = sourceHeight;
    const ctx = croppedCanvas.getContext('2d');
    
    if (!ctx) return null;

    // Draw the cropped portion at full resolution
    ctx.drawImage(
      sourceCanvas,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, sourceWidth, sourceHeight
    );

    return croppedCanvas.toDataURL('image/png', 1.0);
  }, [cropArea]);

  const handlePrint = () => {
    if (cropArea && cropArea.width > 10 && cropArea.height > 10) {
      const imageData = extractCroppedImage();
      onPrint(imageData, currentPage);
    } else {
      // Print full page
      onPrint(null, currentPage);
    }
  };

  const handleDownloadCropped = () => {
    if (!cropArea || cropArea.width <= 10 || cropArea.height <= 10) return;
    
    const imageData = extractCroppedImage();
    if (imageData) {
      // Convert PNG to JPEG for better quality download
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const jpegData = canvas.toDataURL('image/jpeg', 1.0);
          const link = document.createElement('a');
          link.href = jpegData;
          link.download = `cropped-page-${currentPage}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      };
      img.src = imageData;
    }
  };

  const handleDownloadFullImage = () => {
    if (!canvasRef.current) {
      // Try to get canvas again
      if (pageRef.current) {
        const canvas = pageRef.current.querySelector('canvas');
        if (canvas) {
          canvasRef.current = canvas;
        }
      }
    }
    
    if (!canvasRef.current) return;
    
    const sourceCanvas = canvasRef.current;
    
    // Create a new canvas for JPEG conversion with white background
    const jpegCanvas = document.createElement('canvas');
    jpegCanvas.width = sourceCanvas.width;
    jpegCanvas.height = sourceCanvas.height;
    const ctx = jpegCanvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, jpegCanvas.width, jpegCanvas.height);
      ctx.drawImage(sourceCanvas, 0, 0);
      
      const jpegData = jpegCanvas.toDataURL('image/jpeg', 1.0);
      const link = document.createElement('a');
      link.href = jpegData;
      link.download = `page-${currentPage}-full.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 border-b border-border bg-muted/30">
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

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={isCropMode ? "default" : "secondary"}
            size="sm"
            onClick={() => setIsCropMode(!isCropMode)}
            className="gap-2"
          >
            <Crop className="w-4 h-4" />
            {isCropMode ? "Cropping" : "Crop"}
          </Button>
          
          {cropArea && cropArea.width > 10 && cropArea.height > 10 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearCrop}
                title="Clear selection"
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadCropped}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Cropped
              </Button>
            </>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadFullImage}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Full Image
          </Button>

          <Button
            variant="default"
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
              onPassword={onPassword}
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

            {/* Crop Mode Indicator */}
            {isCropMode && !cropArea && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                Click and drag to select area
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onSubmit={handlePasswordSubmit}
        onCancel={handlePasswordCancel}
        error={passwordError}
      />
    </motion.div>
  );
};

export default PDFViewer;
