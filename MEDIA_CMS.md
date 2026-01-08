# Visual CMS

A locally-hosted, Notion-style content management system for your portfolio.

## Quick Start

```bash
# Start both the dev server and CMS
npm run cms

# Then open http://localhost:5173/cms in your browser
```

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   CMS UI        │────▶│   CMS Server    │────▶│   JSON Files    │
│  /cms route     │     │   :3001         │     │   cms-data/     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │  React Components│
                                                │  (imports JSON)  │
                                                └─────────────────┘
```

## Collections

Data is organized into **collections** stored as JSON files in `cms-data/`:

| Collection | File | Description |
|------------|------|-------------|
| Homepage Media | `homepage-media.json` | Videos displayed on the homepage |

## Managing Content

### Editing Content
1. Run `npm run cms`
2. Navigate to `/cms`
3. Select a collection from the sidebar
4. Click any cell to edit inline
5. Click **Save** to persist changes locally
6. Click **Deploy** to push to GitHub (triggers Netlify auto-deploy)

### Adding a New Row
Click the **+ Add row** button at the bottom of the table.

### Deleting a Row
Hover over a row and click the **×** button on the right.

### Reordering Rows
Hover over the row number to reveal up/down arrows for reordering.

## Creating New Collections

1. Click **+ New Collection** in the sidebar
2. Enter a name (e.g., "Projects")
3. Define your fields:
   - **Text**: Plain text input
   - **Number**: Numeric values
   - **Media**: File paths with preview
   - **Link**: URLs with open button
   - **Color**: Color picker with hex input
   - **Toggle**: Boolean on/off switch
4. Click **Create Collection**

## Deployment

The CMS includes a **Deploy** button that:
1. Stages changes in `cms-data/`
2. Commits with message "CMS: Update [collection-name]"
3. Pushes to your GitHub repository
4. Netlify automatically deploys on push

### Prerequisites
- Git repository initialized
- Remote origin configured
- SSH keys or credentials set up

## File Structure

```
cms-data/
├── _schemas.json          # Field definitions for all collections
├── homepage-media.json    # Homepage video data
└── [your-collection].json # Your custom collections

cms-server/
├── index.js               # Express API server
└── git.js                 # Git operations helper

src/cms/
├── CMS.jsx                # Main CMS page
├── CollectionEditor.jsx   # Spreadsheet editor
├── NewCollectionModal.jsx # Collection creation modal
└── fields/                # Field type components
    ├── TextField.jsx
    ├── NumberField.jsx
    ├── MediaField.jsx
    ├── LinkField.jsx
    ├── ColorField.jsx
    └── BooleanField.jsx
```

## Using CMS Data in Components

Import JSON directly in your React components:

```jsx
import homepageMedia from '../cms-data/homepage-media.json';

// Access the data array
const videos = homepageMedia.data;
```

Vite hot-reloads when JSON files change, so you'll see updates immediately.

## API Reference

The CMS server runs on port 3001 with these endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/collections` | List all collections |
| GET | `/api/collections/:name` | Get collection data |
| POST | `/api/collections/:name` | Save collection data |
| DELETE | `/api/collections/:name` | Delete a collection |
| GET | `/api/schemas` | Get all schemas |
| POST | `/api/schemas` | Save schemas |
| POST | `/api/deploy` | Git commit & push |
| GET | `/api/git-status` | Check for uncommitted changes |

## Troubleshooting

### CMS page shows blank
Make sure both servers are running: `npm run cms`

### Deploy fails
- Check that git is configured with `git status`
- Ensure you have push access to the remote
- Check for uncommitted changes outside `cms-data/`

### Changes not appearing
- Click **Save** before **Deploy**
- Refresh the page to reload JSON data

---

For questions or issues, check the server logs in your terminal.
