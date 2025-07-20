export function showToast(message, type = 'info') {
    const toaster = document.getElementById('toaster');
    if (!toaster) return;

    const colors = {
        success: 'bg-green-950 text-green-400 border-green-600',
        error: 'bg-red-950 text-red-400 border-red-600',
        warning: 'bg-yellow-950 text-yellow-400 border-yellow-600',
        info: 'bg-blue-950 text-blue-400 border-blue-600',
    };

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
    };

    const toast = document.createElement('div');
    toast.className = `
        flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg
        w-[300px] animate-fade-in
        ${colors[type] || colors.info}
    `;

    toast.innerHTML = `
        <div class="text-xl">${icons[type] || icons.info}</div>
        <div class="flex-1 text-sm leading-snug">${message}</div>
        <button class="text-gray-400 hover:text-white text-lg font-semibold leading-none">&times;</button>
    `;

    // Close button logic
    const closeBtn = toast.querySelector('button');
    closeBtn.addEventListener('click', () => removeToast(toast));

    toaster.appendChild(toast);

    // Auto-remove after 5s
    setTimeout(() => removeToast(toast), 5000);
}

function removeToast(toast) {
    toast.classList.remove('animate-fade-in');
    toast.classList.add('animate-fade-out');
    setTimeout(() => toast.remove(), 300);
}
