import React, { useState, useRef, useEffect } from "react";

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

// -------------------- Draggable & Resizable Box --------------------
function DraggableResizableBox({ x, y, width, height, onUpdate, children, disabled, hideBorder }) {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const start = useRef({});

    const enabled = !disabled && !hideBorder;

    useEffect(() => {
        const move = (e) => {
            const dx = e.clientX - start.current.x;
            const dy = e.clientY - start.current.y;

            if (isDragging) {
                onUpdate({
                    x: start.current.ix + dx,
                    y: start.current.iy + dy,
                    width: start.current.w,
                    height: start.current.h
                });
            }
            if (isResizing) {
                onUpdate({
                    x: start.current.ix,
                    y: start.current.iy,
                    width: Math.max(100, start.current.w + dx),
                    height: Math.max(100, start.current.h + dy)
                });
            }
        };
        const up = () => {
            setIsDragging(false);
            setIsResizing(false);
        };
        if (isDragging || isResizing) {
            window.addEventListener("mousemove", move);
            window.addEventListener("mouseup", up);
        }
        return () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
        };
    }, [isDragging, isResizing, onUpdate]);

    return (
        <div
            style={{
                position: "absolute",
                left: x,
                top: y,
                width,
                height,
                border: hideBorder ? "none" : "2px dashed #999",
                cursor: enabled ? "move" : "default",
                zIndex: 10
            }}
            onMouseDown={(e) => {
                if (!enabled || e.target.closest(".resize-handle")) return;
                setIsDragging(true);
                start.current = { x: e.clientX, y: e.clientY, ix: x, iy: y, w: width, h: height };
            }}
        >
            {children}
            {enabled && (
                <div
                    className="resize-handle"
                    style={{
                        position: "absolute",
                        right: -6,
                        bottom: -6,
                        width: 16,
                        height: 16,
                        background: "#3b82f6",
                        borderRadius: "50%",
                        cursor: "nwse-resize"
                    }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        setIsResizing(true);
                        start.current = { x: e.clientX, y: e.clientY, ix: x, iy: y, w: width, h: height };
                    }}
                />
            )}
        </div>
    );
}

// -------------------- MAIN COMPONENT --------------------
export default function A4WordComposer() {
    const [template, setTemplate] = useState(null);
    const [docHtml, setDocHtml] = useState("");
    const [fontSize, setFontSize] = useState(16);
    const [pages, setPages] = useState([]);
    const [box, setBox] = useState({ x: 80, y: 120, width: 630, height: 850 });
    const [isExporting, setIsExporting] = useState(false);
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const [libsLoaded, setLibsLoaded] = useState(false);
    const [templateFileName, setTemplateFileName] = useState("Επιλέξτε εικόνα...");
    const [docFileName, setDocFileName] = useState("Επιλέξτε .docx...");
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const measureRef = useRef(null);

    // -------------------- LOAD LIBS --------------------
    useEffect(() => {
        const libs = [
            "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js",
            "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
            "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
        ];
        let loaded = 0;
        libs.forEach(src => {
            const s = document.createElement("script");
            s.src = src;
            s.onload = () => { loaded++; if (loaded === libs.length) setLibsLoaded(true); };
            document.body.appendChild(s);
        });
        const resize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);

    // -------------------- FILE HANDLERS (FIX) --------------------
    const handleTemplateFile = (file) => {
        if (!file || !file.type.startsWith("image/")) return;
        setTemplateFileName(file.name);
        const r = new FileReader();
        r.onload = () => setTemplate(r.result);
        r.readAsDataURL(file);
    };

    const handleDocFile = async (file) => {
        if (!file || !file.name.endsWith(".docx")) return;
        setDocFileName(file.name);
        const buf = await file.arrayBuffer();
        const res = await window.mammoth.convertToHtml({ arrayBuffer: buf });
        setDocHtml(res.value);
    };

    // -------------------- DRAG & DROP --------------------
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDraggingFile(false);
        const file = e.dataTransfer.files[0];
        if (!file) return;
        if (file.type.startsWith("image/")) handleTemplateFile(file);
        else if (file.name.endsWith(".docx")) handleDocFile(file);
    };

    // -------------------- PAGINATION --------------------
    useEffect(() => {
        if (!docHtml || !measureRef.current) {
            setPages([]);
            return;
        }
        const c = measureRef.current;
        c.innerHTML = docHtml;
        c.style.fontSize = fontSize + "px";
        c.style.width = box.width + "px";

        const nodes = Array.from(c.children);
        let pagesArr = [];
        let rest = [...nodes];

        while (rest.length) {
            c.innerHTML = "";
            let page = [];
            let i = 0;
            for (; i < rest.length; i++) {
                c.appendChild(rest[i].cloneNode(true));
                if (c.scrollHeight <= box.height) page.push(rest[i].outerHTML);
                else break;
            }
            pagesArr.push(page.join(""));
            rest = rest.slice(i);
            if (i === 0) break;
        }
        setPages(pagesArr);
    }, [docHtml, fontSize, box]);

    // -------------------- PDF --------------------
    const getPDF = async () => {
        setIsExporting(true);
        await new Promise(r => setTimeout(r, 200));
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("p", "mm", "a4");
        const els = document.querySelectorAll(".a4-page");
        for (let i = 0; i < els.length; i++) {
            const canvas = await window.html2canvas(els[i], { scale: 2 });
            if (i > 0) pdf.addPage();
            pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 210, 297);
        }
        setIsExporting(false);
        return pdf;
    };

    if (!libsLoaded) return <div className="p-10 text-center">Φόρτωση…</div>;

    // -------------------- UI --------------------
    return (
        <div
            className="p-4 bg-gray-100 min-h-screen"
            onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
            onDragLeave={() => setIsDraggingFile(false)}
            onDrop={handleDrop}
        >

            {isDraggingFile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-500 bg-opacity-20 border-4 border-dashed border-blue-500">
                    <h2 className="text-2xl font-bold bg-white p-6 rounded-xl">Ρίξτε το αρχείο εδώ</h2>
                </div>
            )}

            <header className="bg-white p-4 rounded-xl shadow mb-4 flex gap-2">
                <input type="file" hidden id="img" accept="image/*" onChange={e => handleTemplateFile(e.target.files[0])} />
                <label htmlFor="img" className="border-2 border-dashed p-2 rounded cursor-pointer text-xs">
                    🖼️ {templateFileName}
                </label>

                <input type="file" hidden id="doc" accept=".docx" onChange={e => handleDocFile(e.target.files[0])} />
                <label htmlFor="doc" className="border-2 border-dashed p-2 rounded cursor-pointer text-xs">
                    📄 {docFileName}
                </label>

                <button
                    onClick={async () => (await getPDF()).save("document.pdf")}
                    disabled={!pages.length || isExporting}
                    className="ml-auto bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Download PDF
                </button>
            </header>

            <div className="flex flex-col items-center gap-10">
                {pages.map((html, i) => (
                    <div
                        key={i}
                        className="relative bg-white shadow-2xl a4-page"
                        style={{ width: A4_WIDTH, height: A4_HEIGHT }}
                    >
                        {template && (
                            <img src={template} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        )}

                        <DraggableResizableBox
                            x={box.x}
                            y={box.y}
                            width={box.width}
                            height={box.height}
                            onUpdate={setBox}
                            disabled={i > 0 || isMobile}
                            hideBorder={isExporting}
                        >
                            <div
                                style={{ fontSize, lineHeight: 1.4 }}
                                dangerouslySetInnerHTML={{ __html: html }}
                            />
                        </DraggableResizableBox>
                    </div>
                ))}
            </div>

            <div ref={measureRef} style={{ position: "absolute", visibility: "hidden" }} />
        </div>
    );
}
