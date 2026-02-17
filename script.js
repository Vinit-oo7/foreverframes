if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "PING" && event.ports?.[0]) {
      event.ports[0].postMessage("READY");
    }
  });
} else {
  console.warn("Service Worker not supported / not available in this context.");
}

window.addEventListener("DOMContentLoaded", () => {
  const nav = performance.getEntriesByType?.("navigation")?.[0];
  if (document.referrer === "" && (!nav || nav.type === "navigate")) {
    console.log("Normal load");
  }
});

window.addEventListener("load", async () => {
  if (window.location.search.includes("share-target")) return;

  if (navigator.canShare) {
    const params = new URLSearchParams(window.location.search);
  }
});

if (window.location.pathname === "/") {
  window.addEventListener("load", async () => {
    try {
      const navigation = performance.getEntriesByType("navigation")[0];
      if (navigation && navigation.type === "navigate") {
        // Share triggered load
        console.log("App opened via share");
      }
    } catch (e) {}
  });
}

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

window.addEventListener("DOMContentLoaded", () => {
  /* ======================================================
     SUPABASE
  ====================================================== */

  const supabase = createClient(
    "https://dhjgqadhjxvruyvkxdss.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoamdxYWRoanh2cnV5dmt4ZHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzg4ODEsImV4cCI6MjA2OTk1NDg4MX0.t2fy8PixY3Od508Pzv-KGZbai0IotRqt9FOFPPkiQk0",
  );
  // ✅ Only attach SW message listener if SW is available
  if ("serviceWorker" in navigator && navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener("message", async (event) => {
      if (event.data?.type === "SHARED_FILES") {
        // Get user
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) console.warn("auth.getUser error:", error);

        if (!user) {
          alert("Please login to upload shared files.");
          return;
        }

        await handleFiles(event.data.files);

        // Notify SW (only if controlled)
        navigator.serviceWorker.addEventListener("message", async (event) => {
          if (event.data?.type === "SHARED_FILES") {
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
              pendingSharedFiles = event.data.files;
              showToast("Login first — shared files are ready ✅");
              return;
            }

            await handleFiles(event.data.files);

            navigator.serviceWorker.controller?.postMessage({
              type: "SHOW_NOTIFICATION",
              message: "Memory uploaded successfully 🚀",
            });
          }
        });
      }
    });
  } else {
    console.warn(
      "⚠️ Service Worker not available in this context (no SW message handling).",
    );
  }

  /* ======================================================
     ELEMENTS
  ====================================================== */

  const authSection = document.getElementById("authSection");
  const authTitle = document.getElementById("authTitle");
  const authButton = document.getElementById("authButton");
  const toggleAuth = document.getElementById("toggleAuth");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const togglePasswordBtn = document.getElementById("togglePassword");

  const app = document.getElementById("app");
  const toast = document.getElementById("toast");
  const gallery = document.getElementById("gallery");
  const uploadButton = document.getElementById("uploadButton");

  const profileMenu = document.getElementById("profileMenu");
  const profileOptions = document.getElementById("profileOptions");
  const signoutButton = document.getElementById("signoutButton");

  const imageModal = document.getElementById("imageModal");
  const modalImage = document.getElementById("modalImage");
  const modalVideo = document.getElementById("modalVideo");

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const rotateBtn = document.getElementById("rotateBtn");

  const privacyToggle = document.getElementById("privacyToggle");

  const filterBar = document.getElementById("filterBar");
  const underline = document.getElementById("filterUnderline");
  const filterButtons = [...filterBar.querySelectorAll(".filter-btn")];
  const scrollTopButton = document.getElementById("scrollTopButton");
  const shareBtn = document.getElementById("shareBtn");
  const selectionBar = document.getElementById("selectionBar");
  const selectedCount = document.getElementById("selectedCount");
  const shareSelectedBtn = document.getElementById("shareSelected");
  const downloadSelectedBtn = document.getElementById("downloadSelected");
  const cancelBtn = document.getElementById("cancelSelection");
  const pinGate = document.getElementById("pinGate");
  const pinTitle = document.getElementById("pinTitle");
  const pinHint = document.getElementById("pinHint");
  const pinInput = document.getElementById("pinInput");
  const pinSubmit = document.getElementById("pinSubmit");
  const pinReset = document.getElementById("pinReset");

  const deleteBtn = document.getElementById("deleteBtn");
  // ===== PIN Gate Modal (Promise-based) =====
  const pinGateModal = document.getElementById("pinGateModal");
  const pinGateTitle = document.getElementById("pinGateTitle");
  const pinGateDesc = document.getElementById("pinGateDesc");
  const pinGateInput = document.getElementById("pinGateInput");
  const pinGateError = document.getElementById("pinGateError");
  const pinGateConfirm = document.getElementById("pinGateConfirm");
  const pinGateCancel = document.getElementById("pinGateCancel");
  const pinGateClose = document.getElementById("pinGateClose");
  const pinGateToggle = document.getElementById("pinGateToggle");
  // ===== Reset PIN (Email OTP) UI =====
  const resetOtpModal = document.getElementById("resetOtpModal");
  const resetOtpEmail = document.getElementById("resetOtpEmail");
  const resetOtpCode = document.getElementById("resetOtpCode");
  const resetOtpError = document.getElementById("resetOtpError");

  const resetOtpStepSend = document.getElementById("resetOtpStepSend");
  const resetOtpStepVerify = document.getElementById("resetOtpStepVerify");

  const resetOtpSendBtn = document.getElementById("resetOtpSendBtn");
  const resetOtpVerifyBtn = document.getElementById("resetOtpVerifyBtn");
  const resetOtpResend = document.getElementById("resetOtpResend");

  const resetOtpClose = document.getElementById("resetOtpClose");
  const resetOtpCancel1 = document.getElementById("resetOtpCancel1");
  const resetOtpBack = document.getElementById("resetOtpBack");

  const signedUrlCache = new Map();

  /* ======================================================
  STATE
  ====================================================== */

  let isLogin = true;
  let mediaList = [];
  let currentIndex = -1;
  let currentMedia = null;
  let currentRotation = 0;
  let privacyEnabled = true; // 🔐 DEFAULT ON
  let currentFilter = "all";
  let selectionMode = false;
  let galleryUnlocked = false;
  let currentUserId = null;
  let selectedItems = new Set();
  let pressTimer;
  let pendingSharedFiles = null; // ✅ for share-target when user isn't logged in yet

  // Disable right click
  document.addEventListener("contextmenu", (e) => e.preventDefault());

  // Disable drag
  document.addEventListener("dragstart", (e) => {
    if (e.target.tagName === "IMG") e.preventDefault();
  });

  // Disable text selection
  document.addEventListener("selectstart", (e) => e.preventDefault());

  /* ======================================================
  HELPERS
  ====================================================== */
  function openResetOtpModal(email) {
    resetOtpEmail.value = email || "";
    resetOtpCode.value = "";
    resetOtpError.classList.add("hidden");
    resetOtpError.textContent = "";

    resetOtpStepSend.classList.remove("hidden");
    resetOtpStepVerify.classList.add("hidden");

    resetOtpModal.classList.remove("hidden");
    resetOtpModal.classList.add("flex");
  }

  function closeResetOtpModal() {
    resetOtpModal.classList.add("hidden");
    resetOtpModal.classList.remove("flex");
  }

  function showResetOtpError(msg) {
    resetOtpError.textContent = msg;
    resetOtpError.classList.remove("hidden");
  }
  resetOtpClose?.addEventListener("click", closeResetOtpModal);
  resetOtpCancel1?.addEventListener("click", closeResetOtpModal);
  resetOtpModal?.addEventListener("click", (e) => {
    if (e.target === resetOtpModal) closeResetOtpModal();
  });
  resetOtpBack?.addEventListener("click", () => {
    resetOtpError.classList.add("hidden");
    resetOtpStepVerify.classList.add("hidden");
    resetOtpStepSend.classList.remove("hidden");
  });
  async function sendResetOtp(email) {
    // shouldCreateUser:false prevents accidental new accounts
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });

    if (error) throw error;

    resetOtpStepSend.classList.add("hidden");
    resetOtpStepVerify.classList.remove("hidden");
    resetOtpCode.value = "";
    resetOtpCode.focus();
  }
  async function verifyResetOtpAndReset(email, code) {
    const token = (code || "").trim();

    if (!/^\d{6}$/.test(token)) {
      showResetOtpError("Enter the 6-digit code.");
      return;
    }

    const { error: verifyErr } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (verifyErr) {
      showResetOtpError("Invalid or expired code. Try again.");
      return;
    }

    // ✅ OTP verified — now reset PIN in DB
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      showResetOtpError("Session missing. Please login again.");
      return;
    }

    const { error: delErr } = await supabase
      .from("user_pins")
      .delete()
      .eq("user_id", user.id);
    if (delErr) {
      console.error("PIN reset failed:", delErr);
      showResetOtpError("Reset failed: " + delErr.message);
      return;
    }

    closeResetOtpModal();
    showToast("✅ PIN reset. Set a new PIN.");
    await requirePinAndUnlock(user);
  }
  pinReset?.addEventListener("click", async (e) => {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return showToast("Please login first.");

    openResetOtpModal(user.email);
  });
  resetOtpSendBtn?.addEventListener("click", async () => {
    try {
      resetOtpSendBtn.disabled = true;
      await sendResetOtp(resetOtpEmail.value);
      showToast("📩 Code sent to your email");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to send code");
    } finally {
      resetOtpSendBtn.disabled = false;
    }
  });

  resetOtpResend?.addEventListener("click", async () => {
    try {
      await sendResetOtp(resetOtpEmail.value);
      showToast("📩 Code re-sent");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to resend");
    }
  });

  resetOtpVerifyBtn?.addEventListener("click", async () => {
    await verifyResetOtpAndReset(resetOtpEmail.value, resetOtpCode.value);
  });

  function openPinGateModal({
    title = "Enter PIN",
    desc = "",
    confirmText = "Confirm",
  } = {}) {
    return new Promise((resolve) => {
      // ✅ ADD THIS GUARD (prevents pinGateInput null crash)
      if (
        !pinGateModal ||
        !pinGateTitle ||
        !pinGateDesc ||
        !pinGateConfirm ||
        !pinGateCancel ||
        !pinGateClose ||
        !pinGateToggle ||
        !pinGateError ||
        !pinGateInput
      ) {
        console.error(
          "PIN Gate Modal elements missing. Fix IDs in index.html.",
        );
        showToast("UI error: PIN modal missing");
        return resolve(null);
      }

      // Reset UI
      pinGateTitle.textContent = title;
      pinGateDesc.textContent = desc;
      pinGateConfirm.textContent = confirmText;
      pinGateInput.value = "";
      pinGateInput.type = "password";
      pinGateToggle.textContent = "👁️";
      pinGateError.classList.add("hidden");
      pinGateError.textContent = "";

      // Show
      pinGateModal.classList.remove("hidden");
      pinGateModal.classList.add("flex");
      setTimeout(() => pinGateInput.focus(), 50);

      let done = false;
      const finish = (value) => {
        if (done) return;
        done = true;

        pinGateModal.classList.add("hidden");
        pinGateModal.classList.remove("flex");

        // cleanup
        pinGateConfirm.onclick = null;
        pinGateCancel.onclick = null;
        pinGateClose.onclick = null;
        pinGateModal.onclick = null;
        document.removeEventListener("keydown", onKeyDown);

        resolve(value);
      };

      const onKeyDown = (e) => {
        if (e.key === "Escape") finish(null);
        if (e.key === "Enter") pinGateConfirm.click();
      };
      document.addEventListener("keydown", onKeyDown);

      pinGateToggle.onclick = () => {
        const isPwd = pinGateInput.type === "password";
        pinGateInput.type = isPwd ? "text" : "password";
        pinGateToggle.textContent = isPwd ? "🙈" : "👁️";
      };

      pinGateConfirm.onclick = () => finish(pinGateInput.value.trim());
      pinGateCancel.onclick = () => finish(null);
      pinGateClose.onclick = () => finish(null);

      // click outside closes
      pinGateModal.onclick = (e) => {
        if (e.target === pinGateModal) finish(null);
      };
    });
  }

  function pinGateSetError(msg) {
    pinGateError.textContent = msg;
    pinGateError.classList.remove("hidden");
  }

  function showPinGate(show) {
    if (!pinGate) return;

    if (show) {
      pinGate.classList.remove("hidden");
      pinGate.style.display = "flex";
    } else {
      pinGate.classList.add("hidden");
      pinGate.style.display = "none";
    }
  }

  if (window.location.pathname === "/") {
    const formData = new FormData(document.forms[0] || undefined);
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.style.opacity = "1";
    setTimeout(() => (toast.style.opacity = "0"), 1000);
  }

  function setPrivacy(enabled) {
    privacyEnabled = enabled;
    document.body.classList.toggle("privacy-on", privacyEnabled);
    // showToast(privacyEnabled ? 'Privacy ON 🧿' : 'Privacy OFF');
  }

  function setFilter(type) {
    currentFilter = type;
    loadGallery();
  }

  function stopVideo() {
    if (!modalVideo) return;
    modalVideo.pause();
    modalVideo.currentTime = 0;
    modalVideo.removeAttribute("src");
    modalVideo.load();
  }

  async function getNextIndex(userId) {
    const { data: files, error } = await supabase.storage
      .from("memories")
      .list(`${userId}/`, { limit: 1000 });

    if (error || !files) return 1;

    let maxIndex = 0;

    for (const file of files) {
      const idx = extractIndex(file.name);
      if (idx) maxIndex = Math.max(maxIndex, idx);
    }

    return maxIndex + 1;
  }

  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      scrollTopButton.style.opacity = "1";
      scrollTopButton.style.pointerEvents = "auto";
    } else {
      scrollTopButton.style.opacity = "0";
      scrollTopButton.style.pointerEvents = "none";
    }
  });

  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  async function sha256(text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return [...new Uint8Array(buf)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function reversePin(pin) {
    return String(pin).split("").reverse().join("");
  }

  function normalizePin(raw) {
    return String(raw || "")
      .trim()
      .replace(/\s+/g, "");
  }

  /* =====================================================
Unlock gallery
=========================================================*/
  async function getUserPins(userId) {
    const { data, error } = await supabase
      .from("user_pins")
      .select("view_pin_hash, delete_pin_hash")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data; // null if not set
  }

  async function setUserPins(userId, viewPin) {
    const viewHash = await sha256(viewPin);
    const delHash = await sha256(reversePin(viewPin));

    const { error } = await supabase.from("user_pins").upsert({
      user_id: userId,
      view_pin_hash: viewHash,
      delete_pin_hash: delHash,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  }

  async function requirePinAndUnlock(user) {
    galleryUnlocked = false;

    const pins = await getUserPins(user.id);

    showPinGate(true);
    pinInput.value = "";

    // First-time setup (no row yet)
    if (!pins) {
      pinTitle.textContent = "Create PIN";
      pinHint.textContent =
        "Set a 4-digit PIN to view memories (delete PIN will be its reverse).";
      pinSubmit.textContent = "Set PIN";

      pinSubmit.onclick = async () => {
        const pin = normalizePin(pinInput.value);
        if (!/^\d{4}$/.test(pin)) return showToast("Enter exactly 4 digits");

        await setUserPins(user.id, pin);

        showToast("✅ PIN set & synced");
        showPinGate(false);
        galleryUnlocked = true;
        await loadGallery();
      };

      // Optional: reset just deletes row
      pinReset?.addEventListener("click", async (e) => {
        e.preventDefault();

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.email) return showToast("Please login first.");

        openResetOtpModal(user.email);
      });

      return;
    }

    // Normal unlock
    pinTitle.textContent = "Enter PIN";
    pinHint.textContent = "Enter your 4-digit PIN to view memories.";
    pinSubmit.textContent = "Unlock";

    pinSubmit.onclick = async () => {
      const pin = normalizePin(pinInput.value);
      if (!/^\d{4}$/.test(pin)) return showToast("Enter exactly 4 digits");

      const h = await sha256(pin);
      if (h !== pins.view_pin_hash) return showToast("❌ Wrong PIN");

      showToast("🔓 Unlocked");
      showPinGate(false);
      galleryUnlocked = true;
      await loadGallery();
    };
  }

  /* ======================================================
     AUTH
  ====================================================== */

  toggleAuth.onclick = () => {
    isLogin = !isLogin;
    authTitle.textContent = isLogin ? "Login" : "Sign Up";
    authButton.textContent = isLogin ? "Login" : "Sign Up";
    toggleAuth.textContent = isLogin
      ? "Don't have an account? Sign up"
      : "Already have an account? Login";
  };

  togglePasswordBtn.onclick = () => {
    const hidden = passwordInput.type === "password";
    passwordInput.type = hidden ? "text" : "password";
    togglePasswordBtn.textContent = hidden ? "🙈" : "🧿";
  };

  authButton.onclick = async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) return showToast("Fill all fields");

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
    profileOptions.classList.toggle("opacity-0");
    profileOptions.classList.toggle("invisible");
    profileOptions.classList.toggle("pointer-events-none");
  };

  /* ======================================================
     PRIVACY
  ====================================================== */

  privacyToggle.onclick = () => {
    setPrivacy(!privacyEnabled);
  };

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter;
      setActive(btn);
      loadGallery();
    });
  });

  function setActive(activeBtn) {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    activeBtn.classList.add("active");

    moveUnderline(activeBtn);
  }

  function moveUnderline(btn) {
    const rect = btn.getBoundingClientRect();
    const parentRect = filterBar.getBoundingClientRect();

    underline.style.width = `${rect.width}px`;
    underline.style.transform = `translateX(${rect.left - parentRect.left}px)`;
  }
  /* ======================================================
     UPLOAD
  ====================================================== */

  uploadButton.onclick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.multiple = true;
    input.onchange = () => input.files.length && handleFiles(input.files);
    input.click();
  };

  function padNumber(num, size = 3) {
    return String(num).padStart(size, "0");
  }

  function extractIndex(name) {
    const match = name.match(/memories-of-us-(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  }

  async function handleFiles(files) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return showToast("Please login first");

    let counter = await getNextIndex(user.id);

    for (const file of files) {
      let uploadFile = file;

      // HEIC → JPEG
      if (file.name.toLowerCase().endsWith(".heic")) {
        const blob = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.9,
        });
        uploadFile = new File([blob], "converted.jpg", {
          type: "image/jpeg",
        });
      }

      const ext = uploadFile.name.split(".").pop().toLowerCase();
      const filename = `memories-of-us-${padNumber(counter)}.${ext}`;
      counter++;

      const path = `${user.id}/${filename}`;

      const { error } = await supabase.storage
        .from("memories")
        .upload(path, uploadFile, { upsert: false });

      if (error) {
        showToast(`❌ Failed: ${filename}`);
      } else {
        showToast(`✅ Uploaded ${filename}`);

        if (navigator.serviceWorker?.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "SHOW_NOTIFICATION",
            message: "New memory added 📸",
          });
        }
      }
    }

    await loadGallery();
  }

  /* ======================================================
     GALLERY (DATE + LAZY)
  ====================================================== */

  async function loadGallery() {
    if (!galleryUnlocked) return;
    gallery.innerHTML = "";
    mediaList = [];

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { data: files } = await supabase.storage
      .from("memories")
      .list(`${user.id}/`, { limit: 1000 });

    files.sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
    );

    const groups = {};

    for (const file of files) {
      const date = new Date(file.created_at || Date.now()).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(file);
    }

    for (const [date, items] of Object.entries(groups)) {
      const section = document.createElement("div");
      section.className = "gallery-section";

      let hasVisibleItems = false;

      for (const file of items) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (!ext) continue;

        const isVideo = ["mp4", "webm", "mov"].includes(ext);

        // 🔎 FILTER FIRST (avoid unnecessary URL generation)
        if (
          (currentFilter === "image" && isVideo) ||
          (currentFilter === "video" && !isVideo)
        ) {
          continue;
        }

        hasVisibleItems = true;

        /* ==============================
     SIGNED URL (CACHED + CLEAN)
  ============================== */

        let url = signedUrlCache.get(file.name);

        if (!url) {
          const { data, error } = await supabase.storage
            .from("memories")
            .createSignedUrl(`${user.id}/${file.name}`, 1800);

          if (error || !data?.signedUrl) {
            console.error("Signed URL error:", error);
            continue;
          }

          url = data.signedUrl;
          signedUrlCache.set(file.name, url);
        }

        /* ==============================
     PUSH TO MEDIA LIST
  ============================== */

        const index =
          mediaList.push({
            url,
            isVideo,
            name: file.name,
            createdAt: file.created_at,
          }) - 1;

        /* ==============================
     CREATE CARD
  ============================== */

        const card = document.createElement("div");
        card.className = "image-card";
        card.dataset.type = isVideo ? "video" : "image";

        /* ==============================
     LONG PRESS HANDLERS
  ============================== */

        const startPress = () => {
          pressTimer = setTimeout(() => {
            enableSelectionMode();
            toggleSelect(index, card);
          }, 500);
        };

        const cancelPress = () => clearTimeout(pressTimer);

        card.addEventListener("touchstart", startPress);
        card.addEventListener("touchend", cancelPress);
        card.addEventListener("mousedown", startPress);
        card.addEventListener("mouseup", cancelPress);

        card.addEventListener("click", () => {
          if (selectionMode) {
            toggleSelect(index, card);
          } else {
            openModal(index);
          }
        });

        /* ==============================
     MEDIA ELEMENT
  ============================== */

        const media = document.createElement(isVideo ? "video" : "img");
        media.src = url;
        media.loading = "lazy";
        media.draggable = false;

        if (isVideo) {
          media.muted = true;
          media.playsInline = true;
          media.preload = "metadata"; // 🚀 important
        }

        card.appendChild(media);

        /* ==============================
     TIMESTAMP
  ============================== */

        const time = document.createElement("div");
        time.className = "timestamp";
        time.textContent = new Date(file.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        card.appendChild(time);
        section.appendChild(card);
      }

      if (hasVisibleItems) {
        const header = document.createElement("h2");
        header.className = "date-header";
        header.textContent = date;

        gallery.appendChild(header);
        gallery.appendChild(section);
      }
    }
    const emptyPlaceholder = document.getElementById("emptyFolderPlaceholder");

    if (gallery.children.length === 0) {
      emptyPlaceholder.style.display = "flex";
    } else {
      if (emptyPlaceholder) {
        emptyPlaceholder.style.display =
          gallery.children.length === 0 ? "flex" : "none";
      }
    }
  }
  applyFilter();

  /* ======================================================
   FILTER LOGIC  👈 PUT IT HERE
====================================================== */
  function applyFilter() {
    const gallery = document.getElementById("gallery");
    const cards = [...document.querySelectorAll(".image-card")];

    // 1️⃣ Record FIRST positions
    const firstRects = new Map();
    cards.forEach((card) => {
      firstRects.set(card, card.getBoundingClientRect());
    });

    // 2️⃣ Apply visibility with soft fade-out
    cards.forEach((card) => {
      const isVideo = !!card.querySelector("video");

      const shouldShow =
        currentFilter === "all" ||
        (currentFilter === "image" && !isVideo) ||
        (currentFilter === "video" && isVideo);

      if (!shouldShow) {
        card.classList.add("fade-out");

        // Remove from layout after fade
        setTimeout(() => {
          card.style.display = "none";
        }, 300);
      } else {
        card.style.display = "";
        card.classList.remove("fade-out");
      }
    });

    // Force layout recalculation
    gallery.offsetHeight;

    // 3️⃣ FLIP animation
    cards.forEach((card, index) => {
      if (card.style.display === "none") return;

      const first = firstRects.get(card);
      const last = card.getBoundingClientRect();

      const dx = first.left - last.left;
      const dy = first.top - last.top;

      if (dx || dy) {
        card.classList.add("moving");
        card.style.transition = "none";
        card.style.transform = `translate(${dx}px, ${dy}px) scale(0.98)`;
        card.style.opacity = "0";

        requestAnimationFrame(() => {
          card.style.transition = `transform 450ms cubic-bezier(.2,.8,.2,1) ${index * 20}ms,
           opacity 320ms ease ${index * 15}ms`;

          card.style.transform = "";
          card.style.opacity = "1";
        });

        setTimeout(() => {
          card.classList.remove("moving");
        }, 450);
      }
    });
  }

  /* ======================================================
     MODAL
  ====================================================== */

  function openModal(index) {
    stopVideo();

    currentIndex = index;
    currentRotation = 0;

    const item = mediaList[index];
    imageModal.classList.add("open");

    modalImage.style.display = item.isVideo ? "none" : "block";
    modalVideo.style.display = item.isVideo ? "block" : "none";

    modalImage.style.transform = "rotate(0deg)";
    modalVideo.style.transform = "rotate(0deg)";

    if (item.isVideo) {
      modalVideo.src = item.url;
      modalVideo.play();
    } else {
      modalImage.src = item.url;
    }

    prevBtn.style.display = index === 0 ? "none" : "flex";
    nextBtn.style.display = index === mediaList.length - 1 ? "none" : "flex";
  }

  function closeModal() {
    stopVideo();
    imageModal.classList.remove("open");
    setPrivacy(privacyEnabled); // keep blur ON
  }

  imageModal.onclick = (e) => e.target === imageModal && closeModal();

  prevBtn.onclick = () => currentIndex > 0 && openModal(currentIndex - 1);
  nextBtn.onclick = () =>
    currentIndex < mediaList.length - 1 && openModal(currentIndex + 1);

  rotateBtn.onclick = () => {
    currentRotation += 90;

    const activeMedia =
      modalImage.style.display === "none" ? modalVideo : modalImage;

    activeMedia.style.transform = `rotate(${currentRotation}deg)`;

    // Adjust bounds when sideways
    if (Math.abs(currentRotation / 90) % 2 === 1) {
      activeMedia.style.maxWidth = "85vh";
      activeMedia.style.maxHeight = "90vw";
    } else {
      activeMedia.style.maxWidth = "90vw";
      activeMedia.style.maxHeight = "85vh";
    }
  };

  downloadBtn.addEventListener("click", async () => {
    if (currentIndex < 0) return showToast("❌ Nothing selected");

    const item = mediaList[currentIndex];
    if (!item) return showToast("❌ Media missing");

    try {
      const res = await fetch(item.url);
      const blob = await res.blob();

      const a = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);

      a.href = objectUrl;
      a.download = item.name; // EXACT SAME NAME
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);

      showToast(`⬇ Downloaded ${item.name}`);
    } catch {
      showToast("❌ Download failed");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!imageModal.classList.contains("open")) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft") prevBtn.click();
    if (e.key === "ArrowRight") nextBtn.click();
  });
  deleteBtn?.addEventListener("click", async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return showToast("Please login");

    const pins = await getUserPins(user.id);
    if (!pins) return showToast("PIN not set");

    const enteredRaw = await openPinGateModal({
      title: "Delete memory",
      desc: "Enter your DELETE PIN (reverse of your view PIN).",
      confirmText: "Delete",
    });

    if (enteredRaw === null) return; // user cancelled

    const entered = normalizePin(enteredRaw);
    if (!/^\d{4}$/.test(entered)) {
      pinGateSetError("Enter exactly 4 digits.");
      // reopen and stop
      return;
    }

    if (!/^\d{4}$/.test(entered)) return showToast("Enter exactly 4 digits");

    const enteredHash = await sha256(entered);
    if (enteredHash !== pins.delete_pin_hash)
      return showToast("❌ Wrong delete PIN");

    const item = mediaList[currentIndex];
    if (!item?.name) return showToast("❌ Missing file");

    const path = `${user.id}/${item.name}`;
    const { error } = await supabase.storage.from("memories").remove([path]);
    if (error) return showToast("❌ Delete failed");

    signedUrlCache.delete(item.name);
    showToast("🗑 Deleted");
    closeModal();
    await loadGallery();
  });

  /* ======================================================
     SHARING
  ====================================================== */

  shareBtn.addEventListener("click", async () => {
    if (currentIndex < 0) return;

    const item = mediaList[currentIndex];

    try {
      const res = await fetch(item.url);
      const blob = await res.blob();

      const file = new File([blob], item.name, { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Shared from MemoryBox",
          files: [file],
        });
      } else {
        showToast("Sharing not supported");
      }
    } catch {
      showToast("Share failed");
    }
  });

  function toggleSelect(index, card) {
    if (selectedItems.has(index)) {
      selectedItems.delete(index);
      card.classList.remove("selected");
    } else {
      selectedItems.add(index);
      card.classList.add("selected");
    }

    updateSelectionUI();

    if (selectedItems.size === 0) {
      exitSelectionMode();
    }
  }
  function updateSelectionUI() {
    const count = selectedItems.size;

    selectedCount.textContent = `${count} selected`;

    if (count > 0) {
      selectionBar.classList.add("active");
    } else {
      selectionBar.classList.remove("active");
    }
  }

  /* ======================================================
     INIT
  ====================================================== */

  async function initApp() {
    authSection.classList.add("hidden");
    app.classList.remove("hidden");

    // 🔔 Ask notification permission once
    if ("Notification" in window && Notification.permission !== "granted") {
      await Notification.requestPermission();
    }

    setPrivacy(true); // 🔐 default
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) await requirePinAndUnlock(user);
    // ✅ If user shared files into app before logging in, upload now
    if (pendingSharedFiles?.length) {
      const files = pendingSharedFiles;
      pendingSharedFiles = null;
      await handleFiles(files);
    }
  }

  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) initApp();
  });

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.onclick = () => {
      currentFilter = btn.dataset.filter;
      applyFilter();
    };
  });

  /* ============================
    RECEIVE SHARED FILES
============================ */

  // if (navigator.serviceWorker) {
  //   navigator.serviceWorker.addEventListener("message", async (event) => {
  //     if (event.data?.type === "SHARED_FILES") {
  //       const files = event.data.files;

  //       if (files && files.length > 0) {
  //         await supabase.auth.getUser();
  //         await handleFiles(files);
  //         showToast("📥 New memory received!");
  //       }
  //     }
  //   });
  // }

  function enableSelectionMode() {
    if (selectionMode) return;
    selectionMode = true;
    selectedItems.clear();
    document.getElementById("selectionBar").classList.add("active");
  }

  function exitSelectionMode() {
    selectionMode = false;
    selectedItems.clear();
    document
      .querySelectorAll(".image-card.selected")
      .forEach((card) => card.classList.remove("selected"));

    document.getElementById("selectionBar").classList.remove("active");
  }
  document
    .getElementById("downloadSelected")
    .addEventListener("click", async () => {
      if (selectedItems.size === 0) return;

      for (const index of selectedItems) {
        const item = mediaList[index];
        const res = await fetch(item.url);
        const blob = await res.blob();

        const a = document.createElement("a");
        const objectUrl = URL.createObjectURL(blob);

        a.href = objectUrl;
        a.download = item.name;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
      }

      showToast("⬇ Downloaded selected");
      exitSelectionMode();
    });

  document
    .getElementById("shareSelected")
    .addEventListener("click", async () => {
      if (selectedItems.size === 0) return;

      const filesToShare = [];

      for (const index of selectedItems) {
        const item = mediaList[index];
        const res = await fetch(item.url);
        const blob = await res.blob();
        filesToShare.push(new File([blob], item.name, { type: blob.type }));
      }

      if (navigator.canShare && navigator.canShare({ files: filesToShare })) {
        await navigator.share({
          title: "Shared from MemoryBox",
          files: filesToShare,
        });
      } else {
        showToast("Sharing not supported");
      }

      exitSelectionMode();
    });
  cancelBtn.addEventListener("click", exitSelectionMode);

  // function exitSelectionMode() {
  //   selectedItems.clear();

  //   document
  //     .querySelectorAll(".image-card.selected")
  //     .forEach((card) => card.classList.remove("selected"));

  //   updateSelectionUI();
  // }

  // --
  const mediaWrapper = document.getElementById("mediaWrapper");

  if (mediaWrapper) {
    mediaWrapper.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    mediaWrapper.addEventListener("dragstart", (e) => {
      e.preventDefault();
    });

    mediaWrapper.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length > 1) return;
        e.preventDefault();
      },
      { passive: false },
    );
  }
});
