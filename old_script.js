import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

window.addEventListener('DOMContentLoaded', () => {
  const supabase = createClient(
    'https://dhjgqadhjxvruyvkxdss.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoamdxYWRoanh2cnV5dmt4ZHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzg4ODEsImV4cCI6MjA2OTk1NDg4MX0.t2fy8PixY3Od508Pzv-KGZbai0IotRqt9FOFPPkiQk0'
  );

  // Elements
  const authSection = document.getElementById('authSection');
  const authTitle = document.getElementById('authTitle');
  const authButton = document.getElementById('authButton');
  const toggleAuth = document.getElementById('toggleAuth');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('togglePassword');

  const app = document.getElementById('app');
  const toast = document.getElementById('toast');
  const uploadButton = document.getElementById('uploadButton');
  const gallery = document.getElementById('gallery');
  const profileMenu = document.getElementById('profileMenu');
  const profileOptions = document.getElementById('profileOptions');
  const signoutButton = document.getElementById('signoutButton');
  const imageModal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');
  const modalVideo = document.getElementById('modalVideo');

  /* -------------------- Helpers -------------------- */

  function showToast(msg) {
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => (toast.style.opacity = '0'), 2000);
  }

  /* -------------------- Auth -------------------- */

  let isLogin = true;

  toggleAuth.onclick = () => {
    isLogin = !isLogin;
    authTitle.textContent = isLogin ? 'Login' : 'Sign Up';
    authButton.textContent = isLogin ? 'Login' : 'Sign Up';
    toggleAuth.textContent = isLogin
      ? "Don't have an account? Sign up"
      : 'Already have an account? Login';
  };

  togglePasswordBtn.onclick = () => {
    const isPwd = passwordInput.type === 'password';
    passwordInput.type = isPwd ? 'text' : 'password';
    togglePasswordBtn.textContent = isPwd ? '🙈' : '👁️';
  };

  authButton.onclick = async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) return showToast('Please fill in all fields.');

    const { data, error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) return showToast(error.message);
    if (data.user) initApp();
  };

  signoutButton.onclick = async () => {
    await supabase.auth.signOut();
    location.reload();
  };

  profileMenu.onclick = () => {
    const isVisible = !profileOptions.classList.contains('opacity-0');
    profileOptions.classList.toggle('opacity-0', isVisible);
    profileOptions.classList.toggle('invisible', isVisible);
    profileOptions.classList.toggle('pointer-events-none', isVisible);
  };

  /* -------------------- Upload (HEIC → JPEG) -------------------- */

  uploadButton.onclick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = true;
    input.onchange = () => input.files.length && handleFiles(input.files);
    input.click();
  };

  async function handleFiles(files) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return showToast('Please login first.');

    for (const file of files) {
      let uploadFile = file;

      const isHeic =
        file.type === 'image/heic' ||
        file.name.toLowerCase().endsWith('.heic');

      if (isHeic) {
        showToast('Optimizing image for web…');

        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.9
        });

        uploadFile = new File(
          [convertedBlob],
          file.name.replace(/\.heic$/i, '.jpg'),
          { type: 'image/jpeg' }
        );
      }

      const filename = `${Date.now()}-${uploadFile.name}`;
      const path = `${user.id}/${filename}`;

      const { error } = await supabase.storage
        .from('memories')
        .upload(path, uploadFile);

      showToast(
        error ? `❌ ${uploadFile.name} failed` : `✅ Uploaded ${uploadFile.name}`
      );
    }

    await loadGallery();
  }

  /* -------------------- Gallery -------------------- */

  async function loadGallery() {
    gallery.innerHTML = '';
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { data: files, error } = await supabase.storage
      .from('memories')
      .list(`${user.id}/`, { limit: 1000 });

    if (error) return showToast('Error loading files.');

    for (const file of files) {
      const ext = file.name.split('.').pop().toLowerCase();

      // Safety: never try to render HEIC
      if (ext === 'heic') continue;

      const { data } = await supabase.storage
        .from('memories')
        .getPublicUrl(`${user.id}/${file.name}`);

      const url = data.publicUrl;
      const isVideo = ['mp4', 'webm', 'mov'].includes(ext);

      const card = document.createElement('div');
      card.className = 'image-card';

      if (isVideo) {
        const vid = document.createElement('video');
        vid.src = url;
        vid.muted = true;
        vid.playsInline = true;
        vid.onclick = () => openModal(url, true);
        card.appendChild(vid);
      } else {
        const img = document.createElement('img');
        img.src = url;
        img.onclick = () => openModal(url);
        card.appendChild(img);
      }

      gallery.appendChild(card);
    }
  }

  /* -------------------- Modal -------------------- */

  function openModal(url, isVideo = false) {
    modalImage.style.display = isVideo ? 'none' : 'block';
    modalVideo.style.display = isVideo ? 'block' : 'none';

    if (isVideo) {
      modalVideo.src = url;
      modalVideo.play();
    } else {
      modalImage.src = url;
    }

    imageModal.classList.add('open');
  }

  function closeModal() {
    imageModal.classList.remove('open');
    modalVideo.pause();
  }

  imageModal.onclick = (e) => {
    if (e.target === imageModal) closeModal();
  };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  /* -------------------- Init -------------------- */

  async function initApp() {
    authSection.classList.add('hidden');
    app.classList.remove('hidden');
    await loadGallery();
  }

  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) initApp();
  });
});
