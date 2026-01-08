import { useState, useRef, useEffect } from 'react';

export default function ColorField({ value, onChange, isEditing }) {
  const [localValue, setLocalValue] = useState(value || '#000000');
  const inputRef = useRef(null);
  const colorRef = useRef(null);

  useEffect(() => {
    setLocalValue(value || '#000000');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  function handleBlur() {
    if (localValue !== value) {
      onChange(localValue);
    }
  }

  function handleColorChange(e) {
    setLocalValue(e.target.value);
    onChange(e.target.value);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.target.blur();
    }
    if (e.key === 'Escape') {
      setLocalValue(value || '#000000');
      e.target.blur();
    }
  }

  return (
    <div className="field-color">
      <div 
        className="color-swatch"
        style={{ backgroundColor: localValue }}
        onClick={() => colorRef.current?.click()}
      >
        <input
          ref={colorRef}
          type="color"
          value={localValue}
          onChange={handleColorChange}
        />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="#000000"
      />
      <style>{`
        .field-color {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          height: 100%;
          padding: 4px 8px;
        }
        .color-swatch {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          cursor: pointer;
          position: relative;
          flex-shrink: 0;
        }
        .color-swatch input[type="color"] {
          position: absolute;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
        .field-color > input[type="text"] {
          flex: 1;
          min-width: 0;
          padding: 4px 8px;
          border: none;
          background: transparent;
          font-size: 13px;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
          color: #37352f;
          text-transform: uppercase;
        }
        .field-color > input[type="text"]:focus {
          outline: none;
          background: #ffffff;
          border-radius: 3px;
        }
        .field-color > input[type="text"]::placeholder {
          color: #c8c8c8;
        }
      `}</style>
    </div>
  );
}

