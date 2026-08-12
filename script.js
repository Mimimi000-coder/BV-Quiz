// 1. Конфигурация Firebase
const firebaseConfig = {
apiKey: "AIzaSyDLzXhkrKVsvdhyBanCyg0zWtS_BqjL4nM",
authDomain: "bv-quiz.firebaseapp.com",
projectId: "bv-quiz",
storageBucket: "bv-quiz.firebasestorage.app",
messagingSenderId: "446529941972",
appId: "1:446529941972:web:fdf20dc74b1b34344fe641"
};
// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 2. Переключение тем
const themeSelect = document.getElementById('themeSelect');
const pageBody = document.body;

if (themeSelect) {
 themeSelect.addEventListener('change', function() {
 pageBody.className = '';
 if (this.value !== 'theme-green') {
 pageBody.classList.add(this.value);
 }
 });
}

// 3. Элементы интерфейса
const btnTrainer = document.getElementById('btnTrainer');
const trainerBlock = document.getElementById('trainerBlock');
const btnExitTrainer = document.getElementById('btnExitTrainer');
const quizQuestionText = document.getElementById('quizQuestionText');
const quizAnswersGrid = document.getElementById('quizAnswersGrid');
const quizFeedback = document.getElementById('quizFeedback');
const btnNextQuestion = document.getElementById('btnNextQuestion');
const trainerProgress = document.getElementById('trainerProgress');

const btnAddQuestion = document.getElementById('btnAddQuestion');
const addQuestionForm = document.getElementById('addQuestionForm');
const btnSubmitQuestion = document.getElementById('btnSubmitQuestion');
const statusMsg = document.getElementById('formStatus');

const btnAdminToggle = document.getElementById('btnAdminToggle');
const adminPanel = document.getElementById('adminPanel');
const pendingQuestionsList = document.getElementById('pendingQuestionsList');
const btnClearAll = document.getElementById('btnClearAll');

// 4. Логика ТРЕНАЖЕРА (вопросы без повторов + случайный порядок ответов)
let trainerQuestions = [];
let currentQuestionIndex = 0;

if (btnTrainer) {
 btnTrainer.addEventListener('click', startTrainer);
}

if (btnExitTrainer) {
 btnExitTrainer.addEventListener('click', () => {
 trainerBlock.classList.add('hidden');
 });
}

async function startTrainer() {
 addQuestionForm.classList.add('hidden');
 adminPanel.classList.add('hidden');
 quizFeedback.textContent = '';
 btnNextQuestion.classList.add('hidden');
 quizQuestionText.textContent = "Загрузка вопросов из базы...";
 quizAnswersGrid.innerHTML = '';
 trainerBlock.classList.remove('hidden');

 try {
 const snapshot = await db.collection('questions')
 .where('status', '==', 'approved')
 .get();

 if (snapshot.empty) {
 quizQuestionText.textContent = "В базе пока нет одобренных вопросов!";
 return;
 }

 // Загружаем одобренные вопросы и случайно перемешиваем их
 trainerQuestions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 trainerQuestions.sort(() => Math.random() - 0.5);
 currentQuestionIndex = 0;

 showTrainerQuestion();
 } catch (error) {
 console.error("Ошибка загрузки вопросов:", error);
 quizQuestionText.textContent = "Ошибка загрузки вопросов!";
 }
}

function showTrainerQuestion() {
 if (currentQuestionIndex >= trainerQuestions.length) {
 quizQuestionText.textContent = "Поздравляем! Вы прошли все доступные вопросы сезона!";
 quizAnswersGrid.innerHTML = '';
 trainerProgress.textContent = "Завершено";
 btnNextQuestion.classList.add('hidden');
 return;
 }

 const q = trainerQuestions[currentQuestionIndex];
 trainerProgress.textContent = `Вопрос ${currentQuestionIndex + 1} из ${trainerQuestions.length}`;
 quizQuestionText.textContent = q.question;
 quizFeedback.textContent = '';
 btnNextQuestion.classList.add('hidden');
 quizAnswersGrid.innerHTML = '';

 const correctAnswerText = q.answers[q.correct || 0];

 // Перемешиваем варианты ответов местами
 const shuffledAnswers = [...q.answers].sort(() => Math.random() - 0.5);

 shuffledAnswers.forEach((ansText) => {
 const btn = document.createElement('button');
 btn.className = 'answer-btn';
 btn.textContent = ansText;

 btn.addEventListener('click', () => {
 const allBtns = quizAnswersGrid.querySelectorAll('.answer-btn');
 allBtns.forEach(b => b.disabled = true);

 if (ansText === correctAnswerText) {
 btn.classList.add('correct');
 quizFeedback.style.color = "green";
 quizFeedback.textContent = "Правильно!";
 } else {
 btn.classList.add('wrong');
 quizFeedback.style.color = "red";
 quizFeedback.textContent = "Неправильно!";

 allBtns.forEach(b => {
 if (b.textContent === correctAnswerText) {
 b.classList.add('correct');
 }
 });
 }

 btnNextQuestion.classList.remove('hidden');
 });

 quizAnswersGrid.appendChild(btn);
 });
}

if (btnNextQuestion) {
 btnNextQuestion.addEventListener('click', () => {
 currentQuestionIndex++;
 showTrainerQuestion();
 });
}

// 5. Форма добавления вопроса
if (btnAddQuestion && addQuestionForm) {
 btnAddQuestion.addEventListener('click', () => {
 addQuestionForm.classList.toggle('hidden');
 trainerBlock.classList.add('hidden');
 });
}

// 6. Админ-панель (Защита паролем)
if (btnAdminToggle && adminPanel) {
 btnAdminToggle.addEventListener('click', () => {
 const secretCode = "MiMiMi123";
 const input = prompt("Введите код администратора:");
 
 if (input === secretCode) {
 adminPanel.classList.toggle('hidden');
 trainerBlock.classList.add('hidden');
 if (!adminPanel.classList.contains('hidden')) {
 loadPendingQuestions();
 }
 } else if (input !== null) {
 alert("Неверный код доступа!");
 }
 });
}

// 7. Отправка нового вопроса в БД
if (btnSubmitQuestion) {
 btnSubmitQuestion.addEventListener('click', async () => {
 const qText = document.getElementById('qText').value.trim();
 const qAns1 = document.getElementById('qAns1').value.trim();
 const qAns2 = document.getElementById('qAns2').value.trim();
 const qAns3 = document.getElementById('qAns3').value.trim();
 const qAns4 = document.getElementById('qAns4').value.trim();

 if (!qText || !qAns1 || !qAns2 || !qAns3 || !qAns4) {
 statusMsg.style.color = "red";
 statusMsg.textContent = "Заполните все поля!";
 return;
 }

 try {
 btnSubmitQuestion.disabled = true;
 statusMsg.style.color = "orange";
 statusMsg.textContent = "Сохранение...";

 await db.collection('questions').add({
 question: qText,
 answers: [qAns1, qAns2, qAns3, qAns4],
 correct: 0,
 status: 'pending',
 difficulty: 'easy',
 createdAt: firebase.firestore.FieldValue.serverTimestamp()
 });

 document.getElementById('qText').value = '';
 document.getElementById('qAns1').value = '';
 document.getElementById('qAns2').value = '';
 document.getElementById('qAns3').value = '';
 document.getElementById('qAns4').value = '';

 statusMsg.style.color = "green";
 statusMsg.textContent = "Вопрос отправлен на проверку!";
 } catch (error) {
 console.error("Ошибка сохранения:", error);
 statusMsg.style.color = "red";
 statusMsg.textContent = "Ошибка: " + error.message;
 } finally {
 btnSubmitQuestion.disabled = false;
 }
 });
}

// 8. Загрузка вопросов в админке с разворачиванием вариантов
function loadPendingQuestions() {
 db.collection('questions')
 .where('status', '==', 'pending')
 .onSnapshot((snapshot) => {
 pendingQuestionsList.innerHTML = '';

 if (snapshot.empty) {
 pendingQuestionsList.innerHTML = '<p style="font-size: 13px; color: #666;">Пока нет новых вопросов на проверку...</p>';
 return;
 }

 snapshot.docs.forEach((doc) => {
 const q = doc.data();
 const id = doc.id;

 const qCard = document.createElement('div');
 qCard.className = 'admin-q-card';

 qCard.innerHTML = `
 <div class="admin-q-header" onclick="toggleCardDetails('${id}')">
 <span> ${q.question}</span>
 <small id="arrow-${id}">▼</small>
 </div>
 <div id="details-${id}" class="admin-q-details hidden">
 <div><strong>Варианты ответов:</strong></div>
 <ol class="admin-answers-list">
 <li style="color: green; font-weight: bold;">${q.answers[0]} (Правильный)</li>
 <li>${q.answers[1]}</li>
 <li>${q.answers[2]}</li>
 <li>${q.answers[3]}</li>
 </ol>
 <div class="admin-controls">
 <label>Сложность:</label>
 <select id="diff-${id}">
 <option value="easy">Легкая</option>
 <option value="medium">Средняя</option>
 <option value="hard">Сложная</option>
 </select>
 <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px; width: auto;" onclick="approveQuestion('${id}')">Одобрить</button>
 <button class="btn btn-danger" style="padding: 6px 12px; font-size: 12px; width: auto;" onclick="rejectQuestion('${id}')">Отклонить</button>
 </div>
 </div>
 `;
 pendingQuestionsList.appendChild(qCard);
 });
 }, (error) => {
 console.error("Ошибка загрузки вопросов:", error);
 });
}

window.toggleCardDetails = function(id) {
 const details = document.getElementById(`details-${id}`);
 const arrow = document.getElementById(`arrow-${id}`);
 if (details) {
 details.classList.toggle('hidden');
 arrow.textContent = details.classList.contains('hidden') ? '▼' : '▲';
 }
};

window.approveQuestion = async function(id) {
 try {
 const diffSelect = document.getElementById(`diff-${id}`);
 const selectedDifficulty = diffSelect ? diffSelect.value : 'easy';

 await db.collection('questions').doc(id).update({
 status: 'approved',
 difficulty: selectedDifficulty
 });
 alert("Вопрос одобрен!");
 } catch (error) {
 alert("Ошибка одобрения: " + error.message);
 }
};

window.rejectQuestion = async function(id) {
 if (confirm("Вы точно хотите отклонить и удалить этот вопрос?")) {
 try {
 await db.collection('questions').doc(id).delete();
 alert("Вопрос удален.");
 } catch (error) {
 alert("Ошибка удаления: " + error.message);
 }
 }
};

// 9. Очистка всех вопросов
if (btnClearAll) {
 btnClearAll.addEventListener('click', async () => {
 const password = prompt("Введите пароль администратора для удаления базы:");
 if (password !== 'MiMiMi000') {
 alert("Неверный пароль!");
 return;
 }

 const confirmDelete = confirm("ВНИМАНИЕ! Вы точно хотите удалить ВСЕ вопросы сезона?");
 if (confirmDelete) {
 try {
 const snapshot = await db.collection('questions').get();
 const batch = db.batch();

 snapshot.docs.forEach((doc) => {
 batch.delete(doc.ref);
 });

 await batch.commit();
 alert("Все вопросы сезона удалены!");
 } catch (error) {
 console.error("Ошибка удаления:", error);
 alert("Ошибка удаления: " + error.message);
 }
 }
 });
}