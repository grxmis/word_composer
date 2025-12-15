import React, { useState, useRef, useEffect } from "react";

// A4 size at 96 DPI
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

// --- Helper Component: Draggable & Resizable Box (Remains the same) ---
function DraggableResizableBox({ x, y, width, height, onUpdate, children, disabled }) {
  // ... (Implementation remains the same)
}

// --- Main Component ---
export default function A4WordComposer() {
  const [template, setTemplate] = useState(null);
  const [docHtml, setDocHtml] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [pages, setPages] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [libsLoaded, setLibsLoaded] = useState(false);
  
  // 🌟 ΝΕΟ STATE: Για οπτική ένδειξη Drag & Drop
  const [isDragging, setIsDragging] = useState(false); 

  const [box, setBox] = useState({ x: 80, y: 120, width: 630, height: 850 });
  const measureRef = useRef(null);

  const templateInputRef = useRef(null);
  const docInputRef = useRef(null);

  // Load external libraries dynamically via CDN (Remains the same)
  useEffect(() => {
    const scripts = [
      "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
    ];

    let loadedCount = 0;
    scripts.forEach(src => {
      if (document.querySelector(`script[src="${src}"]`)) {
        loadedCount++;
        if (loadedCount === scripts.length) setLibsLoaded(true);
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => {
        loadedCount++;
        if (loadedCount === scripts.length) setLibsLoaded(true);
      };
      document.body.appendChild(script);
    });
  }, []);

  function handleTemplate(e) {
    // Χειρίζεται τόσο το file input όσο και το drop event
    const file = e.target.files?.[0] || e;
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setTemplate(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleDoc(e) {
    if (!window.mammoth) {
      console.error("Mammoth library not loaded.");
      return;
    }
    // Χειρίζεται τόσο το file input όσο και το drop event
    const file = e.target.files?.[0] || e;
    if (!file) return;
    try {
        const buffer = await file.arrayBuffer();
        const result = await window.mammoth.convertToHtml({ arrayBuffer: buffer });
        setDocHtml(result.value || "");
    } catch (error) {
      console.error("Error converting DOCX:", error);
    }
  }

  function handleReset() {
    setTemplate(null);
    setDocHtml("");
    setPages([]);
    setFontSize(16);
    if (templateInputRef.current) templateInputRef.current.value = null;
    if (docInputRef.current) docInputRef.current.value = null;
  }
  
  // Pagination Logic (Remains the same as the final version)
  useEffect(() => {
    // ... (Complex pagination and text splitting logic)
  }, [docHtml, fontSize, box.width, box.height]);

  async function exportPDF() { /* ... */ }
  async function exportImages(type) { /* ... */ }

  // ----------------------------------------------------
  // 🌟 ΝΕΑ ΛΟΓΙΚΗ DRAG & DROP
  // ----------------------------------------------------
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      // Ενεργοποιείται μόνο αν τα μεταφερόμενα στοιχεία είναι αρχεία
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      
      files.forEach(file => {
        const fileType = file.type;
        
        if (fileType.startsWith("image/")) {
          // Είναι εικόνα (Template)
          handleTemplate(file);
        } else if (file.name.endsWith(".docx")) {
          // Είναι DOCX
          handleDoc(file);
        }
      });
      e.dataTransfer.clearData();
    }
  };
  // ----------------------------------------------------

  if (!libsLoaded) {
      return <div className="p-10 text-center">Φόρτωση βιβλιοθηκών...</div>;
  }

  // 🌟 Τυλίγουμε την κύρια περιοχή με τους χειριστές Drag & Drop
  return (
    <div 
      className={`font-sans p-5 bg-gray-100 min-h-screen ${isDragging ? 'border-4 border-dashed border-blue-500 bg-blue-50' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      
      {/* Κεφαλίδα εφαρμογής (Remains the same) */}
      <header className="mb-6 py-4 bg-white shadow-md rounded-lg flex justify-between items-center px-6">
        {/* ... (Header content and Reset Button) ... */}
      </header>
      
      {/* Controls (Export, File Inputs, Font Size) */}
      <div className="mb-6 flex flex-wrap gap-4 bg-white p-4 rounded shadow">
        {/* ... (Export Buttons) ... */}
      </div>

      <div className="flex gap-5 flex-wrap mb-6 bg-white p-4 rounded shadow">
        {/* ... (File Input Template) ... */}
        {/* ... (File Input DOCX) ... */}
        {/* ... (Font Size Control) ... */}
      </div>

      <div className="flex flex-col items-center gap-8">
        {/* Page Rendering (Remains the same) */}
        {/* ... */}
      </div>

      {/* Hidden container for measuring text flow (Remains the same) */}
      <div
        ref={measureRef}
        // ... (styles) ...
      />
      
      {/* 🌟 Οπτική Ένδειξη Drag & Drop 🌟 */}
      {isDragging && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none bg-blue-500 bg-opacity-10 backdrop-blur-sm"
        >
          <p className="text-3xl font-bold text-blue-700 p-8 border-4 border-dashed border-blue-700 rounded-lg">
            Αφήστε τα αρχεία (.docx / image) εδώ!
          </p>
        </div>
      )}

    </div>
  );
}