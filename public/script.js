// Role & State Management (Persist across pages)
const getRole = () => localStorage.getItem('userRole');
const getUserId = () => localStorage.getItem('userId') || '1';

document.addEventListener('DOMContentLoaded', () => {
    // Redirect if not logged in (and not on login page)
    const currentPath = window.location.pathname;
    if (!getRole() && !currentPath.includes('login.html')) {
        window.location.href = 'login.html';
        return;
    }

    lucide.createIcons();

    // UI components
    const adminSection = document.getElementById('admin-section');
    const booksGrid = document.getElementById('books-grid');
    const displayRole = document.getElementById('display-role');
    const logoutBtn = document.getElementById('logout-btn');

    // Update Header Display
    if (displayRole && getRole()) {
        displayRole.innerText = `${getRole().toUpperCase()} MODE ${getRole() === 'user' ? '(ID: ' + getUserId() + ')' : ''}`;
    }

    // Logout logic
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
            window.location.href = 'login.html';
        });
    }

    updateUIVisibility();

    if (booksGrid) loadBooks();

    function updateUIVisibility() {
        if (!adminSection) return;
        if (getRole() === 'admin') {
            adminSection.classList.remove('hidden');
        } else {
            adminSection.classList.add('hidden');
        }
    }

    // CRUD Operations
    async function loadBooks() {
        if (!booksGrid) return;
        booksGrid.innerHTML = '<div class="skeleton"></div>'.repeat(3);

        try {
            const response = await fetch('/api/books');
            const books = await response.json();

            booksGrid.innerHTML = '';
            if (books.length === 0) {
                booksGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-secondary);">Belum ada koleksi buku.</div>';
                return;
            }

            books.forEach(book => {
                const card = createBookCard(book);
                booksGrid.appendChild(card);
            });
            lucide.createIcons();
        } catch (error) {
            showToast('Gagal memuat katalog buku', 'error');
        }
    }

    function createBookCard(book) {
        const div = document.createElement('div');
        div.className = 'book-card';

        const isAdmin = getRole() === 'admin';

        div.innerHTML = `
            <h3>${book.title}</h3>
            <p class="author"><i data-lucide="user"></i> ${book.author}</p>
            <div class="stats">
                <span class="stock-pill ${book.stock <= 0 ? 'low' : ''}">
                    Stok: ${book.stock}
                </span>
            </div>
            <div class="book-actions">
                <button class="btn btn-secondary view-btn" style="flex: 1;"><i data-lucide="info"></i> Detail</button>
                ${isAdmin ? `
                    <button class="btn btn-secondary edit-btn"><i data-lucide="edit-3"></i></button>
                    <button class="btn btn-danger delete-btn"><i data-lucide="trash-2"></i></button>
                ` : `
                    <button class="btn btn-primary borrow-btn" style="flex: 2;" ${book.stock <= 0 ? 'disabled' : ''}>
                        <i data-lucide="map-pin"></i> Pinjam
                    </button>
                `}
            </div>
        `;

        div.querySelector('.view-btn').addEventListener('click', () => showDetail(book.id));

        if (isAdmin) {
            div.querySelector('.edit-btn').addEventListener('click', () => {
                location.href = `edit-book.html?id=${book.id}`;
            });
            div.querySelector('.delete-btn').addEventListener('click', () => deleteBook(book.id));
        } else if (book.stock > 0) {
            div.querySelector('.borrow-btn').addEventListener('click', () => borrowBook(book.id));
        }

        return div;
    }

    async function showDetail(id) {
        const modalContent = document.getElementById('book-detail-content');
        if (!modalContent) return;

        try {
            const response = await fetch(`/api/books/${id}`);
            const book = await response.json();

            modalContent.innerHTML = `
                <h2 style="margin-bottom: 2rem;">Detail Buku</h2>
                <div style="background: rgba(255,255,255,0.05); padding: 2rem; border-radius: 24px; border: 1px solid var(--glass-border);">
                    <p style="font-size: 1.75rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">${book.title}</p>
                    <p style="color: var(--text-secondary); margin-bottom: 2rem;">Penulis: ${book.author}</p>
                    <div class="stock-pill ${book.stock <= 0 ? 'low' : ''}">Stok Tersedia: ${book.stock}</div>
                    <hr style="border: none; border-top: 1px solid var(--glass-border); margin: 2rem 0;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.85rem; color: var(--text-secondary);">
                        <div>ID: #${book.id}</div>
                        <div>Terakhir Update: ${new Date(book.updatedAt).toLocaleDateString()}</div>
                    </div>
                </div>
            `;
            const detailModal = document.getElementById('detail-modal');
            if (detailModal) detailModal.classList.remove('hidden');
        } catch (error) {
            showToast('Gagal memuat detail buku', 'error');
        }
    }

    async function deleteBook(id) {
        if (!confirm('Hapus buku ini secara permanen?')) return;

        try {
            const role = getRole();
            const response = await fetch(`/api/books/${id}`, {
                method: 'DELETE',
                headers: { 'x-user-role': role }
            });

            if (response.ok) {
                showToast('Buku telah dihapus', 'success');
                loadBooks();
            } else {
                showToast('Gagal menghapus buku', 'error');
            }
        } catch (error) {
            showToast('Kesalahan jaringan', 'error');
        }
    }

    async function borrowBook(bookId) {
        if (!navigator.geolocation) {
            return showToast('Geolocation tidak didukung', 'error');
        }

        showToast('Mengambil lokasi...', 'info');

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const userId = getUserId();
            const role = getRole();

            try {
                const response = await fetch('/api/borrow', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-role': role,
                        'x-user-id': userId
                    },
                    body: JSON.stringify({ bookId, latitude, longitude })
                });

                const result = await response.json();
                if (response.ok) {
                    showToast('Buku berhasil dipinjam!', 'success');
                    loadBooks();
                } else {
                    showToast(result.message, 'error');
                }
            } catch (error) {
                showToast('Gangguan pada transaksi', 'error');
            }
        }, () => {
            showToast('Izin lokasi ditolak', 'error');
        });
    }
});

// Helper for global toast
window.showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'alert-circle' : 'info');

    toast.innerHTML = `
        <i data-lucide="${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 500)
    }, 4000);
}
