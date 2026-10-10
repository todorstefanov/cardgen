const binInput = document.querySelector("#bin");
const panInput = document.querySelector("#pan");
const result = document.querySelector("#result");
const cardNumber = document.querySelector("#card-number");
const resultMessage = document.querySelector("#result-message");
let panSuffixEntered = false;

function digitsOnly(value) {
    return value.replace(/\D/g, "");
}

function setResult(message, number = "") {
    result.hidden = false;
    cardNumber.textContent = number;
    resultMessage.textContent = message;
    result.classList.toggle("result--error", number === "");
}

function clearResult() {
    result.hidden = true;
    cardNumber.textContent = "";
    resultMessage.textContent = "";
    result.classList.remove("result--error");
}

function getCardBrand(numberPrefix) {
    if (numberPrefix.startsWith("4")) {
        return "Visa";
    }

    const firstTwo = Number(numberPrefix.slice(0, 2));
    const firstFour = Number(numberPrefix.slice(0, 4));
    if ((firstTwo >= 51 && firstTwo <= 55) || (firstFour >= 2221 && firstFour <= 2720)) {
        return "Mastercard";
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

    const prefix = hasCompleteBin ? bin : pan[0];
    const suffix = hasCompletePan ? pan.slice(1) : "";
    const fillerLength = 15 - prefix.length - (suffix === "" ? 0 : 3);
    let number = "";
    let brand = null;

    for (let attempt = 0; attempt < 1000; attempt += 1) {
        const candidate = `${prefix}${randomDigits(fillerLength)}${suffix.slice(0, 3)}`;
        brand = getCardBrand(candidate);
        const checkDigit = luhnCheckDigit(candidate);
        if (brand && (suffix === "" || checkDigit === suffix[3])) {
            number = `${candidate}${checkDigit}`;
            break;
        }
    }

    if (!number) {
        setResult("This BIN or leading digit is not in a supported Visa or Mastercard range.");
        return;
    }

    setResult(`${brand} test number generated. Use test numbers only.`, number);
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
