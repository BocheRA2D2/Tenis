const Settings = {
    init() {
        const savedTheme = localStorage.getItem('app-theme') || 'light';
        this.applyTheme(savedTheme);
    },

    setTheme(themeName) {
        localStorage.setItem('app-theme', themeName);
        this.applyTheme(themeName);
    },

    applyTheme(themeName) {
        // Remove all possible theme classes
        document.body.classList.remove('theme-dark', 'theme-pingpong-light', 'theme-pingpong-dark');

        // Add the selected one
        if (themeName !== 'light') {
            document.body.classList.add(`theme-${themeName}`);
        }

        // Update UI selection state if needed
        this.render();
    },

    updateSelectionUI(themeName) {
        const options = document.querySelectorAll('.theme-option');
        options.forEach(opt => {
            opt.style.border = '1px solid var(--border-color)';
            opt.style.background = 'var(--bg-app)';
        });

        // Find the one that matches
        const activeOpt = document.querySelector(`.theme-option[onclick*="'${themeName}'"]`);
        if (activeOpt) {
            activeOpt.style.borderColor = 'var(--primary)';
            activeOpt.style.background = 'var(--bg-surface)';
        }
    },

    render() {
        const container = document.getElementById('settings-content');
        if (!container) return;

        const theme = localStorage.getItem('app-theme') || 'light';

        container.innerHTML = `
            <div style="grid-column: 1 / -1;">
                <h4 style="margin-bottom:16px; font-size:1.1rem;">Wybierz motyw aplikacji:</h4>
                <div class="theme-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px;">
                    <div class="theme-option ${theme === 'light' ? 'active' : ''}" onclick="Settings.setTheme('light')" style="padding:16px; border:2px solid ${theme === 'light' ? 'var(--primary)' : 'var(--border-color)'}; border-radius:16px; cursor:pointer; text-align:center; background:var(--bg-surface);">
                        <div style="width:40px; height:40px; background:#f4f6f9; margin:0 auto 10px; border-radius:50%; border:1px solid #ddd;"></div>
                        <span style="font-weight:500;">Jasny</span>
                    </div>
                    <div class="theme-option ${theme === 'dark' ? 'active' : ''}" onclick="Settings.setTheme('dark')" style="padding:16px; border:2px solid ${theme === 'dark' ? 'var(--primary)' : 'var(--border-color)'}; border-radius:16px; cursor:pointer; text-align:center; background:var(--bg-surface);">
                        <div style="width:40px; height:40px; background:#0f172a; margin:0 auto 10px; border-radius:50%; border:1px solid #334155;"></div>
                        <span style="font-weight:500;">Ciemny</span>
                    </div>
                    <div class="theme-option ${theme === 'pingpong-light' ? 'active' : ''}" onclick="Settings.setTheme('pingpong-light')" style="padding:16px; border:2px solid ${theme === 'pingpong-light' ? 'var(--primary)' : 'var(--border-color)'}; border-radius:16px; cursor:pointer; text-align:center; background:var(--bg-surface);">
                        <div style="width:40px; height:40px; background:#f0fdf4; margin:0 auto 10px; border-radius:50%; border:1px solid #10b981;"></div>
                        <span style="font-weight:500;">Ping-Pong Jasny</span>
                    </div>
                    <div class="theme-option ${theme === 'pingpong-dark' ? 'active' : ''}" onclick="Settings.setTheme('pingpong-dark')" style="padding:16px; border:2px solid ${theme === 'pingpong-dark' ? 'var(--primary)' : 'var(--border-color)'}; border-radius:16px; cursor:pointer; text-align:center; background:var(--bg-surface);">
                        <div style="width:40px; height:40px; background:#062006; margin:0 auto 10px; border-radius:50%; border:1px solid #4ade80;"></div>
                        <span style="font-weight:500;">Ping-Pong Ciemny</span>
                    </div>
                </div>

                <div style="margin-top:40px; padding:20px; background:var(--bg-surface); border-radius:16px; border:1px solid var(--border-color); text-align:center;">
                    <p style="color:var(--text-muted); font-size:0.9rem;">Wersja aplikacji: 2.1.0-TabletReady</p>
                </div>
            </div>
        `;
    }
};

// Auto-init theme
Settings.init();
