console.log('JS Connected');

let currentSong = new Audio();
let currFolder = "";
let songs = [];
let allSongs = [];

// Convert seconds to mm:ss
function convertSecondsToTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

// Play a song from a folder
function playMusic(track, folder = currFolder, pause = false) {
    currFolder = folder;
    currentSong.src = `/${folder}/` + track;
    document.querySelector(".song-info").innerHTML = decodeURIComponent(track);
    document.querySelector(".song-time").innerHTML = "00:00 / 00:00";

    if (!pause) {
        currentSong.play();
        play.src = "Images/pause.svg";
    }
}

// Fetch songs from a folder
async function getSongs(folder) {
    currFolder = folder;
    let response = await fetch(`/${folder}/`).then(res => res.text());
    let div = document.createElement("div");
    div.innerHTML = response;

    songs = Array.from(div.getElementsByTagName("a"))
        .filter(a => a.href.endsWith(".mp3"))
        .map(a => a.href.split(`/${folder}/`)[1]);

    // Populate playlist
    const songUL = document.querySelector(".songlist ul");
    songUL.innerHTML = "";
    songs.forEach(song => {
        const li = document.createElement("li");
        li.classList.add("d-flex");
        li.innerHTML = `
            <img src="Images/music.svg" class="invert music-img" alt="music">
            <div class="info"><div>${decodeURIComponent(song)}</div></div>
            <img src="Images/play.svg" class="playnow" alt="play">
        `;
        li.addEventListener("click", () => playMusic(song));
        songUL.appendChild(li);
    });
}

// Display album cards dynamically
async function displayAlbums() {
    const cardContainer = document.querySelector(".card-container");
    cardContainer.innerHTML = "";

    const response = await fetch("/songs/").then(res => res.text());
    const div = document.createElement("div");
    div.innerHTML = response;
    const anchors = Array.from(div.getElementsByTagName("a"));

    for (const e of anchors) {
        if (e.href.includes("/songs")) {
            const folder = e.href.split("/").slice(-1)[0];
            try {
                const metadata = await fetch(`/songs/${folder}/info.json`).then(res => res.json());
                const card = document.createElement("div");
                card.classList.add("card");
                card.dataset.folder = folder;
                card.innerHTML = `
                    <div class="play">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 16 16">
                            <circle cx="8" cy="8" r="8" fill="#1ed760"/>
                            <path d="M10.5 8.5L6 11V5l4.5 2.5a.75.75 0 0 1 0 1.25z" fill="black"/>
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover.jpg" alt="${metadata.title}">
                    <a href="#"><h2>${metadata.title}</h2></a>
                    <p>${metadata.description}</p>
                `;
                cardContainer.appendChild(card);
            } catch (err) {
                console.error(`Failed to load metadata for ${folder}`, err);
            }
        }
    }

    // Event delegation for album cards
    cardContainer.addEventListener("click", async (event) => {
        const card = event.target.closest('.card');
        if (card) await getSongs(`songs/${card.dataset.folder}`);
    });
}

// Load all songs from multiple folders
async function getSongsFromFolder(folder) {
    const response = await fetch(`/${folder}/`).then(res => res.text());
    const div = document.createElement("div");
    div.innerHTML = response;

    return Array.from(div.getElementsByTagName("a"))
        .filter(a => a.href.endsWith(".mp3"))
        .map(a => ({ song: a.href.split(`/${folder}/`)[1], folder }));
}

async function loadAllSongs() {
    const folders = ["songs/Pritam", "songs/ArjitSingh", "songs/JasleenRoyal", "songs/ShreyaGhoshal", "songs/SunidhiChauhan", "songs/VishalShekhar"];
    allSongs = [];
    for (const folder of folders) allSongs = allSongs.concat(await getSongsFromFolder(folder));
}

// Update search results dynamically
function updateSearchResults(filteredSongs) {
    const resultsContainer = document.getElementById("search-results");
    resultsContainer.innerHTML = "";

    if (filteredSongs.length === 0) {
        resultsContainer.innerHTML = "<p>No songs found</p>";
        return;
    }

    filteredSongs.forEach(({ song, folder }) => {
        const div = document.createElement("div");
        div.classList.add("search-result-item");
        div.innerHTML = `<p><strong>${decodeURIComponent(song)}</strong></p>`;
        div.addEventListener("click", () => playMusic(song, folder));
        resultsContainer.appendChild(div);
    });
}

// Main function
async function main() {
    await getSongs("songs/Pritam");
    playMusic(songs[0], "songs/Pritam", true);
    await displayAlbums();
    await loadAllSongs();

    // Play/Pause button
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "Images/pause.svg";
        } else {
            currentSong.pause();
            play.src = "Images/play.svg";
        }
    });

    // Next / Previous buttons
    previous.addEventListener("click", () => {
        const index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index > 0) playMusic(songs[index - 1]);
    });
    next.addEventListener("click", () => {
        const index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index + 1 < songs.length) playMusic(songs[index + 1]);
    });

    // Seekbar updates
    currentSong.addEventListener("timeupdate", () => {
        const duration = currentSong.duration || 0;
        const percent = (currentSong.currentTime / duration) * 100 || 0;
        document.querySelector(".song-time").innerHTML = `${convertSecondsToTime(currentSong.currentTime)}/${convertSecondsToTime(duration)}`;
        document.querySelector(".circle").style.left = percent + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        const percent = e.offsetX / e.target.getBoundingClientRect().width;
        currentSong.currentTime = currentSong.duration * percent;
    });

    // Volume
    const volumeInput = document.querySelector(".range input");
    volumeInput.addEventListener("change", e => {
        currentSong.volume = parseInt(e.target.value) / 100;
    });

    document.querySelector(".volume img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
            volumeInput.value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentSong.volume = 0.1;
            volumeInput.value = 10;
        }
    });

    // Search bar
    document.querySelector("#search-bar").addEventListener("input", e => {
        const searchTerm = e.target.value.trim().toLowerCase();
        const resultsContainer = document.getElementById("search-results");
        if (!searchTerm) {
            resultsContainer.style.display = "none";
            return;
        }
        resultsContainer.style.display = "block";
        const filteredSongs = allSongs.filter(({ song }) => song.toLowerCase().includes(searchTerm));
        updateSearchResults(filteredSongs);
    });
}

main();
