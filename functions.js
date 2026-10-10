const binInput = document.querySelector("#bin");
const panInput = document.querySelector("#pan");
const result = document.querySelector("#result");
const cardNumber = document.querySelector("#card-number");
const resultMessage = document.querySelector("#result-message");
const copyButton = document.querySelector("#copy-number");
const copyMessage = document.querySelector("#copy-message");
let panSuffixEntered = false;

function digitsOnly(value) {
    return value.replace(/\D/g, "");
}

function setResult(message, number = "") {
    result.hidden = false;
    cardNumber.textContent = number;
    resultMessage.textContent = message;
    result.classList.toggle("result--error", number === "");
    copyButton.disabled = number === "";
    copyButton.textContent = "Copy number";
    copyMessage.textContent = "";
}

function clearResult() {
    result.hidden = true;
    cardNumber.textContent = "";
    resultMessage.textContent = "";
    copyMessage.textContent = "";
    copyButton.disabled = true;
    copyButton.textContent = "Copy number";
    result.classList.remove("result--error");
}

async function copyCardNumber() {
    if (!cardNumber.textContent || copyButton.disabled) {
        return;
    }

    if (!navigator.clipboard?.writeText) {
        copyMessage.textContent = "Clipboard access is unavailable in this browser or page context.";
        return;
    }

    try {
        await navigator.clipboard.writeText(cardNumber.textContent);
        copyButton.textContent = "Copied";
        copyMessage.textContent = "Card number copied to clipboard.";
    } catch (error) {
        copyMessage.textContent = "Could not copy the card number. Check clipboard permissions and try again.";
    }
}

function getCardBrand(numberPrefix) {
    if (numberPrefix.startsWith("4")) {
        return { name: "Visa", length: 16 };
    }

    const firstTwo = Number(numberPrefix.slice(0, 2));
    const firstThree = Number(numberPrefix.slice(0, 3));
    const firstFour = Number(numberPrefix.slice(0, 4));
    const firstSix = Number(numberPrefix.slice(0, 6));

    if (firstTwo === 34 || firstTwo === 37) {
        return { name: "American Express", length: 15 };
    }
    if ((firstThree >= 300 && firstThree <= 305) || firstTwo === 36 || (firstTwo >= 38 && firstTwo <= 39)) {
        return { name: "Diners Club", length: 14 };
    }
    if (
        numberPrefix.startsWith("6011") ||
        (firstSix >= 622126 && firstSix <= 622925) ||
        (firstThree >= 644 && firstThree <= 649) ||
        firstTwo === 65
    ) {
        return { name: "Discover", length: 16 };
    }
    if (firstFour >= 3528 && firstFour <= 3589) {
        return { name: "JCB", length: 16 };
    }
    if ((firstTwo >= 51 && firstTwo <= 55) || (firstFour >= 2221 && firstFour <= 2720)) {
        return { name: "Mastercard", length: 16 };
    }
    if (firstTwo === 50 || (firstTwo >= 56 && firstTwo <= 69)) {
        return { name: "Maestro", length: 16 };
    }

    return null;
}

function getPanOnlyPrefix(firstDigit) {
    if (firstDigit === "4") {
        return { prefix: "4", brand: { name: "Visa", length: 16 } };
    }
    if (firstDigit === "5") {
        if (crypto.getRandomValues(new Uint8Array(1))[0] % 2 === 0) {
            return { prefix: "50", brand: { name: "Maestro", length: 16 } };
        }
        const secondDigit = 1 + (crypto.getRandomValues(new Uint8Array(1))[0] % 5);
        return { prefix: `5${secondDigit}`, brand: { name: "Mastercard", length: 16 } };
    }
    if (firstDigit === "2") {
        return { prefix: "2221", brand: { name: "Mastercard", length: 16 } };
    }
    if (firstDigit === "6") {
        if (crypto.getRandomValues(new Uint8Array(1))[0] % 2 === 0) {
            return { prefix: "56", brand: { name: "Maestro", length: 16 } };
        }
        return { prefix: "6011", brand: { name: "Discover", length: 16 } };
    }
    if (firstDigit === "3") {
        const brands = [
            { prefix: "34", brand: { name: "American Express", length: 15 } },
            { prefix: "300", brand: { name: "Diners Club", length: 14 } },
            { prefix: "3528", brand: { name: "JCB", length: 16 } },
        ];
        return brands[crypto.getRandomValues(new Uint8Array(1))[0] % brands.length];
    }

    return null;
}

function randomDigits(length) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => String(byte % 10)).join("");
}

function luhnCheckDigit(number) {
    let sum = 0;
    let doubleDigit = true;

    for (let index = number.length - 1; index >= 0; index -= 1) {
        let digit = Number(number[index]);
        if (doubleDigit) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        sum += digit;
        doubleDigit = !doubleDigit;
    }

    return String((10 - (sum % 10)) % 10);
}

function syncPanWithBin() {
    binInput.value = digitsOnly(binInput.value).slice(0, 8);
    panInput.value = digitsOnly(panInput.value).slice(0, 5);

    const bin = binInput.value;
    const hasCompleteBin = bin.length === 6 || bin.length === 8;
    if (hasCompleteBin) {
        const pan = digitsOnly(panInput.value);
        panInput.value = `${bin[0]}${pan.slice(1)}`.slice(0, 5);
    }
}

function updateResult() {
    syncPanWithBin();

    const bin = binInput.value;
    const pan = panInput.value;
    const hasCompleteBin = bin.length === 6 || bin.length === 8;
    const hasBinInput = bin.length > 0;
    const hasPanInput = bin === "" ? pan.length > 0 : panSuffixEntered;
    const hasCompletePan = pan.length === 5 && hasPanInput;

    if ((hasBinInput && !hasCompleteBin) || (hasPanInput && !hasCompletePan)) {
        clearResult();
        return;
    }

    if (!hasCompleteBin && !hasCompletePan) {
        clearResult();
        return;
    }

    const panOnly = !hasCompleteBin ? getPanOnlyPrefix(pan[0]) : null;
    if (!hasCompleteBin && !panOnly) {
        setResult("This starting digit is not supported by Visa, Mastercard, American Express, Diners Club, Discover, JCB, or Maestro.");
        return;
    }

    const prefix = hasCompleteBin ? bin : panOnly.prefix;
    const suffix = hasCompletePan ? pan.slice(1) : "";
    let number = "";
    let brand = hasCompleteBin ? getCardBrand(prefix) : panOnly.brand;
    if (!brand) {
        setResult("This BIN is not in a supported Visa, Mastercard, American Express, Diners Club, Discover, JCB, or Maestro range.");
        return;
    }

    for (let attempt = 0; attempt < 1000; attempt += 1) {
        const candidateLength = brand.length - 1;
        const fillerLength = candidateLength - prefix.length - (suffix === "" ? 0 : 3);
        const candidate = `${prefix}${randomDigits(fillerLength)}${suffix.slice(0, 3)}`;
        const detectedBrand = getCardBrand(candidate);
        const checkDigit = luhnCheckDigit(candidate);
        if (detectedBrand && detectedBrand.name === brand.name && (suffix === "" || checkDigit === suffix[3])) {
            number = `${candidate}${checkDigit}`;
            break;
        }
    }

    if (!number) {
        setResult("Could not generate a valid number for this supported card range. Check the BIN or PAN and try again.");
        return;
    }

    setResult(`${brand.name} test number generated. Use test numbers only.`, number);
}

binInput.addEventListener("input", () => {
    syncPanWithBin();
    updateResult();
});

panInput.addEventListener("input", () => {
    const pan = digitsOnly(panInput.value).slice(0, 5);
    const hasCompleteBin = binInput.value.length === 6 || binInput.value.length === 8;
    panInput.value = hasCompleteBin ? `${binInput.value[0]}${pan.slice(1)}` : pan;
    panSuffixEntered = hasCompleteBin ? pan.slice(1).length > 0 : pan.length > 0;
    updateResult();
});

copyButton.addEventListener("click", copyCardNumber);
