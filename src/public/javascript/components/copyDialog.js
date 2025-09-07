import { showToast } from "/javascript/components/toaster.js";

const elements = {
    dialog: document.getElementById("copyDialog"),
    dialogTitle: document.getElementById("dialogTitle"),
    dialogText: document.getElementById("dialogText"),
    dialogCopyBtn: document.getElementById("dialogCopyBtn"),
    closeBtn: document.getElementById("closeDialogBtn"),
};

const copyPath = `
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
        class="w-7 h-7 fill-none">
        <path stroke-linejoin="round" stroke-width="2"
            class="text-text-muted stroke-current group-hover:brightness-[var(--highlight-brightness)]"
            d="M9 8v3a1 1 0 0 1-1 1H5m11 4h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1m4 3v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.13a1 1 0 0 1 .24-.65L7.7 8.35A1 1 0 0 1 8.46 8H13a1 1 0 0 1 1 1Z" />
    </svg>Copy`;
const copiedPath = `
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="none" viewBox="0 0 24 24">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"d="M5 11.917 9.724 16.5 19 7.5"/>
    </svg>Copied`;

export function showCopyDialog(title, textToCopy) {
    elements.dialogTitle.innerHTML = title;
    elements.dialogText.value = textToCopy;
    elements.dialog.classList.remove("hidden");
}

let appearTimeout, disappearTimeout;

elements.dialogCopyBtn.addEventListener("click", () => {
    elements.dialogCopyBtn.disabled = true;

    navigator.clipboard
        .writeText(elements.dialogText.value)
        .then(() => {
            showToast("Copied clipboard!", "success");

            // Smooth transition by adding a class
            elements.dialogCopyBtn.classList.add("float-out");

            appearTimeout = setTimeout(() => {
                elements.dialogCopyBtn.innerHTML = copiedPath;
                elements.dialogCopyBtn.classList.remove("float-out");
                elements.dialogCopyBtn.classList.add("float-in");
            }, 300);

            // Revert back after 1 seconds
            disappearTimeout = setTimeout(() => {
                elements.dialogCopyBtn.classList.add("float-out");
                setTimeout(() => {
                    elements.dialogCopyBtn.innerHTML = copyPath;
                    elements.dialogCopyBtn.classList.remove("float-out");
                    elements.dialogCopyBtn.classList.add("float-in");
                    elements.dialogCopyBtn.disabled = false;
                }, 300);
            }, 1000);
        })
        .catch((err) => {
            showToast("Fail to copy!", "error");
            console.error("Failed to copy:", err);
        });
});

elements.closeBtn.addEventListener("click", () => {
    // Clear pending animations
    clearTimeout(appearTimeout);
    clearTimeout(disappearTimeout);
    
    elements.dialogCopyBtn.innerHTML = copyPath;
    elements.dialogCopyBtn.classList.remove("float-in", "float-out");
    elements.dialogText.value = "";
    elements.dialog.classList.add("hidden");
});
