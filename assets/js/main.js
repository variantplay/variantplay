// Export user state globally for games to access
window.userState = {
    isLoggedIn: false,
    uid: null,
    username: '',
    coins: 0,
    isAdmin: false
};

document.addEventListener('DOMContentLoaded', () => {
    // --- Check for Referral ---
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('ref')) {
        sessionStorage.setItem('referral_uid', urlParams.get('ref'));
    }

    // --- UI Setup & Scroll animations ---
    const animatedElements = document.querySelectorAll('.fade-in-up');
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    animatedElements.forEach(el => observer.observe(el));

    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    const orbs = document.querySelectorAll('.glow-orb');
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth - 0.5;
        const mouseY = e.clientY / window.innerHeight - 0.5;
        orbs.forEach((orb, index) => {
            const speed = (index + 1) * 20;
            orb.style.transform = `translate(${mouseX * speed}px, ${mouseY * speed}px)`;
        });
    });

    // --- Firebase Auth & Firestore Logic (Compat Syntax) ---
    window.auth.onAuthStateChanged(async (user) => {
        if (user) {
            window.userState.isLoggedIn = true;
            window.userState.uid = user.uid;
            
            // Fetch user data from Firestore
            const userDocRef = window.db.collection("users").doc(user.uid);
            const userDoc = await userDocRef.get();
            
            if (userDoc.exists) {
                const data = userDoc.data();
                window.userState.username = data.name || "Player";
                window.userState.coins = data.coins || 0;
                window.userState.gamesPlayed = data.gamesPlayed || 0;
                window.userState.avatarUrl = data.avatarUrl || null;
                window.userState.bannerTheme = data.bannerTheme || 'theme-cyan';
                window.userState.isAdmin = data.isAdmin === true;
            } else {
                // If user was created manually in Firebase console or doc creation failed
                window.userState.username = "Player";
                window.userState.coins = 1000;
                window.userState.gamesPlayed = 0;
                window.userState.avatarUrl = null;
                window.userState.bannerTheme = 'theme-cyan';
                await userDocRef.set({
                    name: "Player",
                    email: user.email,
                    coins: 1000,
                    gamesPlayed: 0,
                    rank: "Beginner"
                });
            }
            
            updateAppState();
            
            // Set up chat listeners
            if (window.userState.isAdmin) {
                if (window.setupAdminChatListener) window.setupAdminChatListener();
            } else {
                if (window.setupUserChatListener) window.setupUserChatListener(user.uid);
            }
            
            // Set up real-time listener for coin updates
            userDocRef.onSnapshot((docSnap) => {
                if (docSnap.exists) {
                    const data = docSnap.data();
                    window.userState.coins = data.coins || 0;
                    window.userState.gamesPlayed = data.gamesPlayed || 0;
                    window.userState.avatarUrl = data.avatarUrl || null;
                    window.userState.bannerTheme = data.bannerTheme || 'theme-cyan';
                    updateAppState();
                }
            });
        } else {
            window.userState = { isLoggedIn: false, uid: null, username: '', coins: 0, gamesPlayed: 0, isAdmin: false };
            updateAppState();
        }
    });

    function updateAppState() {
        const loginBtn = document.getElementById('header-login-btn');
        const createBtn = document.getElementById('header-create-btn');
        const dashBtn = document.getElementById('header-dashboard-btn');

        if (window.userState.isLoggedIn) {
            // document.body.classList.add('logged-in'); // Removed forced redirect
            
            if (loginBtn) loginBtn.style.display = 'none';
            if (createBtn) createBtn.style.display = 'none';
            if (dashBtn) dashBtn.style.display = 'inline-flex';

            if (window.userState.isAdmin) {
                document.getElementById('app-nav-admin').style.display = 'flex';
            } else {
                document.getElementById('app-nav-admin').style.display = 'none';
            }
            
            // Update Dashboard Stats
            document.getElementById('dash-games-played').textContent = window.userState.gamesPlayed;
            document.getElementById('dash-points').textContent = window.userState.coins;
            document.getElementById('dash-dollars').textContent = '$' + (window.userState.coins / 10000).toFixed(2);
            
            document.getElementById('app-greeting').textContent = 'Welcome back, ' + window.userState.username + '!';
            document.getElementById('app-header-coins').textContent = window.userState.coins;
            
            // Update Profile View
            document.getElementById('profile-display-name').textContent = window.userState.username;
            document.getElementById('profile-display-email').textContent = window.auth.currentUser ? window.auth.currentUser.email : '';
            if (window.userState.avatarUrl) {
                document.getElementById('profile-avatar-img').src = window.userState.avatarUrl;
            } else {
                document.getElementById('profile-avatar-img').src = 'assets/images/placeholder-avatar.png';
            }
            const banner = document.getElementById('profile-banner');
            banner.className = 'profile-banner ' + window.userState.bannerTheme;
            
            document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
            const activeThemeBtn = document.querySelector('.theme-btn[data-theme="' + window.userState.bannerTheme + '"]');
            if(activeThemeBtn) activeThemeBtn.classList.add('active');
            
            // Clone games grid if not already cloned
            const dashGamesGrid = document.getElementById('app-games-grid');
            if (dashGamesGrid.children.length === 0) {
                const publicGamesGrid = document.querySelector('#games .games-grid');
                if (publicGamesGrid) {
                    dashGamesGrid.innerHTML = publicGamesGrid.innerHTML;
                    // Make cloned animated elements instantly visible
                    dashGamesGrid.querySelectorAll('.fade-in-up').forEach(el => el.classList.add('visible'));
                }
            }
        } else {
            if (loginBtn) loginBtn.style.display = 'inline-flex';
            if (createBtn) createBtn.style.display = 'inline-flex';
            if (dashBtn) dashBtn.style.display = 'none';
            
            document.getElementById('app-greeting').textContent = 'Welcome, Guest!';
            document.body.classList.remove('logged-in');
            
            const navContainer = document.getElementById('nav-actions-container');
            if (navContainer && (!loginBtn || !createBtn || !dashBtn)) {
                navContainer.innerHTML = `
                    <a href="#" class="btn btn-outline login-trigger" id="header-login-btn">Log In</a>
                    <a href="#" class="btn btn-primary glow-btn create-account-trigger" id="header-create-btn">Create Account</a>
                    <a href="#" class="btn btn-primary glow-btn dashboard-trigger" id="header-dashboard-btn" style="display: none;">Dashboard</a>
                `;
                attachLoginListeners();
            }
        }
    }

    // App Sidebar Routing
    document.querySelectorAll('.app-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Handle Logout special case
            if (link.id === 'app-logout-btn') {
                window.auth.signOut();
                window.showToast("Logged out successfully");
                return;
            }

            // Update active states
            document.querySelectorAll('.app-nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const viewName = link.getAttribute('data-view');
            
            if (viewName === 'home') {
                // If they click home, we can just log them out or hide the app container
                document.body.classList.remove('logged-in');
            } else {
                document.body.classList.add('logged-in'); // Ensure app view is visible
                
                // Hide all views
                document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
                
                if (viewName === 'dashboard') {
                    document.getElementById('view-dashboard').classList.add('active');
                } else if (viewName === 'profile') {
                    document.getElementById('view-profile').classList.add('active');
                } else if (viewName === 'withdrawal') {
                    document.getElementById('view-withdrawal').classList.add('active');
                    updateWithdrawalUI(); // Update balances
                } else if (viewName === 'referral') {
                    document.getElementById('view-referral').classList.add('active');
                    updateReferralUI(); // Set link and fetch stats
                } else if (viewName === 'settings') {
                    document.getElementById('view-settings').classList.add('active');
                    updateSettingsUI();
                } else if (viewName === 'contact') {
                    document.getElementById('view-contact').classList.add('active');
                } else if (viewName === 'admin') {
                    document.getElementById('view-admin').classList.add('active');
                } else {
                    document.getElementById('view-placeholder').classList.add('active');
                    document.querySelector('#view-placeholder h2').textContent = viewName.charAt(0).toUpperCase() + viewName.slice(1) + ' Coming Soon';
                }
            }
        });
    });

    document.getElementById('header-dashboard-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.classList.add('logged-in');
        document.querySelectorAll('.app-nav-link').forEach(l => l.classList.remove('active'));
        document.querySelector('.app-nav-link[data-view="dashboard"]')?.classList.add('active');
        document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
        document.getElementById('view-dashboard')?.classList.add('active');
    });

    // --- Auth Modal Logic ---
    const authModal = document.getElementById('auth-modal');
    const authForm = document.getElementById('auth-form');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const usernameInput = document.getElementById('username-input');
    const authError = document.getElementById('auth-error');
    const toggleLink = document.getElementById('auth-toggle-link');
    const modalTitle = document.getElementById('auth-modal-title');
    const modalDesc = document.getElementById('auth-modal-desc');
    const submitBtn = document.getElementById('auth-submit-btn');

    let isSignUp = false;

    function openAuthModal() {
        if (!window.userState.isLoggedIn) {
            authModal.classList.add('active');
            setTimeout(() => emailInput.focus(), 100);
            authError.style.display = 'none';
        } else {
            window.showToast('You are already logged in!', 'info');
        }
    }

    function closeAuthModal() {
        authModal.classList.remove('active');
        authForm.reset();
        authError.style.display = 'none';
    }

    document.querySelector('.close-modal').addEventListener('click', closeAuthModal);
    authModal.addEventListener('click', (e) => { if (e.target === authModal) closeAuthModal(); });

    toggleLink.addEventListener('click', () => {
        isSignUp = !isSignUp;
        authError.style.display = 'none';
        if (isSignUp) {
            modalTitle.textContent = "Create Account";
            modalDesc.textContent = "Join Variant Play to start earning.";
            usernameInput.style.display = 'block';
            usernameInput.required = true;
            submitBtn.innerHTML = 'Sign Up <i class="ph-fill ph-arrow-right"></i>';
            toggleLink.textContent = "Already have an account? Log in";
        } else {
            modalTitle.textContent = "Welcome Back";
            modalDesc.textContent = "Log in to continue earning.";
            usernameInput.style.display = 'none';
            usernameInput.required = false;
            submitBtn.innerHTML = 'Log In <i class="ph-fill ph-arrow-right"></i>';
            toggleLink.textContent = "Need an account? Sign up";
        }
    });

    function attachLoginListeners() {
        document.querySelectorAll('.login-trigger, .create-account-trigger, .claim-bonus-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (btn.classList.contains('create-account-trigger')) {
                    // Set modal to Sign Up mode
                    isSignUp = true;
                    usernameInput.style.display = 'block';
                    usernameInput.required = true;
                    modalTitle.textContent = "Create Account";
                    modalDesc.textContent = "Sign up and claim your bonus!";
                    submitBtn.innerHTML = 'Sign Up <i class="ph-fill ph-arrow-right"></i>';
                    toggleLink.textContent = "Already have an account? Log in";
                } else {
                    // Set modal to Log In mode
                    isSignUp = false;
                    usernameInput.style.display = 'none';
                    usernameInput.required = false;
                    modalTitle.textContent = "Welcome Back";
                    modalDesc.textContent = "Log in to continue earning.";
                    submitBtn.innerHTML = 'Log In <i class="ph-fill ph-arrow-right"></i>';
                    toggleLink.textContent = "Need an account? Sign up";
                }
                openAuthModal();
            });
        });
    }
    attachLoginListeners();
    
    document.querySelectorAll('.play-now-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(!window.userState.isLoggedIn && btn.tagName === 'A' && btn.getAttribute('href') !== '#games'){
                e.preventDefault();
                openAuthModal();
            }
        });
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const username = usernameInput.value.trim();
        
        authError.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';

        try {
            if (isSignUp) {
                const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                const pendingReward = window.userState.pendingReward || 0;
                const initialCoins = 1000 + pendingReward; // 1000 signup bonus + any won in guest mode
                
                const referredBy = sessionStorage.getItem('referral_uid');
                
                // Create user doc
                const userData = {
                    name: username,
                    email: email,
                    coins: initialCoins, 
                    gamesPlayed: pendingReward > 0 ? 1 : 0,
                    rank: "Beginner",
                    totalReferrals: 0,
                    referralPoints: 0
                };
                if (referredBy && referredBy !== user.uid) {
                    userData.referredBy = referredBy;
                }
                
                await window.db.collection("users").doc(user.uid).set(userData);
                
                // Process Referral Credit
                if (referredBy && referredBy !== user.uid) {
                    try {
                        await window.db.collection("users").doc(referredBy).update({
                            coins: firebase.firestore.FieldValue.increment(500),
                            totalReferrals: firebase.firestore.FieldValue.increment(1),
                            referralPoints: firebase.firestore.FieldValue.increment(500)
                        });
                        sessionStorage.removeItem('referral_uid'); // clear it
                    } catch (e) {
                        console.error("Error crediting referrer", e);
                    }
                }
                
                window.userState.pendingReward = 0; // Clear it
                window.showToast(`Welcome ${username}! You claimed ${initialCoins} coins!`, 'success');
            } else {
                await window.auth.signInWithEmailAndPassword(email, password);
                
                // If they had a pending reward and they log in instead of signing up
                if (window.userState.pendingReward > 0) {
                    const userRef = window.db.collection("users").doc(window.auth.currentUser.uid);
                    await userRef.update({
                        coins: firebase.firestore.FieldValue.increment(window.userState.pendingReward),
                        gamesPlayed: firebase.firestore.FieldValue.increment(1)
                    });
                    window.showToast(`Welcome back! Added your ${window.userState.pendingReward} pending coins!`, 'success');
                    window.userState.pendingReward = 0;
                } else {
                    window.showToast(`Welcome back!`, 'success');
                }
            }
            closeAuthModal();
        } catch (error) {
            authError.textContent = error.message.replace('Firebase: ', '');
            authError.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = isSignUp ? 'Sign Up <i class="ph-fill ph-arrow-right"></i>' : 'Log In <i class="ph-fill ph-arrow-right"></i>';
        }
    });

    // --- Leaderboard Logic ---
    const leaderboardList = document.getElementById('leaderboard-list');
    
    // Real-time listener for top 10 users
    const query = window.db.collection("users").orderBy("coins", "desc").limit(10);
    query.onSnapshot((snapshot) => {
        leaderboardList.innerHTML = '';
        if (snapshot.empty) {
            leaderboardList.innerHTML = '<li style="text-align:center; padding:2rem; color:var(--text-muted);">No players yet. Be the first!</li>';
            return;
        }
        
        let rank = 1;
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.padding = '1rem 0';
            li.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            
            let rankDisplay = `#${rank}`;
            if(rank === 1) rankDisplay = '🥇';
            else if(rank === 2) rankDisplay = '🥈';
            else if(rank === 3) rankDisplay = '🥉';

            li.innerHTML = `
                <span style="font-weight:bold; color:var(--accent-cyan); width:50px;">${rankDisplay}</span>
                <span style="flex:1;">${data.name}</span>
                <span style="font-weight:bold; color:#FFD700;">${data.coins}</span>
            `;
            leaderboardList.appendChild(li);
            rank++;
        });
    }, (error) => {
        console.error("Leaderboard fetch error:", error);
        leaderboardList.innerHTML = '<li style="text-align:center; padding:2rem; color:var(--text-muted);">Configure Firebase to view Leaderboard.</li>';
    });

    // --- Profile Logic ---
    const avatarUpload = document.getElementById('profile-avatar-upload');
    if (avatarUpload) {
        avatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Check file size (limit to ~500kb)
            if (file.size > 500 * 1024) {
                window.showToast("File too large. Please select an image under 500KB.", "warning");
                return;
            }
            
            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64String = event.target.result;
                try {
                    await window.db.collection('users').doc(window.userState.uid).update({
                        avatarUrl: base64String
                    });
                    window.showToast("Profile picture updated successfully!", "success");
                } catch (err) {
                    console.error("Error updating avatar:", err);
                    window.showToast("Failed to update profile picture.", "warning");
                }
            };
            reader.readAsDataURL(file);
        });
    }

    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const theme = e.target.getAttribute('data-theme');
            try {
                await window.db.collection('users').doc(window.userState.uid).update({
                    bannerTheme: theme
                });
                window.showToast("Banner theme updated!", "success");
            } catch (err) {
                window.showToast("Failed to update theme.", "warning");
            }
        });
    });

    document.getElementById('profile-save-username')?.addEventListener('click', async () => {
        const input = document.getElementById('profile-username-input');
        const newName = input.value.trim();
        if(!newName) return;
        try {
            await window.db.collection('users').doc(window.userState.uid).update({ name: newName });
            window.showToast("Username updated!", "success");
            input.value = '';
        } catch(err) {
            window.showToast("Error updating username.", "warning");
        }
    });

    document.getElementById('profile-save-email')?.addEventListener('click', async () => {
        const input = document.getElementById('profile-email-input');
        const newEmail = input.value.trim();
        if(!newEmail) return;
        try {
            await window.auth.currentUser.updateEmail(newEmail);
            window.showToast("Email updated successfully!", "success");
            input.value = '';
        } catch(err) {
            if (err.code === 'auth/requires-recent-login') {
                window.showToast("Security requires recent login. Please log out and back in first.", "warning");
            } else {
                window.showToast("Error updating email: " + err.message, "warning");
            }
        }
    });

    document.getElementById('profile-save-password')?.addEventListener('click', async () => {
        const input = document.getElementById('profile-password-input');
        const newPassword = input.value;
        if(!newPassword || newPassword.length < 6) {
            window.showToast("Password must be at least 6 characters.", "warning");
            return;
        }
        try {
            await window.auth.currentUser.updatePassword(newPassword);
            window.showToast("Password updated successfully!", "success");
            input.value = '';
        } catch(err) {
            if (err.code === 'auth/requires-recent-login') {
                window.showToast("Security requires recent login. Please log out and back in first.", "warning");
            } else {
                window.showToast("Error updating password: " + err.message, "warning");
            }
        }
    });

    document.getElementById('profile-delete-account')?.addEventListener('click', async () => {
        if(confirm("Are you sure you want to permanently delete your account? This action cannot be undone and you will lose all your coins.")) {
            try {
                await window.db.collection('users').doc(window.userState.uid).delete();
                await window.auth.currentUser.delete();
                window.showToast("Account deleted successfully.", "success");
            } catch(err) {
                if (err.code === 'auth/requires-recent-login') {
                    window.showToast("Security requires recent login. Please log out and back in first.", "warning");
                } else {
                    window.showToast("Error deleting account: " + err.message, "warning");
                }
            }
        }
    });

    // --- Withdrawal Logic ---
    let selectedWithdrawMethod = null;
    
    window.updateWithdrawalUI = function() {
        const dollars = (window.userState.coins / 10000);
        document.getElementById('withdraw-available-balance').textContent = dollars.toFixed(2);
        document.getElementById('withdraw-available-points').textContent = window.userState.coins;
        
        let progress = (window.userState.coins / 10000) * 100;
        if(progress > 100) progress = 100;
        
        document.getElementById('withdraw-progress-text').textContent = Math.round(progress) + '%';
        document.getElementById('withdraw-progress-bar').style.width = progress + '%';
    };

    document.querySelectorAll('.payment-card').forEach(card => {
        card.addEventListener('click', (e) => {
            document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedWithdrawMethod = card.getAttribute('data-method');
            
            const formArea = document.getElementById('withdraw-form-area');
            const formLabel = document.getElementById('withdraw-input-label');
            const formInput = document.getElementById('withdraw-account-input');
            
            formArea.style.display = 'block';
            
            if (selectedWithdrawMethod === 'paypal') {
                formLabel.textContent = 'PayPal Email Address';
                formInput.placeholder = 'Enter your PayPal email';
                formInput.type = 'email';
            } else if (selectedWithdrawMethod === 'bank') {
                formLabel.textContent = 'Bank Account Number / IBAN';
                formInput.placeholder = 'Enter your bank details';
                formInput.type = 'text';
            } else if (selectedWithdrawMethod === 'crypto') {
                formLabel.textContent = 'USDT (TRC20) or LTC Address';
                formInput.placeholder = 'Enter your wallet address';
                formInput.type = 'text';
            }
            
            // Auto fill max amount
            const maxDollars = Math.floor(window.userState.coins / 10000);
            if (maxDollars >= 1) {
                document.getElementById('withdraw-amount-input').value = maxDollars;
            } else {
                document.getElementById('withdraw-amount-input').value = '';
            }
        });
    });

    document.getElementById('withdraw-submit-btn')?.addEventListener('click', async () => {
        const accountDetails = document.getElementById('withdraw-account-input').value.trim();
        const amountStr = document.getElementById('withdraw-amount-input').value;
        const amountNum = parseFloat(amountStr);
        
        if (!selectedWithdrawMethod) {
            window.showToast("Please select a payment method.", "warning");
            return;
        }
        if (!accountDetails) {
            window.showToast("Please enter your account details.", "warning");
            return;
        }
        if (isNaN(amountNum) || amountNum < 1) {
            window.showToast("Minimum withdrawal is $1.00.", "warning");
            return;
        }
        
        const requiredCoins = amountNum * 10000;
        if (window.userState.coins < requiredCoins) {
            window.showToast("Insufficient balance.", "warning");
            return;
        }
        
        const btn = document.getElementById('withdraw-submit-btn');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="ph-fill ph-spinner ph-spin"></i> Processing...';
        
        try {
            // Deduct coins
            await window.db.collection('users').doc(window.userState.uid).update({
                coins: firebase.firestore.FieldValue.increment(-requiredCoins)
            });
            
            // Save withdrawal request
            await window.db.collection('withdrawals').add({
                uid: window.userState.uid,
                method: selectedWithdrawMethod,
                details: accountDetails,
                amountDollars: amountNum,
                pointsDeducted: requiredCoins,
                status: 'Pending',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            window.showToast("Withdrawal request submitted! Pending approval.", "success");
            
            // Reset form
            document.getElementById('withdraw-account-input').value = '';
            document.getElementById('withdraw-form-area').style.display = 'none';
            document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('selected'));
            selectedWithdrawMethod = null;
            updateWithdrawalUI();
            
        } catch (err) {
            console.error(err);
            window.showToast("Error processing withdrawal.", "warning");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });

    // --- Referral Logic ---
    window.updateReferralUI = async function() {
        if (!window.userState.uid) return;
        
        const baseUrl = window.location.origin + window.location.pathname;
        const refLink = `${baseUrl}?ref=${window.userState.uid}`;
        document.getElementById('referral-link-input').value = refLink;
        
        // Fetch stats if they exist
        const userDoc = await window.db.collection('users').doc(window.userState.uid).get();
        if (userDoc.exists) {
            const data = userDoc.data();
            const totalReferrals = data.totalReferrals || 0;
            const referralPoints = data.referralPoints || 0;
            
            document.getElementById('referral-total-count').textContent = totalReferrals;
            document.getElementById('referral-total-points').textContent = referralPoints;
        }
    };

    document.getElementById('referral-copy-btn')?.addEventListener('click', () => {
        const input = document.getElementById('referral-link-input');
        input.select();
        input.setSelectionRange(0, 99999); // For mobile devices
        try {
            navigator.clipboard.writeText(input.value);
            window.showToast("Referral link copied to clipboard!", "success");
        } catch (err) {
            // Fallback for older browsers
            document.execCommand('copy');
            window.showToast("Referral link copied to clipboard!", "success");
        }
    });

    // --- Settings Logic ---
    window.updateSettingsUI = async function() {
        if (!window.userState.uid) return;
        
        try {
            const userDoc = await window.db.collection('users').doc(window.userState.uid).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                const settings = data.settings || {};
                
                // Defaults
                document.getElementById('setting-sfx').checked = settings.sfx !== false;
                document.getElementById('setting-music').checked = settings.music === true;
                document.getElementById('setting-notify-tournaments').checked = settings.notifyTournaments !== false;
                document.getElementById('setting-notify-payments').checked = settings.notifyPayments !== false;
                document.getElementById('setting-privacy-leaderboard').checked = settings.privacyLeaderboard !== false;
            }
        } catch (err) {
            console.error("Error loading settings", err);
        }
    };

    document.getElementById('settings-save-btn')?.addEventListener('click', async (e) => {
        if (!window.userState.uid) return;
        const btn = e.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Saving...';
        btn.disabled = true;

        const newSettings = {
            sfx: document.getElementById('setting-sfx').checked,
            music: document.getElementById('setting-music').checked,
            notifyTournaments: document.getElementById('setting-notify-tournaments').checked,
            notifyPayments: document.getElementById('setting-notify-payments').checked,
            privacyLeaderboard: document.getElementById('setting-privacy-leaderboard').checked
        };

        try {
            await window.db.collection('users').doc(window.userState.uid).update({
                settings: newSettings
            });
            window.showToast("Settings saved successfully!", "success");
        } catch (err) {
            console.error("Error saving settings", err);
            window.showToast("Failed to save settings.", "warning");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });

    // --- Contact & Support Logic ---
    document.getElementById('contact-copy-email')?.addEventListener('click', () => {
        const email = 'variantplayofficial@gmail.com';
        try {
            navigator.clipboard.writeText(email);
            window.showToast("Email address copied!", "success");
        } catch (err) {
            window.showToast("Failed to copy. Please select and copy manually.", "warning");
        }
    });

    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    let unsubscribeUserChat = null;

    window.setupUserChatListener = function(uid) {
        if (unsubscribeUserChat) unsubscribeUserChat();
        
        unsubscribeUserChat = window.db.collection('chats').doc(uid).onSnapshot((doc) => {
            if (chatMessages) {
                chatMessages.innerHTML = '';
                if (doc.exists) {
                    const data = doc.data();
                    const messages = data.messages || [];
                    messages.forEach(msg => {
                        appendChatBubble(chatMessages, msg.text, msg.sender === 'user' ? 'user-bubble' : 'bot-bubble', msg.timestamp);
                    });
                } else {
                    appendChatBubble(chatMessages, "Hello! How can we help you today?", 'bot-bubble');
                }
            }
        });
    };

    if (chatForm && chatInput && chatMessages) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (!text || !window.userState.uid) return;

            // Secret admin command
            if (text === '/admin') {
                try {
                    await window.db.collection('users').doc(window.userState.uid).update({ isAdmin: true });
                    window.userState.isAdmin = true;
                    document.getElementById('app-nav-admin').style.display = 'flex';
                    window.showToast("Admin privileges granted!", "success");
                    chatInput.value = '';
                    if (window.setupAdminChatListener) window.setupAdminChatListener();
                } catch (err) {
                    window.showToast("Error granting admin.", "warning");
                }
                return;
            }

            const newMsg = {
                text: text,
                sender: 'user',
                timestamp: Date.now()
            };

            chatInput.value = '';

            try {
                const chatRef = window.db.collection('chats').doc(window.userState.uid);
                const docSnap = await chatRef.get();
                if (!docSnap.exists) {
                    await chatRef.set({
                        userId: window.userState.uid,
                        username: window.userState.username,
                        lastUpdated: Date.now(),
                        messages: [newMsg]
                    });
                } else {
                    await chatRef.update({
                        lastUpdated: Date.now(),
                        messages: firebase.firestore.FieldValue.arrayUnion(newMsg)
                    });
                }
            } catch (err) {
                console.error("Error sending message", err);
                window.showToast("Failed to send message.", "warning");
            }
        });
    }

    // --- Admin Chat Logic ---
    let currentAdminChatUid = null;
    let unsubscribeAdminChatList = null;
    let unsubscribeAdminActiveChat = null;

    const adminChatList = document.getElementById('admin-chat-list');
    const adminChatMessages = document.getElementById('admin-chat-messages');
    const adminChatTargetName = document.getElementById('admin-chat-target-name');
    const adminChatTargetId = document.getElementById('admin-chat-target-id');
    const adminChatForm = document.getElementById('admin-chat-form');
    const adminChatInput = document.getElementById('admin-chat-input');
    const adminChatSubmit = document.getElementById('admin-chat-submit');

    window.setupAdminChatListener = function() {
        if (!adminChatList) return;
        if (unsubscribeAdminChatList) unsubscribeAdminChatList();

        unsubscribeAdminChatList = window.db.collection('chats')
            .orderBy('lastUpdated', 'desc')
            .onSnapshot(snapshot => {
                adminChatList.innerHTML = '';
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const div = document.createElement('div');
                    div.className = 'admin-chat-item';
                    if (currentAdminChatUid === doc.id) div.classList.add('active');
                    
                    const lastMsg = data.messages && data.messages.length > 0 ? data.messages[data.messages.length - 1].text : 'New conversation';
                    
                    div.innerHTML = `
                        <h4>${data.username || 'Unknown'}</h4>
                        <p>${lastMsg}</p>
                    `;
                    
                    div.onclick = () => {
                        document.querySelectorAll('.admin-chat-item').forEach(el => el.classList.remove('active'));
                        div.classList.add('active');
                        openAdminChat(doc.id, data.username);
                    };
                    
                    adminChatList.appendChild(div);
                });
            });
    };

    function openAdminChat(uid, username) {
        currentAdminChatUid = uid;
        adminChatTargetName.textContent = username || 'Unknown';
        adminChatTargetId.textContent = uid;
        adminChatInput.disabled = false;
        adminChatSubmit.disabled = false;

        if (unsubscribeAdminActiveChat) unsubscribeAdminActiveChat();
        
        unsubscribeAdminActiveChat = window.db.collection('chats').doc(uid).onSnapshot(doc => {
            if (adminChatMessages && doc.exists) {
                adminChatMessages.innerHTML = '';
                const data = doc.data();
                const messages = data.messages || [];
                messages.forEach(msg => {
                    // Reverse logic for admin view: user is left, admin is right
                    const typeClass = msg.sender === 'user' ? 'bot-bubble' : 'user-bubble';
                    appendChatBubble(adminChatMessages, msg.text, typeClass, msg.timestamp);
                });
            }
        });
    }

    if (adminChatForm) {
        adminChatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentAdminChatUid) return;
            const text = adminChatInput.value.trim();
            if (!text) return;

            const newMsg = {
                text: text,
                sender: 'admin',
                timestamp: Date.now()
            };

            adminChatInput.value = '';

            try {
                await window.db.collection('chats').doc(currentAdminChatUid).update({
                    lastUpdated: Date.now(),
                    messages: firebase.firestore.FieldValue.arrayUnion(newMsg)
                });
            } catch (err) {
                console.error("Error sending admin reply", err);
            }
        });
    }

    function appendChatBubble(container, text, typeClass, timestampMs = null) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${typeClass}`;
        
        const d = timestampMs ? new Date(timestampMs) : new Date();
        const timeStr = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        bubble.innerHTML = `
            ${text}
            <span class="timestamp">${timeStr}</span>
        `;
        
        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;
    }
});

// Global Toast function
window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast`;
    let iconClass = 'ph-info';
    if (type === 'success') iconClass = 'ph-check-circle';
    if (type === 'warning') iconClass = 'ph-warning';
    
    toast.innerHTML = `<i class="ph-fill ${iconClass}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
};
