// 1. Переключение тем
const themeSelect = document.getElementById('themeSelect');
const pageBody = document.body;

themeSelect.addEventListener('change', function() {
 pageBody.className = '';
 if (this.value !== 'theme-green') {
 pageBody.classList.add(this.value);
 }
});

// 2. Элементы формы "Свой вопрос" и Админки
const btnAddQuestion = document.getElementById('btnAddQuestion');
const addQuestionForm = document.getElementById('addQuestionForm');
const btnSubmitQuestion = document.getElementById('btnSubmitQuestion');
const statusMsg = document.getElementById('formStatus');

const btnAdminToggle = document.getElementById('btnAdminToggle');
const adminPanel = document.getElementById('adminPanel');
const pendingQuestionsList = document.getElementById('pendingQuestionsList');

// Массив для хранения всех вопросов
let allQuestions = [];

// Показ/скрытие формы вопроса
btnAddQuestion.addEventListener('click', function() {
 addQuestionForm.classList.toggle('hidden');
});

// Показ/скрытие админ-панели
// Показ админ-панели с паролем
btnAdminToggle.addEventListener('click', function() {
 // Установи здесь свой пароль!
 const secretCode = "1234"; 
 const input = prompt("Введите код администратора:");
 
 if (input === secretCode) {
 adminPanel.classList.toggle('hidden');
 renderAdminPanel();
 } else {
 alert("Неверный код!");
 }
});

// Отправка вопроса пользователем
btnSubmitQuestion.addEventListener('click', function() {
 const qText = document.getElementById('qText').value;
 const qAns1 = document.getElementById('qAns1').value;
 const qAns2 = document.getElementById('qAns2').value;
 const qAns3 = document.getElementById('qAns3').value;
 const qAns4 = document.getElementById('qAns4').value;

 if (!qText || !qAns1 || !qAns2 || !qAns3 || !qAns4) {
 statusMsg.style.color = "red";
 statusMsg.textContent = "Заполните все поля!";
 return;
 }

 const newQuestion = {
 id: Date.now(),
 question: qText,
 answers: [qAns1, qAns2, qAns3, qAns4],
 correct: 0,
 status: 'pending',
 difficulty: 'easy'
 };

 allQuestions.push(newQuestion);

 // Очистка полей
 document.getElementById('qText').value = '';
 document.getElementById('qAns1').value = '';
 document.getElementById('qAns2').value = '';
 document.getElementById('qAns3').value = '';
 document.getElementById('qAns4').value = '';

 statusMsg.style.color = "green";
 statusMsg.textContent = "Вопрос отправлен на проверку!";

 renderAdminPanel();
});

// Функция отрисовки вопросов в админке
function renderAdminPanel() {
 const pending = allQuestions.filter(q => q.status === 'pending');
 
 if (pending.length === 0) {
 pendingQuestionsList.innerHTML = '<p style="font-size: 13px; color: #666;">Пока нет новых вопросов на проверку...</p>';
 return;
 }

 pendingQuestionsList.innerHTML = '';

 pending.forEach(q => {
 const qCard = document.createElement('div');
 qCard.className = 'admin-q-card';
 qCard.innerHTML = `
 <strong>${q.question}</strong>
 <small>Правильный ответ: ${q.answers[0]}</small>
 <div class="admin-controls">
 <select id="diff-${q.id}">
 <option value="easy">Легкий</option>
 <option value="medium">Средний</option>
 <option value="hard">Сложный</option>
 </select>
 <button class="btn-approve" onclick="approveQuestion(${q.id})">Одобрить</button>
 </div>
 `;
 pendingQuestionsList.appendChild(qCard);
 });
}

// Функция одобрения вопроса
window.approveQuestion = function(id) {
 const q = allQuestions.find(item => item.id === id);
 if (q) {
 const diffSelect = document.getElementById(`diff-${id}`);
 q.difficulty = diffSelect.value;
 q.status = 'approved';
 alert(`Вопрос одобрен! Уровень сложности: ${q.difficulty}`);
 renderAdminPanel();
 }
};