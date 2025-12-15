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

  // Text box – configured ONLY on the first page
  const [box, setBox] = useState({ x: 80, y: 120, width: 630, height: 850 });
  const measureRef = useRef(null);
  
  // Ref για τον καθαρισμό των input files
  const templateInputRef = useRef(null);
  const docInputRef = useRef(null);

  // Load external libraries dynamically via CDN (Remains the same)
  useEffect(() => {
    // ... (Implementation remains the same)
  }, []);
  
  // handleTemplate and handleDoc remain the same

  function handleTemplate(e) {
    const file = e.target.files && e.target.files[0];
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
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
        const buffer = await file.arrayBuffer();
        const result = await window.mammoth.convertToHtml({ arrayBuffer: buffer });
        setDocHtml(result.value || "");
    } catch (error) {
      console.error("Error converting DOCX:", error);
    }
  }

  // --- ΝΕΑ ΣΥΝΑΡΤΗΣΗ ΚΑΘΑΡΙΣΜΟΥ ---
  function handleReset() {
    // Καθαρισμός των States
    setTemplate(null);
    setDocHtml("");
    setPages([]);
    setFontSize(16);
    // Επαναφορά των input fields για να μπορέσουν να φορτωθούν τα ίδια αρχεία ξανά
    if (templateInputRef.current) templateInputRef.current.value = null;
    if (docInputRef.current) docInputRef.current.value = null;
  }

  // Pagination Logic (Remains the same, but should include the content splitting logic from the previous reply)
  useEffect(() => {
    // ... (The complex pagination and text splitting logic goes here, exactly as provided previously)
  }, [docHtml, fontSize, box.width, box.height]);

  // exportPDF and exportImages remain the same

  async function exportPDF() { /* ... */ }
  async function exportImages(type) { /* ... */ }

  if (!libsLoaded) {
      return <div className="p-10 text-center">Φόρτωση βιβλιοθηκών...</div>;
  }

  return (
    <div className="font-sans p-5 bg-gray-100 min-h-screen">
      
      {/* 🌟 ΚΕΦΑΛΙΔΑ ΕΦΑΡΜΟΓΗΣ 🌟 */}
      <header className="mb-6 py-4 bg-white shadow-md rounded-lg flex justify-between items-center px-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          📝 A4 Document Composer
        </h1>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-150 flex items-center gap-2 text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Καθαρισμός / Επαναφορά
        </button>
      </header>
      {/* --------------------------- */}
      
      <div className="mb-6 flex flex-wrap gap-4 bg-white p-4 rounded shadow">
        {/* Export Buttons (Remains the same) */}
        {/* ... */}
      </div>

      <div className="flex gap-5 flex-wrap mb-6 bg-white p-4 rounded shadow">
        <label className="flex flex-col gap-1 text-sm font-medium">
          📄 Επιλογή template (JPEG/PNG)
          <input 
             type="file" 
             accept="image/*" 
             onChange={handleTemplate} 
             className="text-gray-600"
             ref={templateInputRef} // <-- Σύνδεση με το Ref
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          📝 Επιλογή Word (.docx)
          <input 
             type="file" 
             accept=".docx" 
             onChange={handleDoc} 
             className="text-gray-600"
             ref={docInputRef} // <-- Σύνδεση με το Ref
          />
        </label>
        {/* Font Size Control (Remains the same) */}
        {/* ... */}
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
    </div>
  );
}