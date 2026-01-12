// Helper: load & save ke localStorage
const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

// State awal (gunakan dummy kalau belum ada)
const state = {
  siswa: storage.get("ss_siswa", [
    { id: "1", nama: "Budi Santoso", nis: "202301", kelas: "XI IPA 1", email: "ortu.budi@example.com" },
    { id: "2", nama: "Siti Aminah", nis: "202302", kelas: "XI IPS 2", email: "ortu.siti@example.com" },
  ]),
  surat: storage.get("ss_surat", []),
  spp: storage.get("ss_spp", []),
  izin: storage.get("ss_izin", []),
  pengaduan: storage.get("ss_pengaduan", []),
  user: storage.get("ss_user", { role: "guest", name: "Tamu" }),
};

function persist() {
  storage.set("ss_siswa", state.siswa);
  storage.set("ss_surat", state.surat);
  storage.set("ss_spp", state.spp);
  storage.set("ss_izin", state.izin);
  storage.set("ss_pengaduan", state.pengaduan);
  storage.set("ss_user", state.user);
}

// Format tanggal sederhana
function formatDate(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// SECTION SWITCHING
let showSection; // Declare globally so mobile menu can use it

function initNavigation() {
  const sections = document.querySelectorAll(".section");
  const navLinks = document.querySelectorAll(".nav-link");
  const sideItems = document.querySelectorAll(".sidebar-item");

  showSection = function(id) {
    sections.forEach((s) => s.classList.toggle("active", s.id === id));
    navLinks.forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.section === id)
    );
    sideItems.forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.section === id)
    );
    // Update mobile menu items too
    const mobileMenuItems = document.querySelectorAll(".mobile-menu-item");
    mobileMenuItems.forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.section === id)
    );
  };

  navLinks.forEach((btn) =>
    btn.addEventListener("click", () => showSection(btn.dataset.section))
  );
  sideItems.forEach((btn) =>
    btn.addEventListener("click", () => showSection(btn.dataset.section))
  );

  // Default update alerts by role
  updateRoleAlerts();
}

// AUTH
const demoAccounts = {
  admin: { password: "admin123", role: "admin", name: "Admin Sekolah" },
  guru: { password: "guru123", role: "guru", name: "Guru" },
  siswa: { password: "siswa123", role: "siswa", name: "Siswa" },
};

function updateUserUI() {
  const label = document.getElementById("user-role-label");
  const avatar = document.getElementById("user-avatar");
  if (!label || !avatar) return;
  label.textContent =
    state.user.role === "guest"
      ? "Belum Login"
      : `${state.user.name} (${state.user.role})`;
  avatar.textContent =
    state.user.name && state.user.name.length > 0
      ? state.user.name.charAt(0).toUpperCase()
      : "?";
  updateRoleAlerts();
}

function updateRoleAlerts() {
  const alerts = document.querySelectorAll(".role-alert");
  alerts.forEach((a) => {
    if (state.user.role === "guest") {
      a.style.display = "block";
    } else {
      a.style.display = "none";
    }
  });
  toggleFormsByRole();
}

function toggleFormsByRole() {
  // Guest: block all forms
  const forms = document.querySelectorAll("form");
  forms.forEach((f) => (f.querySelector("button[type='submit']").disabled = false));

  if (state.user.role === "guest") {
    disableForm("form-surat");
    disableForm("form-spp");
    disableForm("form-izin");
    disableForm("form-pengaduan");
    disableForm("form-siswa");
  } else if (state.user.role === "siswa") {
    // siswa boleh: surat, izin, pengaduan
    disableForm("form-spp");
    disableForm("form-siswa");
  } else if (state.user.role === "guru") {
    // guru boleh: surat, izin, pengaduan, spp
    disableForm("form-siswa");
  } else if (state.user.role === "admin") {
    // admin akses penuh
  }
}

function disableForm(id) {
  const form = document.getElementById(id);
  if (!form) return;
  const submit = form.querySelector("button[type='submit']");
  if (submit) submit.disabled = true;
}

function initAuth() {
  const modal = document.getElementById("auth-modal");
  const btnToggle = document.getElementById("btn-auth-toggle");
  const btnClose = document.getElementById("auth-close");
  const form = document.getElementById("auth-form");
  const note = document.getElementById("auth-note");

  function showModal() {
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
  }
  function hideModal() {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    note.textContent = "";
    note.className = "form-note";
    form.reset();
  }

  btnToggle.addEventListener("click", () => {
    if (state.user.role === "guest") {
      showModal();
    } else {
      // logout
      state.user = { role: "guest", name: "Tamu" };
      persist();
      updateUserUI();
      btnToggle.textContent = "Login";
    }
  });

  btnClose.addEventListener("click", hideModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) hideModal();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("auth-username").value.trim();
    const password = document.getElementById("auth-password").value.trim();
    const account = demoAccounts[username];
    if (!account || account.password !== password) {
      note.textContent = "Username/password salah.";
      note.className = "form-note error";
      return;
    }
    state.user = { role: account.role, name: account.name };
    persist();
    updateUserUI();
    document.getElementById("btn-auth-toggle").textContent = "Logout";
    hideModal();
  });
}

// RENDER FUNGSI
function renderDashboard() {
  const totalPengajuan =
    state.surat.length + state.izin.length + state.pengaduan.length;
  document.getElementById("stat-total-pengajuan").textContent =
    totalPengajuan.toString();

  document.getElementById("stat-spp-bulan").textContent =
    state.spp.length.toString();

  const openComplaints = state.pengaduan.filter((p) => p.status !== "selesai");
  document.getElementById("stat-pengaduan-open").textContent =
    openComplaints.length.toString();

  // Pengajuan terbaru (gabung surat + izin)
  const latest = [
    ...state.surat.map((s) => ({
      jenis: "Surat " + s.jenisLabel,
      siswa: s.nama,
      tanggal: s.tanggal,
      status: s.status,
    })),
    ...state.izin.map((i) => ({
      jenis: "Izin " + i.jenis.toUpperCase(),
      siswa: i.nama,
      tanggal: i.tanggal,
      status: i.status,
    })),
  ]
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    .slice(0, 5);

  const tbody = document.querySelector("#table-latest-pengajuan tbody");
  tbody.innerHTML = "";
  latest.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.siswa}</td>
      <td>${item.jenis}</td>
      <td>${formatDate(item.tanggal)}</td>
      <td><span class="badge badge-info">${item.status}</span></td>
    `;
    tbody.appendChild(tr);
  });

  // Pengaduan terbaru
  const ul = document.getElementById("list-latest-pengaduan");
  ul.innerHTML = "";
  state.pengaduan
    .slice()
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    .slice(0, 5)
    .forEach((p) => {
      const li = document.createElement("li");
      li.className = "list-item";
      li.innerHTML = `
        <div class="list-item-title">${p.nama} - ${p.kelas}</div>
        <div class="list-item-meta">${formatDate(
          p.tanggal
        )} • ${p.kategoriLabel}</div>
        <div class="list-item-text">${p.isi.slice(0, 80)}${
        p.isi.length > 80 ? "..." : ""
      }</div>
      `;
      ul.appendChild(li);
    });
}

function renderSurat() {
  const tbody = document.querySelector("#table-surat tbody");
  tbody.innerHTML = "";
  state.surat
    .slice()
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    .forEach((s) => {
      const canVerify = state.user.role === "admin" || state.user.role === "guru";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.nama}</td>
        <td>${s.jenisLabel}</td>
        <td>${formatDate(s.tanggal)}</td>
        <td>
          <span class="badge badge-info">${s.status}</span>
          ${
            canVerify && s.status !== "Diverifikasi"
              ? `<button class="btn small ghost" data-verify-surat="${s.id}" style="margin-left:4px;">Verifikasi</button>`
              : ""
          }
        </td>
      `;
      tbody.appendChild(tr);
    });

  // Event verifikasi surat
  tbody.querySelectorAll("[data-verify-surat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-verify-surat");
      const idx = state.surat.findIndex((x) => x.id === id);
      if (idx === -1) return;
      state.surat[idx].status = "Diverifikasi";
      persist();
      renderSurat();
      renderDashboard();
    });
  });
}

function renderSPP() {
  const tbody = document.querySelector("#table-spp tbody");
  tbody.innerHTML = "";
  state.spp
    .slice()
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    .forEach((s) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.nama}</td>
        <td>${s.bulanLabel}</td>
        <td>Rp ${s.nominal.toLocaleString("id-ID")}</td>
        <td>${formatDate(s.tanggal)}</td>
      `;
      tbody.appendChild(tr);
    });
}

function renderIzin() {
  const tbody = document.querySelector("#table-izin tbody");
  tbody.innerHTML = "";
  state.izin
    .slice()
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    .forEach((i) => {
      const canVerify = state.user.role === "admin" || state.user.role === "guru";
      const tr = document.createElement("tr");
      const jenisLabel =
        i.jenis === "sakit"
          ? "Sakit"
          : i.jenis === "izin"
          ? "Izin"
          : "Alpha";
      tr.innerHTML = `
        <td>${i.nama}</td>
        <td>${formatDate(i.tanggal)}</td>
        <td>${jenisLabel}</td>
        <td>
          <span class="badge badge-warning">${i.status}</span>
          ${
            canVerify && i.status !== "Disetujui"
              ? `<button class="btn small ghost" data-verify-izin="${i.id}" style="margin-left:4px;">Setujui</button>`
              : ""
          }
        </td>
      `;
      tbody.appendChild(tr);
    });

  // Event verifikasi izin
  tbody.querySelectorAll("[data-verify-izin]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-verify-izin");
      const idx = state.izin.findIndex((x) => x.id === id);
      if (idx === -1) return;
      state.izin[idx].status = "Disetujui";
      persist();
      renderIzin();
      renderDashboard();
    });
  });
}

function renderPengaduan() {
  const ul = document.getElementById("list-pengaduan");
  ul.innerHTML = "";
  state.pengaduan
    .slice()
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    .forEach((p) => {
      const canClose = state.user.role === "admin" || state.user.role === "guru";
      const li = document.createElement("li");
      li.className = "list-item";
      li.innerHTML = `
        <div class="list-item-title">${p.nama} - ${p.kelas}</div>
        <div class="list-item-meta">
          ${formatDate(p.tanggal)} • ${p.kategoriLabel} • Status: ${p.status}
        </div>
        <div class="list-item-text">${p.isi}</div>
        ${
          canClose && p.status !== "Selesai"
            ? `<button class="btn small ghost" data-done-pengaduan="${p.id}" style="margin-top:4px;">Tandai Selesai</button>`
            : ""
        }
      `;
      ul.appendChild(li);
    });

  // Event tandai pengaduan selesai
  ul.querySelectorAll("[data-done-pengaduan]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-done-pengaduan");
      const idx = state.pengaduan.findIndex((x) => x.id === id);
      if (idx === -1) return;
      state.pengaduan[idx].status = "Selesai";
      persist();
      renderPengaduan();
      renderDashboard();
    });
  });
}

function renderSiswa() {
  const tbody = document.querySelector("#table-siswa tbody");
  tbody.innerHTML = "";
  state.siswa.forEach((s) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.nama}</td>
      <td>${s.nis}</td>
      <td>${s.kelas}</td>
      <td>
        <div class="table-actions">
          <button class="btn small ghost" data-edit-siswa="${s.id}">Edit</button>
          <button class="btn small" data-del-siswa="${s.id}">Hapus</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Event edit/hapus
  tbody.querySelectorAll("[data-edit-siswa]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-edit-siswa");
      const s = state.siswa.find((x) => x.id === id);
      if (!s) return;
      document.getElementById("siswa-id").value = s.id;
      document.getElementById("siswa-nama").value = s.nama;
      document.getElementById("siswa-nis").value = s.nis;
      document.getElementById("siswa-kelas").value = s.kelas;
      document.getElementById("siswa-email").value = s.email || "";
    });
  });

  tbody.querySelectorAll("[data-del-siswa]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-del-siswa");
      if (!confirm("Hapus data siswa ini?")) return;
      state.siswa = state.siswa.filter((x) => x.id !== id);
      persist();
      renderSiswa();
    });
  });
}

// FORM HANDLERS
function initForms() {
  // Isi pilihan bulan SPP
  const bulanSelect = document.getElementById("spp-bulan");
  const bulan = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  bulan.forEach((b, i) => {
    const opt = document.createElement("option");
    opt.value = i + 1;
    opt.textContent = b;
    bulanSelect.appendChild(opt);
  });

  // Form surat
  document
    .getElementById("form-surat")
    .addEventListener("submit", (event) => {
      event.preventDefault();
      const nama = document.getElementById("surat-nama").value.trim();
      const nis = document.getElementById("surat-nis").value.trim();
      const jenis = document.getElementById("surat-jenis").value;
      const ket = document.getElementById("surat-keterangan").value.trim();
      const note = document.getElementById("surat-note");

      if (!nama || !nis || !jenis) {
        note.textContent = "Lengkapi data terlebih dahulu.";
        note.className = "form-note error";
        return;
      }

      const jenisLabel =
        jenis === "keterangan-aktif"
          ? "Keterangan Aktif"
          : jenis === "izin-kegiatan"
          ? "Izin Kegiatan"
          : "Rekomendasi Beasiswa";

      state.surat.push({
        id: Date.now().toString(),
        nama,
        nis,
        jenis,
        jenisLabel,
        keperluan: ket,
        status: "Menunggu verifikasi",
        tanggal: new Date().toISOString(),
      });
      persist();
      renderSurat();
      renderDashboard();

      event.target.reset();
      note.textContent = "Pengajuan surat berhasil disimpan (mode demo).";
      note.className = "form-note success";
    });

  // Form SPP
  document.getElementById("form-spp").addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = document.getElementById("spp-nama").value.trim();
    const nis = document.getElementById("spp-nis").value.trim();
    const bulanVal = document.getElementById("spp-bulan").value;
    const nominalVal = parseInt(
      document.getElementById("spp-nominal").value,
      10
    );
    const note = document.getElementById("spp-note");

    if (!nama || !nis || !bulanVal || !nominalVal) {
      note.textContent = "Lengkapi semua data pembayaran.";
      note.className = "form-note error";
      return;
    }

    state.spp.push({
      id: Date.now().toString(),
      nama,
      nis,
      bulan: parseInt(bulanVal, 10),
      bulanLabel: bulan[parseInt(bulanVal, 10) - 1],
      nominal: nominalVal,
      tanggal: new Date().toISOString(),
    });
    persist();
    renderSPP();
    renderDashboard();

    e.target.reset();
    note.textContent = "Pembayaran SPP tercatat (mode demo).";
    note.className = "form-note success";
  });

  // Form izin
  document.getElementById("form-izin").addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = document.getElementById("izin-nama").value.trim();
    const nis = document.getElementById("izin-nis").value.trim();
    const tanggal = document.getElementById("izin-tanggal").value;
    const jenis = document.getElementById("izin-jenis").value;
    const ket = document.getElementById("izin-keterangan").value.trim();
    const note = document.getElementById("izin-note");

    if (!nama || !nis || !tanggal || !jenis) {
      note.textContent = "Lengkapi data pengajuan izin.";
      note.className = "form-note error";
      return;
    }

    state.izin.push({
      id: Date.now().toString(),
      nama,
      nis,
      tanggal,
      jenis,
      keterangan: ket,
      status: "Menunggu konfirmasi",
    });
    persist();
    renderIzin();
    renderDashboard();

    e.target.reset();
    note.textContent = "Pengajuan izin tersimpan (mode demo).";
    note.className = "form-note success";
  });

  // Form pengaduan
  document
    .getElementById("form-pengaduan")
    .addEventListener("submit", (e) => {
      e.preventDefault();
      const nama = document.getElementById("pengaduan-nama").value.trim();
      const kelas = document.getElementById("pengaduan-kelas").value.trim();
      const jenis = document.getElementById("pengaduan-jenis").value;
      const isi = document.getElementById("pengaduan-isi").value.trim();
      const note = document.getElementById("pengaduan-note");

      if (!nama || !kelas || !jenis || !isi) {
        note.textContent = "Lengkapi semua field pengaduan.";
        note.className = "form-note error";
        return;
      }

      const kategoriLabel =
        jenis === "fasilitas"
          ? "Fasilitas Sekolah"
          : jenis === "pembelajaran"
          ? "Pembelajaran"
          : jenis === "bimbingan"
          ? "Bimbingan / BK"
          : "Lainnya";

      state.pengaduan.push({
        id: Date.now().toString(),
        nama,
        kelas,
        kategori: jenis,
        kategoriLabel,
        isi,
        status: "Belum dibaca",
        tanggal: new Date().toISOString(),
      });
      persist();
      renderPengaduan();
      renderDashboard();

      e.target.reset();
      note.textContent = "Pengaduan terkirim (mode demo).";
      note.className = "form-note success";
    });

  // Form siswa
  document.getElementById("form-siswa").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("siswa-id").value;
    const nama = document.getElementById("siswa-nama").value.trim();
    const nis = document.getElementById("siswa-nis").value.trim();
    const kelas = document.getElementById("siswa-kelas").value.trim();
    const email = document.getElementById("siswa-email").value.trim();
    const note = document.getElementById("siswa-note");

    if (!nama || !nis || !kelas) {
      note.textContent = "Nama, NIS, dan kelas wajib diisi.";
      note.className = "form-note error";
      return;
    }

    if (id) {
      const idx = state.siswa.findIndex((s) => s.id === id);
      if (idx !== -1) {
        state.siswa[idx] = { ...state.siswa[idx], nama, nis, kelas, email };
      }
    } else {
      state.siswa.push({
        id: Date.now().toString(),
        nama,
        nis,
        kelas,
        email,
      });
    }

    persist();
    renderSiswa();
    document.getElementById("form-siswa").reset();
    document.getElementById("siswa-id").value = "";
    note.textContent = "Data siswa tersimpan (mode demo).";
    note.className = "form-note success";
  });
}

// INIT
// Mobile Menu Toggle
function initMobileMenu() {
  const toggleBtn = document.getElementById("mobile-menu-toggle");
  const overlay = document.getElementById("mobile-menu-overlay");
  const mobileMenuItems = document.querySelectorAll(".mobile-menu-item");

  if (!toggleBtn || !overlay) return;

  toggleBtn.addEventListener("click", () => {
    toggleBtn.classList.toggle("active");
    overlay.classList.toggle("active");
    // Prevent body scroll when menu is open
    document.body.style.overflow = overlay.classList.contains("active") ? "hidden" : "";
  });

  // Close menu when clicking outside
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      toggleBtn.classList.remove("active");
      overlay.classList.remove("active");
      document.body.style.overflow = "";
    }
  });

  // Handle mobile menu item clicks
  mobileMenuItems.forEach((item) => {
    item.addEventListener("click", () => {
      const section = item.dataset.section;
      if (section && showSection) {
        showSection(section);
        toggleBtn.classList.remove("active");
        overlay.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initAuth();
  initForms();
  initMobileMenu();
  renderSurat();
  renderSPP();
  renderIzin();
  renderPengaduan();
  renderSiswa();
  renderDashboard();
  updateUserUI();

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear().toString();
});

