import { useState } from 'react';
import TextField from './fields/TextField';
import NumberField from './fields/NumberField';
import MediaField from './fields/MediaField';
import LinkField from './fields/LinkField';
import ColorField from './fields/ColorField';
import BooleanField from './fields/BooleanField';

const FIELD_COMPONENTS = {
  text: TextField,
  number: NumberField,
  media: MediaField,
  link: LinkField,
  color: ColorField,
  boolean: BooleanField,
};

export default function CollectionEditor({ schema, data, onChange }) {
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);

  function handleCellChange(rowIndex, fieldKey, value) {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [fieldKey]: value };
    onChange(newData);
  }

  function handleAddRow() {
    const newRow = {};
    schema.fields.forEach(field => {
      if (field.type === 'number' && field.key === 'id') {
        newRow[field.key] = data.length > 0 ? Math.max(...data.map(d => d.id || 0)) + 1 : 1;
      } else if (field.type === 'boolean') {
        newRow[field.key] = false;
      } else if (field.type === 'number') {
        newRow[field.key] = 0;
      } else {
        newRow[field.key] = '';
      }
    });
    onChange([...data, newRow]);
  }

  function handleDeleteRow(rowIndex) {
    const newData = data.filter((_, i) => i !== rowIndex);
    onChange(newData);
    setSelectedRow(null);
  }

  function handleMoveRow(rowIndex, direction) {
    const newIndex = rowIndex + direction;
    if (newIndex < 0 || newIndex >= data.length) return;
    
    const newData = [...data];
    const [removed] = newData.splice(rowIndex, 1);
    newData.splice(newIndex, 0, removed);
    onChange(newData);
  }

  return (
    <div className="collection-editor">
      <div className="table-container">
        <table className="cms-table">
          <thead>
            <tr>
              <th className="row-handle-header"></th>
              {schema.fields.map(field => (
                <th key={field.key} className={`col-${field.type}`}>
                  <span className="col-label">{field.label}</span>
                  <span className="col-type">{field.type}</span>
                </th>
              ))}
              <th className="row-actions-header"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr 
                key={rowIndex}
                className={selectedRow === rowIndex ? 'selected' : ''}
                onClick={() => setSelectedRow(rowIndex)}
              >
                <td className="row-handle">
                  <span className="row-number">{rowIndex + 1}</span>
                  <div className="row-drag">
                    <button 
                      className="move-btn"
                      onClick={(e) => { e.stopPropagation(); handleMoveRow(rowIndex, -1); }}
                      disabled={rowIndex === 0}
                    >↑</button>
                    <button 
                      className="move-btn"
                      onClick={(e) => { e.stopPropagation(); handleMoveRow(rowIndex, 1); }}
                      disabled={rowIndex === data.length - 1}
                    >↓</button>
                  </div>
                </td>
                {schema.fields.map(field => {
                  const FieldComponent = FIELD_COMPONENTS[field.type] || TextField;
                  const isSelected = selectedCell?.row === rowIndex && selectedCell?.field === field.key;
                  return (
                    <td 
                      key={field.key}
                      className={`cell cell-${field.type} ${isSelected ? 'editing' : ''}`}
                      onClick={() => setSelectedCell({ row: rowIndex, field: field.key })}
                    >
                      <FieldComponent
                        value={row[field.key]}
                        onChange={(value) => handleCellChange(rowIndex, field.key, value)}
                        isEditing={isSelected}
                        field={field}
                      />
                    </td>
                  );
                })}
                <td className="row-actions">
                  <button 
                    className="delete-btn"
                    onClick={(e) => { e.stopPropagation(); handleDeleteRow(rowIndex); }}
                    title="Delete row"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 3.5L11 11.5M11 3.5L3 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <button className="add-row-btn" onClick={handleAddRow}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Add row
      </button>

      <style>{`
        .collection-editor {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: 0;
        }

        .table-container {
          flex: 1;
          overflow: auto;
        }

        .cms-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .cms-table th {
          position: sticky;
          top: 0;
          background: #f7f6f3;
          border-bottom: 1px solid #e8e8e7;
          padding: 8px 12px;
          text-align: left;
          font-weight: 500;
          color: #37352f;
          z-index: 10;
        }

        .cms-table th .col-label {
          display: block;
        }

        .cms-table th .col-type {
          display: block;
          font-size: 11px;
          font-weight: 400;
          color: #91918e;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          margin-top: 2px;
        }

        .row-handle-header,
        .row-actions-header {
          width: 40px;
        }

        .cms-table td {
          border-bottom: 1px solid #f0f0ef;
          padding: 0;
          vertical-align: top;
        }

        .cms-table tr:hover td {
          background: #fafafa;
        }

        .cms-table tr.selected td {
          background: #f0f7ff;
        }

        .row-handle {
          width: 40px;
          padding: 8px 4px !important;
          text-align: center;
          color: #91918e;
          font-size: 12px;
          position: relative;
        }

        .row-number {
          display: block;
        }

        .row-drag {
          display: none;
          flex-direction: column;
          gap: 2px;
          position: absolute;
          top: 4px;
          left: 4px;
        }

        .row-handle:hover .row-number {
          display: none;
        }

        .row-handle:hover .row-drag {
          display: flex;
        }

        .move-btn {
          width: 20px;
          height: 16px;
          border: none;
          background: #e8e8e7;
          border-radius: 3px;
          cursor: pointer;
          font-size: 10px;
          color: #37352f;
        }

        .move-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .move-btn:hover:not(:disabled) {
          background: #d8d8d7;
        }

        .row-actions {
          width: 40px;
          padding: 8px 4px !important;
          text-align: center;
        }

        .delete-btn {
          opacity: 0;
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          color: #91918e;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.1s, background 0.1s, color 0.1s;
        }

        .cms-table tr:hover .delete-btn {
          opacity: 1;
        }

        .delete-btn:hover {
          background: #fee2e2;
          color: #ef4444;
        }

        .cell {
          min-width: 120px;
          max-width: 300px;
        }

        .cell-text,
        .cell-link {
          min-width: 180px;
        }

        .cell-media {
          min-width: 200px;
        }

        .cell-number {
          min-width: 80px;
          max-width: 120px;
        }

        .cell-color {
          min-width: 100px;
          max-width: 150px;
        }

        .cell-boolean {
          min-width: 80px;
          max-width: 100px;
        }

        .cell.editing {
          box-shadow: inset 0 0 0 2px #2383e2;
        }

        .add-row-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          margin: 8px 16px 16px;
          border: 1px dashed #d8d8d7;
          background: transparent;
          border-radius: 4px;
          font-size: 14px;
          color: #91918e;
          cursor: pointer;
          transition: background 0.1s, border-color 0.1s, color 0.1s;
        }

        .add-row-btn:hover {
          background: #f7f6f3;
          border-color: #91918e;
          color: #37352f;
        }
      `}</style>
    </div>
  );
}

