// =============================================
// SPOTIFY DOWNLOADER - MAIN SCRIPT
// =============================================

class SpotifyDownloader {
    constructor() {
        // Initialize all DOM elements
        this.initializeElements();
        
        // Initialize state variables
        this.initializeState();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize the app
        this.initializeApp();
    }
    
    // =============================================
    // INITIALIZATION METHODS
    // =============================================
    
    initializeElements() {
        // View containers
        this.viewInput = document.getElementById('view-input');
        this.viewLoading = document.getElementById('view-loading');
        this.viewResult = document.getElementById('view-result');
        this.viewError = document.getElementById('view-error');
        
        // Input elements
        this.urlInput = document.getElementById('spotifyUrl');
        this.searchBtn = document.getElementById('searchBtn');
        this.clearBtn = document.getElementById('clearBtn');
        
        // Loading elements
        this.loadingTitle = document.getElementById('loadingTitle');
        this.loadingSubtitle = document.getElementById('loadingSubtitle');
        this.progressBar = document.getElementById('progressBar');
        
        // Result elements
        this.albumArt = document.getElementById('albumArt');
        this.trackTitle = document.getElementById('trackTitle');
        this.artistName = document.getElementById('artistName');
        this.durationTxt = document.getElementById('durationTxt');
        this.sizeTxt = document.getElementById('sizeTxt');
        this.fileSize = document.getElementById('fileSize');
        
        // Action buttons
        this.finalDownloadBtn = document.getElementById('finalDownloadBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.playPreviewBtn = document.getElementById('playPreviewBtn');
        this.shareBtn = document.getElementById('shareBtn');
        this.retryBtn = document.getElementById('retryBtn');
        
        // Error elements
        this.errorTitle = document.getElementById('errorTitle');
        this.errorMessage = document.getElementById('errorMessage');
        
        // Audio element for preview
        this.previewAudio = document.getElementById('previewAudio');
        
        // All views array
        this.views = [this.viewInput, this.viewLoading, this.viewResult, this.viewError];
    }
    
    initializeState() {
        this.currentView = 'input';
        this.currentTrackData = null;
        this.currentDownloadUrl = '';
        this.currentFileName = '';
        this.isProcessing = false;
        this.progressInterval = null;
        
        // API endpoint configuration
        this.apiConfig = {
            endpoint: '/api',
            timeout: 30000,
            retries: 3,
            retryDelay: 1000
        };
    }
    
    setupEventListeners() {
        // Input view events
        this.searchBtn.addEventListener('click', () => this.processTrack());
        this.clearBtn.addEventListener('click', () => this.clearInput());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.processTrack();
        });
        this.urlInput.addEventListener('input', () => this.validateInput());
        
        // Result view events
        this.finalDownloadBtn.addEventListener('click', (e) => this.downloadTrack(e));
        this.resetBtn.addEventListener('click', () => this.resetToInput());
        this.playPreviewBtn.addEventListener('click', () => this.previewTrack());
        this.shareBtn.addEventListener('click', () => this.shareTrack());
        
        // Error view events
        this.retryBtn.addEventListener('click', () => this.showView('input'));
        
        // Audio events
        this.previewAudio.addEventListener('ended', () => {
            this.playPreviewBtn.innerHTML = '<i class="fas fa-play-circle"></i> Preview';
        });
        
        // Window events
        window.addEventListener('online', () => this.handleOnlineStatus());
        window.addEventListener('offline', () => this.handleOfflineStatus());
        window.addEventListener('beforeunload', (e) => this.handleBeforeUnload(e));
    }
    
    initializeApp() {
        // Check online status
        if (!navigator.onLine) {
            this.showError('No Internet Connection', 'Please check your internet connection and try again.');
            return;
        }
        
        // Auto-focus input on load
        setTimeout(() => {
            this.urlInput.focus();
        }, 500);
        
        // Show initial view
        this.showView('input');
        
        // Load any saved data from localStorage
        this.loadSavedData();
    }
    
    // =============================================
    // VIEW MANAGEMENT
    // =============================================
    
    showView(viewName) {
        // Hide all views
        this.views.forEach(view => {
            view.classList.remove('active-view');
            view.style.display = 'none';
        });
        
        // Show selected view
        switch(viewName) {
            case 'input':
                this.viewInput.classList.add('active-view');
                this.viewInput.style.display = 'block';
                this.currentView = 'input';
                break;
                
            case 'loading':
                this.viewLoading.classList.add('active-view');
                this.viewLoading.style.display = 'block';
                this.currentView = 'loading';
                break;
                
            case 'result':
                this.viewResult.classList.add('active-view');
                this.viewResult.style.display = 'block';
                this.currentView = 'result';
                break;
                
            case 'error':
                this.viewError.classList.add('active-view');
                this.viewError.style.display = 'block';
                this.currentView = 'error';
                break;
        }
        
        // Update URL without page reload
        this.updateUrlState(viewName);
    }
    
    updateUrlState(viewName) {
        const url = new URL(window.location);
        url.searchParams.set('view', viewName);
        window.history.replaceState({}, '', url);
    }
    
    // =============================================
    // INPUT VALIDATION
    // =============================================
    
    validateInput() {
        const url = this.urlInput.value.trim();
        const isValid = this.isValidSpotifyUrl(url);
        
        // Update button state
        this.searchBtn.disabled = !isValid || !url;
        this.clearBtn.style.visibility = url ? 'visible' : 'hidden';
        
        // Visual feedback
        if (url && !isValid) {
            this.urlInput.style.borderColor = '#ff4757';
        } else {
            this.urlInput.style.borderColor = '';
        }
        
        return isValid;
    }
    
    isValidSpotifyUrl(url) {
        if (!url) return false;
        
        const patterns = [
            // Track URLs
            /^(https?:\/\/)?(open\.spotify\.com\/track\/[a-zA-Z0-9]{22})(\?.*)?$/,
            /^(https?:\/\/)?(spotify\.link\/[a-zA-Z0-9]+)$/,
            
            // Album URLs
            /^(https?:\/\/)?(open\.spotify\.com\/album\/[a-zA-Z0-9]{22})(\?.*)?$/,
            
            // Playlist URLs
            /^(https?:\/\/)?(open\.spotify\.com\/playlist\/[a-zA-Z0-9]{22})(\?.*)?$/,
            
            // Artist URLs
            /^(https?:\/\/)?(open\.spotify\.com\/artist\/[a-zA-Z0-9]{22})(\?.*)?$/
        ];
        
        return patterns.some(pattern => pattern.test(url.trim()));
    }
    
    clearInput() {
        this.urlInput.value = '';
        this.urlInput.focus();
        this.validateInput();
        this.showNotification('Input cleared', 'info');
    }
    
    // =============================================
    // TRACK PROCESSING
    // =============================================
    
    async processTrack() {
        const url = this.urlInput.value.trim();
        
        // Validate input
        if (!url) {
            this.showNotification('Please enter a Spotify URL', 'error');
            this.urlInput.focus();
            return;
        }
        
        if (!this.isValidSpotifyUrl(url)) {
            this.showNotification('Invalid Spotify URL format', 'error');
            this.urlInput.focus();
            return;
        }
        
        // Check if already processing
        if (this.isProcessing) {
            this.showNotification('Already processing a track', 'info');
            return;
        }
        
        this.isProcessing = true;
        this.showView('loading');
        this.startProgressAnimation();
        
        try {
            // Step 1: Initial validation
            this.updateLoadingState('Validating URL', 'Checking Spotify link format...', 20);
            await this.delay(800);
            
            // Step 2: Fetch track data from API
            this.updateLoadingState('Fetching track info', 'Connecting to Spotify...', 40);
            
            const trackData = await this.fetchTrackData(url);
            
            // Step 3: Process data
            this.updateLoadingState('Processing audio', 'Preparing download link...', 70);
            await this.delay(1000);
            
            // Step 4: Complete
            this.updateLoadingState('Ready to download', 'Track processed successfully!', 100);
            await this.delay(500);
            
            // Display result
            this.displayTrackInfo(trackData);
            this.showView('result');
            
            // Save to history
            this.saveToHistory(trackData);
            
        } catch (error) {
            console.error('Process error:', error);
            this.handleProcessError(error);
        } finally {
            this.isProcessing = false;
            this.stopProgressAnimation();
        }
    }
    
    async fetchTrackData(url, retryCount = 0) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.apiConfig.timeout);
            
            const response = await fetch(this.apiConfig.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ url }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.status) {
                throw new Error(data.error || data.message || 'Failed to process track');
            }
            
            return data;
            
        } catch (error) {
            // Retry logic
            if (retryCount < this.apiConfig.retries && error.name !== 'AbortError') {
                this.updateLoadingState(
                    `Retrying... (${retryCount + 1}/${this.apiConfig.retries})`,
                    'Connection issue, retrying...',
                    40
                );
                
                await this.delay(this.apiConfig.retryDelay);
                return this.fetchTrackData(url, retryCount + 1);
            }
            
            throw error;
        }
    }
    
    updateLoadingState(title, subtitle, progress) {
        if (this.loadingTitle) this.loadingTitle.textContent = title;
        if (this.loadingSubtitle) this.loadingSubtitle.textContent = subtitle;
        if (this.progressBar) this.progressBar.style.width = `${progress}%`;
    }
    
    startProgressAnimation() {
        let progress = 0;
        this.progressInterval = setInterval(() => {
            if (progress < 90) {
                progress += 0.5;
                this.progressBar.style.width = `${progress}%`;
            }
        }, 100);
    }
    
    stopProgressAnimation() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }
    
    // =============================================
    // DISPLAY TRACK INFO
    // =============================================
    
    displayTrackInfo(data) {
        this.currentTrackData = data;
        this.currentDownloadUrl = data.download_url;
        
        // Set track info
        this.trackTitle.textContent = data.title || 'Unknown Track';
        this.artistName.textContent = data.artist || 'Unknown Artist';
        
        // Set album art with fallback
        if (data.cover && data.cover !== 'https://via.placeholder.com/300?text=No+Cover') {
            this.albumArt.src = data.cover;
            this.albumArt.onerror = () => {
                this.albumArt.src = 'https://via.placeholder.com/200/1DB954/FFFFFF?text=No+Cover';
            };
        }
        
        // Set metadata
        if (data.duration) {
            this.durationTxt.textContent = this.formatDuration(data.duration);
        }
        
        if (data.size) {
            this.sizeTxt.textContent = data.size;
            this.fileSize.textContent = data.size;
        }
        
        // Generate filename
        this.currentFileName = this.generateFileName(data);
        
        // Enable download button
        this.finalDownloadBtn.disabled = false;
    }
    
    formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return '--:--';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    generateFileName(data) {
        const safeTitle = (data.title || 'track')
            .replace(/[^a-z0-9]/gi, '_')
            .substring(0, 50);
            
        const safeArtist = (data.artist || 'artist')
            .replace(/[^a-z0-9]/gi, '_')
            .substring(0, 30);
            
        return `${safeArtist}_-_${safeTitle}.mp3`
            .replace(/^_+\s*-\s*_+/, 'spotify_track')
            .replace(/_+/g, '_')
            .toLowerCase();
    }
    
    // =============================================
    // DOWNLOAD FUNCTIONALITY
    // =============================================
    
    async downloadTrack(e) {
        if (e) e.preventDefault();
        
        if (!this.currentDownloadUrl) {
            this.showNotification('Download URL not available', 'error');
            return;
        }
        
        // Disable button during download
        const originalContent = this.finalDownloadBtn.innerHTML;
        this.finalDownloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
        this.finalDownloadBtn.disabled = true;
        
        try {
            // Verify the download link is accessible
            const headResponse = await fetch(this.currentDownloadUrl, { method: 'HEAD' });
            
            if (!headResponse.ok) {
                throw new Error('Download link expired or invalid');
            }
            
            // Get file size for progress indication
            const contentLength = headResponse.headers.get('content-length');
            const fileSizeMB = contentLength ? `(${(contentLength / (1024 * 1024)).toFixed(1)} MB)` : '';
            
            // Create download link
            const link = document.createElement('a');
            link.href = this.currentDownloadUrl;
            link.download = this.currentFileName;
            link.style.display = 'none';
            
            // Add to DOM and trigger download
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                this.finalDownloadBtn.innerHTML = originalContent;
                this.finalDownloadBtn.disabled = false;
                
                // Show success notification
                this.showNotification(
                    `Download started: ${this.currentFileName} ${fileSizeMB}`,
                    'success'
                );
                
                // Track download in history
                this.trackDownload(this.currentFileName);
                
            }, 1000);
            
        } catch (error) {
            console.error('Download error:', error);
            
            // Restore button state
            this.finalDownloadBtn.innerHTML = originalContent;
            this.finalDownloadBtn.disabled = false;
            
            // Show error
            this.showNotification('Download failed. Link may be expired.', 'error');
            
            // Option to retry
            if (confirm('Download failed. Would you like to try processing the track again?')) {
                this.resetToInput();
            }
        }
    }
    
    previewTrack() {
        if (!this.currentDownloadUrl) {
            this.showNotification('No track available for preview', 'error');
            return;
        }
        
        const button = this.playPreviewBtn;
        
        if (this.previewAudio.src !== this.currentDownloadUrl) {
            this.previewAudio.src = this.currentDownloadUrl;
            this.previewAudio.load();
        }
        
        if (this.previewAudio.paused) {
            this.previewAudio.play()
                .then(() => {
                    button.innerHTML = '<i class="fas fa-pause-circle"></i> Pause';
                    this.showNotification('Playing preview...', 'info');
                })
                .catch(error => {
                    console.error('Playback error:', error);
                    this.showNotification('Cannot play preview. Download instead.', 'error');
                });
        } else {
            this.previewAudio.pause();
            button.innerHTML = '<i class="fas fa-play-circle"></i> Preview';
        }
    }
    
    shareTrack() {
        if (!this.currentTrackData) {
            this.showNotification('No track to share', 'error');
            return;
        }
        
        const shareData = {
            title: `${this.currentTrackData.title} - ${this.currentTrackData.artist}`,
            text: `Check out this track: ${this.currentTrackData.title} by ${this.currentTrackData.artist}`,
            url: window.location.href
        };
        
        if (navigator.share && navigator.canShare(shareData)) {
            navigator.share(shareData)
                .then(() => this.showNotification('Track shared successfully', 'success'))
                .catch(error => {
                    if (error.name !== 'AbortError') {
                        this.copyToClipboard();
                    }
                });
        } else {
            this.copyToClipboard();
        }
    }
    
    copyToClipboard() {
        const text = `${this.currentTrackData.title} - ${this.currentTrackData.artist}\nDownload: ${window.location.href}`;
        
        navigator.clipboard.writeText(text)
            .then(() => this.showNotification('Link copied to clipboard', 'success'))
            .catch(() => this.showNotification('Failed to copy to clipboard', 'error'));
    }
    
    // =============================================
    // ERROR HANDLING
    // =============================================
    
    handleProcessError(error) {
        console.error('Process error details:', error);
        
        let title = 'Processing Error';
        let message = 'An error occurred while processing the track.';
        
        if (error.name === 'AbortError') {
            title = 'Request Timeout';
            message = 'The request took too long. Please check your internet connection and try again.';
        } else if (error.message.includes('Failed to fetch')) {
            title = 'Network Error';
            message = 'Unable to connect to the server. Please check your internet connection.';
        } else if (error.message.includes('Invalid Spotify URL')) {
            title = 'Invalid URL';
            message = 'Please provide a valid Spotify track, album, or playlist URL.';
        } else if (error.message.includes('HTTP')) {
            title = 'Server Error';
            message = 'The server encountered an error. Please try again later.';
        }
        
        this.showError(title, message);
    }
    
    showError(title, message) {
        this.errorTitle.textContent = title;
        this.errorMessage.textContent = message;
        this.showView('error');
        this.showNotification(message, 'error');
    }
    
    // =============================================
    // STATE MANAGEMENT
    // =============================================
    
    resetToInput() {
        // Reset all states
        this.currentTrackData = null;
        this.currentDownloadUrl = '';
        this.currentFileName = '';
        this.isProcessing = false;
        
        // Stop any audio playback
        this.previewAudio.pause();
        this.previewAudio.src = '';
        this.playPreviewBtn.innerHTML = '<i class="fas fa-play-circle"></i> Preview';
        
        // Clear input and focus
        this.urlInput.value = '';
        this.validateInput();
        
        // Show input view
        this.showView('input');
        this.urlInput.focus();
        
        this.showNotification('Ready for new download', 'info');
    }
    
    loadSavedData() {
        try {
            const savedHistory = localStorage.getItem('spotifyDownloaderHistory');
            if (savedHistory) {
                const history = JSON.parse(savedHistory);
                console.log('Loaded history:', history.length, 'items');
            }
        } catch (error) {
            console.warn('Failed to load saved data:', error);
        }
    }
    
    saveToHistory(trackData) {
        try {
            const historyItem = {
                title: trackData.title,
                artist: trackData.artist,
                timestamp: new Date().toISOString(),
                url: trackData.download_url
            };
            
            let history = JSON.parse(localStorage.getItem('spotifyDownloaderHistory') || '[]');
            history.unshift(historyItem);
            history = history.slice(0, 50); // Keep last 50 items
            
            localStorage.setItem('spotifyDownloaderHistory', JSON.stringify(history));
        } catch (error) {
            console.warn('Failed to save to history:', error);
        }
    }
    
    trackDownload(filename) {
        try {
            let downloads = JSON.parse(localStorage.getItem('spotifyDownloaderDownloads') || '[]');
            downloads.unshift({
                filename,
                timestamp: new Date().toISOString()
            });
            downloads = downloads.slice(0, 100); // Keep last 100 downloads
            
            localStorage.setItem('spotifyDownloaderDownloads', JSON.stringify(downloads));
        } catch (error) {
            console.warn('Failed to track download:', error);
        }
    }
    
    // =============================================
    // UTILITY METHODS
    // =============================================
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    showNotification(message, type = 'info') {
        // Remove any existing notification
        const existingNotification = document.querySelector('.notification-toast');
        if (existingNotification) existingNotification.remove();
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification-toast notification-${type}`;
        
        // Set icon based on type
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff4757' : type === 'success' ? '#1DB954' : '#2d3436'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease;
            max-width: 350px;
        `;
        
        // Add close button event
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.onclick = () => notification.remove();
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
        
        // Add animation keyframes
        if (!document.querySelector('#notification-animations')) {
            const style = document.createElement('style');
            style.id = 'notification-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // =============================================
    // NETWORK STATUS HANDLING
    // =============================================
    
    handleOnlineStatus() {
        this.showNotification('You are back online', 'success');
        if (this.currentView === 'error') {
            this.showView('input');
        }
    }
    
    handleOfflineStatus() {
        this.showNotification('You are offline. Some features may not work.', 'warning');
    }
    
    handleBeforeUnload(e) {
        if (this.isProcessing) {
            e.preventDefault();
            e.returnValue = 'You are currently processing a track. Are you sure you want to leave?';
            return e.returnValue;
        }
    }
    
    // =============================================
    // PUBLIC METHODS
    // =============================================
    
    getCurrentTrack() {
        return this.currentTrackData;
    }
    
    getDownloadUrl() {
        return this.currentDownloadUrl;
    }
    
    isCurrentlyProcessing() {
        return this.isProcessing;
    }
}

// =============================================
// INITIALIZE APPLICATION
// =============================================

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    window.spotifyDownloader = new SpotifyDownloader();
    
    // Add service worker for PWA support (optional)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    }
    
    // Add offline detection
    if (!navigator.onLine) {
        document.body.classList.add('offline');
        window.spotifyDownloader.showNotification('You are currently offline', 'warning');
    }
});

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpotifyDownloader;
}