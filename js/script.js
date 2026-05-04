let audioContext;
let analyser;
let sourceNode;
let dataArray;
let visualizerStarted = false;

let baselineBass = 0.01;
let baselineMids = 0.01;
let baselineHighs = 0.01;

let lastVisualizerFrame = 0;
let currentSongSrc = null;

let currentLyrics = [];
let activeLyricIndex = -1;

let prevBass = 0;
let prevLowMids = 0;
let prevMids = 0;
let prevHighs = 0;
let prevTotal = 0;

let musicFlash = 0;
let smoothEnergy = 0;

/* =========================
   THEMES
========================= */

function applyTheme(song) {
  const root = document.documentElement;

  if (!songsTheme[song]) return;

  const { main, second } = songsTheme[song];

  root.style.setProperty("--main", main);
  root.style.setProperty("--second", second);

  root.style.setProperty("--main-glow", main + "55");
  root.style.setProperty("--second-glow", second + "55");
  root.style.setProperty("--shadow-main", main + "80");
  root.style.setProperty("--shadow-soft", main + "26");
}

function applyIdleTheme() {
  const root = document.documentElement;

  root.style.setProperty("--main", "#4000ff");
  root.style.setProperty("--second", "#0066ff");

  root.style.setProperty("--main-glow", "rgba(50, 0, 200, 0.35)");
  root.style.setProperty("--second-glow", "rgba(0, 102, 255, 0.35)");
  root.style.setProperty("--shadow-main", "rgba(50, 0, 200, 0.5)");
  root.style.setProperty("--shadow-soft", "rgba(50, 0, 200, 0.15)");
}

function returnToIdleTheme() {
  document.body.classList.add("idle");

  const root = document.documentElement;

  root.style.setProperty("--disco-opacity", "0.06");
  root.style.setProperty("--beat-glow", "0.45");
  root.style.setProperty("--beat-brightness", "1");
  root.style.setProperty("--beat-blur", "24px");
  root.style.setProperty("--bass-orb", "38%");
root.style.setProperty("--melody-orb", "42%");
root.style.setProperty("--high-orb", "32%");

  setTimeout(() => {
    applyIdleTheme();

    root.style.setProperty("--disco-opacity", "0");
    root.style.setProperty("--disco-scale", "1");
    root.style.setProperty("--beat-glow", "0.35");
    root.style.setProperty("--beat-brightness", "1");
    root.style.setProperty("--beat-blur", "24px");
  }, 450);
}

function restoreSongTheme() {
  const audio = document.getElementById("audio");
  const src = currentSongSrc || audio.getAttribute("src");

  if (!src) return;

  document.body.classList.remove("idle");
  applyTheme(src);

  prevBass = 0;
  prevLowMids = 0;
  prevMids = 0;
  prevHighs = 0;
  prevTotal = 0;
  musicFlash = 0;
  smoothEnergy = 0;
}

/* =========================
   LOAD SECTIONS
========================= */

function loadSection(id, file) {
  return fetch(file)
    .then(response => response.text())
    .then(data => {
      document.getElementById(id).innerHTML = data;
    });
}

/* =========================
   INIT
========================= */

window.onload = async () => {
  await loadSection("preview-section", "sections/preview.html");
  await loadSection("vote-section", "sections/vote.html");
  await loadSection("links-section", "sections/links.html");
  await loadSection("albums-section", "sections/albums.html");
  await loadSection("footer-section", "sections/footer.html");
  await loadSection("player-section", "sections/player.html?v=999");

  const audio = document.getElementById("audio");
  const nowPlaying = document.getElementById("nowPlaying");

  audio.removeAttribute("src");
  nowPlaying.textContent = "Selecciona una canción";
  currentTrack = -1;

  document.body.classList.add("idle");
  applyIdleTheme();

  setUpPlayer();
  updatePlayButtons();
  startCountdown();
};

/* =========================
   PLAYER
========================= */

function setUpPlayer() {
  const audio = document.getElementById("audio");
  const playBtn = document.getElementById("playBtn");
  const progress = document.getElementById("progress");
  const current = document.getElementById("current");
  const duration = document.getElementById("duration");

  playBtn.addEventListener("click", () => {
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      returnToIdleTheme();
    } else {
      const src = audio.getAttribute("src");
      if (!src) return;

      restoreSongTheme();

      audio.play();
      isPlaying = true;

      startAudioVisualizer();

      if (audioContext && audioContext.state === "suspended") {
        audioContext.resume();
      }
    }

    updatePlayButtons();
  });

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;

    const percent = (audio.currentTime / audio.duration) * 100;

    progress.style.width = percent + "%";
    current.textContent = formatTime(audio.currentTime);
    duration.textContent = formatTime(audio.duration);

    const lyricsProgress = document.getElementById("lyricsProgress");
    const lyricsCurrent = document.getElementById("lyricsCurrent");
    const lyricsDuration = document.getElementById("lyricsDuration");

    if (lyricsProgress) lyricsProgress.style.width = percent + "%";
    if (lyricsCurrent) lyricsCurrent.textContent = formatTime(audio.currentTime);
    if (lyricsDuration) lyricsDuration.textContent = formatTime(audio.duration);

    syncLyrics();
    updateReactiveEffects();
  });

  audio.addEventListener("ended", () => {
    nextTrack();
  });
}

/* =========================
   SONG CONTROL
========================= */

function playSong(element, song) {
  const audio = document.getElementById("audio");
  const nowPlaying = document.getElementById("nowPlaying");

  audio.src = song;
  currentSongSrc = song;

  

  document.body.classList.remove("idle");
  applyTheme(song);

  audio.play();

  baselineBass = 0.01;
  baselineMids = 0.01;
  baselineHighs = 0.01;

  prevBass = 0;
  prevLowMids = 0;
  prevMids = 0;
  prevHighs = 0;
  prevTotal = 0;
  musicFlash = 0;
  smoothEnergy = 0;

  startAudioVisualizer();

  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume();
  }

  isPlaying = true;

  document.querySelectorAll(".track").forEach(track => {
    track.classList.remove("active");
  });

  if (element) {
    element.classList.add("active");
  }

  const cleanTitle = element
    ? element.textContent.replace("⏵", "").trim()
    : getSongTitle(song);

  nowPlaying.textContent = cleanTitle;
  currentTrack = ambientPlaylist.indexOf(song);

  updateLyrics(song, cleanTitle);
  updatePlayButtons();
}

function toggleMainPlay() {
  const audio = document.getElementById("audio");

  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    returnToIdleTheme();
  } else {
    const src = audio.getAttribute("src");
    if (!src) return;

    restoreSongTheme();

    audio.play();
    isPlaying = true;

    startAudioVisualizer();

    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume();
    }
  }

  updatePlayButtons();
}

function nextTrack() {
  const audio = document.getElementById("audio");

  if (currentTrack === -1) {
    isPlaying = false;
    updatePlayButtons();
    return;
  }

  currentTrack++;

  if (currentTrack >= ambientPlaylist.length) {
    currentTrack = 0;
  }

  const tracks = document.querySelectorAll("#ambientTracks .track");

  if (tracks[currentTrack]) {
    playSong(tracks[currentTrack], ambientPlaylist[currentTrack]);
  } else {
    const song = ambientPlaylist[currentTrack];

    audio.src = song;
    currentSongSrc = song;

    document.body.classList.remove("idle");
    applyTheme(song);

    audio.play();
    isPlaying = true;

    updateLyrics(song, getSongTitle(song));
    updatePlayButtons();
  }
}

function previousTrack() {
  const audio = document.getElementById("audio");

  if (currentTrack === -1) {
    audio.currentTime = 0;
    return;
  }

  if (audio.currentTime > 5) {
    audio.currentTime = 0;
    return;
  }

  currentTrack--;

  if (currentTrack < 0) {
    currentTrack = ambientPlaylist.length - 1;
  }

  const tracks = document.querySelectorAll("#ambientTracks .track");

  if (tracks[currentTrack]) {
    playSong(tracks[currentTrack], ambientPlaylist[currentTrack]);
  } else {
    const song = ambientPlaylist[currentTrack];

    audio.src = song;
    currentSongSrc = song;

    document.body.classList.remove("idle");
    applyTheme(song);

    audio.play();
    isPlaying = true;

    updateLyrics(song, getSongTitle(song));
    updatePlayButtons();
  }
}

/* =========================
   LYRICS
========================= */

function updateLyrics(song, title) {
  const lyricsPanelTitle = document.getElementById("lyricsPanelTitle");
  const lyricsCover = document.getElementById("lyricsCover");

  if (!lyricsPanelTitle) return;

  lyricsPanelTitle.textContent = title;

  if (lyricsCover) {
    lyricsCover.src = song.includes("ambient") ? "images/ambient.jpeg" : "images/irme.PNG";
  }

  renderLyrics(song);
}

function renderLyrics(song) {
  const container = document.getElementById("lyricsPanelText");

  if (!container) {
    console.error("NO EXISTE lyricsPanelText");
    return;
  }

  container.innerHTML = "";
  currentLyrics = [];
  activeLyricIndex = -1;

  if (!lyricsData || !lyricsData[song]) {
    container.innerHTML = `
      <div class="lyric-line active">Letra no disponible todavía.</div>
      <div class="lyric-line">Verifica data.js</div>
    `;
    return;
  }

  currentLyrics = lyricsData[song];

  currentLyrics.forEach((line, index) => {
    const div = document.createElement("div");
    div.className = "lyric-line";
    div.id = "line-" + index;
    div.textContent = line.text;
    div.dataset.time = line.time;
    div.classList.add("clickable");

    div.addEventListener("click", () => {
      const audio = document.getElementById("audio");

      audio.currentTime = line.time;

      restoreSongTheme();

      audio.play();
      isPlaying = true;

      updatePlayButtons();

      activeLyricIndex = -1;
      syncLyrics();
    });

    container.appendChild(div);
  });

  syncLyrics();
}

function syncLyrics() {
  const audio = document.getElementById("audio");
  const container = document.getElementById("lyricsPanelText");

  if (!audio || !container || currentLyrics.length === 0) return;

  const time = audio.currentTime;
  let newIndex = 0;

  for (let i = 0; i < currentLyrics.length; i++) {
    if (time >= currentLyrics[i].time) {
      newIndex = i;
    }
  }

  if (newIndex === activeLyricIndex) return;

  activeLyricIndex = newIndex;

  document.querySelectorAll(".lyric-line").forEach((line, index) => {
    line.classList.remove("active", "past");

    if (index < activeLyricIndex) {
      line.classList.add("past");
    }
  });

  const activeLine = document.getElementById("line-" + activeLyricIndex);

  if (activeLine) {
    activeLine.classList.add("active");

    const offset =
      activeLine.offsetTop -
      container.clientHeight / 2 +
      activeLine.clientHeight / 2;

    container.scrollTo({
      top: offset,
      behavior: "smooth"
    });
  }
}

function toggleLyricsPanel() {
  const panel = document.getElementById("lyricsPanel");
  if (!panel) return;

  panel.classList.toggle("open");
}

function toggleLyricsFullscreen() {
  const panel = document.getElementById("lyricsPanel");
  if (!panel) return;

  panel.classList.toggle("fullscreen");
}

/* =========================
   UI BUTTONS
========================= */

function updatePlayButtons() {
  const playBtn = document.getElementById("playBtn");
  const lyricsPlayBtn = document.getElementById("lyricsPlayBtn");
  const lyricsCover = document.getElementById("lyricsCover");
  const bottomPlayer = document.querySelector(".bottom-player");

  if (playBtn) {
    playBtn.textContent = isPlaying ? "⏸" : "⏵";
  }

  if (lyricsPlayBtn) {
    lyricsPlayBtn.textContent = isPlaying ? "⏸" : "⏵";
  }

  if (lyricsCover) {
    lyricsCover.classList.toggle("playing", isPlaying);
  }

  if (bottomPlayer) {
    bottomPlayer.classList.toggle("playing", isPlaying);
  }
}

/* =========================
   TITLES
========================= */

function getSongTitle(song) {
  const titles = {
    "audio/ambient1.wav": "01. MAS RICA",
    "audio/ambient2.wav": "02. AMBIENT",
    "audio/ambient3.wav": "03. TE PASO A BUSCAR",
    "audio/ambient4.wav": "04. DALE SUAVE",
    "audio/ambient5.wav": "05. DENTRO DE TI",
    "audio/ambient6.wav": "06. MODOLUNA",
    "audio/ambient7.wav": "07. L&P",
    "audio/ambient8.wav": "08. TENTANDO",
    "audio/ambient9.wav": "09. NO ME HAGAS ESPERAR",
    "audio/ambient10.mp3": "10. REYNISFJARA",
    "audio/TRACK01.mp3": "IRME"
  };

  return titles[song] || "Canción";
}

/* =========================
   ALBUMS
========================= */

function playAmbientAlbum() {
  const album = document.getElementById("ambientTracks");
  const arrow = document.getElementById("arrowAlbum");

  album.classList.remove("closed");
  arrow.textContent = "▼";

  const tracks = document.querySelectorAll("#ambientTracks .track");

  if (tracks.length > 0) {
    playSong(tracks[0], ambientPlaylist[0]);
  }
}

/* =========================
   VOTE / COMMENTS
========================= */

function vote(option) {
  if (option === "A") {
    votesA++;
    document.getElementById("votesA").textContent = votesA + " votos";
  } else {
    votesB++;
    document.getElementById("votesB").textContent = votesB + " votos";
  }
}

function addComment(option) {
  const nameInput = document.getElementById("name" + option);
  const commentInput = document.getElementById("comment" + option);
  const list = document.getElementById("comments" + option);

  const name = nameInput.value.trim() || "fan";
  const text = commentInput.value.trim();

  if (text === "") return;

  const comment = document.createElement("div");
  comment.className = "comment";

  const initial = name.charAt(0).toUpperCase();

  comment.innerHTML = `
    <div class="avatar">${initial}</div>
    <div class="comment-content">
      <strong>@${name}</strong>
      <span>${text}</span>
    </div>
  `;

  list.prepend(comment);

  nameInput.value = "";
  commentInput.value = "";
}

/* =========================
   SECTIONS
========================= */

function toggleSection(contentId, arrowId, openDisplay) {
  const content = document.getElementById(contentId);
  const arrow = document.getElementById(arrowId);

  if (content.style.display === "none") {
    content.style.display = openDisplay;
    arrow.textContent = "▼";
  } else {
    content.style.display = "none";
    arrow.textContent = "▲";
  }
}

function toggleVote() {
  toggleSection("voteContent", "arrowVote", "grid");
}

function toggleLinks() {
  toggleSection("linksContent", "arrowLinks", "grid");
}

function toggleAlbumsSection() {
  toggleSection("albumsContent", "arrowAlbumsSection", "grid");
}

function toggleInnerSection(sectionId, arrowId) {
  const section = document.getElementById(sectionId);
  const arrow = document.getElementById(arrowId);

  section.classList.toggle("closed");

  if (section.classList.contains("closed")) {
    arrow.textContent = "▶";
  } else {
    arrow.textContent = "▼";
  }
}

/* =========================
   PROGRESS
========================= */

function setProgress(e) {
  const audio = document.getElementById("audio");

  if (!audio.duration) return;

  const width = e.currentTarget.clientWidth;
  const clickX = e.offsetX;

  audio.currentTime = (clickX / width) * audio.duration;
}

function formatTime(time) {
  if (!time) return "0:00";

  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

/* =========================
   VISUALIZER
========================= */

function updateReactiveEffects() {
  const audio = document.getElementById("audio");
  const lyricsBg = document.querySelector(".lyrics-bg");

  if (!audio || !isPlaying) return;

  if (lyricsBg) {
    lyricsBg.style.filter = `blur(var(--beat-blur)) brightness(var(--beat-brightness))`;
  }
}

function startAudioVisualizer() {
  const audio = document.getElementById("audio");
  if (!audio || visualizerStarted) return;

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();

  sourceNode = audioContext.createMediaElementSource(audio);
  sourceNode.connect(analyser);
  analyser.connect(audioContext.destination);

  analyser.fftSize = 256;
  dataArray = new Uint8Array(analyser.frequencyBinCount);

  visualizerStarted = true;
  animateAudioEffects();
}

function animateAudioEffects(timestamp = 0) {
  if (!analyser || !dataArray) return;

  if (timestamp - lastVisualizerFrame < 16) {
    requestAnimationFrame(animateAudioEffects);
    return;
  }

  lastVisualizerFrame = timestamp;
  analyser.getByteFrequencyData(dataArray);

  const subBass = getAverageRange(0, 5);
  const bass = getAverageRange(5, 14);
  const lowMids = getAverageRange(14, 35);
  const mids = getAverageRange(35, 75);
  const highs = getAverageRange(75, 125);

  const kickHit = Math.max(0, bass - prevBass);
  const snareHit = Math.max(0, mids - prevMids);
  const melodyMove = Math.max(0, lowMids - prevLowMids);
  const hatSpark = Math.max(0, highs - prevHighs);

  prevBass = bass;
  prevLowMids = lowMids;
  prevMids = mids;
  prevHighs = highs;

  const totalEnergy =
    subBass * 0.20 +
    bass * 0.30 +
    lowMids * 0.20 +
    mids * 0.20 +
    highs * 0.10;

  smoothEnergy = smoothEnergy * 0.90 + totalEnergy * 0.10;

  const beatImpact = Math.min(
    1,
    kickHit * 6.5 +
    snareHit * 4.2 +
    melodyMove * 2.5 +
    hatSpark * 1.8
  );

  musicFlash = Math.max(musicFlash * 0.78, beatImpact);

  const intensity = Math.min(1, smoothEnergy * 1.1 + musicFlash * 1.35);

  const root = document.documentElement;

  const playingNow = isPlaying && audioIsActuallyPlaying();

if (playingNow) {
  root.style.setProperty("--disco-opacity", (0.02 + intensity * 0.48).toFixed(3));
  root.style.setProperty("--disco-scale", (1 + musicFlash * 0.065).toFixed(3));
  root.style.setProperty("--beat-scale", (1 + kickHit * 0.09).toFixed(3));
  root.style.setProperty("--beat-brightness", (1 + smoothEnergy * 0.28).toFixed(3));
  root.style.setProperty("--beat-blur", `${(24 - intensity * 7).toFixed(1)}px`);
  root.style.setProperty("--beat-glow", (0.75 + intensity * 2.3).toFixed(3));
  root.style.setProperty("--bass-orb", `${(32 + bass * 32 + kickHit * 90).toFixed(1)}%`);
root.style.setProperty("--melody-orb", `${(36 + lowMids * 30 + melodyMove * 70).toFixed(1)}%`);
root.style.setProperty("--high-orb", `${(26 + highs * 22 + hatSpark * 55).toFixed(1)}%`);
}
  requestAnimationFrame(animateAudioEffects);
}

function getAverageRange(start, end) {
  let sum = 0;
  let count = 0;

  for (let i = start; i < end && i < dataArray.length; i++) {
    sum += dataArray[i];
    count++;
  }

  return count ? sum / count / 255 : 0;
}

function audioIsActuallyPlaying() {
  const audio = document.getElementById("audio");

  return audio &&
    !audio.paused &&
    !audio.ended &&
    audio.currentTime > 0 &&
    audio.readyState > 2;
}


/* =========================
   BIO PAGE
========================= */

async function openBioPage() {
  document.getElementById("main-content").style.display = "none";

  const bioPage = document.getElementById("bio-page");
  bioPage.classList.remove("hidden");

  if (bioPage.innerHTML.trim() === "") {
    await loadSection("bio-page", "bio.html");
  }
}

function openHomePage() {
  const mainContent = document.getElementById("main-content");
  const bioPage = document.getElementById("bio-page");

  if (mainContent) mainContent.style.display = "block";
  if (bioPage) bioPage.classList.add("hidden");

  window.history.pushState(null, "", "index.html");
}

function goToSection(sectionId) {
  const mainContent = document.getElementById("main-content");
  const bioPage = document.getElementById("bio-page");

  if (mainContent) {
    mainContent.style.display = "block";
  }

  if (bioPage) {
    bioPage.classList.add("hidden");
  }

  setTimeout(() => {
    const section = document.getElementById(sectionId);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }, 150);
}