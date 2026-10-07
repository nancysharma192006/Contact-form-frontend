const API_URL = "http://localhost:5000";

const form = document.getElementById("contactForm");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const messageInput = document.getElementById("message");
const counter = document.getElementById("counter");
const responseMessage = document.getElementById("responseMessage");
const submitButton = document.getElementById("submitButton");
const buttonText = document.getElementById("buttonText");
const readiness = document.getElementById("readiness");
const readinessLabel = document.getElementById("readinessLabel");
let responseDismissTimeout;
let responseClearTimeout;

const fields = [
    {
        input: nameInput,
        feedback: document.getElementById("nameFeedback"),
        touched: false,
        validate: validateName
    },
    {
        input: emailInput,
        feedback: document.getElementById("emailFeedback"),
        touched: false,
        validate: validateEmail
    },
    {
        input: messageInput,
        feedback: document.getElementById("messageFeedback"),
        touched: false,
        validate: validateMessage
    }
];

function validateName(value) {
    const name = value.replace(/\s+/gu, " ").trim();

    if (!name) {
        return { valid: false, message: "Please enter your name." };
    }
    if (name.length < 2) {
        return { valid: false, message: "Your name must be at least 2 characters." };
    }
    if (name.length > 60) {
        return { valid: false, message: "Your name must be 60 characters or fewer." };
    }
    if (!/^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u.test(name)) {
        return { valid: false, message: "Use letters, spaces, hyphens, or apostrophes only." };
    }

    const compactName = name.toLocaleLowerCase().replace(/[\s'\u2019-]/gu, "");
    const placeholders = new Set(["test", "asdf", "qwerty", "yourname", "name"]);
    if (
        placeholders.has(compactName) ||
        [...compactName].every((character) => character === compactName[0])
    ) {
        return { valid: false, message: "Please enter a real name." };
    }

    return { valid: true, message: "" };
}

function validateEmail(value) {
    const email = value.trim();

    if (!email) {
        return { valid: false, message: "Please enter your email address." };
    }

    const [localPart, ...domainParts] = email.split("@");
    const domain = domainParts.join("@");
    const emailPattern = /^[^\s@]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

    if (
        domainParts.length !== 1 ||
        !localPart ||
        localPart.startsWith(".") ||
        localPart.endsWith(".") ||
        localPart.includes("..") ||
        !emailPattern.test(email)
    ) {
        return { valid: false, message: "Enter a valid email, like you12@gmail.com." };
    }

    return { valid: true, message: "" };
}

function validateMessage(value) {
    const message = value.trim();
    const meaningfulCharacters = [...message.replace(/\s/gu, "")].length;
    const lettersAndNumbers = [...message.matchAll(/[\p{L}\p{N}]/gu)].length;
    const letters = [...message.matchAll(/\p{L}/gu)].length;
    const compactMessage = message.toLocaleLowerCase().replace(/[\s\p{P}\p{S}]/gu, "");

    if (!message) {
        return { valid: false, message: "Please add a message." };
    }
    if (message.length > 500) {
        return { valid: false, message: "Your message must be 500 characters or fewer." };
    }
    if (meaningfulCharacters < 10 || lettersAndNumbers < 8 || letters < 3) {
        return { valid: false, message: "Please write at least 10 meaningful characters." };
    }
    if (
        [...compactMessage].every((character) => character === compactMessage[0]) ||
        /^(.{1,4})\1{2,}$/u.test(compactMessage)
    ) {
        return { valid: false, message: "Please add a little more detail to your message." };
    }

    return { valid: true, message: "" };
}

function showFieldState(field) {
    const result = field.validate(field.input.value);

    field.input.setAttribute("aria-invalid", String(!result.valid));
    field.input.dataset.valid = String(result.valid);
    field.feedback.textContent = result.valid
        ? (field.input.value.trim() ? "Looks good" : "")
        : result.message;
    field.feedback.dataset.state = result.valid ? "valid" : "error";

    return result.valid;
}

function updateReadiness() {
    const validCount = fields.filter((field) => field.validate(field.input.value).valid).length;
    const state = validCount === fields.length
        ? "ready"
        : validCount > 0 || fields.some((field) => field.input.value.trim())
            ? "almost"
            : "waiting";

    readiness.dataset.state = state;
    readinessLabel.textContent = {
        waiting: "Waiting for details",
        almost: "Almost ready",
        ready: "Ready to reach out"
    }[state];
}

fields.forEach((field) => {
    field.input.addEventListener("blur", () => {
        field.touched = true;
        showFieldState(field);
        updateReadiness();
    });

    field.input.addEventListener("input", () => {
        if (field.touched) {
            showFieldState(field);
        }
        updateReadiness();
    });
});

messageInput.addEventListener("input", () => {
    counter.textContent = `${messageInput.value.length} / 500`;
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearTimeout(responseDismissTimeout);
    clearTimeout(responseClearTimeout);
    responseMessage.classList.remove("is-dismissing");
    responseMessage.textContent = "";
    responseMessage.className = "response-message";

    fields.forEach((field) => {
        field.touched = true;
    });

    const invalidFields = fields.filter((field) => !showFieldState(field));
    updateReadiness();

    if (invalidFields.length > 0) {
        invalidFields[0].input.focus();
        return;
    }

    const formData = {
        name: nameInput.value.replace(/\s+/gu, " ").trim(),
        email: emailInput.value.trim(),
        message: messageInput.value.trim()
    };

    submitButton.disabled = true;
    buttonText.textContent = "Sending...";

    try {
        const response = await fetch(`${API_URL}/api/contact`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        });

        let result;
        try {
            result = await response.json();
        } catch (error) {
            throw new Error("The server returned an unreadable response.", { cause: error });
        }

        if (!response.ok || result.success !== true) {
            throw new Error("The server did not accept the message.");
        }

        form.reset();
        fields.forEach((field) => {
            field.touched = false;
            field.input.setAttribute("aria-invalid", "false");
            delete field.input.dataset.valid;
            field.feedback.textContent = "";
            field.feedback.dataset.state = "";
        });

        counter.textContent = "0 / 500";
        responseMessage.textContent =
            "You're all set! ✨\nYour message has reached us. Thanks for getting in touch.";
        responseMessage.classList.add("success");
        responseDismissTimeout = setTimeout(() => {
            responseMessage.classList.add("is-dismissing");
            responseClearTimeout = setTimeout(() => {
                responseMessage.textContent = "";
                responseMessage.className = "response-message";
            }, 220);
        }, 3000);
        updateReadiness();
    } catch (error) {
        console.error("Could not submit the contact form:", error);
        responseMessage.textContent = "Something went wrong. Please try again.";
        responseMessage.classList.add("error");
    } finally {
        submitButton.disabled = false;
        buttonText.textContent = "Reach out";
    }
});

updateReadiness();
