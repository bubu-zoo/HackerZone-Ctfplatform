// HackerZone Admin Panel JavaScript

(function() {
    'use strict';

    // ==================== STATE ====================
    const state = {
        authenticated: false,
        challenges: [],
        users: [],
        logs: [],
        stats: {},
        currentPage: 'dashboard',
        csrfToken: null
    };

    // Categories and Difficulties
    const CATEGORIES = [
        'Web Exploitation',
        'Cryptography',
        'Reverse Engineering',
        'Binary Exploitation',
        'Forensics',
        'OSINT',
        'Miscellaneous',
        'Steganography'
    ];

    const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Expert', 'Insane'];

    // ==================== API ====================
    const API = {
        async request(endpoint, options = {}) {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': state.csrfToken || getCookie('csrfToken')
                },
                credentials: 'same-origin'
            };

            const config = { ...defaultOptions, ...options };
            if (config.body && typeof config.body === 'object') {
                config.body = JSON.stringify(config.body);
            }

            try {
                const response = await fetch(endpoint, config);
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Request failed');
                }
                
                return data;
            } catch (error) {
                console.error('API Error:', error);
                throw error;
            }
        },

        // Auth
        async login(credentials) {
            return this.request('/hackur/api/login', {
                method: 'POST',
                body: credentials
            });
        },

        async logout() {
            return this.request('/hackur/api/logout', {
                method: 'POST'
            });
        },

        async checkAuth() {
            return this.request('/hackur/api/check');
        },

        // Dashboard
        async getDashboard() {
            return this.request('/hackur/api/dashboard');
        },

        // Challenges
        async getChallenges() {
            return this.request('/hackur/api/challenges');
        },

        async getChallenge(id) {
            return this.request(`/hackur/api/challenges/${id}`);
        },

        async createChallenge(data) {
            return this.request('/hackur/api/challenges', {
                method: 'POST',
                body: data
            });
        },

        async updateChallenge(id, data) {
            return this.request(`/hackur/api/challenges/${id}`, {
                method: 'PUT',
                body: data
            });
        },

        async deleteChallenge(id) {
            return this.request(`/hackur/api/challenges/${id}`, {
                method: 'DELETE'
            });
        },

        async enableChallenge(id) {
            return this.request(`/hackur/api/challenges/${id}/enable`, {
                method: 'POST'
            });
        },

        async disableChallenge(id) {
            return this.request(`/hackur/api/challenges/${id}/disable`, {
                method: 'POST'
            });
        },

        // Users
        async getUsers() {
            return this.request('/hackur/api/users');
        },

        async banUser(id) {
            return this.request(`/hackur/api/users/${id}/ban`, {
                method: 'POST'
            });
        },

        async unbanUser(id) {
            return this.request(`/hackur/api/users/${id}/unban`, {
                method: 'POST'
            });
        },

        // Logs
        async getLogs(limit = 100) {
            return this.request(`/hackur/api/logs?limit=${limit}`);
        }
    };

    // ==================== UTILITIES ====================
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleString();
    }

    function showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle'
        };

        toast.innerHTML = `
            <i class="toast-icon ${icons[type]}"></i>
            <span>${escapeHtml(message)}</span>
        `;

        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'toastIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    function showLoading() {
        return '<div class="loading"><div class="spinner"></div></div>';
    }

    // ==================== MODALS ====================
    function openModal(title, content) {
        const overlay = document.getElementById('modalOverlay');
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = content;
        overlay.classList.add('active');
    }

    function closeModal() {
        document.getElementById('modalOverlay').classList.remove('active');
    }

    // ==================== AUTH ====================
    async function checkAuth() {
        try {
            const result = await API.checkAuth();
            if (result.authenticated) {
                state.authenticated = true;
                showAdminPanel();
                return true;
            }
        } catch (error) {
            console.log('Not authenticated');
        }
        state.authenticated = false;
        showLoginScreen();
        return false;
    }

    function showLoginScreen() {
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('adminContainer').style.display = 'none';
    }

    function showAdminPanel() {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('adminContainer').style.display = 'flex';
        document.getElementById('adminUsername').textContent = 'bubu';
        loadPage('dashboard');
    }

    async function handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';

        try {
            const formData = new FormData(form);
            await API.login({
                username: formData.get('username'),
                password: formData.get('password')
            });

            state.authenticated = true;
            showAdminPanel();
            showToast('Welcome, Admin!', 'success');
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        }
    }

    async function handleLogout() {
        try {
            await API.logout();
            state.authenticated = false;
            showLoginScreen();
            showToast('Logged out successfully', 'success');
        } catch (error) {
            showToast('Logout failed', 'error');
        }
    }

    // ==================== PAGES ====================
    async function loadPage(page) {
        state.currentPage = page;
        
        // Update sidebar
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });

        // Update title
        const titles = {
            dashboard: 'Dashboard',
            challenges: 'Challenges',
            users: 'Users',
            logs: 'Audit Logs'
        };
        document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';

        const content = document.getElementById('adminContent');
        content.innerHTML = showLoading();

        try {
            switch (page) {
                case 'challenges':
                    await loadChallengesPage();
                    break;
                case 'users':
                    await loadUsersPage();
                    break;
                case 'logs':
                    await loadLogsPage();
                    break;
                default:
                    await loadDashboard();
            }
        } catch (error) {
            content.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Page</h3>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            `;
        }
    }

    async function loadDashboard() {
        const data = await API.getDashboard();
        state.stats = data.stats;

        const content = document.getElementById('adminContent');
        content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon users"><i class="fas fa-users"></i></div>
                    <div class="stat-value">${data.stats.totalUsers}</div>
                    <div class="stat-label">Total Users</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon challenges"><i class="fas fa-flag"></i></div>
                    <div class="stat-value">${data.stats.totalChallenges}</div>
                    <div class="stat-label">Total Challenges</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon solves"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-value">${data.stats.totalSolves}</div>
                    <div class="stat-label">Total Solves</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon submissions"><i class="fas fa-paper-plane"></i></div>
                    <div class="stat-value">${data.stats.totalSubmissions}</div>
                    <div class="stat-label">Total Submissions</div>
                </div>
            </div>

            <div class="activity-list">
                <div class="activity-header">Recent Activity</div>
                ${data.recentActivity.length > 0 ? data.recentActivity.map(log => `
                    <div class="activity-item">
                        <div class="activity-icon ${getActivityIconClass(log.action)}">
                            <i class="fas ${getActivityIcon(log.action)}"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-text">
                                <strong>${escapeHtml(log.actor)}</strong> - ${escapeHtml(log.action)}
                                ${log.target ? ` → ${escapeHtml(log.target)}` : ''}
                            </div>
                            <div class="activity-time">${formatDate(log.created_at)}</div>
                        </div>
                    </div>
                `).join('') : '<div class="empty-state"><p>No recent activity</p></div>'}
            </div>
        `;
    }

    function getActivityIcon(action) {
        const icons = {
            'LOGIN_SUCCESS': 'fa-sign-in-alt',
            'LOGIN_FAILED': 'fa-times-circle',
            'CHALLENGE_SOLVED': 'fa-flag-checkered',
            'WRONG_FLAG': 'fa-times',
            'ADMIN_LOGIN_SUCCESS': 'fa-user-shield',
            'CHALLENGE_CREATED': 'fa-plus',
            'CHALLENGE_UPDATED': 'fa-edit',
            'CHALLENGE_DELETED': 'fa-trash',
            'USER_BANNED': 'fa-ban',
            'USER_UNBANNED': 'fa-user-check'
        };
        return icons[action] || 'fa-info-circle';
    }

    function getActivityIconClass(action) {
        if (action.includes('SUCCESS') || action.includes('SOLVED')) return 'login';
        if (action.includes('FAILED') || action.includes('WRONG')) return 'failed';
        if (action.includes('ADMIN')) return 'admin';
        return 'solve';
    }

    // ==================== CHALLENGES PAGE ====================
    async function loadChallengesPage() {
        const data = await API.getChallenges();
        state.challenges = data.challenges;

        const content = document.getElementById('adminContent');
        content.innerHTML = `
            <div class="data-table-container">
                <div class="data-table-header">
                    <span class="data-table-title">All Challenges (${state.challenges.length})</span>
                    <button class="btn btn-primary" onclick="Admin.showCreateChallenge()">
                        <i class="fas fa-plus"></i> Add Challenge
                    </button>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Difficulty</th>
                            <th>Points</th>
                            <th>Solves</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.challenges.length > 0 ? state.challenges.map(c => `
                            <tr>
                                <td>${c.id}</td>
                                <td>${escapeHtml(c.title)}</td>
                                <td>${escapeHtml(c.category)}</td>
                                <td>
                                    <span class="difficulty-badge ${c.difficulty.toLowerCase()}">
                                        ${c.difficulty}
                                    </span>
                                </td>
                                <td>${c.points}</td>
                                <td>${c.solves}</td>
                                <td>
                                    <span class="badge ${c.is_enabled ? 'badge-success' : 'badge-danger'}">
                                        ${c.is_enabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="action-btn edit" onclick="Admin.editChallenge(${c.id})" title="Edit">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="action-btn toggle" onclick="Admin.toggleChallenge(${c.id}, ${c.is_enabled})" title="Toggle">
                                            <i class="fas fa-${c.is_enabled ? 'eye-slash' : 'eye'}"></i>
                                        </button>
                                        <button class="action-btn delete" onclick="Admin.deleteChallenge(${c.id})" title="Delete">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="8" class="empty-state">No challenges found</td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
        `;
    }

    function showCreateChallenge() {
        openModal('Create Challenge', getChallengeForm());
        document.getElementById('challengeForm').addEventListener('submit', handleCreateChallenge);
    }

    async function editChallenge(id) {
        try {
            const data = await API.getChallenge(id);
            const challenge = data.challenge;
            
            openModal('Edit Challenge', getChallengeForm(challenge));
            document.getElementById('challengeForm').addEventListener('submit', (e) => handleUpdateChallenge(e, id));
        } catch (error) {
            showToast('Failed to load challenge', 'error');
        }
    }

    function getChallengeForm(challenge = null) {
        return `
            <form id="challengeForm">
                <div class="form-group">
                    <label class="form-label">Title *</label>
                    <input type="text" name="title" class="form-input" required
                           value="${challenge ? escapeHtml(challenge.title) : ''}"
                           maxlength="100">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Category *</label>
                        <select name="category" class="form-select" required>
                            ${CATEGORIES.map(cat => `
                                <option value="${cat}" ${challenge?.category === cat ? 'selected' : ''}>
                                    ${cat}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Difficulty *</label>
                        <select name="difficulty" class="form-select" required>
                            ${DIFFICULTIES.map(diff => `
                                <option value="${diff}" ${challenge?.difficulty === diff ? 'selected' : ''}>
                                    ${diff}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Description *</label>
                    <textarea name="description" class="form-textarea" required
                              maxlength="2000">${challenge ? escapeHtml(challenge.description) : ''}</textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Points *</label>
                        <input type="number" name="points" class="form-input" required
                               min="1" max="1000"
                               value="${challenge ? challenge.points : '100'}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Flag * (e.g., HZ{flag_here})</label>
                        <input type="text" name="flag" class="form-input" required
                               value="${challenge ? escapeHtml(challenge.flag) : 'HZ{'}"
                               pattern="HZ\\{[\\w\\-_!@#$%^&*()+=]+\\}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Hint (optional)</label>
                    <textarea name="hint" class="form-textarea"
                              maxlength="500">${challenge?.hint ? escapeHtml(challenge.hint) : ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Attachment URL (optional)</label>
                    <input type="url" name="attachment_url" class="form-input"
                           value="${challenge?.attachment_url ? escapeHtml(challenge.attachment_url) : ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-checkbox">
                        <input type="checkbox" name="is_enabled" ${!challenge || challenge.is_enabled ? 'checked' : ''}>
                        <span>Enabled (visible to users)</span>
                    </label>
                </div>
                
                <div class="modal-footer" style="padding: 1rem 0 0; border: none;">
                    <button type="button" class="btn btn-secondary" onclick="Admin.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> ${challenge ? 'Update' : 'Create'}
                    </button>
                </div>
            </form>
        `;
    }

    async function handleCreateChallenge(e) {
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

        try {
            const formData = new FormData(form);
            await API.createChallenge({
                title: formData.get('title'),
                description: formData.get('description'),
                category: formData.get('category'),
                difficulty: formData.get('difficulty'),
                points: parseInt(formData.get('points')),
                flag: formData.get('flag'),
                hint: formData.get('hint') || null,
                attachment_url: formData.get('attachment_url') || null,
                is_enabled: formData.get('is_enabled') === 'on'
            });

            closeModal();
            showToast('Challenge created successfully', 'success');
            loadChallengesPage();
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Create';
        }
    }

    async function handleUpdateChallenge(e, id) {
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

        try {
            const formData = new FormData(form);
            await API.updateChallenge(id, {
                title: formData.get('title'),
                description: formData.get('description'),
                category: formData.get('category'),
                difficulty: formData.get('difficulty'),
                points: parseInt(formData.get('points')),
                flag: formData.get('flag'),
                hint: formData.get('hint') || null,
                attachment_url: formData.get('attachment_url') || null,
                is_enabled: formData.get('is_enabled') === 'on'
            });

            closeModal();
            showToast('Challenge updated successfully', 'success');
            loadChallengesPage();
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Update';
        }
    }

    async function toggleChallenge(id, isEnabled) {
        try {
            if (isEnabled) {
                await API.disableChallenge(id);
                showToast('Challenge disabled', 'success');
            } else {
                await API.enableChallenge(id);
                showToast('Challenge enabled', 'success');
            }
            loadChallengesPage();
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    async function deleteChallenge(id) {
        if (!confirm('Are you sure you want to delete this challenge? This action cannot be undone.')) {
            return;
        }

        try {
            await API.deleteChallenge(id);
            showToast('Challenge deleted', 'success');
            loadChallengesPage();
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    // ==================== USERS PAGE ====================
    async function loadUsersPage() {
        const data = await API.getUsers();
        state.users = data.users;

        const content = document.getElementById('adminContent');
        content.innerHTML = `
            <div class="data-table-container">
                <div class="data-table-header">
                    <span class="data-table-title">All Users (${state.users.length})</span>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Score</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Last Login</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.users.length > 0 ? state.users.map(u => `
                            <tr>
                                <td>${u.id}</td>
                                <td>${escapeHtml(u.username)}</td>
                                <td>${escapeHtml(u.email)}</td>
                                <td>${u.score}</td>
                                <td>
                                    <span class="badge ${u.is_banned ? 'badge-danger' : 'badge-success'}">
                                        ${u.is_banned ? 'Banned' : 'Active'}
                                    </span>
                                </td>
                                <td>${formatDate(u.created_at)}</td>
                                <td>${formatDate(u.last_login)}</td>
                                <td>
                                    <div class="action-buttons">
                                        ${u.is_banned ? `
                                            <button class="action-btn" onclick="Admin.unbanUser(${u.id})" title="Unban">
                                                <i class="fas fa-user-check"></i>
                                            </button>
                                        ` : `
                                            <button class="action-btn delete" onclick="Admin.banUser(${u.id})" title="Ban">
                                                <i class="fas fa-ban"></i>
                                            </button>
                                        `}
                                    </div>
                                </td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="8" class="empty-state">No users found</td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
        `;
    }

    async function banUser(id) {
        if (!confirm('Are you sure you want to ban this user?')) return;

        try {
            await API.banUser(id);
            showToast('User banned', 'success');
            loadUsersPage();
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    async function unbanUser(id) {
        try {
            await API.unbanUser(id);
            showToast('User unbanned', 'success');
            loadUsersPage();
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    // ==================== LOGS PAGE ====================
    async function loadLogsPage() {
        const data = await API.getLogs(200);
        state.logs = data.logs;

        const content = document.getElementById('adminContent');
        content.innerHTML = `
            <div class="data-table-container">
                <div class="data-table-header">
                    <span class="data-table-title">Audit Logs (${state.logs.length})</span>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Action</th>
                            <th>Actor</th>
                            <th>Target</th>
                            <th>IP Address</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.logs.length > 0 ? state.logs.map(log => `
                            <tr>
                                <td style="white-space: nowrap;">${formatDate(log.created_at)}</td>
                                <td>
                                    <span class="badge ${getLogBadgeClass(log.action)}">
                                        ${escapeHtml(log.action)}
                                    </span>
                                </td>
                                <td>${escapeHtml(log.actor)}</td>
                                <td>${escapeHtml(log.target || '-')}</td>
                                <td><code>${escapeHtml(log.ip_address)}</code></td>
                                <td>${escapeHtml(log.details || '-')}</td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="6" class="empty-state">No logs found</td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
        `;
    }

    function getLogBadgeClass(action) {
        if (action.includes('SUCCESS') || action.includes('SOLVED') || action.includes('CREATED')) return 'badge-success';
        if (action.includes('FAILED') || action.includes('WRONG') || action.includes('DENIED')) return 'badge-danger';
        if (action.includes('ADMIN')) return 'badge-warning';
        return 'badge-info';
    }

    // ==================== INITIALIZATION ====================
    function init() {
        state.csrfToken = getCookie('csrfToken');

        // Login form
        document.getElementById('loginForm')?.addEventListener('submit', handleLogin);

        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

        // Sidebar navigation
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                loadPage(link.dataset.page);
            });
        });

        // Modal close
        document.getElementById('modalClose')?.addEventListener('click', closeModal);
        document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeModal();
        });

        // Check authentication
        checkAuth();
    }

    // ==================== PUBLIC API ====================
    window.Admin = {
        showCreateChallenge,
        editChallenge,
        toggleChallenge,
        deleteChallenge,
        banUser,
        unbanUser,
        closeModal
    };

    // Start
    document.addEventListener('DOMContentLoaded', init);
})();
