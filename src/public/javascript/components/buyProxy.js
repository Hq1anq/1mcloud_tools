const elements = {
	container: document.getElementById("buyContainer"),
	dialog: document.getElementById("buyDialog"),
	cancelBuy: document.getElementById("cancelBuy"),

	buyQuantity: document.getElementById("buyQuantity"),
	buyNation: document.getElementById("buyNation-trigger"),
	nationMenu: document.getElementById("buyNation-menu"),
	apiKey: document.getElementById("api-key"),

	summaryOriginalPrice: document.getElementById("summaryOriginalPrice"),
	summaryDiscount: document.getElementById("summaryDiscount"),
	summaryMustPay: document.getElementById("summaryMustPay")
};

export function showBuyDialog() {
	elements.container.classList.remove("hidden");
	setTimeout(() => {
		elements.dialog.classList.remove("scale-90", "opacity-0");
		elements.dialog.classList.add("scale-100", "opacity-100");
	}, 10);

	elements.cancelBuy.addEventListener("click", closeBuyDialog);
	elements.buyQuantity.addEventListener("change", calculateSummary);
	elements.nationMenu.addEventListener("click", calculateSummary);
	calculateSummary();
}

async function calculateSummary() {
	const nationCode = elements.buyNation.textContent.trim()
		.match(/\((.*)\)/)[1];
	const apiKeyString = elements.apiKey.value.trim();
	const quantityString = elements.buyQuantity.value;

	const res = await fetch('/proxy/buy-calc', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
			quantity: +quantityString,
			nation: nationCode,
			apiKey: apiKeyString
		})
    });

	const data = await res.json();
	let summaryOriginalPrice = "ERROR", summaryDiscount = "ERROR", summaryMustPay = "ERROR";

	if (data.success) {
		summaryOriginalPrice = data.info.original_price;
		summaryDiscount = `-${data.info.discount}`;
		summaryMustPay = data.info.must_pay;
	}

	elements.summaryOriginalPrice.innerHTML = summaryOriginalPrice;
	elements.summaryDiscount.innerHTML = summaryDiscount;
	elements.summaryMustPay.innerHTML = summaryMustPay;
}

export function closeBuyDialog() {
	elements.dialog.classList.remove("scale-100", "opacity-100");
	elements.dialog.classList.add("scale-90", "opacity-0");
	setTimeout(() => {
		elements.container.classList.add("hidden");
	}, 300);
}
