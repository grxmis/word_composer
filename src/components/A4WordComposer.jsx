import React, { useState, useRef, useEffect } from "react";

// A4 size at 96 DPI
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

// --- Draggable & Resizable Box ---
function DraggableResizableBox({ x, y, width, height, onUpdate, children, disabled }) {
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const start = useRef({});

  useEffect(() => {
    const move = (e) => {
      if (disabled) return;

      if (dragging) {
        onUpdate({
          x: start.current.x + (e.clientX - start.current.mx),
          y: start.current.y + (e.clientY - start.current.my),
          width: start.current.w,
          height: start.current.h
        });
      }

      if (resizing) {
        onUpdate({
          x: start.current.x,
          y: start.current.y,
          width: Math.max(100, start.current.w + (e.clientX - start.current.mx)),
          height: Math.max(100, start.current.h + (e.clientY - start.current.my))
        });
      }
    };

    const up = () => {
      setDragging(false);
      setResizing(false);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [dragging, resizing, disabled, onUpdate]);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        border: disabled ? "none" : "2px dashed #999",
        cursor: "move",
        zIndex: 10
      }}
      onMouseDown={(e) => {
        if (e.target.classList.contains("resize")) return;
        setDragging(true);
        start.current = { x, y, w: width, h: height, mx: e.clientX, my: e.clientY };
      }}
    >
      {children}
      {!disabled && (
        <div
          className="resize"
          onMouseDown={(e) => {
            e.stopPropagation();
            setResizing(true);
            start.current = { x, y, w: width, h: height, mx: e.clientX, my: e.clientY };
          }}
          style={{
            position: "absolute",
            right: -6,
            bottom: -6,
            width: 16,
            height: 16,
            background: "#2563eb",
            borderRadius: "50%",
            cursor: "nwse-resize"
          }}
        />
      )}
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function A4WordComposer() {
  const [template, setTemplate] = useState(null);
  const [docHtml, setDocHtml] = useState("");
  const [pages, setPages] = useState([]);
  const [fontSize, setFontSize] = useState(16);
  const [isExporting, setIsExporting] = useState(false);
  const [libsLoaded, setLibsLoaded] = useState(false);

  const [box, setBox] = useState({ x: 80, y: 120, width: 630, height: 850 });
  const measureRef = useRef(null);

  // Load libraries
  useEffect(() => {
    const libs = [
      "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
    ];
    let count = 0;
    libs.forEach(src => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => {
        count++;
        if (count === libs.length) setLibsLoaded(true);
      };
      document.body.appendChild(s);
    });
  }, []);

  async function handleDoc(e) {
    const file = e.target.files[0];
    const buffer = await file.arrayBuffer();
    const result = await window.mammoth.convertToHtml({ arrayBuffer: buffer });
    setDocHtml(result.value);
  }

  function handleTemplate(e) {
    const file = e.target.files[0];
    const r = new FileReader();
    r.onload = () => setTemplate(r.result);
    r.readAsDataURL(file);
  }

  // Pagination
  useEffect(() => {
    if (!docHtml || !measureRef.current) return;

    const container = measureRef.current;
    container.innerHTML = docHtml;
    container.style.width = box.width + "px";
    container.style.fontSize = fontSize + "px";
    container.style.lineHeight = "1.4";

    const nodes = Array.from(container.children);
    const result = [];
    let page = [];

    container.innerHTML = "";
    nodes.forEach(el => {
      const clone = el.cloneNode(true);
      container.appendChild(clone);
      if (container.scrollHeight > box.height) {
        container.removeChild(clone);
        result.push(page.map(n => n.outerHTML).join(""));
        page = [];
        container.innerHTML = "";
        container.appendChild(clone);
      }
      page.push(clone);
    });
    if (page.length) result.push(page.map(n => n.outerHTML).join(""));
    setPages(result);
  }, [docHtml, fontSize, box]);

  // ===== EXPORT PDF =====
  async function exportPDF() {
    setIsExporting(true);
    const pdf = new window.jspdf.jsPDF("p", "mm", "a4");
    const els = document.querySelectorAll(".a4-page");

    for (let i = 0; i < els.length; i++) {
      await new Promise(r => setTimeout(r, 300));

      const canvas = await window.html2canvas(els[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      });

      const img = canvas.toDataURL("image/jpeg", 1.0);
      if (i > 0) pdf.addPage();
      pdf.addImage(img, "JPEG", 0, 0, 210, 297);
    }

    pdf.save("document.pdf");
    setIsExporting(false);
  }

  // ===== EXPORT PNG / JPEG =====
  async function exportImage(type) {
    setIsExporting(true);
    const els = document.querySelectorAll(".a4-page");

    for (let i = 0; i < els.length; i++) {
      await new Promise(r => setTimeout(r, 300));

      const canvas = await window.html2canvas(els[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      });

      const url = canvas.toDataURL(`image/${type}`, 1.0);
      const a = document.createElement("a");
      a.href = url;
      a.download = `page_${i + 1}.${type}`;
      a.click();
    }
    setIsExporting(false);
  }

  if (!libsLoaded) return <div>Φόρτωση…</div>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="mb-4 flex gap-2">
        <input type="file" accept=".docx" onChange={handleDoc} />
        <input type="file" accept="image/*" onChange={handleTemplate} />
        <button onClick={exportPDF}>📄 PDF</button>
        <button onClick={() => exportImage("png")}>🖼 PNG</button>
        <button onClick={() => exportImage("jpeg")}>🖼 JPEG</button>
      </div>

      {pages.map((html, i) => (
        <div
          key={i}
          className="a4-page shadow mb-10"
          style={{
            width: A4_WIDTH,
            height: A4_HEIGHT,
            backgroundImage: template ? `url(${template})` : "white",
            backgroundSize: "cover",
            position: "relative"
          }}
        >
          {i === 0 ? (
            <DraggableResizableBox {...box} onUpdate={setBox}>
              <div
                style={{ fontSize, lineHeight: 1.4 }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </DraggableResizableBox>
          ) : (
            <div
              style={{
                position: "absolute",
                left: box.x,
                top: box.y,
                width: box.width,
                height: box.height,
                fontSize,
                lineHeight: 1.4
              }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      ))}

      <div ref={measureRef} style={{ position: "absolute", visibility: "hidden" }} />
    </div>
  );
}
