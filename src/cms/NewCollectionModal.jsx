import { useState } from 'react';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'media', label: 'Media' },
  { value: 'link', label: 'Link' },
  { value: 'color', label: 'Color' },
  { value: 'boolean', label: 'Toggle' },
];

export default function NewCollectionModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [fields, setFields] = useState([
    { key: 'id', label: 'ID', type: 'number', required: true },
  ]);

  function handleAddField() {
    const newKey = `field_${fields.length}`;
    setFields([...fields, { key: newKey, label: '', type: 'text', required: false }]);
  }

  function handleFieldChange(index, updates) {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    // Auto-generate key from label
    if (updates.label !== undefined) {
      newFields[index].key = updates.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }
    setFields(newFields);
  }

  function handleRemoveField(index) {
    if (index === 0) return; // Don't remove ID field
    setFields(fields.filter((_, i) => i !== index));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name, name, fields);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>New Collection</h3>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Collection Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Projects, Team Members"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Fields</label>
              <div className="fields-list">
                {fields.map((field, index) => (
                  <div key={index} className="field-row">
                    <input
                      type="text"
                      value={field.label}
                      onChange={e => handleFieldChange(index, { label: e.target.value })}
                      placeholder="Field label"
                      disabled={index === 0}
                      className="field-label-input"
                    />
                    <select
                      value={field.type}
                      onChange={e => handleFieldChange(index, { type: e.target.value })}
                      disabled={index === 0}
                      className="field-type-select"
                    >
                      {FIELD_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <label className="field-required">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={e => handleFieldChange(index, { required: e.target.checked })}
                        disabled={index === 0}
                      />
                      Required
                    </label>
                    {index > 0 && (
                      <button 
                        type="button" 
                        className="field-remove"
                        onClick={() => handleRemoveField(index)}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3 3.5L11 11.5M11 3.5L3 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" className="add-field-btn" onClick={handleAddField}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Add Field
              </button>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-create" disabled={!name.trim()}>
              Create Collection
            </button>
          </div>
        </form>

        <style>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal {
            background: #ffffff;
            border-radius: 8px;
            width: 100%;
            max-width: 520px;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          }

          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid #e8e8e7;
          }

          .modal-header h3 {
            font-size: 16px;
            font-weight: 600;
            color: #37352f;
          }

          .modal-close {
            width: 28px;
            height: 28px;
            border: none;
            background: transparent;
            border-radius: 4px;
            cursor: pointer;
            color: #91918e;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .modal-close:hover {
            background: #efefee;
            color: #37352f;
          }

          .modal-body {
            padding: 20px;
            overflow-y: auto;
          }

          .form-group {
            margin-bottom: 20px;
          }

          .form-group:last-child {
            margin-bottom: 0;
          }

          .form-group > label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: #37352f;
            margin-bottom: 8px;
          }

          .form-group > input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #e8e8e7;
            border-radius: 4px;
            font-size: 14px;
            color: #37352f;
          }

          .form-group > input:focus {
            outline: none;
            border-color: #2383e2;
            box-shadow: 0 0 0 3px rgba(35, 131, 226, 0.1);
          }

          .fields-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 12px;
          }

          .field-row {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .field-label-input {
            flex: 1;
            padding: 6px 10px;
            border: 1px solid #e8e8e7;
            border-radius: 4px;
            font-size: 13px;
          }

          .field-label-input:focus {
            outline: none;
            border-color: #2383e2;
          }

          .field-label-input:disabled {
            background: #f7f6f3;
            color: #91918e;
          }

          .field-type-select {
            width: 100px;
            padding: 6px 8px;
            border: 1px solid #e8e8e7;
            border-radius: 4px;
            font-size: 13px;
            background: #ffffff;
          }

          .field-type-select:disabled {
            background: #f7f6f3;
            color: #91918e;
          }

          .field-required {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #91918e;
            white-space: nowrap;
          }

          .field-required input {
            margin: 0;
          }

          .field-remove {
            width: 28px;
            height: 28px;
            border: none;
            background: transparent;
            border-radius: 4px;
            cursor: pointer;
            color: #91918e;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .field-remove:hover {
            background: #fee2e2;
            color: #ef4444;
          }

          .add-field-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border: 1px dashed #d8d8d7;
            background: transparent;
            border-radius: 4px;
            font-size: 13px;
            color: #91918e;
            cursor: pointer;
          }

          .add-field-btn:hover {
            background: #f7f6f3;
            border-color: #91918e;
            color: #37352f;
          }

          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 16px 20px;
            border-top: 1px solid #e8e8e7;
          }

          .btn-cancel,
          .btn-create {
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
          }

          .btn-cancel {
            background: #ffffff;
            border: 1px solid #e8e8e7;
            color: #37352f;
          }

          .btn-cancel:hover {
            background: #f7f7f7;
          }

          .btn-create {
            background: #2383e2;
            border: 1px solid #2383e2;
            color: #ffffff;
          }

          .btn-create:hover:not(:disabled) {
            background: #0077d4;
          }

          .btn-create:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </div>
  );
}

