const toaster = document.getElementById('toaster');

const statusStyles = {
    success: {
        icon: 
        `<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm13.707-1.293a1 1 0 0 0-1.414-1.414L11 12.586l-1.793-1.793a1 1 0 0 0-1.414 1.414l2.5 2.5a1 1 0 0 0 1.414 0l4-4Z"/>
        </svg>`,
        bg: 'bg-green-800 text-green-200'
    },
    error: {
        icon: 
        `<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm7.707-3.707a1 1 0 0 0-1.414 1.414L10.586 12l-2.293 2.293a1 1 0 1 0 1.414 1.414L12 13.414l2.293 2.293a1 1 0 0 0 1.414-1.414L13.414 12l2.293-2.293a1 1 0 0 0-1.414-1.414L12 10.586 9.707 8.293Z""/>
        </svg>`,
        bg: 'bg-red-800 text-red-200'
    },
    warning: {
        icon: 
        `<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v5a1 1 0 1 0 2 0V8Zm-1 7a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2H12Z""/>
        </svg>`,
        bg: 'bg-yellow-700 text-yellow-200'
    },
    info: {
        icon:
        `<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z""/>
        </svg>`,
        bg: 'bg-blue-800 text-blue-200'
    },
    loading: {
        icon: 
        `<svg class="w-8 h-8 animate-spin fill-none" viewBox="0 0 50 50">
            <circle
                cx="25" cy="25" r="20"
                stroke="currentColor"
                stroke-width="5"
                class="text-input/60"
            />
            <circle 
                cx="25" cy="25" r="20"
                stroke="currentColor"
                stroke-width="5"
                stroke-linecap="round"
                stroke-dasharray="90"
                stroke-dashoffset="60"
            >
            </circle>
        </svg>`,
        bg: 'text-[var(--logo-ring)]'
    }
};

export function showToast(message, type = 'success') {
    if (!toaster) return;

    const toast = createToast(message, type);
    toaster.appendChild(toast);
}

export function testToast() {
    showToast('SUCCESS', 'success');
    showToast('ERROR', 'error');
    showToast('WARNING', 'warning');
    showToast('INFO', 'info');
    showToast('LOADING', 'loading');
}

function createToast(message, type) {
    const toast = document.createElement('div');
    toast.className = 'float-in flex items-center bg-toast text-text-primary cursor-pointer w-full max-w-xs p-4 rounded-lg shadow-sm';

    toast.innerHTML = `
        ${contentDiv(message, type)}
        <button type="button" class="ms-auto -mx-1.5 -my-1.5 bg-toast hover:brightness-125 hover:text-icon-hover rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 14 14">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
            </svg>
        </button>
    `;

    // Close button (extra can click toast to close - for mobile ui)
    toast.addEventListener('click', () => {
        toast.classList.add('float-out');
        setTimeout(() => toast.remove(), 300);
    });

    if (type !== 'loading') {
        // Auto-hide after 10s
        setTimeout(() => {
            toast.classList.add('float-out');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    return toast;
}

function contentDiv(message, type) {
    const style = statusStyles[type] || statusStyles.info;
    return `
        <div id="toast-content" class="flex items-center">
            <div class="${style.bg} flex items-center justify-center shrink-0 w-8 h-8 rounded-lg">
                ${style.icon}
            </div>
            <div id="toast-message" class="mx-3 text-sm font-bold flex-1">${message}</div>
        </div>
    `;
}

export function changeToToast(message, type = 'info') {
    if (!toaster) return;

    let loadingToast = null;

    for (let i = 0; i < toaster.children.length; i++) {
        const toast = toaster.children[i];
        const messageDiv = toast.querySelector('#toast-message');
        if (messageDiv && messageDiv.textContent.includes('...')) {
            loadingToast = toast;
            break;
        }
    }

    if (!loadingToast) {
        // No loading toast found, create new one
        toaster.appendChild(createToast(message, type));
        return;
    }

    // Icon transition
    const contentWrapper = loadingToast.querySelector('div:first-child');
    contentWrapper.classList.add('float-out');

    setTimeout(() => {
        // Change icon, background & message
        contentWrapper.innerHTML = contentDiv(message, type);
        contentWrapper.classList.remove('float-out');
        contentWrapper.classList.add('float-in');

        // Remove animation class after done to allow re-trigger later
        setTimeout(() => {
            contentWrapper.classList.remove('float-in');
        }, 300);
    }, 300);

    // Reset auto-dismiss timer
    clearTimeout(loadingToast.dismissTimer);
    loadingToast.dismissTimer = setTimeout(() => {
        loadingToast.classList.add('float-out');
        setTimeout(() => loadingToast.remove(), 300);
    }, 5000);
}
