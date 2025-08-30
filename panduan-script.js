// Tahun dinamis
document.getElementById('y').textContent = new Date().getFullYear();

// Auto-rotate video dengan suara
const video = document.getElementById('player');
const videoSource = document.getElementById('playerSource');
const playButton = document.getElementById('playButton');
const videos = [
  'treasure map onepiece.mp4',
  'treasure map onepiece2.mp4'
];
let currentVideoIndex = 0;
let isUserInteracted = false;

// Function untuk ganti video
function switchVideo() {
  currentVideoIndex = (currentVideoIndex + 1) % videos.length;
  videoSource.src = videos[currentVideoIndex];
  video.load();
  
  if (isUserInteracted) {
    video.play();
  }
}

// Function untuk enable audio dan autoplay
function enableAudioAndAutoplay() {
  isUserInteracted = true;
  video.muted = false; // Nyalakan suara
  video.play();
  playButton.style.display = 'none';
}

// Event listener ketika video selesai
video.addEventListener('ended', switchVideo);

// Event listener untuk play button
playButton.addEventListener('click', enableAudioAndAutoplay);

// Cek apakah autoplay berhasil
video.addEventListener('loadeddata', function() {
  video.play().then(function() {
    // Autoplay berhasil, tapi masih muted
    // Tampilkan tombol untuk enable suara
    if (video.muted) {
      playButton.style.display = 'block';
    }
  }).catch(function(error) {
    // Autoplay gagal total, tampilkan tombol
    playButton.style.display = 'block';
    console.log('Autoplay diblokir, menampilkan tombol manual');
  });
});

// Event listener untuk user interaction (klik di video)
video.addEventListener('click', function() {
  if (!isUserInteracted) {
    enableAudioAndAutoplay();
  }
});

// TOGGLE GAMBAR PENJELASAN
const galleryToggle = document.getElementById('galleryToggle');
const galleryGrid = document.getElementById('galleryGrid');
let isGalleryVisible = false;

galleryToggle.addEventListener('click', function() {
  isGalleryVisible = !isGalleryVisible;
  
  if (isGalleryVisible) {
    // Show gallery
    galleryGrid.classList.add('show');
    galleryToggle.classList.add('active');
    galleryToggle.querySelector('span:first-child').textContent = '📸 Sembunyikan Gambar';
  } else {
    // Hide gallery
    galleryGrid.classList.remove('show');
    galleryToggle.classList.remove('active');
    galleryToggle.querySelector('span:first-child').textContent = '📸 Gambar Penjelasan';
  }
});
