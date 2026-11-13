
"use strict";

const STORAGE_KEYS = {
    theme: "masterTextTheme",
    darkMode: "masterTextDarkMode",
    fontSize: "masterTextFontSize",
    userName: "masterTextUserName",
    name: "masterTextName",
    loggedIn: "masterTextLoggedIn",
    guest: "masterTextGuest",
    drafts: "masterTextDrafts"
};

function getSavedItem(key, fallback = "") {
    try {
        const value = localStorage.getItem(key);
        return value !== null ? value : fallback;
    } catch (error) {
        console.error("Storage read failed:", error);
        return fallback;
    }
}

function saveItem(key, value) {
    try {
        localStorage.setItem(key, String(value));
        return true;
    } catch (error) {
        console.error("Storage save failed:", error);
        return false;
    }
}

function removeSavedItem(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error("Storage removal failed:", error);
        return false;
    }
}

function getSavedDrafts() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.drafts);

        if (!stored) return [];

        const drafts = JSON.parse(stored);

        if (!Array.isArray(drafts)) return [];

        return drafts.filter(draft =>
            draft &&
            typeof draft === "object" &&
            draft.id !== undefined &&
            typeof draft.content === "string"
        );
    } catch (error) {
        console.error("Could not load drafts:", error);
        return [];
    }
}

function saveDrafts(drafts) {
    if (!Array.isArray(drafts)) return false;

    return saveItem(
        STORAGE_KEYS.drafts,
        JSON.stringify(drafts)
    );
}

function createDraftId() {
    return Date.now().toString() +
        Math.random().toString(36).slice(2, 8);
}

function countWords(text) {
    const trimmed = String(text || "").trim();

    return trimmed
        ? trimmed.split(/\s+/u).length
        : 0;
}

function setupPreferences() {
    const root = document.documentElement;

    const themeToggle =
        document.getElementById("themeToggle") ||
        document.getElementById("darkModeToggle");

    const fontSizeSelect =
        document.getElementById("fontSize") ||
        document.getElementById("fontSizeSelect");

    const fontScales = {
        small: 0.85,
        medium: 1,
        large: 1.20
    };

    function normaliseFontSize(value) {
        const aliases = {
            small: "small",
            medium: "medium",
            large: "large",
            big: "large",
            "font-small": "small",
            "font-medium": "medium",
            "font-large": "large",
            "font-big": "large"
        };

        return aliases[
            String(value || "").toLowerCase()
        ] || "medium";
    }

    function applyTheme(theme, persist = true) {
        const selected =
            theme === "dark" ? "dark" : "light";

        const isDark = selected === "dark";

        root.classList.toggle("dark-mode", isDark);
        document.body.classList.toggle("dark-mode", isDark);

        root.dataset.theme = selected;
        document.body.dataset.theme = selected;

        if (themeToggle) {
            themeToggle.checked = isDark;

            themeToggle.setAttribute(
                "aria-pressed",
                String(isDark)
            );
        }

        if (persist) {
            saveItem(STORAGE_KEYS.theme, selected);
            saveItem(STORAGE_KEYS.darkMode, String(isDark));
        }
    }

    function applyFontSize(value, persist = true) {
        const selected = normaliseFontSize(value);
        const scale = fontScales[selected];

        root.style.setProperty(
            "--font-scale",
            String(scale)
        );

        root.style.setProperty(
            "--font-size",
            `calc(16px * ${scale})`
        );

        root.dataset.fontSize = selected;
        document.body.dataset.fontSize = selected;

        const fontClasses = [
            "font-small",
            "font-medium",
            "font-large",
            "font-big"
        ];

        root.classList.remove(...fontClasses);
        document.body.classList.remove(...fontClasses);

        root.classList.add(`font-${selected}`);

        document.body.classList.add(
            selected === "large"
                ? "font-big"
                : `font-${selected}`
        );

        if (fontSizeSelect) {
            const matchingOption = Array.from(
                fontSizeSelect.options
            ).find(option =>
                normaliseFontSize(option.value) === selected
            );

            if (matchingOption) {
                fontSizeSelect.value = matchingOption.value;
            }
        }

        document.querySelectorAll(
            "[data-font-size]"
        ).forEach(control => {
            const active =
                normaliseFontSize(
                    control.dataset.fontSize
                ) === selected;

            control.classList.toggle("active", active);

            control.setAttribute(
                "aria-pressed",
                String(active)
            );
        });

        if (persist) {
            saveItem(STORAGE_KEYS.fontSize, selected);
        }
    }

    const savedTheme =
        getSavedItem(STORAGE_KEYS.theme) ||
        (
            getSavedItem(STORAGE_KEYS.darkMode) === "true"
                ? "dark"
                : "light"
        );

    const savedFontSize = getSavedItem(
        STORAGE_KEYS.fontSize,
        "medium"
    );

    applyTheme(savedTheme, false);
    applyFontSize(savedFontSize, false);

    themeToggle?.addEventListener("change", () => {
        applyTheme(
            themeToggle.checked ? "dark" : "light"
        );
    });

    fontSizeSelect?.addEventListener("change", () => {
        applyFontSize(fontSizeSelect.value);
    });

    document.querySelectorAll(
        "[data-font-size]"
    ).forEach(control => {
        control.addEventListener("click", event => {
            event.preventDefault();
            applyFontSize(control.dataset.fontSize);
        });
    });

    window.addEventListener("storage", event => {
        if (
            event.key === STORAGE_KEYS.theme ||
            event.key === STORAGE_KEYS.darkMode
        ) {
            const theme =
                getSavedItem(STORAGE_KEYS.theme) ||
                (
                    getSavedItem(STORAGE_KEYS.darkMode) === "true"
                        ? "dark"
                        : "light"
                );

            applyTheme(theme, false);
        }

        if (event.key === STORAGE_KEYS.fontSize) {
            applyFontSize(event.newValue || "medium", false);
        }
    });
}

function setupMenus() {
    const profileButton =
        document.getElementById("profileButton");

    const settingsButton =
        document.getElementById("settingsButton");

    const profileMenu =
        document.getElementById("profileMenu");

    const settingsMenu =
        document.getElementById("settingsMenu");

    function closeMenus() {
        profileMenu?.classList.remove("show", "open");
        settingsMenu?.classList.remove("show", "open");

        profileButton?.setAttribute(
            "aria-expanded",
            "false"
        );

        settingsButton?.setAttribute(
            "aria-expanded",
            "false"
        );
    }

    function toggleMenu(button, menu) {
        if (!button || !menu) return;

        const shouldOpen =
            !menu.classList.contains("show") &&
            !menu.classList.contains("open");

        closeMenus();

        if (shouldOpen) {
            menu.classList.add("show", "open");

            button.setAttribute(
                "aria-expanded",
                "true"
            );
        }
    }

    profileButton?.addEventListener("click", event => {
        event.stopPropagation();
        toggleMenu(profileButton, profileMenu);
    });

    settingsButton?.addEventListener("click", event => {
        event.stopPropagation();
        toggleMenu(settingsButton, settingsMenu);
    });

    profileMenu?.addEventListener("click", event => {
        event.stopPropagation();
    });

    settingsMenu?.addEventListener("click", event => {
        event.stopPropagation();
    });

    document.addEventListener("click", closeMenus);

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeMenus();
        }
    });
}

function setupProfile() {
    const profileName =
        document.getElementById("profileName");

    const loginLink =
        document.getElementById("loginLink");

    const logoutButton =
        document.getElementById("logoutButton");

    const name =
        getSavedItem(STORAGE_KEYS.name) ||
        getSavedItem(STORAGE_KEYS.userName) ||
        "Guest";

    const loggedIn =
        getSavedItem(STORAGE_KEYS.loggedIn) === "true";

    if (profileName) {
        profileName.textContent = name;
    }

    if (loginLink) {
        loginLink.hidden = loggedIn;
    }

    if (logoutButton) {
        logoutButton.hidden = !loggedIn;

        logoutButton.onclick = function() {
            removeSavedItem(STORAGE_KEYS.name);
            removeSavedItem(STORAGE_KEYS.userName);
            removeSavedItem(STORAGE_KEYS.loggedIn);
            removeSavedItem(STORAGE_KEYS.guest);

            sessionStorage.removeItem("masterTextUser");

            window.location.href = "login.html";
        };
    }
}

function setupHeader() {
    setupMenus();
    setupProfile();
}

function setupLogin() {
    const loginForm =
        document.getElementById("loginForm");

    const guestButton =
        document.getElementById("guestButton");

    const loginName =
        document.getElementById("loginName");

    const loginPassword =
        document.getElementById("loginPassword");

    const loginMessage =
        document.getElementById("loginMessage");

    function showMessage(message) {
        if (loginMessage) {
            loginMessage.textContent = message;
        }
    }

    loginForm?.addEventListener("submit", event => {
        event.preventDefault();

        const name = loginName?.value.trim();
        const password = loginPassword?.value;

        if (!name || !password) {
            showMessage(
                "Please enter your name and password."
            );
            return;
        }

        saveItem(STORAGE_KEYS.userName, name);
        saveItem(STORAGE_KEYS.name, name);
        saveItem(STORAGE_KEYS.loggedIn, "true");
        saveItem(STORAGE_KEYS.guest, "false");

        sessionStorage.setItem(
            "masterTextUser",
            name
        );

        window.location.href = "home.html";
    });

    guestButton?.addEventListener("click", () => {
        saveItem(STORAGE_KEYS.userName, "Guest");
        saveItem(STORAGE_KEYS.name, "Guest");
        saveItem(STORAGE_KEYS.loggedIn, "false");
        saveItem(STORAGE_KEYS.guest, "true");

        sessionStorage.removeItem("masterTextUser");

        window.location.href = "home.html";
    });
}

function setupWordCount() {
    const answer = document.getElementById("answer");
    const output = document.getElementById("wordCount");

    if (!answer || !output) return;

    function updateWordCount() {
        output.textContent = `${countWords(answer.value)} words`;
    }

    answer.addEventListener("input", updateWordCount);
    updateWordCount();
}

function setupPracticeTimer() {
    const timeButton = document.getElementById("timeButton");
    const timeSetup = document.getElementById("timeSetup");
    const timeInput = document.getElementById("timeInput");
    const startButton = document.getElementById("startTimer");
    const timeError = document.getElementById("timeError");
    const timerDisplay = document.getElementById("timerDisplay");
    const timerOptions = document.getElementById("timerOptions");
    const addTimeButton = document.getElementById("addTimeButton");
    const submitButton = document.getElementById("submitButton");
    const answer = document.getElementById("answer");
    const status = document.getElementById("statusMessage");
    const toast = document.getElementById("reminderToast");

    if (
        !timeButton || !timeSetup || !timeInput ||
        !startButton || !timerDisplay || !answer
    ) return;

    let remaining = 0;
    let deadline = null;
    let interval = null;
    let running = false;
    let expired = false;
    let addingTime = false;
    let toastTimeout = null;
    let notifiedFive = false;
    let notifiedTwo = false;

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;

        return (
            `${String(minutes).padStart(2, "0")}:` +
            `${String(secs).padStart(2, "0")}`
        );
    }

    function showToast(message, duration = 4000) {
        if (!toast) return;

        toast.textContent = message;
        toast.classList.add("visible");

        clearTimeout(toastTimeout);

        toastTimeout = setTimeout(() => {
            toast.classList.remove("visible");
        }, duration);
    }

    function setStatus(message) {
        if (status) status.textContent = message;
    }

    function renderTimer() {
        timerDisplay.textContent = formatTime(remaining);
    }

    function stopInterval() {
        if (interval !== null) clearInterval(interval);

        interval = null;
        running = false;
        deadline = null;
    }

    function revealSetup(isAdding = false) {
        stopInterval();

        addingTime = isAdding;
        timeSetup.hidden = false;
        timerDisplay.hidden = true;
        timeButton.hidden = true;

        if (timerOptions) timerOptions.hidden = true;

        timeInput.value = "";

        if (timeError) timeError.textContent = "";

        timeInput.focus();
    }

    function parseTime() {
        const value = timeInput.value.trim();
        const match = value.match(/^(\d{1,3}):([0-5]\d)$/);

        if (!match) {
            throw new Error(
                "Enter time as mm:ss, for example 05:30."
            );
        }

        const minutes = Number(match[1]);
        const seconds = Number(match[2]);
        const total = minutes * 60 + seconds;

        if (total <= 0) {
            throw new Error(
                "Please enter a time greater than 00:00."
            );
        }

        return total;
    }

    function startTimer() {
        let total;

        try {
            total = parseTime();
        } catch (error) {
            if (timeError) timeError.textContent = error.message;
            return;
        }

        if (addingTime) {
            remaining += total;
        } else {
            remaining = total;
            notifiedFive = false;
            notifiedTwo = false;
        }

        addingTime = false;
        expired = false;

        if (timeError) timeError.textContent = "";

        timeSetup.hidden = true;
        timerDisplay.hidden = false;
        timeButton.hidden = false;
        timeButton.textContent = "Pause";

        if (timerOptions) timerOptions.hidden = true;

        answer.disabled = false;

        if (submitButton) submitButton.disabled = false;
        if (addTimeButton) addTimeButton.disabled = false;

        setStatus("Your timed practice has started.");

        renderTimer();
        runClock();
    }

    function finishTimer() {
        stopInterval();

        remaining = 0;
        expired = true;

        renderTimer();

        answer.disabled = false;
        timeButton.hidden = true;

        if (timerOptions) timerOptions.hidden = false;

        if (addTimeButton) {
            addTimeButton.hidden = false;
            addTimeButton.disabled = false;
        }

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Submit";
        }

        setStatus(
            "Time is up. You can add more time or submit your answer."
        );

        showToast(
            "Time is up. Your answer is ready to submit.",
            5000
        );
    }

    function runClock() {
        if (interval !== null) clearInterval(interval);

        if (remaining <= 0) {
            finishTimer();
            return;
        }

        running = true;
        deadline = Date.now() + remaining * 1000;

        interval = setInterval(() => {
            if (!running || expired) return;

            remaining = Math.max(
                0,
                Math.ceil((deadline - Date.now()) / 1000)
            );

            renderTimer();

            if (
                !notifiedFive &&
                remaining <= 300 &&
                remaining > 0
            ) {
                notifiedFive = true;
                showToast("Five minutes remaining.", 5000);
            }

            if (
                !notifiedTwo &&
                remaining <= 120 &&
                remaining > 0
            ) {
                notifiedTwo = true;
                showToast("Two minutes remaining.", 5000);
            }

            if (remaining > 0 && remaining % 600 === 0) {
                showToast("Keep going — check your progress.");
            }

            if (remaining <= 0) finishTimer();
        }, 200);
    }

    timeButton.addEventListener("click", () => {
        if (expired) return;

        if (running) {
            remaining = Math.max(
                0,
                Math.ceil((deadline - Date.now()) / 1000)
            );

            stopInterval();
            renderTimer();

            timeButton.textContent = "Resume";

            setStatus(
                "Timer paused. Click Resume to continue."
            );
        } else if (remaining > 0) {
            runClock();

            timeButton.textContent = "Pause";
            setStatus("Timer resumed.");
        }
    });

    timeButton.addEventListener("dblclick", event => {
        event.preventDefault();
        revealSetup(false);
    });

    startButton.addEventListener("click", startTimer);

    timeInput.addEventListener("input", () => {
        timeInput.value = timeInput.value
            .replace(/[^\d:]/g, "")
            .slice(0, 6);

        if (timeError) timeError.textContent = "";
    });

    timeInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            startTimer();
        }
    });

    addTimeButton?.addEventListener("click", () => {
        if (!expired && remaining <= 0) return;

        revealSetup(true);

        setStatus(
            "Enter the additional time in mm:ss."
        );
    });

    submitButton?.addEventListener("click", event => {
        event.preventDefault();

        const content = answer.value.trim();

        if (!content) {
            setStatus("Write an answer before submitting.");
            answer.disabled = false;
            answer.focus();
            return;
        }

        stopInterval();

        const drafts = getSavedDrafts();

        drafts.unshift({
            id: createDraftId(),
            title: "Timed practice — " + new Date().toLocaleDateString(),
            content,
            date: new Date().toISOString(),
            type: "practice"
        });

        saveDrafts(drafts);

        setStatus("Your answer has been saved to your drafts.");
        showToast("Practice answer saved.", 4000);
    });

    renderTimer();
}

function setupFAQ() {
    const viewMoreButton =
        document.getElementById("viewMoreButton");

    const extraQuestions =
        document.querySelectorAll(".extra-question");

    if (!viewMoreButton) return;

    let expanded = false;

    function updateFAQ() {
        extraQuestions.forEach(question => {
            question.hidden = !expanded;

            question.classList.toggle(
                "visible",
                expanded
            );
        });

        viewMoreButton.textContent =
            expanded ? "View Less" : "View More";

        viewMoreButton.setAttribute(
            "aria-expanded",
            String(expanded)
        );
    }

    updateFAQ();

    viewMoreButton.addEventListener("click", () => {
        expanded = !expanded;
        updateFAQ();
    });
}

function setupContactForm() {
    const contactForm =
        document.getElementById("contactForm");

    const contactMessage =
        document.getElementById("contactMessage");

    if (!contactForm) return;

    contactForm.addEventListener("submit", event => {
        event.preventDefault();

        if (!contactForm.checkValidity()) {
            contactForm.reportValidity();
            return;
        }

        const firstName =
            document.getElementById("firstName")?.value.trim();

        const lastName =
            document.getElementById("lastName")?.value.trim();

        const email =
            document.getElementById("contactEmail")?.value.trim();

        const reason =
            document.getElementById("reason")?.value.trim();

        if (!firstName || !lastName || !email || !reason) {
            if (contactMessage) {
                contactMessage.textContent =
                    "Please complete all required fields.";
            }

            return;
        }

        if (contactMessage) {
            contactMessage.textContent =
                "Your details are valid. Message delivery has not yet been configured.";
        }
    });
}

function setupDrafts() {
    const grid = document.getElementById("draftGrid");
    const modal = document.getElementById("draftModal");
    const form = document.getElementById("draftForm");

    if (!grid || !modal || !form) return;

    const titleInput = document.getElementById("draftTitle");
    const contentInput = document.getElementById("draftContent");
    const modalTitle = document.getElementById("draftModalTitle");
    const emptyMessage = document.getElementById("emptyDrafts");
    const closeButton = document.getElementById("closeDraftModal");
    const cancelButton = document.getElementById("cancelDraft");

    if (!titleInput || !contentInput) return;

    let editingId = null;

    function openModal(draft = null) {
        editingId = draft ? draft.id : null;

        if (modalTitle) {
            modalTitle.textContent = draft
                ? "Edit Draft"
                : "New Draft";
        }

        titleInput.value = draft?.title || "";
        contentInput.value = draft?.content || "";

        modal.hidden = false;
        titleInput.focus();
    }

    function closeModal() {
        modal.hidden = true;
        form.reset();
        editingId = null;
    }

    function createElement(tag, className, text) {
        const element = document.createElement(tag);

        if (className) element.className = className;

        if (text !== undefined) {
            element.textContent = text;
        }

        return element;
    }

    function renderDrafts() {
        const drafts = getSavedDrafts();

        grid.replaceChildren();

        if (emptyMessage) {
            emptyMessage.hidden = drafts.length > 0;
        }

        drafts.forEach(draft => {
            const card = createElement("article", "draft-card");

            card.tabIndex = 0;

            card.setAttribute(
                "aria-label",
                `Open draft: ${draft.title || "Untitled Draft"}`
            );

            const title = createElement(
                "h2",
                "",
                draft.title || "Untitled Draft"
            );

            const content = draft.content || "";

            const preview = createElement(
                "p",
                "",
                content.slice(0, 100) +
                (content.length > 100 ? "..." : "")
            );

            const date = createElement("div", "draft-date");

            const savedDate = draft.savedAt
                ? new Date(draft.savedAt)
                : null;

            date.textContent =
                savedDate &&
                !Number.isNaN(savedDate.getTime())
                    ? `Saved ${savedDate.toLocaleDateString()}`
                    : "Saved draft";

            const actions = createElement(
                "div",
                "draft-card-actions"
            );

            const editButton = createElement(
                "button",
                "",
                "Edit"
            );

            editButton.type = "button";

            editButton.addEventListener("click", event => {
                event.stopPropagation();
                openModal(draft);
            });

            const deleteButton = createElement(
                "button",
                "",
                "Delete"
            );

            deleteButton.type = "button";

            deleteButton.addEventListener("click", event => {
                event.stopPropagation();

                if (!confirm("Delete this draft?")) return;

                const updated = getSavedDrafts().filter(
                    item =>
                        String(item.id) !== String(draft.id)
                );

                saveDrafts(updated);
                renderDrafts();
            });

            actions.append(editButton, deleteButton);

            card.append(title, preview, date, actions);

            card.addEventListener("click", () => {
                openModal(draft);
            });

            card.addEventListener("keydown", event => {
                if (
                    event.target === card &&
                    (event.key === "Enter" || event.key === " ")
                ) {
                    event.preventDefault();
                    openModal(draft);
                }
            });

            grid.appendChild(card);
        });

        const addCard = createElement(
            "button",
            "add-draft-card",
            "+"
        );

        addCard.type = "button";

        addCard.setAttribute(
            "aria-label",
            "Create a new draft"
        );

        addCard.addEventListener("click", () => {
            openModal();
        });

        grid.appendChild(addCard);
    }

    form.addEventListener("submit", event => {
        event.preventDefault();

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title || !content) {
            alert("Please enter a title and some writing.");
            return;
        }

        const drafts = getSavedDrafts();

        if (editingId !== null) {
            const index = drafts.findIndex(
                item =>
                    String(item.id) === String(editingId)
            );

            if (index !== -1) {
                drafts[index] = {
                    ...drafts[index],
                    title,
                    content,
                    savedAt: new Date().toISOString()
                };
            } else {
                drafts.unshift({
                    id: createDraftId(),
                    title,
                    content,
                    savedAt: new Date().toISOString(),
                    source: "Drafts"
                });
            }
        } else {
            drafts.unshift({
                id: createDraftId(),
                title,
                content,
                savedAt: new Date().toISOString(),
                source: "Drafts"
            });
        }

        if (!saveDrafts(drafts)) {
            alert(
                "Could not save your draft. Check your browser storage."
            );
            return;
        }

        closeModal();
        renderDrafts();
    });

    closeButton?.addEventListener("click", closeModal);
    cancelButton?.addEventListener("click", closeModal);

    modal.addEventListener("click", event => {
        if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });

    renderDrafts();
}

function setupNewDraftPage() {
    const form = document.getElementById("newDraftForm");
    const titleInput = document.getElementById("newDraftTitle");
    const textInput = document.getElementById("newDraftText");
    const wordCountOutput = document.getElementById("newDraftWordCount");
    const saveButton = document.getElementById("saveDraftButton");
    const clearButton = document.getElementById("clearDraftButton");
    const statusMessage = document.getElementById("draftStatus");

    if (!form || !textInput) return;

    function updateWordCount() {
        if (wordCountOutput) {
            wordCountOutput.textContent =
                `${countWords(textInput.value)} words`;
        }
    }

    function showStatus(message) {
        if (statusMessage) {
            statusMessage.textContent = message;
        }
    }

    textInput.addEventListener("input", updateWordCount);

    form.addEventListener("submit", event => {
        event.preventDefault();

        const title =
            titleInput?.value.trim() || "Untitled Draft";

        const content = textInput.value.trim();

        if (!content) {
            showStatus("Write something before saving.");
            textInput.focus();
            return;
        }

        const drafts = getSavedDrafts();

        drafts.unshift({
            id: createDraftId(),
            title,
            content,
            savedAt: new Date().toISOString(),
            source: "New Draft"
        });

        if (!saveDrafts(drafts)) {
            showStatus(
                "Your draft could not be saved. Copy your writing before leaving."
            );
            return;
        }

        showStatus("Draft saved successfully!");

        if (saveButton) {
            saveButton.textContent = "Saved!";

            setTimeout(() => {
                saveButton.textContent = "Save Draft";
            }, 2000);
        }
    });

    clearButton?.addEventListener("click", () => {
        const hasContent =
            titleInput?.value.trim() ||
            textInput.value.trim();

        if (
            hasContent &&
            !confirm("Clear your current writing?")
        ) {
            return;
        }

        form.reset();
        updateWordCount();
        showStatus("Your writing area has been cleared.");
    });

    updateWordCount();
}

function setupLiteraryAnalysis() {
    const textSelector = document.getElementById("textModel");
    const questionText = document.getElementById("questionText");
    const readingContent = document.getElementById("readingContent");
    const analysisIntro = document.getElementById("analysisIntro");
    const techniqueSelect = document.getElementById("techniqueSelect");
    const analysisContent = document.getElementById("analysisContent");
    const modelParagraph = document.getElementById("modelParagraph");

    if (
        !textSelector || !questionText || !readingContent ||
        !analysisIntro || !techniqueSelect || !analysisContent ||
        !modelParagraph
    ) return;

    const textModels = {

        ozymandias: {
            question: "How does Shelley present the conflict between human power and time?",
            introduction: "Shelley explores the temporary nature of human power. Select a technique to see how he develops this idea.",
            reading: `
                <span class="text-category">POETRY · ROMANTICISM</span>
                <h2>Ozymandias</h2>
                <h3>Percy Bysshe Shelley</h3>
                <p class="text-context">A traveller describes the remains of a statue belonging to a once-powerful ruler. The ruined monument reveals how time has undermined the ruler's ambition.</p>
                <div class="literary-extract">
                    <p>I met a traveller from an antique land</p>
                    <p>Who said: Two vast and trunkless legs of stone</p>
                    <p>Stand in the desert. Near them, on the sand,</p>
                    <p>Half sunk, a shattered visage lies, whose frown,</p>
                    <p>And wrinkled lip, and sneer of cold command,</p>
                    <p>Tell that its sculptor well those passions read</p>
                    <p>Which yet survive, stamped on these lifeless things,</p>
                    <p>The hand that mocked them and the heart that fed:</p>
                    <p>And on the pedestal these words appear:</p>
                    <p>"My name is Ozymandias, King of Kings;</p>
                    <p>Look on my Works, ye Mighty, and despair!"</p>
                    <p>Nothing beside remains. Round the decay</p>
                    <p>Of that colossal Wreck, boundless and bare</p>
                    <p>The lone and level sands stretch far away.</p>
                </div>
                <div class="reading-notes">
                    <h3>Context</h3>
                    <p>Shelley uses the ruined statue of an Egyptian ruler to question the permanence of political authority and human achievement.</p>
                </div>
                <p class="source-link">Source: <a href="https://www.poetryfoundation.org/poems/46565/ozymandias" target="_blank" rel="noopener noreferrer">Poetry Foundation</a></p>
            `,
            techniques: [
                {
                    name: "Visual imagery",
                    evidence: '"Two vast and trunkless legs of stone"',
                    explanation: "The description of the statue as 'trunkless' emphasises that its central body has disappeared. Although the statue was designed to represent greatness, it has been reduced to incomplete fragments. The contrast between 'vast' and 'trunkless' highlights how even impressive human creations can be destroyed.",
                    message: "Shelley suggests that human power and achievements cannot withstand the passage of time."
                },
                {
                    name: "Characterisation",
                    evidence: '"sneer of cold command"',
                    explanation: "The word 'sneer' presents Ozymandias as arrogant and dismissive, while 'cold' suggests emotional detachment and cruelty. Rather than presenting the ruler as admirable, Shelley reveals the intimidating personality behind his authority.",
                    message: "The poem questions whether power built on arrogance and intimidation deserves admiration."
                },
                {
                    name: "Irony",
                    evidence: '"Look on my Works, ye Mighty, and despair!"',
                    explanation: "Ozymandias expects other rulers to feel inferior when they see his achievements. However, the declaration becomes ironic when the reader discovers that nothing remains. His confidence contrasts with the destruction surrounding the statue.",
                    message: "Shelley exposes the arrogance of people who believe their power and achievements will last forever."
                },
                {
                    name: "Symbolism",
                    evidence: '"The lone and level sands stretch far away."',
                    explanation: "The endless desert symbolises the overwhelming power of nature and time. The landscape stretches far beyond the remains of the statue, making the ruler's monument appear insignificant.",
                    message: "Nature and time outlast the political power and material achievements of human beings."
                },
                {
                    name: "Structure and contrast",
                    evidence: '"Nothing beside remains."',
                    explanation: "This short, abrupt statement interrupts the ruler's confident inscription. The shift from his boastful words to the reality of the empty desert creates a powerful contrast and reverses the meaning of his declaration.",
                    message: "The structure reinforces the idea that time eventually overturns human attempts to achieve permanence."
                },
                {
                    name: "Alliteration and sound",
                    evidence: '"lone and level"',
                    explanation: "The repetition of the initial 'l' sound creates a smooth, flowing quality. This contributes to the sense of an enormous, uninterrupted landscape and contrasts with the broken statue.",
                    message: "The sound and description of the landscape reinforce the emptiness left behind by the ruler."
                }
            ],
            model: "Shelley uses irony to undermine the arrogance of individuals who believe their power is permanent. This is evident in Ozymandias's declaration, 'Look on my Works, ye Mighty, and despair!' The commanding tone suggests that the ruler expects his achievements to inspire fear and admiration. However, this confidence is immediately undermined by the statement, 'Nothing beside remains.' The contrast between his proud declaration and the ruined statue exposes the temporary nature of his authority. Shelley therefore suggests that political power and material achievements cannot overcome the passage of time."
        },

        dulce: {
            question: "How does Owen challenge the glorification of war?",
            introduction: "Owen exposes the physical and psychological consequences of warfare. Explore how his literary choices communicate the brutality of conflict.",
            reading: `
                <span class="text-category">POETRY · WAR LITERATURE</span>
                <h2>Dulce et Decorum Est</h2>
                <h3>Wilfred Owen</h3>
                <p class="text-context">Owen describes exhausted soldiers during the First World War. The poem moves from their suffering to a gas attack and the trauma experienced by the speaker.</p>
                <div class="literary-extract">
                    <p>Bent double, like old beggars under sacks,</p>
                    <p>Knock-kneed, coughing like hags, we cursed through sludge,</p>
                    <p>Till on the haunting flares we turned our backs,</p>
                    <p>And towards our distant rest began to trudge.</p>
                    <p>Men marched asleep. Many had lost their boots,</p>
                    <p>But limped on, blood-shod. All went lame; all blind;</p>
                    <p>Drunk with fatigue; deaf even to the hoots</p>
                    <p>Of gas-shells dropping softly behind.</p>
                    <p>Gas! GAS! Quick, boys!—An ecstasy of fumbling,</p>
                    <p>Fitting the clumsy helmets just in time;</p>
                    <p>As under a green sea, I saw him drowning.</p>
                    <p>He plunges at me, guttering, choking, drowning.</p>
                    <p>My friend, you would not tell with such high zest</p>
                    <p>The old Lie: Dulce et decorum est</p>
                    <p>Pro patria mori.</p>
                </div>
                <div class="reading-notes">
                    <h3>Context</h3>
                    <p>The Latin phrase in the title is traditionally translated as "It is sweet and fitting to die for one's country." Owen challenges this patriotic belief by presenting the suffering of soldiers.</p>
                </div>
                <p class="source-link">Source: <a href="https://war.web.ox.ac.uk/wilfred-owen-dulce-et-decorum-est" target="_blank" rel="noopener noreferrer">University of Oxford</a></p>
            `,
            techniques: [
                {
                    name: "Simile",
                    evidence: '"like old beggars under sacks"',
                    explanation: "Owen compares the soldiers to old beggars, presenting them as weak, exhausted and physically deteriorated. This contrasts with traditional representations of soldiers as strong and heroic.",
                    message: "War strips soldiers of the strength and dignity often associated with patriotic ideas of heroism."
                },
                {
                    name: "Metaphorical imagery",
                    evidence: '"blood-shod"',
                    explanation: "This unusual expression suggests that the soldiers' feet are covered in blood as though blood has become their footwear. It creates an image of continuous physical suffering.",
                    message: "The reality of warfare is painful and physically destructive."
                },
                {
                    name: "Capitalisation and punctuation",
                    evidence: '"Gas! GAS! Quick, boys!"',
                    explanation: "The capitalisation and exclamation marks create urgency and panic. The sudden change in rhythm reflects the rapid shift from exhaustion to an emergency.",
                    message: "War is unpredictable, chaotic and terrifying rather than glorious."
                },
                {
                    name: "Colour imagery and simile",
                    evidence: '"As under a green sea, I saw him drowning."',
                    explanation: "The comparison of the gas-filled environment to a green sea presents the soldier as drowning. The colour 'green' creates an unnatural atmosphere, while 'drowning' emphasises his helplessness.",
                    message: "Owen makes the suffering caused by chemical warfare vivid and difficult to ignore."
                },
                {
                    name: "Repetition",
                    evidence: '"guttering, choking, drowning."',
                    explanation: "The sequence of verbs emphasises the soldier's prolonged suffering. The repeated reference to drowning also suggests that the experience continues to haunt the speaker.",
                    message: "The psychological consequences of war can continue long after the physical event."
                },
                {
                    name: "Irony and allusion",
                    evidence: '"The old Lie"',
                    explanation: "Owen refers to the traditional patriotic statement but labels it 'The old Lie'. After showing the reader the soldier's suffering, he directly challenges the idea that dying in war is necessarily noble.",
                    message: "Owen rejects the romanticised glorification of war."
                }
            ],
            model: "Owen uses disturbing visual imagery to challenge the romanticised representation of warfare. This is evident in his description of a soldier 'under a green sea', where the simile transforms poisonous gas into an overwhelming underwater environment. The adjective 'green' creates an unnatural and threatening image, while the verb 'drowning' emphasises the soldier's helplessness. By presenting death as a traumatic experience rather than a heroic sacrifice, Owen encourages readers to question the patriotic messages used to glorify war."
        },

        road: {
            question: "How does Frost explore the uncertainty of choices and their consequences?",
            introduction: "Frost uses the image of two diverging roads to explore decisions, uncertainty and the way people interpret their past.",
            reading: `
                <span class="text-category">POETRY · MODERN LITERATURE</span>
                <h2>The Road Not Taken</h2>
                <h3>Robert Frost</h3>
                <p class="text-context">The speaker encounters two roads in a forest and must decide which one to follow. The decision becomes a reflection on choices and their consequences.</p>
                <div class="literary-extract">
                    <p>Two roads diverged in a yellow wood,</p>
                    <p>And sorry I could not travel both</p>
                    <p>And be one traveller, long I stood</p>
                    <p>And looked down one as far as I could</p>
                    <p>To where it bent in the undergrowth;</p>
                    <br>
                    <p>Then took the other, as just as fair,</p>
                    <p>And having perhaps the better claim,</p>
                    <p>Because it was grassy and wanted wear;</p>
                    <p>Though as for that the passing there</p>
                    <p>Had worn them really about the same.</p>
                    <br>
                    <p>I shall be telling this with a sigh</p>
                    <p>Somewhere ages and ages hence:</p>
                    <p>Two roads diverged in a wood, and I—</p>
                    <p>I took the one less traveled by,</p>
                    <p>And that has made all the difference.</p>
                </div>
                <div class="reading-notes">
                    <h3>Context</h3>
                    <p>Frost explores the difficulty of making decisions when their future consequences cannot be known.</p>
                </div>
                <p class="source-link">Source: <a href="https://www.poetryfoundation.org/articles/89511/robert-frost-the-road-not-taken" target="_blank" rel="noopener noreferrer">Poetry Foundation</a></p>
            `,
            techniques: [
                {
                    name: "Symbolism",
                    evidence: '"Two roads diverged"',
                    explanation: "The two roads symbolise different choices or possible directions in life. The speaker's inability to travel both represents the limitations people face when making decisions.",
                    message: "Life involves choices that require people to give up alternative possibilities."
                },
                {
                    name: "Visual imagery",
                    evidence: '"yellow wood"',
                    explanation: "The autumnal setting creates an image of change and transition. The yellow wood can suggest a moment of uncertainty in which the speaker must decide what to do next.",
                    message: "Choices often occur during periods of change and uncertainty."
                },
                {
                    name: "Personification",
                    evidence: '"wanted wear"',
                    explanation: "The road is described as though it desires to be travelled. This gives the road a human quality and makes the speaker's decision seem more personal.",
                    message: "People often attach meaning and personality to the choices they make."
                },
                {
                    name: "Tone and ambiguity",
                    evidence: '"with a sigh"',
                    explanation: "The word 'sigh' creates uncertainty about how the speaker feels about the decision. It could suggest satisfaction, regret or reflection.",
                    message: "People may reinterpret their past choices as they grow older."
                },
                {
                    name: "Structure and repetition",
                    evidence: '"Two roads diverged"',
                    explanation: "The return to the image of the two roads in the final stanza gives the poem a reflective structure. The speaker revisits the original decision and considers how it may be remembered.",
                    message: "The meaning people give to their choices can change over time."
                }
            ],
            model: "Frost uses symbolism to explore the uncertainty involved in making decisions. The image of 'Two roads diverged' represents the different directions a person may take in life. The fact that the speaker cannot travel both roads highlights the limitations of human choice, as selecting one possibility means abandoning another. Furthermore, the diverging roads create a sense of uncertainty because the speaker cannot see where either path will lead. Frost therefore suggests that decisions are often made without knowing their eventual consequences."
        },

        macbeth: {
            question: "How does Shakespeare present the conflict between ambition and morality?",
            introduction: "Shakespeare presents ambition as a powerful force that can challenge morality and lead to destruction.",
            reading: `
                <span class="text-category">DRAMA · TRAGEDY</span>
                <h2>Macbeth</h2>
                <h3>William Shakespeare</h3>
                <p class="text-context">Macbeth is a tragedy in which a Scottish nobleman becomes increasingly consumed by ambition after hearing a prophecy that he will become king.</p>
                <div class="literary-extract">
                    <p><strong>Macbeth:</strong></p>
                    <p>I have no spur to prick the sides of my intent, but only vaulting ambition.</p>
                    <br>
                    <p><strong>Lady Macbeth:</strong></p>
                    <p>Look like th' innocent flower, But be the serpent under't.</p>
                    <br>
                    <p><strong>Macbeth:</strong></p>
                    <p>Is this a dagger which I see before me, The handle toward my hand?</p>
                </div>
                <div class="reading-notes">
                    <h3>Context</h3>
                    <p>Shakespeare explores ambition, kingship, guilt and moral corruption in a tragedy set in medieval Scotland.</p>
                </div>
                <p class="source-link">Source: <a href="https://www.folger.edu/explore/shakespeares-works/macbeth/read/" target="_blank" rel="noopener noreferrer">Folger Shakespeare Library</a></p>
            `,
            techniques: [
                {
                    name: "Metaphor",
                    evidence: '"Vaulting ambition"',
                    explanation: "Macbeth compares ambition to something that leaps too far and loses control. The image suggests that his desire for power may exceed reasonable limits.",
                    message: "Uncontrolled ambition can lead individuals towards their own destruction."
                },
                {
                    name: "Animal imagery",
                    evidence: '"the serpent under\'t"',
                    explanation: "Lady Macbeth uses the image of a serpent to suggest deception and hidden evil. The contrast between an innocent appearance and a dangerous reality highlights the importance of disguise.",
                    message: "Appearances can conceal immoral intentions."
                },
                {
                    name: "Rhetorical question",
                    evidence: '"Is this a dagger which I see before me?"',
                    explanation: "Macbeth's question reveals his uncertainty and disturbed mental state. The dagger may represent his ambition, guilt and growing psychological instability.",
                    message: "The pursuit of power begins to damage Macbeth's sense of reality and morality."
                },
                {
                    name: "Foreshadowing",
                    evidence: '"vaulting ambition"',
                    explanation: "Macbeth's description of ambition as something that overreaches itself and falls anticipates the consequences of his actions.",
                    message: "The play suggests that excessive ambition can contain the seeds of its own downfall."
                }
            ],
            model: "Shakespeare presents ambition as a destructive force through Macbeth's metaphor of 'vaulting ambition'. By comparing ambition to a leap that exceeds its limits, Shakespeare suggests that Macbeth's desire for power is becoming uncontrollable. The image of something that falls also anticipates the consequences of his pursuit of the throne. This reveals Macbeth's awareness that his ambition may lead to destruction, yet he continues towards his goal. Shakespeare therefore explores the conflict between personal desire and moral responsibility."
        },

        technology: {
            question: "How does the writer present the benefits and challenges of technology in education?",
            introduction: "This adapted extract explores how language, contrast and persuasive techniques can communicate a balanced argument about technology.",
            reading: `
                <span class="text-category">NON-LITERARY · INFORMATIVE TEXT</span>
                <h2>Technology in Education</h2>
                <h3>Adapted non-literary extract</h3>
                <p class="text-context">This is an original model extract, not a verbatim passage from the cited report.</p>
                <div class="literary-extract">
                    <p>Technology has transformed the modern classroom, placing an almost unlimited library of information within the reach of students.</p>
                    <br>
                    <p>A learner can explore distant places, collaborate with classmates and access resources that were once difficult to obtain. In this sense, technology has the potential to make education more accessible.</p>
                    <br>
                    <p>Yet progress comes with its own challenges. A screen can become a window to knowledge, but it can also become a source of distraction. Not every student has a reliable device or internet connection.</p>
                    <br>
                    <p>The question, therefore, is not whether technology belongs in education, but how it should be used. Digital tools should support learning rather than replace the curiosity, discussion and human relationships that make education meaningful.</p>
                </div>
                <div class="reading-notes">
                    <h3>Context</h3>
                    <p>This model extract explores digital access, classroom learning and the challenges of educational technology.</p>
                </div>
                <p class="source-link">Related report: <a href="https://gem-report-2023.unesco.org/technology-in-education/" target="_blank" rel="noopener noreferrer">UNESCO GEM Report 2023</a></p>
            `,
            techniques: [
                {
                    name: "Metaphor",
                    evidence: '"a window to knowledge"',
                    explanation: "The metaphor presents technology as a way of accessing information and opportunities. A window allows someone to see beyond their immediate surroundings, just as digital tools can expose students to new knowledge.",
                    message: "Technology can expand educational opportunities."
                },
                {
                    name: "Contrast",
                    evidence: '"a window to knowledge, but it can also become a source of distraction"',
                    explanation: "The writer places the benefits and disadvantages of technology side by side. This contrast prevents the argument from becoming entirely positive or negative.",
                    message: "Technology has both educational advantages and potential drawbacks."
                },
                {
                    name: "Inclusive language",
                    evidence: '"Not every student"',
                    explanation: "This phrase draws attention to students who may lack reliable access to devices or internet connections. It broadens the argument beyond students who already benefit from technology.",
                    message: "Educational technology should be considered alongside issues of fairness and accessibility."
                },
                {
                    name: "Rhetorical question",
                    evidence: '"The question, therefore, is not whether technology belongs in education, but how it should be used."',
                    explanation: "The writer reframes the debate. Instead of asking whether technology should be used, the sentence directs the reader towards responsible and effective implementation.",
                    message: "The value of technology depends on how thoughtfully it is integrated into education."
                },
                {
                    name: "Listing",
                    evidence: '"curiosity, discussion and human relationships"',
                    explanation: "The list identifies qualities that digital tools should not replace. The combination of intellectual, social and interpersonal elements presents education as more than simply accessing information.",
                    message: "Technology should complement human interaction rather than replace it."
                }
            ],
            model: "The writer uses contrast to present the advantages and disadvantages of technology in education. This is evident in the description of a screen as 'a window to knowledge, but it can also become a source of distraction'. The metaphor 'window to knowledge' suggests that digital tools can broaden students' access to information, while the contrasting reference to distraction introduces the possibility of misuse. By placing these ideas together, the writer presents a balanced argument rather than suggesting that technology is entirely beneficial or harmful. The writer ultimately implies that its effectiveness depends on how responsibly it is used."
        }
    };

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    let currentModel = null;

    function displayTechnique(index) {
        if (!currentModel) return;

        const technique =
            currentModel.techniques[Number(index)];

        if (!technique) return;

        analysisContent.innerHTML = `
            <section class="analysis-detail">
                <h3>Evidence</h3>
                <blockquote>
                    ${escapeHTML(technique.evidence)}
                </blockquote>
                <h3>Literary technique</h3>
                <p><strong>${escapeHTML(technique.name)}</strong></p>
                <h3>Explanation and analysis</h3>
                <p>${escapeHTML(technique.explanation)}</p>
                <div class="writer-message">
                    <h3>Writer's message</h3>
                    <p>${escapeHTML(technique.message)}</p>
                </div>
            </section>
        `;
    }

    function displayText(modelName) {
        const selectedModel = textModels[modelName];

        if (!selectedModel) {
            console.warn(
                `MasterText: no literary model found for "${modelName}".`
            );
            return;
        }

        currentModel = selectedModel;

        questionText.textContent = selectedModel.question;
        readingContent.innerHTML = selectedModel.reading;
        analysisIntro.textContent = selectedModel.introduction;

        techniqueSelect.replaceChildren();

        selectedModel.techniques.forEach((technique, index) => {
            const option = document.createElement("option");

            option.value = String(index);
            option.textContent = technique.name;

            techniqueSelect.appendChild(option);
        });

        techniqueSelect.value = "0";

        displayTechnique(0);

        modelParagraph.innerHTML = `
            <h3>Complete Model Analytical Paragraph</h3>
            <p>${escapeHTML(selectedModel.model)}</p>
        `;

        document.title =
            `${modelName.charAt(0).toUpperCase() + modelName.slice(1)} | MasterText`;
    }

    textSelector.addEventListener("change", () => {
        displayText(textSelector.value);
    });

    techniqueSelect.addEventListener("change", () => {
        displayTechnique(techniqueSelect.value);
    });

    const initialModel = textModels[textSelector.value]
        ? textSelector.value
        : Object.keys(textModels)[0];

    textSelector.value = initialModel;

    displayText(initialModel);
}

function initializeWebsite() {
    const initializers = [
        setupPreferences,
        setupHeader,
        setupNavigation,
        setupLogin,
        setupWordCount,
        setupPracticeTimer,
        setupFAQ,
        setupContactForm,
        setupDrafts,
        setupNewDraftPage,
        setupLiteraryAnalysis
    ];

    initializers.forEach(initializer => {
        if (typeof initializer !== "function") return;

        try {
            initializer();
        } catch (error) {
            console.error(
                `Error initializing ${initializer.name}:`,
                error
            );
        }
    });
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeWebsite,
        { once: true }
    );
} else {
    initializeWebsite();
}
