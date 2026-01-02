let course = "";
let questions = [];
let answers = [];
let index = 0;
let timeLeft = 600;
let timer;
let submitted = false;

const pages = document.querySelectorAll(".page");

/* ---------------- PAGE NAV ---------------- */
function showPage(id) {
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* ---------------- COURSE SELECTION ---------------- */
document.querySelectorAll(".course-card").forEach(card => {
  card.onclick = () => {
    course = card.dataset.course
      .toLowerCase()
      .replace(/\s+/g, ""); // CHM 101 → chm101

    document.getElementById("courseTitle").innerText =
      card.querySelector("h3").innerText;

    showPage("instructionPage");
  };
});

/* ---------------- START EXAM ---------------- */
document.getElementById("startExam").onclick = async () => {
  try {
    const res = await fetch(`${course}.json`);
    if (!res.ok) throw new Error("Course file not found");

    const data = await res.json();

    questions = flatten(data)
      .sort(() => Math.random() - 0.5)
      .slice(0, 40);

    answers = Array(questions.length).fill(null);
    index = 0;
    submitted = false;
    timeLeft = 600;

    showPage("examPage");
    startTimer();
    buildPalette();
    loadQuestion();

  } catch (err) {
    alert(`Error loading exam: ${err.message}`);
    console.error(err);
  }
};

/* ---------------- FLATTEN JSON ---------------- */
function flatten(data) {
  let out = [];

  data.sections.forEach(section => {
    section.questions.forEach(q => {
      out.push({
        section: section.section,
        text: q.question,
        options: Object.values(q.options),
        correct: Object.keys(q.options).indexOf(q.answer)
      });
    });
  });

  return out;
}

/* ---------------- LOAD QUESTION ---------------- */
function loadQuestion() {
  const q = questions[index];

  document.getElementById("questionCounter").innerText =
    `Question ${index + 1} of ${questions.length}`;

  document.getElementById("progressBar").style.width =
    `${((index + 1) / questions.length) * 100}%`;

  let html = `<small>${q.section}</small><h3>${q.text}</h3>`;

  q.options.forEach((opt, i) => {
    html += `
      <div class="option ${answers[index] === i ? "selected" : ""}"
        onclick="selectAnswer(${i})">
        ${opt}
      </div>`;
  });

  document.getElementById("questionBox").innerHTML = html;
  updatePalette();
}

function selectAnswer(i) {
  if (submitted) return;
  answers[index] = i;
  loadQuestion();
}

/* ---------------- NAVIGATION ---------------- */
nextBtn.onclick = () => {
  if (index < questions.length - 1) index++;
  loadQuestion();
};

prevBtn.onclick = () => {
  if (index > 0) index--;
  loadQuestion();
};

/* ---------------- QUESTION PALETTE ---------------- */
function buildPalette() {
  palette.innerHTML = "";
  questions.forEach((_, i) => {
    const b = document.createElement("button");
    b.innerText = i + 1;
    b.onclick = () => {
      index = i;
      loadQuestion();
    };
    palette.appendChild(b);
  });
}

function updatePalette() {
  document.querySelectorAll(".palette button").forEach((b, i) => {
    b.classList.toggle("answered", answers[i] !== null);
    b.classList.toggle("current", i === index);
  });
}

/* ---------------- TIMER ---------------- */
function startTimer() {
  clearInterval(timer);

  timer = setInterval(() => {
    timeLeft--;

    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    timerEl.innerText = `${m}:${String(s).padStart(2, "0")}`;

    if (timeLeft <= 60) timerEl.classList.add("red");
    if (timeLeft <= 0) submitExam();
  }, 1000);
}

/* ---------------- SUBMIT ---------------- */
submitBtn.onclick = submitExam;

function submitExam() {
  if (submitted) return;
  submitted = true;
  clearInterval(timer);

  let score = 0;
  let review = "";

  questions.forEach((q, i) => {
    if (answers[i] === q.correct) score++;

    review += `<p><b>${q.text}</b></p>`;
    q.options.forEach((opt, j) => {
      let cls =
        j === q.correct ? "correct" :
        j === answers[i] ? "wrong" : "";
      review += `<div class="option ${cls}">${opt}</div>`;
    });
  });

  scoreSummary.innerHTML = `
    <p><b>Score:</b> ${score}/${questions.length}</p>
    <p><b>Percentage:</b> ${(score / questions.length * 100).toFixed(1)}%</p>
  `;

  answerReview.innerHTML = review;
  showPage("resultPage");
}

window.onbeforeunload = () =>
  submitted ? null : "Exam in progress!";