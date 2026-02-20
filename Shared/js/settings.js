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
        this.updateSelectionUI(themeName);
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
        const theme = localStorage.getItem('app-theme') || 'light';
        this.updateSelectionUI(theme);
    }
};

// Auto-init theme
Settings.init();
