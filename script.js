let QUESTION_BANK = {}; // For quiz questions
let FLASHCARD_BANK = {}; // For flashcards

const TOPICS_ORDER = [
  "Organisation og omverden",
  "Forretningsforståelse",
  "Strategi",
  "Forandringsledelse",
  "Organisationsdesign",
  "Personlig, teams og samarbejde",
  "Ledelse",
  "Organisationskultur",
  "Økonomi",
];


let state = { topic: null, questions: [], index: 0, answers: {}, submitted: false };

const $ = sel => document.querySelector(sel);
const topicsView = $('#topicsView');
const quizView = $('#quizView');
const resultsView = $('#resultsView');
const topicsGrid = $('#topicsGrid');
const progressEl = $('#progress');
const crumbsEl = $('#crumbs');
const questionEl = $('#questionText');
const choicesEl = $('#choices');
const backBtn = $('#backBtn');
const nextBtn = $('#nextBtn');
const submitBtn = $('#submitBtn');
const backToTopics = $('#backToTopics');
const backToTopicsTop = $('#backToTopicsTop');
const summaryEl = $('#summary');
const reviewList = $('#reviewList');
const retryBtn = $('#retryBtn');
const resultsBack = $('#resultsBack');
const flashcardsView = $('#flashcardsView');
const flashcardText = $('#flashcardText');
const flashcardCrumbs = $('#flashcardCrumbs');
const prevFlashcardBtn = $('#prevFlashcardBtn');
const nextFlashcardBtn = $('#nextFlashcardBtn');
const backToTopicsFlashcards = $('#backToTopicsFlashcards');

function show(view) {
  topicsView.style.display = view === 'topics' ? '' : 'none';
  quizView.style.display = view === 'quiz' ? '' : 'none';
  flashcardsView.style.display = view === 'flashcards' ? '' : 'none';
  resultsView.style.display = view === 'results' ? '' : 'none';
  backToTopicsTop.style.display = view === 'quiz' ? '' : 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderTopics() {
  const frag = document.createDocumentFragment();
  const allCard = document.createElement('div');
  allCard.className = 'topic';
  allCard.innerHTML = `<h3>ALL</h3><p>Studér alle emner på én gang</p>`;
  allCard.addEventListener('click', () => startTopic('ALL'));
  frag.appendChild(allCard);

  for (const t of TOPICS_ORDER) {
    const card = document.createElement('div');
    card.className = 'topic';
    const count = (QUESTION_BANK[t] || []).length; // Use QUESTION_BANK for quiz questions
    card.innerHTML = `
      <h3>${t}</h3>
      <p>${count > 0 ? count + ' spørgsmål' : 'Ingen spørgsmål endnu'}</p>
      <button class="btn" onclick="startFlashcards('${t}')">Flashcards</button>
      <button class="btn" onclick="startTopic('${t}')">Quiz</button>
    `;
    frag.appendChild(card);
  }

  topicsGrid.innerHTML = '';
  topicsGrid.appendChild(frag);
}

function startTopic(topic) {
  let questions = [];
  if (topic === 'ALL') {
    for (const key of Object.keys(QUESTION_BANK)) {
      questions = questions.concat(QUESTION_BANK[key]);
    }
    // Always shuffle the questions when "ALL" is selected
    questions = questions.sort(() => Math.random() - 0.5);
  } else {
    questions = QUESTION_BANK[topic] || [];
  }
  if (!questions.length) return alert('Ingen spørgsmål til dette emne endnu.');

  state = { topic, questions, index: 0, answers: {}, submitted: false };
  renderQuestion();
  show('quiz');
}

choicesEl.addEventListener('change', (e) => {
  if (e.target && e.target.matches('input[name="choice"]')) {
    select(e.target.value);
  }
});

function renderQuestion() {
  const q = state.questions[state.index];
  crumbsEl.textContent = `${state.topic}`;
  progressEl.textContent = `${state.index + 1} / ${state.questions.length}`;
  questionEl.textContent = q.question;
  choicesEl.innerHTML = '';

  // Dynamically determine the number of options (keys starting with 'a', 'b', etc.)
  const options = Object.keys(q).filter(key => ['a', 'b', 'c', 'd', 'e'].includes(key));
  const selected = state.answers[state.index] || null;

  options.forEach(letter => {
    const div = document.createElement('label');
    div.className = 'choice' + (selected === letter ? ' selected' : '');
    div.innerHTML = `
      <input type="radio" name="choice" value="${letter}" ${selected === letter ? 'checked' : ''}>
      <div class="bullet">${letter.toUpperCase()}</div>
      <div>${q[letter]}</div>
    `;
    choicesEl.appendChild(div);
  });

  backBtn.style.display = state.index === 0 ? 'none' : '';
  nextBtn.style.display = state.index < state.questions.length - 1 ? '' : 'none';
  submitBtn.style.display = state.index === state.questions.length - 1 ? '' : 'none';
}


function select(letter) {
  // Save the selected answer
  state.answers[state.index] = letter;

  // Update the selected choice visually
  Array.from(choicesEl.children).forEach((el, idx) => {
    const l = ['a', 'b', 'c', 'd'][idx];
    el.classList.toggle('selected', l === letter);
  });

  // Automatically move to the next question or submit if it's the last question
  if (state.index < state.questions.length - 1) {
    state.index++;
    renderQuestion();
  } else {
    submitBtn.click(); // Automatically submit if it's the last question
    
  }
}

nextBtn.addEventListener('click', () => { if (state.index < state.questions.length - 1) { state.index++; renderQuestion(); }});
backBtn.addEventListener('click', () => { if (state.index > 0) { state.index--; renderQuestion(); }});
backToTopics.addEventListener('click', e => { e.preventDefault(); show('topics'); });
backToTopicsTop.addEventListener('click', e => { e.preventDefault(); show('topics'); });

submitBtn.addEventListener('click', () => { state.submitted = true; renderResults(); show('results'); });

function renderResults() {
  const total = state.questions.length;
  let correctCount = 0;
  const results = [];
  const topicScores = {}; // To store scores per topic

  // Calculate results and scores per topic
  state.questions.forEach((q, i) => {
    const chosen = state.answers[i];
    const correct = q.correct_option;
    const isCorrect = chosen === correct;
    if (isCorrect) correctCount++;

    // Track scores per topic
    if (!topicScores[q.topic]) {
      topicScores[q.topic] = { correct: 0, total: 0 };
    }
    topicScores[q.topic].total++;
    if (isCorrect) topicScores[q.topic].correct++;

    results.push({ q, chosen, correct, isCorrect });
  });

  // Display overall score
  summaryEl.textContent = `Du fik ${correctCount} ud af ${total} rigtigt (${Math.round((correctCount / total) * 100)}%)`;



  // Display topic scores only if "ALL" is selected
  if (state.topic === 'ALL') {
    const topicSummary = document.createElement('div');
    topicSummary.className = 'topic-summary';
    topicSummary.innerHTML = '<h3>Score per emne:</h3>';
    Object.keys(topicScores).forEach(topic => {
      const { correct, total } = topicScores[topic];
      const topicDiv = document.createElement('div');
      topicDiv.textContent = `${topic}: ${correct} / ${total} rigtigt`;
      topicSummary.appendChild(topicDiv);
    });
    summaryEl.appendChild(topicSummary);
  }

  // Display detailed results
  reviewList.innerHTML = '';
  results.forEach(({ q, chosen, correct, isCorrect }, i) => {
    const item = document.createElement('div');
    item.className = 'review-item';
    item.innerHTML = `
      <div class="review-q">${i + 1}. ${q.question}
        ${isCorrect ? '<span class="chip correct">Korrekt</span>' : '<span class="chip wrong">Forkert</span>'}
      </div>`;
    const list = document.createElement('div');
    list.className = 'review-choices';

    // Dynamically determine the available options for this question
    const options = Object.keys(q).filter(key => ['a', 'b', 'c', 'd', 'e'].includes(key));
    options.forEach(letter => {
      const line = document.createElement('div');
      line.className = 'choice';
      if (letter === correct) line.classList.add('correct');
      if (chosen && letter === chosen && chosen !== correct) line.classList.add('wrong');
      line.innerHTML = `<div class="bullet">${letter.toUpperCase()}</div><div>${q[letter]}</div>`;
      list.appendChild(line);
    });

    item.appendChild(list);
    reviewList.appendChild(item);
  });
}

retryBtn.addEventListener('click', () => {
  state.index = 0; state.answers = {}; state.submitted = false;
  renderQuestion(); show('quiz');
});
resultsBack.addEventListener('click', e => { e.preventDefault(); show('topics'); });


// Load quiz questions (if stored in a separate JSON file)
fetch('questions.json')
  .then(res => res.json())
  .then(data => {
    QUESTION_BANK = data; // Store quiz questions here
    renderTopics(); // Render topics after loading quiz questions
  })
  .catch(err => console.error('Error loading questions.json', err));

// Load flashcards
fetch('flashcards.json')
  .then(res => res.json())
  .then(data => {
    FLASHCARD_BANK = data; // Store flashcards here
  })
  .catch(err => console.error('Error loading flashcards.json', err));


let flashcardState = { topic: null, flashcards: [], index: 0 };

function startFlashcards(topic) {
  const flashcards = FLASHCARD_BANK[topic] || []; // Use FLASHCARD_BANK for flashcards
  if (!flashcards.length) return alert('Ingen flashcards til dette emne endnu.');

  flashcardState = { topic, flashcards, index: 0 };
  renderFlashcard();
  show('flashcards');
}

function renderFlashcard() {
  const card = flashcardState.flashcards[flashcardState.index];
  flashcardCrumbs.textContent = `${flashcardState.topic}`;

  // Set up the flashcard with two sides
  flashcardText.innerHTML = `
    <div class="flashcard-face front">${card.question || "Ingen spørgsmål"}</div>
    <div class="flashcard-face back" style="display:none;">${card.answer || "Ingen svar"}</div>
  `;

  prevFlashcardBtn.style.display = flashcardState.index === 0 ? 'none' : '';
  nextFlashcardBtn.style.display = flashcardState.index < flashcardState.flashcards.length - 1 ? '' : 'none';
}

// Keydown event listener for flipping and navigation
// also need to be able to click on flashcard to flip
flashcardText.addEventListener('click', () => {
  const front = flashcardText.querySelector('.front');
  const back = flashcardText.querySelector('.back');
  if (front.style.display === 'none') {
    front.style.display = '';
    back.style.display = 'none';
  } else {
    front.style.display = 'none';
    back.style.display = '';
  }
});
document.addEventListener('keydown', (e) => {
  if (flashcardsView.style.display === 'none') return;

  if (e.code === 'Space') {
    e.preventDefault();
    const front = flashcardText.querySelector('.front');
    const back = flashcardText.querySelector('.back');
    if (front.style.display === 'none') {
      front.style.display = '';
      back.style.display = 'none';
    } else {
      front.style.display = 'none';
      back.style.display = '';
    }
  }

  if (e.code === 'ArrowRight') {
    if (flashcardState.index < flashcardState.flashcards.length - 1) {
      flashcardState.index++;
      renderFlashcard();
    }
  }

  if (e.code === 'ArrowLeft') {
    if (flashcardState.index > 0) {
      flashcardState.index--;
      renderFlashcard();
    }
  }
});