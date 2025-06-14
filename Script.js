// DOM Elements
const audioPlayer = document.getElementById('audioPlayer');
const playlistElement = document.getElementById('playlist');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const progressBar = document.getElementById('progressBar');
const progress = document.getElementById('progress');
const currentTimeDisplay = document.getElementById('currentTime');
const durationDisplay = document.getElementById('duration');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const volumeControl = document.getElementById('volume');
const repeatBtn = document.getElementById('repeatBtn');
const favoriteBtn = document.getElementById('favoriteBtn');
const lyricsBtn = document.getElementById('lyricsBtn');
const lyricsContainer = document.getElementById('lyricsContainer');
const lyricsContent = document.getElementById('lyricsContent');
const shufflePlaylistBtn = document.getElementById('shufflePlaylistBtn');
const playlistToggle = document.getElementById('playlistToggle');
const playlistContainer = document.getElementById('playlistContainer');
const selectFolderBtn = document.getElementById('selectFolderBtn');
const folderInfo = document.getElementById('folderInfo');
const themeSwitcher = document.getElementById('themeSwitcher');
const speedBtn = document.getElementById('speedBtn');
const speedOptions = document.getElementById('speedOptions');

// Player state
let playlist = [];
let currentTrackIndex = 0;
let isPlaying = false;
let isRepeat = false;
let isShuffled = false;
let playbackRate = 1;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let currentTheme = localStorage.getItem('theme') || 'dark';

// Initialize
function init() {
    setTheme(currentTheme);
    updateFavoritesUI();
    setupEventListeners();
    
    // Display creator info in console
    console.log('%cMade by %cAkash Kumar Utwani', 'color: #aaa; font-size: 12px;', 'color: #6c5ce7; font-weight: bold; font-size: 14px;');
}

// Event Listeners
function setupEventListeners() {
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', playPrevious);
    nextBtn.addEventListener('click', playNext);
    shufflePlaylistBtn.addEventListener('click', toggleShuffle);
    repeatBtn.addEventListener('click', toggleRepeat);
    playlistToggle.addEventListener('click', togglePlaylistVisibility);
    progressBar.addEventListener('click', seek);
    volumeControl.addEventListener('input', setVolume);
    favoriteBtn.addEventListener('click', toggleFavorite);
    lyricsBtn.addEventListener('click', toggleLyrics);
    themeSwitcher.addEventListener('click', toggleTheme);
    selectFolderBtn.addEventListener('click', selectMusicFiles);
    speedBtn.addEventListener('click', toggleSpeedOptions);
    
    document.querySelectorAll('.speed-option').forEach(option => {
        option.addEventListener('click', () => {
            setPlaybackSpeed(parseFloat(option.dataset.speed));
            speedOptions.classList.remove('show');
        });
    });
    
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', handleSongEnd);
    audioPlayer.addEventListener('loadedmetadata', updateDuration);
}

function togglePlaylistVisibility() {
    playlistContainer.classList.toggle('show');
}

function toggleShuffle() {
    isShuffled = !isShuffled;
    shufflePlaylistBtn.classList.toggle('active', isShuffled);
    if (isShuffled) shufflePlaylist();
}

function shufflePlaylist() {
    if (playlist.length === 0) return;
    
    for (let i = playlist.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
    }
    
    currentTrackIndex = playlist.findIndex(track => track.url === audioPlayer.src);
    renderPlaylist();
}

function selectMusicFiles() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'audio/*';
    
    input.onchange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            addToPlaylist(files);
            folderInfo.textContent = `Loaded ${files.length} songs`;
            if (playlist.length > 0 && !isPlaying) {
                currentTrackIndex = 0;
                loadTrack(currentTrackIndex);
            }
        }
    };
    
    input.click();
}

function addToPlaylist(files) {
    files.forEach(file => {
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        let artist = "Unknown Artist";
        let title = fileName;
        
        const separators = [" - ", "_", "–", "•"];
        for (const sep of separators) {
            if (fileName.includes(sep)) {
                const parts = fileName.split(sep);
                if (parts.length > 1) {
                    artist = parts[0].trim();
                    title = parts.slice(1).join(sep).trim();
                    break;
                }
            }
        }
        
        playlist.push({
            file: file,
            name: title,
            url: URL.createObjectURL(file),
            artist: artist
        });
    });
    renderPlaylist();
}

function renderPlaylist() {
    playlistElement.innerHTML = '';
    playlist.forEach((track, index) => {
        const songItem = document.createElement('div');
        songItem.className = `song-item ${index === currentTrackIndex ? 'active' : ''}`;
        songItem.setAttribute('data-index', index);
        songItem.innerHTML = `
            <div class="song-number">${index + 1}</div>
            <div class="song-info">
                <div class="song-title">${track.name}</div>
                <div class="song-artist">${track.artist}</div>
            </div>
            <div class="song-duration">-:--</div>
        `;
        songItem.addEventListener('click', () => {
            currentTrackIndex = index;
            loadTrack(currentTrackIndex);
            if (!isPlaying) togglePlay();
        });
        playlistElement.appendChild(songItem);
    });
}

function loadTrack(index) {
    if (playlist.length === 0) return;
    
    const track = playlist[index];
    audioPlayer.src = track.url;
    trackTitle.textContent = track.name;
    trackArtist.textContent = track.artist || "Unknown Artist";
    
    progress.style.width = '0%';
    currentTimeDisplay.textContent = '0:00';
    
    document.querySelectorAll('.song-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.song-item[data-index="${index}"]`)?.classList.add('active');
    
    updateFavoritesUI();
}

function togglePlay() {
    if (playlist.length === 0) return;
    
    if (isPlaying) {
        audioPlayer.pause();
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        audioPlayer.play()
            .then(() => playBtn.innerHTML = '<i class="fas fa-pause"></i>')
            .catch(e => console.log("Playback failed:", e));
    }
    isPlaying = !isPlaying;
}

function playPrevious() {
    if (playlist.length === 0) return;
    
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrackIndex);
    if (isPlaying) audioPlayer.play();
}

function playNext() {
    if (playlist.length === 0) return;
    
    if (isShuffled) {
        currentTrackIndex = Math.floor(Math.random() * playlist.length);
    } else {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    }
    loadTrack(currentTrackIndex);
    if (isPlaying) audioPlayer.play();
}

function toggleRepeat() {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle('active', isRepeat);
}

function updateProgress() {
    const { currentTime, duration } = audioPlayer;
    if (duration) {
        const progressPercent = (currentTime / duration) * 100;
        progress.style.width = `${progressPercent}%`;
        currentTimeDisplay.textContent = formatTime(currentTime);
    }
}

function seek(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audioPlayer.duration;
    audioPlayer.currentTime = (clickX / width) * duration;
}

function setVolume() {
    audioPlayer.volume = volumeControl.value;
}

function updateDuration() {
    durationDisplay.textContent = formatTime(audioPlayer.duration);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function handleSongEnd() {
    if (isRepeat) {
        audioPlayer.currentTime = 0;
        audioPlayer.play();
    } else {
        playNext();
    }
}

function toggleFavorite() {
    if (playlist.length === 0) return;
    
    const currentTrack = playlist[currentTrackIndex];
    const index = favorites.findIndex(fav => fav.url === currentTrack.url);
    
    if (index === -1) {
        favorites.push(currentTrack);
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
    } else {
        favorites.splice(index, 1);
        favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function updateFavoritesUI() {
    if (playlist.length === 0 || currentTrackIndex === undefined) return;
    
    const currentTrack = playlist[currentTrackIndex];
    const isFavorited = favorites.some(fav => fav.url === currentTrack.url);
    favoriteBtn.innerHTML = isFavorited 
        ? '<i class="fas fa-heart"></i>' 
        : '<i class="far fa-heart"></i>';
}

function toggleLyrics() {
    lyricsContainer.classList.toggle('show');
    lyricsContent.textContent = "Lyrics not available for local files";
}

function toggleSpeedOptions() {
    speedOptions.classList.toggle('show');
}

function setPlaybackSpeed(speed) {
    playbackRate = speed;
    audioPlayer.playbackRate = speed;
    speedBtn.querySelector('span').textContent = `${speed}x`;
    
    document.querySelectorAll('.speed-option').forEach(option => {
        option.classList.toggle('active', parseFloat(option.dataset.speed) === speed);
    });
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.classList.toggle('light-theme', currentTheme === 'light');
    document.body.classList.toggle('dark-theme', currentTheme === 'dark');
    localStorage.setItem('theme', currentTheme);
    themeSwitcher.innerHTML = currentTheme === 'dark' 
        ? '<i class="fas fa-moon"></i>' 
        : '<i class="fas fa-sun"></i>';
}

function setTheme(theme) {
    currentTheme = theme;
    document.body.classList.add(`${theme}-theme`);
    themeSwitcher.innerHTML = theme === 'dark' 
        ? '<i class="fas fa-moon"></i>' 
        : '<i class="fas fa-sun"></i>';
}

// Initialize the player
init();