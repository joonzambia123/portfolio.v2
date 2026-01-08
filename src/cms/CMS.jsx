import { useState, useEffect } from 'react';
import CollectionEditor from './CollectionEditor';
import NewCollectionModal from './NewCollectionModal';

const API_BASE = 'http://localhost:3001/api';

export default function CMS() {
  const [collections, setCollections] = useState([]);
  const [schemas, setSchemas] = useState({});
  const [activeCollection, setActiveCollection] = useState(null);
  const [collectionData, setCollectionData] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [deployStatus, setDeployStatus] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [gitHasChanges, setGitHasChanges] = useState(false);

  // Load collections and schemas on mount
  useEffect(() => {
    loadCollections();
    loadSchemas();
    checkGitStatus();
  }, []);

  // Load collection data when active collection changes
  useEffect(() => {
    if (activeCollection) {
      loadCollectionData(activeCollection);
    }
  }, [activeCollection]);

  async function loadCollections() {
    try {
      const res = await fetch(`${API_BASE}/collections`);
      const { collections } = await res.json();
      setCollections(collections);
      if (collections.length > 0 && !activeCollection) {
        setActiveCollection(collections[0]);
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  }

  async function loadSchemas() {
    try {
      const res = await fetch(`${API_BASE}/schemas`);
      const data = await res.json();
      setSchemas(data);
    } catch (error) {
      console.error('Failed to load schemas:', error);
    }
  }

  async function loadCollectionData(name) {
    try {
      const res = await fetch(`${API_BASE}/collections/${name}`);
      const { data } = await res.json();
      setCollectionData(data || []);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to load collection data:', error);
    }
  }

  async function checkGitStatus() {
    try {
      const res = await fetch(`${API_BASE}/git-status`);
      const { hasChanges } = await res.json();
      setGitHasChanges(hasChanges);
    } catch (error) {
      console.error('Failed to check git status:', error);
    }
  }

  async function handleSave() {
    if (!activeCollection) return;
    setSaveStatus('saving');
    try {
      await fetch(`${API_BASE}/collections/${activeCollection}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: collectionData }),
      });
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
      checkGitStatus();
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to save:', error);
    }
  }

  async function handleDeploy() {
    setDeployStatus('deploying');
    try {
      const res = await fetch(`${API_BASE}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `CMS: Update ${activeCollection}` }),
      });
      const result = await res.json();
      if (result.success) {
        setDeployStatus('deployed');
        setGitHasChanges(false);
      } else {
        setDeployStatus('error');
      }
      setTimeout(() => setDeployStatus(''), 3000);
    } catch (error) {
      setDeployStatus('error');
      console.error('Failed to deploy:', error);
    }
  }

  async function handleCreateCollection(name, displayName, fields) {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    
    // Save schema
    const newSchemas = {
      ...schemas,
      [slug]: {
        name: displayName,
        description: '',
        fields: fields,
      },
    };
    
    await fetch(`${API_BASE}/schemas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSchemas),
    });
    
    // Create empty collection
    await fetch(`${API_BASE}/collections/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [] }),
    });
    
    setSchemas(newSchemas);
    await loadCollections();
    setActiveCollection(slug);
    setShowNewModal(false);
  }

  function handleDataChange(newData) {
    setCollectionData(newData);
    setHasUnsavedChanges(true);
    setSaveStatus('');
  }

  const currentSchema = schemas[activeCollection];

  return (
    <div className="cms-container">
      {/* Sidebar */}
      <aside className="cms-sidebar">
        <div className="cms-sidebar-header">
          <h1>CMS</h1>
        </div>
        <nav className="cms-nav">
          <div className="cms-nav-section">
            <span className="cms-nav-label">Collections</span>
            {collections.map((col) => (
              <button
                key={col}
                className={`cms-nav-item ${activeCollection === col ? 'active' : ''}`}
                onClick={() => setActiveCollection(col)}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="2" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="6" y1="6" x2="6" y2="14" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                {schemas[col]?.name || col}
              </button>
            ))}
          </div>
          <button className="cms-nav-add" onClick={() => setShowNewModal(true)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            New Collection
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="cms-main">
        {activeCollection && currentSchema ? (
          <>
            <header className="cms-header">
              <div className="cms-header-left">
                <h2>{currentSchema.name}</h2>
                {currentSchema.description && (
                  <p className="cms-header-desc">{currentSchema.description}</p>
                )}
              </div>
              <div className="cms-header-actions">
                {hasUnsavedChanges && (
                  <span className="cms-unsaved-indicator">Unsaved changes</span>
                )}
                {saveStatus === 'saved' && (
                  <span className="cms-save-indicator">Saved ✓</span>
                )}
                <button 
                  className="cms-btn cms-btn-secondary"
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || saveStatus === 'saving'}
                >
                  {saveStatus === 'saving' ? 'Saving...' : 'Save'}
                </button>
                <button 
                  className="cms-btn cms-btn-primary"
                  onClick={handleDeploy}
                  disabled={deployStatus === 'deploying' || (!gitHasChanges && !hasUnsavedChanges)}
                >
                  {deployStatus === 'deploying' ? 'Deploying...' : 
                   deployStatus === 'deployed' ? 'Deployed ✓' : 'Deploy'}
                </button>
              </div>
            </header>
            <CollectionEditor
              schema={currentSchema}
              data={collectionData}
              onChange={handleDataChange}
            />
          </>
        ) : (
          <div className="cms-empty">
            <p>Select a collection from the sidebar or create a new one.</p>
          </div>
        )}
      </main>

      {showNewModal && (
        <NewCollectionModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreateCollection}
        />
      )}

      <style>{`
        .cms-container {
          display: flex;
          min-height: 100vh;
          background: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .cms-sidebar {
          width: 260px;
          background: #fbfbfa;
          border-right: 1px solid #e8e8e7;
          display: flex;
          flex-direction: column;
        }

        .cms-sidebar-header {
          padding: 16px 20px;
          border-bottom: 1px solid #e8e8e7;
        }

        .cms-sidebar-header h1 {
          font-size: 14px;
          font-weight: 600;
          color: #37352f;
          letter-spacing: -0.01em;
        }

        .cms-nav {
          flex: 1;
          padding: 12px 8px;
          display: flex;
          flex-direction: column;
        }

        .cms-nav-section {
          flex: 1;
        }

        .cms-nav-label {
          display: block;
          padding: 4px 12px 8px;
          font-size: 11px;
          font-weight: 500;
          color: #91918e;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .cms-nav-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border: none;
          background: transparent;
          border-radius: 4px;
          font-size: 14px;
          color: #37352f;
          cursor: pointer;
          text-align: left;
          transition: background 0.1s;
        }

        .cms-nav-item:hover {
          background: #efefee;
        }

        .cms-nav-item.active {
          background: #efefee;
        }

        .cms-nav-item svg {
          color: #91918e;
        }

        .cms-nav-add {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border: none;
          background: transparent;
          border-radius: 4px;
          font-size: 14px;
          color: #91918e;
          cursor: pointer;
          transition: background 0.1s, color 0.1s;
        }

        .cms-nav-add:hover {
          background: #efefee;
          color: #37352f;
        }

        .cms-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .cms-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid #e8e8e7;
        }

        .cms-header h2 {
          font-size: 18px;
          font-weight: 600;
          color: #37352f;
        }

        .cms-header-desc {
          font-size: 13px;
          color: #91918e;
          margin-top: 2px;
        }

        .cms-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cms-unsaved-indicator {
          font-size: 13px;
          color: #eb5757;
        }

        .cms-save-indicator {
          font-size: 13px;
          color: #0f7b6c;
        }

        .cms-btn {
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.1s, opacity 0.1s;
        }

        .cms-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .cms-btn-secondary {
          background: #ffffff;
          border: 1px solid #e8e8e7;
          color: #37352f;
        }

        .cms-btn-secondary:hover:not(:disabled) {
          background: #f7f7f7;
        }

        .cms-btn-primary {
          background: #2383e2;
          border: 1px solid #2383e2;
          color: #ffffff;
        }

        .cms-btn-primary:hover:not(:disabled) {
          background: #0077d4;
        }

        .cms-empty {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #91918e;
        }
      `}</style>
    </div>
  );
}

