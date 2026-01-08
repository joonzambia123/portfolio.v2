export default function BooleanField({ value, onChange }) {
  function handleToggle() {
    onChange(!value);
  }

  return (
    <div className="field-boolean">
      <button 
        className={`toggle ${value ? 'active' : ''}`}
        onClick={handleToggle}
        type="button"
      >
        <span className="toggle-knob" />
      </button>
      <span className="toggle-label">{value ? 'Yes' : 'No'}</span>
      <style>{`
        .field-boolean {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          height: 100%;
          padding: 8px 12px;
        }
        .toggle {
          width: 36px;
          height: 20px;
          border-radius: 10px;
          border: none;
          background: #d8d8d7;
          cursor: pointer;
          position: relative;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .toggle.active {
          background: #2383e2;
        }
        .toggle-knob {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
          transition: transform 0.2s;
        }
        .toggle.active .toggle-knob {
          transform: translateX(16px);
        }
        .toggle-label {
          font-size: 13px;
          color: #91918e;
        }
      `}</style>
    </div>
  );
}

