'use client';

import { useState, useRef, useEffect } from 'react';

interface NativeRichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
}

export default function NativeRichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Start writing your chapter...",
  height = 500 
}: NativeRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  // Fixed color palette (now includes White)
  const PALETTE = [
    '#000000', // Black
    '#FFFFFF', // White
    '#DC2626', // Red
    '#16A34A', // Green
    '#2563EB', // Blue
    '#F59E0B', // Orange
    '#7C3AED', // Purple
    '#F43F5E', // Pink/Red
    '#0F766E', // Teal
    '#FDE047', // Yellow
  ];
  // Removed native color inputs in favor of swatches
  // Track selection to avoid losing it when opening color pickers
  const savedSelectionRef = useRef<Range | null>(null);
  // Debounce parent onChange while dragging color pickers
  const debounceTimerRef = useRef<number | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffff00');
  const [isBlockMenuOpen, setIsBlockMenuOpen] = useState(false);
  const [isTextMenuOpen, setIsTextMenuOpen] = useState(false);
  const [isHighlightMenuOpen, setIsHighlightMenuOpen] = useState(false);
  const [isToolbarOpen, setIsToolbarOpen] = useState(true);
  const blockBtnRef = useRef<HTMLButtonElement | null>(null);
  const textBtnRef = useRef<HTMLButtonElement | null>(null);
  const highlightBtnRef = useRef<HTMLButtonElement | null>(null);
  const [blockMenuPos, setBlockMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [textMenuPos, setTextMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [highlightMenuPos, setHighlightMenuPos] = useState<{ top: number; left: number } | null>(null);
  

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string, propagate: boolean = true) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    if (propagate) handleInput();
  };

  const schedulePropagate = (delay = 150) => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      handleInput();
    }, delay);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    const range = savedSelectionRef.current;
    if (sel && range) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  const handleHeading = (tag: string) => {
    if (!tag) return;
    saveSelection();
    restoreSelection();
    document.execCommand('formatBlock', false, tag);
    handleInput();
  };

  const handleTextColor = (color: string) => {
    setTextColor(color);
    // Ensure inline styles are used
    document.execCommand('styleWithCSS', false, 'true');
    restoreSelection();
    execCommand('foreColor', color, false);
    schedulePropagate();
  };

  const handleBgColor = (color: string) => {
    setBgColor(color);
    document.execCommand('styleWithCSS', false, 'true');
    restoreSelection();
    // Prefer hiliteColor when available (better highlight behavior)
    const cmd = document.queryCommandSupported('hiliteColor') ? 'hiliteColor' : 'backColor';
    execCommand(cmd, color, false);
    schedulePropagate();
  };

  

  const handleLink = () => {
    // Preserve current selection before opening modal
    saveSelection();
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setLinkText(selection.toString());
    }
    setIsLinkModalOpen(true);
  };

  const insertLink = () => {
    if (linkUrl) {
      // Ensure URL has protocol
      const normalized = /^(https?:)?\/\//i.test(linkUrl) ? linkUrl : `https://${linkUrl}`;
      // Restore selection where link should be inserted
      restoreSelection();
      const link = `<a href="${normalized}" target="_blank" rel="noopener noreferrer" style="color: #3498db; text-decoration: none;">${linkText || normalized}</a>`;
      execCommand('insertHTML', link);
      // Refocus editor
      editorRef.current?.focus();
    }
    setIsLinkModalOpen(false);
    setLinkUrl('');
    setLinkText('');
  };

  // Make links inside the editor clickable while editing
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a') as HTMLAnchorElement | null;
    if (anchor && anchor.href) {
      e.preventDefault();
      window.open(anchor.href, '_blank', 'noopener');
    }
  };

  const ToolbarButton = ({ onClick, title, children, active = false }: {
    onClick: () => void;
    title: string;
    children: React.ReactNode;
    active?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded hover:bg-gray-100 ${
        active ? 'bg-blue-100' : ''
      }`}
    >
      {children}
    </button>
  );

  // Keep floating dropdowns positioned on scroll/resize
  useEffect(() => {
    const updatePositions = () => {
      if (isBlockMenuOpen && blockBtnRef.current) {
        const r = blockBtnRef.current.getBoundingClientRect();
        setBlockMenuPos({ top: r.bottom + 8, left: r.left });
      }
      if (isTextMenuOpen && textBtnRef.current) {
        const r = textBtnRef.current.getBoundingClientRect();
        setTextMenuPos({ top: r.bottom + 8, left: r.left });
      }
      if (isHighlightMenuOpen && highlightBtnRef.current) {
        const r = highlightBtnRef.current.getBoundingClientRect();
        setHighlightMenuPos({ top: r.bottom + 8, left: r.left });
      }
    };
    window.addEventListener('scroll', updatePositions, true);
    window.addEventListener('resize', updatePositions);
    return () => {
      window.removeEventListener('scroll', updatePositions, true);
      window.removeEventListener('resize', updatePositions);
    };
  }, [isBlockMenuOpen, isTextMenuOpen, isHighlightMenuOpen]);

  return (
    <div className="native-rich-text-editor w-full overflow-hidden">
      {/* Toolbar */}
      {/* Floating toolbar toggle (left side, sticky) */}
      <button
        type="button"
        onClick={() => setIsToolbarOpen(v => !v)}
        title={isToolbarOpen ? 'Hide toolbar' : 'Show toolbar'}
        aria-label={isToolbarOpen ? 'Hide toolbar' : 'Show toolbar'}
        className="fixed left-3 top-52 z-50 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 p-3"
      >
        {isToolbarOpen ? (
          // Minus icon when open
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><rect x="4" y="9" width="12" height="2" rx="1"/></svg>
        ) : (
          // Plus icon when closed
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4h2v12H9z"/><path d="M4 9h12v2H4z"/></svg>
        )}
      </button>
      
      {isToolbarOpen && (
        <div className="fixed left-14 top-36 z-50 bg-gray-50 p-2 sm:p-3 rounded shadow-lg max-w-[90vw] overflow-visible">
        {/* Row 1: Text Formatting */
        }
        <div className="flex flex-wrap gap-1 mb-2">
          <ToolbarButton onClick={() => execCommand('bold')} title="Bold">
            <strong className="text-sm">B</strong>
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('italic')} title="Italic">
            <em className="text-sm">I</em>
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('underline')} title="Underline">
            <u className="text-sm">U</u>
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('strikeThrough')} title="Strikethrough">
            <s className="text-sm">S</s>
          </ToolbarButton>
          
          {/* Format Dropdown */}
          <select
            onChange={(e) => handleHeading(e.target.value)}
            className="px-2 py-1 rounded text-xs sm:text-sm ml-2 bg-white hover:bg-gray-100 focus:outline-none"
            defaultValue=""
          >
            <option value="">Format</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="p">Paragraph</option>
          </select>

          {/* Media & Utility moved next to Format */}
          <div className="flex items-center gap-1 ml-2">
            <ToolbarButton onClick={handleLink} title="Insert Link">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd"/>
              </svg>
            </ToolbarButton>

            {/* Block options menu (alignments & lists) */}
            <div className="relative ml-1">
              <button
                ref={blockBtnRef}
                type="button"
                title="Block Options"
                onClick={() => {
                  const next = !isBlockMenuOpen;
                  setIsBlockMenuOpen(next);
                  if (next && blockBtnRef.current) {
                    const r = blockBtnRef.current.getBoundingClientRect();
                    setBlockMenuPos({ top: r.bottom + 8, left: r.left });
                  }
                }}
                className="p-2 rounded hover:bg-gray-100"
              >
                {/* icon-only compact */}
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 5h14v2H3zM3 9h14v2H3zM3 13h14v2H3z" />
                </svg>
              </button>

              {isBlockMenuOpen && (
                <div className={`absolute left-0 z-20 mt-2 bg-white rounded shadow-lg p-1 flex flex-col ${blockMenuPos ? `top-${blockMenuPos.top} left-${blockMenuPos.left}` : ''}`}>
                  <button
                    type="button"
                    title="Align Left"
                    className="w-full h-8 sm:h-9 hover:bg-gray-100 flex items-center justify-center"
                    onClick={() => { execCommand('justifyLeft'); setIsBlockMenuOpen(false); }}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4h14a1 1 0 010 2H3a1 1 0 010-2zM3 8h10a1 1 0 010 2H3a1 1 0 010-2zM3 12h14a1 1 0 010 2H3a1 1 0 010-2zM3 16h10a1 1 0 010 2H3a1 1 0 010-2z"/></svg>
                  </button>
                  <button
                    type="button"
                    title="Align Center"
                    className="w-full h-8 sm:h-9 hover:bg-gray-100 flex items-center justify-center"
                    onClick={() => { execCommand('justifyCenter'); setIsBlockMenuOpen(false); }}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4h14a1 1 0 010 2H3a1 1 0 010-2zM5 8h10a1 1 0 010 2H5a1 1 0 010-2zM3 12h14a1 1 0 010 2H3a1 1 0 010-2zM5 16h10a1 1 0 010 2H5a1 1 0 010-2z"/></svg>
                  </button>
                  <button
                    type="button"
                    title="Align Right"
                    className="w-full h-8 sm:h-9 hover:bg-gray-100 flex items-center justify-center"
                    onClick={() => { execCommand('justifyRight'); setIsBlockMenuOpen(false); }}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4h14a1 1 0 010 2H3a1 1 0 010-2zM7 8h10a1 1 0 010 2H7a1 1 0 010-2zM3 12h14a1 1 0 010 2H3a1 1 0 010-2zM7 16h10a1 1 0 010 2H7a1 1 0 010-2z"/></svg>
                  </button>
                  <button
                    type="button"
                    title="Bullet List"
                    className="w-full h-8 sm:h-9 hover:bg-gray-100 flex items-center justify-center"
                    onClick={() => { execCommand('insertUnorderedList'); setIsBlockMenuOpen(false); }}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 5a1 1 0 100 2 1 1 0 000-2zM6 6a1 1 0 011-1h10a1 1 0 110 2H7a1 1 0 01-1-1zM3 10a1 1 0 100 2 1 1 0 000-2zM7 11a1 1 0 011-1h10a1 1 0 110 2H8a1 1 0 01-1-1zM3 15a1 1 0 100 2 1 1 0 000-2zM8 16a1 1 0 011-1h10a1 1 0 110 2H9a1 1 0 01-1-1z"/></svg>
                  </button>
                  <button
                    type="button"
                    title="Numbered List"
                    className="w-full h-8 sm:h-9 hover:bg-gray-100 flex items-center justify-center"
                    onClick={() => { execCommand('insertOrderedList'); setIsBlockMenuOpen(false); }}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M3 5h2v1H3zM7 5h10v1H7zM3 10h2v1H3zM7 10h10v1H7zM3 15h2v1H3zM7 15h10v1H7z"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        
        {/* Row 3: Colors (dropdowns) */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Text color dropdown */}
          <div>
            <button
              ref={textBtnRef}
              type="button"
              onClick={() => {
                const next = !isTextMenuOpen;
                setIsTextMenuOpen(next);
                setIsHighlightMenuOpen(false);
                if (next && textBtnRef.current) {
                  const r = textBtnRef.current.getBoundingClientRect();
                  setTextMenuPos({ top: r.bottom + 8, left: r.left });
                }
              }}
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100"
              title="Text Color"
            >
              <span className="text-xs text-gray-700">Text</span>
              <span className="w-4 h-4 rounded" style={{ backgroundColor: textColor }} />
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/></svg>
            </button>
          </div>

          {/* Highlight color dropdown */}
          <div>
            <button
              ref={highlightBtnRef}
              type="button"
              onClick={() => {
                const next = !isHighlightMenuOpen;
                setIsHighlightMenuOpen(next);
                setIsTextMenuOpen(false);
                if (next && highlightBtnRef.current) {
                  const r = highlightBtnRef.current.getBoundingClientRect();
                  setHighlightMenuPos({ top: r.bottom + 8, left: r.left });
                }
              }}
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100"
              title="Highlight Color"
            >
              <span className="text-xs text-gray-700">Highlight</span>
              <span className="w-4 h-4 rounded" style={{ backgroundColor: bgColor }} />
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/></svg>
            </button>
          </div>
        </div>
        </div>
      )}

      {/* Floating dropdowns rendered outside toolbar box */}
      {isBlockMenuOpen && blockMenuPos && (
        <div
          className="fixed z-[9999] bg-white rounded shadow-lg p-1 flex flex-col"
          style={{ top: blockMenuPos.top, left: blockMenuPos.left }}
        >
          <button
            type="button"
            title="Align Left"
            className="w-44 flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100"
            onClick={() => { execCommand('justifyLeft'); setIsBlockMenuOpen(false); }}
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M3 5h10v2H3zM3 9h14v2H3zM3 13h12v2H3z"/></svg>
            <span className="text-sm">Align Left</span>
          </button>
          <button
            type="button"
            title="Align Center"
            className="w-44 flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100"
            onClick={() => { execCommand('justifyCenter'); setIsBlockMenuOpen(false); }}
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5 5h10v2H5zM3 9h14v2H3zM4 13h12v2H4z"/></svg>
            <span className="text-sm">Align Center</span>
          </button>
          <button
            type="button"
            title="Align Right"
            className="w-44 flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100"
            onClick={() => { execCommand('justifyRight'); setIsBlockMenuOpen(false); }}
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7 5h10v2H7zM3 9h14v2H3zM5 13h12v2H5z"/></svg>
            <span className="text-sm">Align Right</span>
          </button>
          <div className="h-px bg-gray-100 my-1" />
          <button
            type="button"
            title="Bulleted List"
            className="w-44 flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100"
            onClick={() => { execCommand('insertUnorderedList'); setIsBlockMenuOpen(false); }}
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6 5h11v2H6zM6 9h11v2H6zM6 13h11v2H6zM3 6.5a1 1 0 112 0 1 1 0 01-2 0zM3 10.5a1 1 0 112 0 1 1 0 01-2 0zM3 14.5a1 1 0 112 0 1 1 0 01-2 0z"/></svg>
            <span className="text-sm">Bulleted List</span>
          </button>
          <button
            type="button"
            title="Numbered List"
            className="w-44 flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100"
            onClick={() => { execCommand('insertOrderedList'); setIsBlockMenuOpen(false); }}
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6 5h11v2H6zM6 9h11v2H6zM6 13h11v2H6z"/><text x="2" y="7" fontSize="6" fill="currentColor">1</text><text x="2" y="11" fontSize="6" fill="currentColor">2</text><text x="2" y="15" fontSize="6" fill="currentColor">3</text></svg>
            <span className="text-sm">Numbered List</span>
          </button>
        </div>
      )}

      {isTextMenuOpen && textMenuPos && (
        <div
          className="fixed z-[9999] bg-white rounded shadow-lg p-2 grid grid-cols-5 md:grid-cols-9 gap-1 w-40 md:w-56"
          style={{ top: textMenuPos.top, left: textMenuPos.left }}
        >
          {PALETTE.map((c) => (
            <button
              key={`fore-dd-${c}`}
              type="button"
              onMouseDown={saveSelection}
              onClick={() => { handleTextColor(c); setIsTextMenuOpen(false); }}
              title={c}
              className={`w-7 h-7 rounded ${(textColor === c) ? 'ring-2 ring-offset-1 ring-blue-400' : ''} ${c.toLowerCase() === '#ffffff' ? 'border border-gray-300' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}

      {isHighlightMenuOpen && highlightMenuPos && (
        <div
          className="fixed z-[9999] bg-white rounded shadow-lg p-2 grid grid-cols-5 md:grid-cols-9 gap-1 w-40 md:w-56"
          style={{ top: highlightMenuPos.top, left: highlightMenuPos.left }}
        >
          {PALETTE.map((c) => (
            <button
              key={`back-dd-${c}`}
              type="button"
              onMouseDown={saveSelection}
              onClick={() => { handleBgColor(c); setIsHighlightMenuOpen(false); }}
              title={c}
              className={`w-7 h-7 rounded ${(bgColor === c) ? 'ring-2 ring-offset-1 ring-blue-400' : ''} ${c.toLowerCase() === '#ffffff' ? 'border border-gray-300' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onClick={handleEditorClick}
        className="p-4 outline-none"
        style={{ 
          minHeight: height,
          fontFamily: 'Georgia, serif',
          fontSize: '16px',
          lineHeight: '1.6'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      

      {/* Link Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Insert Link</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Link Text</label>
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter link text"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">URL</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="https://example.com"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={insertLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        [contenteditable] h1 {
          font-size: 2.5em;
          font-weight: bold;
          margin: 0.5em 0;
          color: #2c3e50;
        }
        
        [contenteditable] h2 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.5em 0;
          color: #34495e;
        }
        
        [contenteditable] h3 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.5em 0;
          color: #34495e;
        }
        

        
        [contenteditable] p {
          margin: 0.5em 0;
        }
        
        [contenteditable] ul, [contenteditable] ol {
          margin: 0.5em 0;
          padding-left: 2em;
        }
        
        [contenteditable] a {
          color: #3498db;
          text-decoration: none;
        }
        
        [contenteditable] a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
