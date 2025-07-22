import { showToast } from '/javascript/components/toaster.js'

const elements = {
    dialog : document.getElementById('copyDialog'),
    dialogTitle : document.getElementById('dialogTitle'),
    dialogText : document.getElementById('dialogText'),
    copyBtn: document.getElementById('copyBtn'),
    closeBtn : document.getElementById('closeDialogBtn')
}

export function showCopyDialog(title, textToCopy) {
    elements.dialogTitle.innerHTML = title;
    elements.dialogText.value = textToCopy;
    elements.dialog.classList.remove('hidden');

    elements.copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                showToast('Copied clipboard!', 'success');

                // Save original content
                const originalHTML = elements.copyBtn.innerHTML;

                // Smooth transition by adding a class
                elements.copyBtn.classList.add('float-out');

                setTimeout(() => {
                    elements.copyBtn.innerHTML = 
                    `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 11.917 9.724 16.5 19 7.5"/>
                    </svg>Copied`;
                    elements.copyBtn.classList.remove('float-out');
                    elements.copyBtn.classList.add('float-in');
                }, 300);

                // Revert back after 2 seconds
                setTimeout(() => {
                    elements.copyBtn.classList.add('float-out');
                    setTimeout(() => {
                        elements.copyBtn.innerHTML = originalHTML;
                        elements.copyBtn.classList.remove('float-out');
                        elements.copyBtn.classList.add('float-in');
                    }, 300);
                }, 2000);
            })
            .catch(err => {
                showToast('Fail to copy!', 'error');
                console.error('Failed to copy:', err);
            });
    })

    elements.closeBtn.addEventListener('click', () => {
        elements.dialog.classList.add('hidden');
    });
}