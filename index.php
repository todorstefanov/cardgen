<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#f4f6fb">
    <title>CardGen v2.0</title>
    <link rel="stylesheet" href="style.css">
    <script src="functions.js" defer></script>
</head>
<body>
    <main class="card">
        <header class="card__header">
            <span class="eyebrow">TODOR'S CARD NUMBER TOOL</span>
            <h1>CardGen</h1>
            <p>Enter a BIN, a five-digit PAN, or both to generate a checksum-valid test number for a supported card brand.</p>
        </header>

        <div class="form">
            <div class="field">
                <label for="bin">BIN <span class="label-hint">6 or 8 digits</span></label>
                <input
                    id="bin"
                    name="bin"
                    type="text"
                    inputmode="numeric"
                    autocomplete="off"
                    maxlength="8"
                    pattern="[0-9]{6}|[0-9]{8}"
                    placeholder="e.g. 424242"
                    aria-describedby="bin-help"
                >
                <small id="bin-help">Enter 6 or 8 digits. A BIN can generate a number on its own.</small>
            </div>

            <div class="field">
                <label for="pan">PAN <span class="label-hint">5 digits</span></label>
                <input
                    id="pan"
                    name="pan"
                    type="text"
                    inputmode="numeric"
                    autocomplete="off"
                    maxlength="5"
                    pattern="[0-9]{5}"
                    placeholder="e.g. 40042"
                    aria-describedby="pan-help"
                >
                <small id="pan-help">Enter 5 digits. With a BIN, the first digit matches it; the last four are preserved.</small>
            </div>
        </div>

        <section id="result" class="result" aria-live="polite" hidden>
            <span class="result__label">Generated card number</span>
            <output id="card-number" class="result__number"></output>
            <button id="copy-number" class="copy-button" type="button" disabled>Copy number</button>
            <p id="result-message" class="result__message"></p>
            <p id="copy-message" class="copy-message" role="status" aria-live="polite"></p>
        </section>
    </main>
</body>
</html>
