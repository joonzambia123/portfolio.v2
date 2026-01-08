import { useState, useRef, useEffect } from 'react';

export default function NumberField({ value, onChange, isEditing }) {
  const [localValue, setLocalValue] = useState(value ?? '');
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalValue(value ?? '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  function handleBlur() {
    const numValue = localValue === '' ? 0 : parseFloat(localValue);
    if (numValue !== value) {
      onChange(isNaN(numValue) ? 0 : numValue);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.target.blur();
    }
    if (e.key === 'Escape') {
      setLocalValue(value ?? '');
      e.target.blur();
    }
  }

  return (
    <div className="field-number">
      <input
        ref={inputRef}
        type="number"
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="0"
      />
      <style>{`
        .field-number {
          width: 100%;
          height: 100%;
        }
        .field-number input {
          width: 100%;
          padding: 8px 12px;
          border: none;
          background: transparent;
          font-size: 14px;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
          color: #37352f;
          text-align: right;
        }
        .field-number input:focus {
          outline: none;
          background: #ffffff;
        }
        .field-number input::placeholder {
          color: #c8c8c8;
        }
        /* Hide number spinners */
        .field-number input::-webkit-outer-spin-button,
        .field-number input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .field-number input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}

