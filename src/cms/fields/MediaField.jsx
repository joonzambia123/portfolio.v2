import { useState, useRef, useEffect } from 'react';

export default function MediaField({ value, onChange, isEditing }) {
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

  const isVideo = localValue && (localValue.endsWith('.mp4') || localValue.endsWith('.m4v') || localValue.endsWith('.webm'));
  const isImage = localValue && (localValue.endsWith('.jpg') || localValue.endsWith('.jpeg') || localValue.endsWith('.png') || localValue.endsWith('.gif') || localValue.endsWith('.webp'));

  return (
    <div className="field-media">
      <div className="media-preview">
        {isVideo && (
          <video src={localValue} muted playsInline />
        )}
        {isImage && (
          <img src={localValue} alt="" />
        )}
        {!isVideo && !isImage && localValue && (
          <div className="media-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4.66669 6.66667L8.00002 10L11.3334 6.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 10V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="/path/to/file"
      />
      <style>{`
        .field-media {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          height: 100%;
          padding: 4px 8px;
        }
        .media-preview {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          background: #f7f6f3;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }
        .media-preview video,
        .media-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .media-icon {
          color: #91918e;
        }
        .field-media input {
          flex: 1;
          min-width: 0;
          padding: 4px 8px;
          border: none;
          background: transparent;
          font-size: 13px;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
          color: #37352f;
        }
        .field-media input:focus {
          outline: none;
          background: #ffffff;
          border-radius: 3px;
        }
        .field-media input::placeholder {
          color: #c8c8c8;
        }
      `}</style>
    </div>
  );
}

