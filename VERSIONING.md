# Version Management Guide

This document explains how to manage app versions and ensure users get the latest updates.

## How It Works

The application now includes automatic version checking and cache invalidation:

1. **Network-First for HTML**: The app always checks for updated HTML files from the network first
2. **Automatic Update Detection**: Checks for new versions on page load and every 60 seconds
3. **User Notification**: When a new version is available, users are prompted to update
4. **Cache Invalidation**: Old cached assets are automatically removed when a new version is deployed

## Releasing a New Version

When you want to release a new version of the application:

1. **Update the VERSION constant** in `public/sw.js`:
   ```javascript
   const VERSION = '0.0.2'; // Increment this number
   ```

2. **Build and deploy** your application:
   ```bash
   npm run build
   # Deploy the dist/ folder to your hosting service
   ```

3. **User Experience**: 
   - When users visit the app after deployment, it will detect the new service worker
   - They'll see a confirmation dialog: "A new version is available! Click OK to update."
   - Upon confirmation, the app updates and reloads automatically

## Version Numbering

Use semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Incompatible API changes or major features
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

Examples:
- `0.0.1` → `0.0.2` (bug fix)
- `0.0.9` → `0.1.0` (new feature)
- `0.9.0` → `1.0.0` (major release)

## Testing Version Updates Locally

1. Build the app: `npm run build`
2. Serve it: `npm run preview`
3. Open in browser and note the version
4. Change VERSION in `public/sw.js`
5. Rebuild: `npm run build`
6. Refresh the browser - you should see the update prompt

## Cache Strategy

- **HTML files**: Network-first (always checks for updates)
- **JavaScript/CSS**: Cache-first (faster loading, updated with version change)
- **Images**: Cache-first (faster loading, updated with version change)

## Troubleshooting

### Users not seeing updates
- Ensure you incremented the VERSION in `public/sw.js`
- Verify the build includes the updated service worker
- Check browser DevTools → Application → Service Workers

### Force clear cache manually
Users can clear the cache manually if needed:
1. Open DevTools (F12)
2. Go to Application → Storage
3. Click "Clear site data"
4. Refresh the page
