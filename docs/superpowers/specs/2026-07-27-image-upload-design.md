# Image Upload — Design Spec

## Overview
Add file upload support to the platform. Users can upload images via drag & drop or file picker. Uploaded images are stored on the local filesystem and served via Express static middleware. The avatar URL input in Settings is replaced with an UploadDropzone component.

## Backend

### Dependencies
- `multer` — multipart form parsing
- `uuid` — unique filenames

### Storage
- Root: `server/uploads/`
- Subdirs: `avatars/`, `posts/`, `content/`
- Filename: `{uuid}-{sanitized-original-name}`
- Max file size: 10MB
- Allowed types: image/jpeg, image/png, image/gif, image/webp, image/svg+xml

### API

#### `POST /api/upload`
- Auth: verifyToken
- Body: multipart/form-data with field `file` (the image) and optional `type` (subdirectory hint: 'avatar'|'post'|'content', defaults to 'content')
- Response 200: `{ url: '/uploads/{type}/{filename}' }`
- Response 413: file too large
- Response 415: invalid file type

#### `DELETE /api/upload/:filename`
- Auth: verifyToken
- Deletes file from disk
- Response 200: `{ message: 'Deleted' }`

### Static serving
- In `server/src/index.js`, add `app.use('/uploads', express.static('uploads'))` after helmet config (with appropriate crossOriginOpenerPolicy for images).

### Middleware
- `multer` config with disk storage, filename via `uuid`, file filter for image types
- Error handling for multer limits (file size, unexpected field)

## Frontend

### `UploadDropzone` component
Location: `packages/ui/src/UploadDropzone.jsx`

Props:
- `type` — subdirectory hint ('avatar'|'post'|'content')
- `onUpload` — callback `(url: string) => void`
- `accept` — accept string (defaults to image types)
- `className` — optional class override
- `children` — optional custom trigger content

States:
- Default: shows drop zone or click-to-browse
- Uploading: shows progress indicator
- Success: shows preview with URL
- Error: shows error message

Implementation:
- Hidden file input triggered by click on the drop zone
- `onDragOver`/`onDrop` handlers for drag & drop
- `onChange` on file input triggers `POST /api/upload` via `FormData`
- Returns the URL via `onUpload` callback

### Settings avatar integration
- Replace the current avatar URL input + preview with `UploadDropzone type="avatar"`
- On upload success, immediately save the avatar URL via the existing profile update API
- Show the new avatar immediately

### Icon
- Uses existing Nerd Font icons for upload/cloud-upload

## Migration
No database changes needed. Uploaded files are not tracked in the database — URLs are stored in existing `avatar_url` fields and content bodies.

## Rollout
- Feature can be tested immediately after adding the route and installing deps
- Backward compatible: existing URL-based avatars continue to work
