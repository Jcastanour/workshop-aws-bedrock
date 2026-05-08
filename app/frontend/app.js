/* =========================================================
   NIMBUS — frontend logic
   Reemplazar API_URL con el endpoint real de API Gateway
   ========================================================= */

const API_URL = "REPLACE_WITH_API_GATEWAY_URL";

const chatBox      = document.getElementById("chat-box");
const questionInput = document.getElementById("question");
const clockEl      = document.getElementById("clock");
const latencyEl    = document.getElementById("latency");
const sessionIdEl  = document.getElementById("session-id");

/* ---------- session id (visual, no funcional) ---------- */
sessionIdEl.textContent = String(Math.floor(10 + Math.random() * 90));

/* ---------- reloj utc-style ---------- */
function tickClock() {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    clockEl.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
tickClock();
setInterval(tickClock, 1000);

/* ---------- enter para enviar, shift+enter para nueva línea ---------- */
questionInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        askQuestion();
    }
});

/* ---------- sugerencias clicables ---------- */
document.querySelectorAll(".suggest li").forEach(li => {
    li.addEventListener("click", () => {
        questionInput.value = li.dataset.q;
        questionInput.focus();
    });
});

/* ---------- helpers ---------- */
function escapeHTML(str) {
    return str.replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function addMessage(text, sender, opts = {}) {
    const article = document.createElement("article");
    article.classList.add("msg", sender === "user" ? "msg-user" : "msg-ai");

    const meta = document.createElement("header");
    meta.classList.add("msg-meta", "mono");
    const tag = document.createElement("span");
    tag.classList.add("msg-tag");
    tag.textContent = sender === "user" ? "TÚ" : "AGENTE";
    const dot = document.createElement("span");
    dot.classList.add("muted");
    dot.textContent = "·";
    const ts = document.createElement("span");
    ts.classList.add("muted");
    const now = new Date();
    ts.textContent = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    meta.append(tag, dot, ts);

    const body = document.createElement("div");
    body.classList.add("msg-body");
    if (opts.html) {
        body.innerHTML = text;
    } else {
        body.textContent = text;
    }
    if (opts.error) body.classList.add("is-error");

    article.append(meta, body);
    chatBox.appendChild(article);
    chatBox.scrollTop = chatBox.scrollHeight;
    return body;
}

/* ---------- llamada al backend ---------- */
async function askQuestion() {
    const question = questionInput.value.trim();
    if (!question) return;

    addMessage(question, "user");
    questionInput.value = "";
    questionInput.style.height = "auto";

    const loadingBody = addMessage(
        `<span class="thinking">pensando<span class="d"></span><span class="d"></span><span class="d"></span></span>`,
        "ai",
        { html: true }
    );

    const t0 = performance.now();

    try {
        const response = await fetch(API_URL + "/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question })
        });

        const data = await response.json();
        const dt = Math.round(performance.now() - t0);
        latencyEl.textContent = dt;

        if (!response.ok || data.error) {
            loadingBody.classList.add("is-error");
            loadingBody.textContent = "✗ " + (data.error || `HTTP ${response.status}`);
            return;
        }

        loadingBody.textContent = data.answer || "(respuesta vacía)";
    } catch (error) {
        loadingBody.classList.add("is-error");
        loadingBody.textContent = "✗ No se pudo contactar el servicio: " + error.message;
    }
}

/* ---------- textarea autoexpand ---------- */
questionInput.addEventListener("input", () => {
    questionInput.style.height = "auto";
    questionInput.style.height = Math.min(questionInput.scrollHeight, 160) + "px";
});
