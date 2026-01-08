import { useState, useRef, useEffect } from 'react';

export default function TextField({ value, onChange, isEditing }) {
  const [localValue, setLocalValue] = useState(value || '');
  const textareaRef = useRef(null);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [localValue]);

  function handleBlur() {
    if (localValue !== value) {
      onChange(localValue);
    }
  }

  function handleKeyDown(e) {
    // Cmd/Ctrl + Enter to save and blur
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.target.blur();
    }
    if (e.key === 'Escape') {
      setLocalValue(value || '');
      e.target.blur();
    }
  }

  return (
    <div className="field-text">
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="—"
        rows={1}
      />
      <style>{`
        .field-text {
          width: 100%;
          height: 100%;
        }
        .field-text textarea {
          width: 100%;
          min-height: 32px;
          padding: 8px 12px;
          border: none;
          background: transparent;
          font-size: 14px;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
          color: #37352f;
          resize: none;
          overflow: hidden;
          line-height: 1.5;
        }
        .field-text textarea:focus {
          outline: none;
          background: #ffffff;
        }
        .field-text textarea::placeholder {
          color: #c8c8c8;
        }
      `}</style>
    </div>
  );
}
