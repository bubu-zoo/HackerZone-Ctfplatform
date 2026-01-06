// HackerZone CTF Platform - Main JavaScript

(function() {
    'use strict';

    // ==================== STATE ====================
    const state = {
        user: null,
        challenges: {},
        categories: [],
        leaderboard: [],
        currentPage: 'home',
        csrfToken: null
    };

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
        async register(userData) {
            return this.request('/api/auth/register', {
                method: 'POST',
                body: userData
            });
        },

        async login(credentials) {
            return this.request('/api/auth/login', {
                method: 'POST',
                body: credentials
            });
        },

        async logout() {
            return this.request('/api/auth/logout', {
                method: 'POST'
            });
        },

        async checkAuth() {
            return this.request('/api/auth/check');
        },

        async getMe() {
            return this.request('/api/auth/me');
        },

        // Challenges
        async getChallenges() {
            return this.request('/api/challenges');
        },

        async getChallenge(id) {
            return this.request(`/api/challenges/${id}`);
        },

        async submitFlag(challengeId, flag) {
            return this.request(`/api/challenges/${challengeId}/submit`, {
                method: 'POST',
                body: { flag }
            });
        },

        async unlockHint(challengeId) {
            return this.request(`/api/challenges/${challengeId}/unlock-hint`, {
                method: 'POST'
            });
        },

        // Leaderboard
        async getLeaderboard() {
            return this.request('/api/leaderboard');
        },

        async getStats() {
            return this.request('/api/leaderboard/stats');
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
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle'
        };

        toast.innerHTML = `
            <i class="toast-icon ${icons[type]}"></i>
            <span class="toast-message">${escapeHtml(message)}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastSlideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    function showLoading() {
        return '<div class="loading"><div class="spinner"></div></div>';
    }

    // ==================== MODALS ====================
    function openModal(title, content) {
        const overlay = document.getElementById('modalOverlay');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');

        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        const overlay = document.getElementById('modalOverlay');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ==================== AUTH ====================
    async function checkAuthentication() {
        try {
            const result = await API.checkAuth();
            if (result.authenticated) {
                const userData = await API.getMe();
                state.user = userData.user;
                updateNavAuth();
                return true;
            }
        } catch (error) {
            console.log('Not authenticated');
        }
        state.user = null;
        updateNavAuth();
        return false;
    }

    function updateNavAuth() {
        const navAuth = document.getElementById('navAuth');
        
        if (state.user) {
            navAuth.innerHTML = `
                <div class="user-profile">
                    <button class="user-btn" id="userBtn">
                        <div class="user-avatar">${state.user.username.charAt(0).toUpperCase()}</div>
                        <div class="user-info">
                            <div class="user-name">${escapeHtml(state.user.username)}</div>
                            <div class="user-score">${state.user.score} pts</div>
                        </div>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="user-dropdown" id="userDropdown">
                        <button class="dropdown-item" onclick="App.showProfile()">
                            <i class="fas fa-user"></i> Profile
                        </button>
                        <div class="dropdown-divider"></div>
                        <button class="dropdown-item danger" onclick="App.logout()">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </div>
            `;

            // Dropdown toggle
            const userBtn = document.getElementById('userBtn');
            const userDropdown = document.getElementById('userDropdown');
            
            userBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('active');
            });

            document.addEventListener('click', () => {
                userDropdown?.classList.remove('active');
            });
        } else {
            navAuth.innerHTML = `
                <button class="btn btn-secondary" onclick="App.showLogin()">Login</button>
                <button class="btn btn-primary" onclick="App.showRegister()">Register</button>
            `;
        }
    }

    function showLogin() {
        openModal('Login', `
            <form id="loginForm" class="auth-form">
                <div class="form-group">
                    <label class="form-label">Username</label>
                    <input type="text" name="username" class="form-input" required 
                           autocomplete="username" maxlength="20">
                </div>
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" name="password" class="form-input" required 
                           autocomplete="current-password">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
                    <i class="fas fa-sign-in-alt"></i> Login
                </button>
            </form>
            <div class="auth-footer">
                Don't have an account? <a href="#" onclick="App.showRegister(); return false;">Register</a>
            </div>
        `);

        document.getElementById('loginForm').addEventListener('submit', handleLogin);
    }

    function showRegister() {
        openModal('Create Account', `
            <form id="registerForm" class="auth-form">
                <div class="form-group">
                    <label class="form-label">Username</label>
                    <input type="text" name="username" class="form-input" required 
                           autocomplete="username" maxlength="20" pattern="[a-zA-Z0-9_]{3,20}">
                    <small class="form-error" style="display: none;"></small>
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" name="email" class="form-input" required 
                           autocomplete="email">
                </div>
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" name="password" class="form-input" required 
                           autocomplete="new-password" id="regPassword">
                    <ul class="password-requirements">
                        <li data-req="length">At least 8 characters</li>
                        <li data-req="upper">One uppercase letter</li>
                        <li data-req="lower">One lowercase letter</li>
                        <li data-req="number">One number</li>
                        <li data-req="special">One special character</li>
                    </ul>
                </div>
                <div class="form-group">
                    <label class="form-label">Confirm Password</label>
                    <input type="password" name="confirmPassword" class="form-input" required 
                           autocomplete="new-password">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
                    <i class="fas fa-user-plus"></i> Register
                </button>
            </form>
            <div class="auth-footer">
                Already have an account? <a href="#" onclick="App.showLogin(); return false;">Login</a>
            </div>
        `);

        // Password validation
        const passwordInput = document.getElementById('regPassword');
        passwordInput?.addEventListener('input', validatePasswordInput);

        document.getElementById('registerForm').addEventListener('submit', handleRegister);
    }

    function validatePasswordInput(e) {
        const password = e.target.value;
        const requirements = document.querySelectorAll('.password-requirements li');
        
        const checks = {
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        requirements.forEach(li => {
            const req = li.dataset.req;
            li.classList.toggle('valid', checks[req]);
        });
    }

    async function handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

        try {
            const formData = new FormData(form);
            await API.login({
                username: formData.get('username'),
                password: formData.get('password')
            });

            closeModal();
            await checkAuthentication();
            showToast('Welcome back!', 'success');
            
            if (state.currentPage === 'challenges') {
                loadChallenges();
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

        try {
            const formData = new FormData(form);
            await API.register({
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword')
            });

            closeModal();
            showToast('Account created! Please login.', 'success');
            showLogin();
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-user-plus"></i> Register';
        }
    }

    async function logout() {
        try {
            await API.logout();
            state.user = null;
            updateNavAuth();
            showToast('Logged out successfully', 'success');
            navigate('home');
        } catch (error) {
            showToast('Logout failed', 'error');
        }
    }

    // ==================== PAGES ====================
    async function loadHomePage() {
        const main = document.getElementById('mainContent');
        main.innerHTML = showLoading();

        try {
            const stats = await API.getStats();
            
            main.innerHTML = `
                <div class="hero">
                    <h1 class="hero-title">Welcome to HackerZone</h1>
                    <p class="hero-subtitle">
                        Test your hacking skills, solve challenges, and compete with hackers worldwide. 
                        Are you ready to capture the flags?
                    </p>
                    <div class="hero-actions">
                        ${!state.user ? `
                            <button class="btn btn-primary" onclick="App.showRegister()">
                                <i class="fas fa-rocket"></i> Get Started
                            </button>
                        ` : `
                            <button class="btn btn-primary" onclick="App.navigate('challenges')">
                                <i class="fas fa-flag"></i> Start Hacking
                            </button>
                        `}
                        <button class="btn btn-secondary" onclick="App.navigate('leaderboard')">
                            <i class="fas fa-trophy"></i> View Leaderboard
                        </button>
                    </div>
                    <div class="hero-stats">
                        <div class="stat-card">
                            <div class="stat-value">${stats.stats.totalPlayers}</div>
                            <div class="stat-label">Players</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.stats.totalChallenges}</div>
                            <div class="stat-label">Challenges</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.stats.totalSolves}</div>
                            <div class="stat-label">Flags Captured</div>
                        </div>
                    </div>
                </div>

                <div class="features">
                    <div class="feature-card">
                        <div class="feature-icon"><i class="fas fa-globe"></i></div>
                        <h3 class="feature-title">Web Exploitation</h3>
                        <p class="feature-desc">SQL injection, XSS, CSRF, and more web vulnerabilities to exploit.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon"><i class="fas fa-lock"></i></div>
                        <h3 class="feature-title">Cryptography</h3>
                        <p class="feature-desc">Break ciphers, crack hashes, and defeat encryption schemes.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon"><i class="fas fa-microchip"></i></div>
                        <h3 class="feature-title">Reverse Engineering</h3>
                        <p class="feature-desc">Analyze binaries, crack keygens, and understand malware.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon"><i class="fas fa-bug"></i></div>
                        <h3 class="feature-title">Binary Exploitation</h3>
                        <p class="feature-desc">Buffer overflows, ROP chains, and memory corruption.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon"><i class="fas fa-search"></i></div>
                        <h3 class="feature-title">Forensics</h3>
                        <p class="feature-desc">Investigate disk images, network captures, and memory dumps.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon"><i class="fas fa-user-secret"></i></div>
                        <h3 class="feature-title">OSINT</h3>
                        <p class="feature-desc">Gather intelligence from public sources and social media.</p>
                    </div>
                </div>
            `;
        } catch (error) {
            main.innerHTML = `
                <div class="hero">
                    <h1 class="hero-title">Welcome to HackerZone</h1>
                    <p class="hero-subtitle">
                        Test your hacking skills, solve challenges, and compete with hackers worldwide.
                    </p>
                    <button class="btn btn-primary" onclick="App.showRegister()">
                        <i class="fas fa-rocket"></i> Get Started
                    </button>
                </div>
            `;
        }
    }

    async function loadChallenges() {
        const main = document.getElementById('mainContent');
        
        if (!state.user) {
            main.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-lock"></i>
                    <h3>Authentication Required</h3>
                    <p>Please login to view challenges</p>
                    <button class="btn btn-primary" onclick="App.showLogin()" style="margin-top: 1rem;">
                        <i class="fas fa-sign-in-alt"></i> Login
                    </button>
                </div>
            `;
            return;
        }

        main.innerHTML = showLoading();

        try {
            const data = await API.getChallenges();
            state.challenges = data.challenges;
            state.categories = data.categories;

            renderChallenges();
        } catch (error) {
            showToast('Failed to load challenges', 'error');
            main.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to Load</h3>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            `;
        }
    }

    function renderChallenges(filterCategory = 'all', filterDifficulty = 'all') {
        const main = document.getElementById('mainContent');
        
        let html = `
            <div class="challenges-header">
                <h1 class="challenges-title"><i class="fas fa-flag"></i> Challenges</h1>
                <div class="challenges-filters">
                    <select class="filter-select" id="categoryFilter" onchange="App.filterChallenges()">
                        <option value="all">All Categories</option>
                        ${state.categories.map(cat => 
                            `<option value="${escapeHtml(cat)}" ${filterCategory === cat ? 'selected' : ''}>${escapeHtml(cat)}</option>`
                        ).join('')}
                    </select>
                    <select class="filter-select" id="difficultyFilter" onchange="App.filterChallenges()">
                        <option value="all">All Difficulties</option>
                        <option value="Easy" ${filterDifficulty === 'Easy' ? 'selected' : ''}>Easy</option>
                        <option value="Medium" ${filterDifficulty === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="Hard" ${filterDifficulty === 'Hard' ? 'selected' : ''}>Hard</option>
                        <option value="Expert" ${filterDifficulty === 'Expert' ? 'selected' : ''}>Expert</option>
                        <option value="Insane" ${filterDifficulty === 'Insane' ? 'selected' : ''}>Insane</option>
                    </select>
                </div>
            </div>
        `;

        const categoryIcons = {
            'Web Exploitation': 'fa-globe',
            'Cryptography': 'fa-lock',
            'Reverse Engineering': 'fa-microchip',
            'Binary Exploitation': 'fa-bug',
            'Forensics': 'fa-search',
            'OSINT': 'fa-user-secret',
            'Miscellaneous': 'fa-puzzle-piece',
            'Steganography': 'fa-image'
        };

        for (const category of state.categories) {
            let challenges = state.challenges[category] || [];
            
            // Apply filters
            if (filterCategory !== 'all' && filterCategory !== category) continue;
            if (filterDifficulty !== 'all') {
                challenges = challenges.filter(c => c.difficulty === filterDifficulty);
            }
            
            if (challenges.length === 0) continue;

            html += `
                <div class="category-section">
                    <div class="category-header">
                        <i class="category-icon fas ${categoryIcons[category] || 'fa-flag'}"></i>
                        <h2 class="category-title">${escapeHtml(category)}</h2>
                        <span class="category-count">${challenges.length} challenges</span>
                    </div>
                    <div class="challenges-grid">
                        ${challenges.map(challenge => `
                            <div class="challenge-card ${challenge.solved ? 'solved' : ''}" 
                                 onclick="App.openChallenge(${challenge.id})">
                                <div class="challenge-header">
                                    <h3 class="challenge-title">${escapeHtml(challenge.title)}</h3>
                                    <span class="challenge-points">${challenge.points} pts</span>
                                </div>
                                <p class="challenge-desc">${escapeHtml(challenge.description)}</p>
                                <div class="challenge-meta">
                                    <span class="challenge-difficulty ${challenge.difficulty.toLowerCase()}">
                                        ${challenge.difficulty}
                                    </span>
                                    <span class="challenge-solves">
                                        <i class="fas fa-check"></i> ${challenge.solves} solves
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if (html === `
            <div class="challenges-header">
                <h1 class="challenges-title"><i class="fas fa-flag"></i> Challenges</h1>
                <div class="challenges-filters">
                    <select class="filter-select" id="categoryFilter" onchange="App.filterChallenges()">
                        <option value="all">All Categories</option>
                        ${state.categories.map(cat => 
                            `<option value="${escapeHtml(cat)}" ${filterCategory === cat ? 'selected' : ''}>${escapeHtml(cat)}</option>`
                        ).join('')}
                    </select>
                    <select class="filter-select" id="difficultyFilter" onchange="App.filterChallenges()">
                        <option value="all">All Difficulties</option>
                        <option value="Easy" ${filterDifficulty === 'Easy' ? 'selected' : ''}>Easy</option>
                        <option value="Medium" ${filterDifficulty === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="Hard" ${filterDifficulty === 'Hard' ? 'selected' : ''}>Hard</option>
                        <option value="Expert" ${filterDifficulty === 'Expert' ? 'selected' : ''}>Expert</option>
                        <option value="Insane" ${filterDifficulty === 'Insane' ? 'selected' : ''}>Insane</option>
                    </select>
                </div>
            </div>
        `) {
            html += `
                <div class="empty-state">
                    <i class="fas fa-flag"></i>
                    <h3>No Challenges Found</h3>
                    <p>Try adjusting your filters</p>
                </div>
            `;
        }

        main.innerHTML = html;
    }

    function filterChallenges() {
        const category = document.getElementById('categoryFilter').value;
        const difficulty = document.getElementById('difficultyFilter').value;
        renderChallenges(category, difficulty);
    }

    async function openChallenge(id) {
        try {
            const data = await API.getChallenge(id);
            const challenge = data.challenge;

            // Build hint section based on unlock status
            let hintSection = '';
            if (challenge.hintUnlocked && challenge.hint) {
                // Hint is unlocked - show it
                hintSection = `
                    <div class="challenge-hint">
                        <div class="challenge-hint-title"><i class="fas fa-lightbulb"></i> Hint (Unlocked)</div>
                        <div>${escapeHtml(challenge.hint)}</div>
                    </div>
                `;
            } else if (challenge.hintCost) {
                // Hint is locked - show unlock button
                hintSection = `
                    <div class="challenge-hint locked" id="hintSection-${challenge.id}">
                        <div class="challenge-hint-title"><i class="fas fa-lock"></i> Hint Locked</div>
                        <div style="margin-bottom: 10px; color: #888;">
                            Spend <strong style="color: var(--accent-secondary)">${challenge.hintCost} points</strong> to unlock the hint.
                        </div>
                        <button class="btn btn-secondary btn-small" onclick="App.unlockHint(${challenge.id}, ${challenge.hintCost})">
                            <i class="fas fa-unlock"></i> Unlock Hint (-${challenge.hintCost} pts)
                        </button>
                    </div>
                `;
            }

            openModal(challenge.title, `
                <div class="challenge-modal">
                    <div class="challenge-modal-category">${escapeHtml(challenge.category)}</div>
                    <div class="challenge-modal-meta">
                        <span class="challenge-difficulty ${challenge.difficulty.toLowerCase()}">
                            ${challenge.difficulty}
                        </span>
                        <span class="challenge-points">${challenge.points} pts</span>
                        <span class="challenge-solves">
                            <i class="fas fa-check"></i> ${challenge.solves} solves
                        </span>
                    </div>
                    <div class="challenge-modal-desc">${escapeHtml(challenge.description)}</div>
                    ${hintSection}
                    ${challenge.attachment_url ? `
                        <div style="margin-bottom: 1.5rem;">
                            <a href="${escapeHtml(challenge.attachment_url)}" class="btn btn-primary btn-small" 
                               target="_blank" rel="noopener noreferrer">
                                <i class="fas fa-external-link-alt"></i> Open Challenge
                            </a>
                        </div>
                    ` : ''}
                    ${challenge.solved ? `
                        <div class="challenge-hint" style="background: rgba(0,255,136,0.1); border-color: var(--accent-primary);">
                            <div style="color: var(--accent-primary); font-weight: 600;">
                                <i class="fas fa-check-circle"></i> Challenge Solved!
                            </div>
                        </div>
                    ` : `
                        <form class="flag-form" onsubmit="App.submitFlag(event, ${challenge.id})">
                            <input type="text" class="flag-input" placeholder="HZ{your_flag_here}" 
                                   required pattern="HZ\\{[\\w\\-_!@#$%^&*()+=]+\\}">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-flag"></i> Submit
                            </button>
                        </form>
                    `}
                </div>
            `);
        } catch (error) {
            showToast('Failed to load challenge', 'error');
        }
    }

    async function unlockHint(challengeId, cost) {
        if (!confirm(`Are you sure you want to spend ${cost} points to unlock this hint?`)) {
            return;
        }

        try {
            const result = await API.unlockHint(challengeId);
            
            if (result.success) {
                showToast(result.message, 'success');
                
                // Update user score in state
                if (result.newScore !== undefined) {
                    state.user.score = result.newScore;
                    updateNavAuth();
                }
                
                // Update the hint section in the modal
                const hintSection = document.getElementById(`hintSection-${challengeId}`);
                if (hintSection && result.hint) {
                    hintSection.className = 'challenge-hint';
                    hintSection.innerHTML = `
                        <div class="challenge-hint-title"><i class="fas fa-lightbulb"></i> Hint (Unlocked)</div>
                        <div>${escapeHtml(result.hint)}</div>
                    `;
                }
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    async function submitFlag(e, challengeId) {
        e.preventDefault();
        const form = e.target;
        const input = form.querySelector('input');
        const btn = form.querySelector('button');
        const flag = input.value.trim();

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const result = await API.submitFlag(challengeId, flag);
            
            if (result.correct) {
                showToast(`🎉 Correct! +${result.points} points`, 'success');
                state.user.score = result.newScore;
                updateNavAuth();
                closeModal();
                loadChallenges(); // Refresh to show solved state
            } else {
                showToast('❌ Incorrect flag. Try again!', 'error');
                input.value = '';
                input.focus();
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-flag"></i> Submit';
        }
    }

    async function loadLeaderboard() {
        const main = document.getElementById('mainContent');
        main.innerHTML = showLoading();

        try {
            const data = await API.getLeaderboard();
            
            main.innerHTML = `
                <div class="leaderboard-container">
                    <div class="leaderboard-header">
                        <h1 class="leaderboard-title"><i class="fas fa-trophy"></i> Leaderboard</h1>
                        <p style="color: var(--text-secondary);">Top hackers ranked by score</p>
                    </div>
                    <div class="leaderboard-table">
                        <div class="leaderboard-row header">
                            <span>Rank</span>
                            <span>Player</span>
                            <span>Score</span>
                            <span>Solves</span>
                        </div>
                        ${data.leaderboard.length > 0 ? data.leaderboard.map(player => `
                            <div class="leaderboard-row">
                                <span class="rank ${player.rank === 1 ? 'gold' : player.rank === 2 ? 'silver' : player.rank === 3 ? 'bronze' : ''}">
                                    ${player.rank <= 3 ? ['🥇', '🥈', '🥉'][player.rank - 1] : '#' + player.rank}
                                </span>
                                <span class="username">${escapeHtml(player.username)}</span>
                                <span class="score">${player.score}</span>
                                <span class="solves-count">${player.solves}</span>
                            </div>
                        `).join('') : `
                            <div class="empty-state">
                                <p>No players yet. Be the first!</p>
                            </div>
                        `}
                    </div>
                </div>
            `;
        } catch (error) {
            showToast('Failed to load leaderboard', 'error');
            main.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to Load</h3>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            `;
        }
    }

    function showProfile() {
        if (!state.user) return;
        
        openModal('Profile', `
            <div style="text-align: center; padding: 1rem;">
                <div class="user-avatar" style="width: 80px; height: 80px; font-size: 2rem; margin: 0 auto 1rem;">
                    ${state.user.username.charAt(0).toUpperCase()}
                </div>
                <h2 style="margin-bottom: 0.5rem;">${escapeHtml(state.user.username)}</h2>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">${escapeHtml(state.user.email)}</p>
                <div class="stat-card" style="display: inline-block;">
                    <div class="stat-value">${state.user.score}</div>
                    <div class="stat-label">Total Score</div>
                </div>
            </div>
        `);
    }

    // ==================== NAVIGATION ====================
    function navigate(page) {
        state.currentPage = page;
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });

        // Update URL
        const urls = {
            home: '/',
            challenges: '/challenges',
            leaderboard: '/leaderboard'
        };
        history.pushState({ page }, '', urls[page] || '/');

        // Load page content
        switch (page) {
            case 'challenges':
                loadChallenges();
                break;
            case 'leaderboard':
                loadLeaderboard();
                break;
            default:
                loadHomePage();
        }
    }

    function handleNavigation() {
        const path = window.location.pathname;
        
        if (path === '/challenges') {
            navigate('challenges');
        } else if (path === '/leaderboard') {
            navigate('leaderboard');
        } else {
            navigate('home');
        }
    }

    // ==================== INITIALIZATION ====================
    async function init() {
        // Get CSRF token
        state.csrfToken = getCookie('csrfToken');

        // Setup navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navigate(link.dataset.page);
            });
        });

        // Mobile nav toggle
        document.getElementById('navToggle')?.addEventListener('click', () => {
            document.getElementById('navLinks').classList.toggle('active');
        });

        // Modal close
        document.getElementById('modalClose')?.addEventListener('click', closeModal);
        document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeModal();
        });

        // Handle browser back/forward
        window.addEventListener('popstate', handleNavigation);

        // Check authentication
        await checkAuthentication();

        // Load initial page
        handleNavigation();
    }

    // ==================== PUBLIC API ====================
    window.App = {
        navigate,
        showLogin,
        showRegister,
        showProfile,
        logout,
        openChallenge,
        submitFlag,
        filterChallenges,
        unlockHint
    };

    // Start app
    document.addEventListener('DOMContentLoaded', init);
})();
