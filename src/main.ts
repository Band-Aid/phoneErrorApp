import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')

if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js')
			.then(registration => {
				// Check for updates every time the page loads
				registration.update()
				
				// Check for updates periodically (every 60 seconds)
				setInterval(() => {
					registration.update()
				}, 60000)
				
				// Listen for new service worker waiting
				registration.addEventListener('updatefound', () => {
					const newWorker = registration.installing
					if (newWorker) {
						newWorker.addEventListener('statechange', () => {
							if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
								// New service worker available, prompt user to update
								if (confirm('A new version is available! Click OK to update.')) {
									newWorker.postMessage({ type: 'SKIP_WAITING' })
									// Reload the page after the new service worker activates
									navigator.serviceWorker.addEventListener('controllerchange', () => {
										window.location.reload()
									})
								}
							}
						})
					}
				})
			})
			.catch(() => {})
	})
}
