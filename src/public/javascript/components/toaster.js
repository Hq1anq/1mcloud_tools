export function showToast(message, type = 'success') {
    const toaster = document.getElementById('toaster');
    if (!toaster) return;

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
        }
    };

    const style = statusStyles[type] || statusStyles.info;

    const toast = document.createElement('div');
    toast.className = 'toast-show flex items-center bg-dark-800 text-gray-400 w-full max-w-xs p-4 rounded-lg shadow-sm';

    toast.innerHTML = `
        <div class="${style.bg} flex items-center justify-center shrink-0 w-8 h-8 rounded-lg">
            ${style.icon}
        </div>
        <div class="mx-3 text-sm font-normal flex-1">${message}</div>
        <button type="button" class="ms-auto -mx-1.5 -my-1.5 bg-dark-800 hover:bg-dark-700 text-gray-500 hover:text-white rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 inline-flex items-center justify-center h-8 w-8">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 14 14">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
            </svg>
        </button>
    `;

    // Close button
    toast.querySelector('button')?.addEventListener('click', () => {
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 300);
    });

    // Auto-hide after 4s
    setTimeout(() => {
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 300);
    }, 10000);

    toaster.appendChild(toast);
}