import { useState, useRef, useEffect } from 'react';

export default function LinkField({ value, onChange, isEditing }) {
  const [localValue, setLocalValue] = useState(value || '');
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalValue(value || '');
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

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.target.blur();
    }
    if (e.key === 'Escape') {
      setLocalValue(value || '');
      e.target.blur();
    }
  }

  const isValidUrl = localValue && (localValue.startsWith('http://') || localValue.startsWith('https://'));

  return (
    <div className="field-link">
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="https://"
      />
      {isValidUrl && (
        <a 
          href={localValue} 
          target="_blank" 
          rel="noopener noreferrer"
          className="link-open"
          onClick={e => e.stopPropagation()}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M11 7.5V11.5C11 11.7652 10.8946 12.0196 10.7071 12.2071C10.5196 12.3946 10.2652 12.5 10 12.5H2.5C2.23478 12.5 1.98043 12.3946 1.79289 12.2071C1.60536 12.0196 1.5 11.7652 1.5 11.5V4C1.5 3.73478 1.60536 3.48043 1.79289 3.29289C1.98043 3.10536 2.23478 3 2.5 3H6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 1.5H12.5V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5.5 8.5L12.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      )}
      <style>{`
        .field-link {
          display: flex;
          align-items: center;
          width: 100%;
          height: 100%;
        }
        .field-link input {
          flex: 1;
          min-width: 0;
          padding: 8px 12px;
          border: none;
          background: transparent;
          font-size: 14px;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
          color: #2383e2;
        }
        .field-link input:focus {
          outline: none;
          background: #ffffff;
          color: #37352f;
        }
        .field-link input::placeholder {
          color: #c8c8c8;
        }
        .link-open {
          padding: 4px 8px;
          color: #91918e;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 3px;
          transition: background 0.1s, color 0.1s;
        }
        .link-open:hover {
          background: #efefee;
          color: #2383e2;
        }
      `}</style>
    </div>
  );
}

