const QUESTION_COUNT = 10;
const SCORE_PER_QUESTION = 10;

let questions = [];
let currentIndex = 0;
let score = 0;
let userAnswers = [];
let selectedOptions = [];
let isAnswered = false;

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function showScreen(screenId) {
    document.getElementById('difficultyScreen').classList.add('hidden');
    document.getElementById('quizScreen').classList.add('hidden');
    document.getElementById('resultScreen').classList.add('hidden');
    document.getElementById(screenId).classList.remove('hidden');
}

async function startQuiz(difficulty) {
    const loadingMsg = document.getElementById('loadingMsg');
    const errorMsg = document.getElementById('errorMsg');
    loadingMsg.classList.remove('hidden');
    errorMsg.classList.add('hidden');

    // 加载对应难度的背景图
    document.body.style.backgroundImage = `url('images/${difficulty}/background.jpg')`;

    try {
        const response = await fetch(`problems/${difficulty}.json`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();

        const allQuestions = Object.entries(data).map(([id, q]) => ({
            id,
            ...q
        }));

        if (allQuestions.length === 0) {
            throw new Error('题库为空');
        }

        questions = shuffleArray(allQuestions).slice(0, QUESTION_COUNT);
        currentIndex = 0;
        score = 0;
        userAnswers = [];

        showScreen('quizScreen');
        renderQuestion();
    } catch (err) {
        loadingMsg.classList.add('hidden');
        errorMsg.textContent = `加载失败：${err.message}，请检查文件是否存在`;
        errorMsg.classList.remove('hidden');
    }
}

function renderQuestion() {
    const q = questions[currentIndex];
    isAnswered = false;
    selectedOptions = [];

    document.getElementById('progressText').textContent = `第 ${currentIndex + 1}/${QUESTION_COUNT} 题`;
    document.getElementById('scoreText').textContent = `得分：${score}`;

    const questionTextEl = document.getElementById('questionText');
    questionTextEl.innerHTML = formatQuestionText(q.question);

    const optionsList = document.getElementById('optionsList');
    const fillInputContainer = document.getElementById('fillInputContainer');
    const multiHint = document.getElementById('multiHint');
    const submitBtn = document.getElementById('submitBtn');
    const nextBtn = document.getElementById('nextBtn');

    optionsList.innerHTML = '';
    fillInputContainer.classList.add('hidden');
    multiHint.classList.add('hidden');
    submitBtn.classList.remove('hidden');
    nextBtn.classList.add('hidden');

    if (q.options) {
        const correctAnswer = q.correct_answer;
        const isMulti = correctAnswer.length > 1;

        if (isMulti) {
            multiHint.classList.remove('hidden');
        }

        for (const [key, value] of Object.entries(q.options)) {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = `${key}. ${value}`;
            btn.dataset.option = key;
            btn.onclick = () => toggleOption(btn, key, isMulti);
            li.appendChild(btn);
            optionsList.appendChild(li);
        }
    } else {
        fillInputContainer.classList.remove('hidden');
        document.getElementById('fillInput').value = '';
        document.getElementById('fillInput').disabled = false;
    }
}

function formatQuestionText(text) {
    return marked.parse(text);
}

function toggleOption(btn, key, isMulti) {
    if (isAnswered) return;

    if (isMulti) {
        const idx = selectedOptions.indexOf(key);
        if (idx > -1) {
            selectedOptions.splice(idx, 1);
            btn.classList.remove('selected');
        } else {
            selectedOptions.push(key);
            btn.classList.add('selected');
        }
    } else {
        document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        selectedOptions = [key];
        btn.classList.add('selected');
    }
}

function submitAnswer() {
    if (isAnswered) return;

    const q = questions[currentIndex];
    let userAnswer = '';

    if (q.options) {
        if (selectedOptions.length === 0) {
            alert('请至少选择一个选项');
            return;
        }
        userAnswer = selectedOptions.sort().join('');
    } else {
        const input = document.getElementById('fillInput');
        userAnswer = input.value.trim();
        if (!userAnswer) {
            alert('请输入答案');
            return;
        }
        input.disabled = true;
    }

    isAnswered = true;
    const correctAnswer = q.correct_answer;
    const isCorrect = userAnswer === correctAnswer;

    if (isCorrect) {
        score += SCORE_PER_QUESTION;
        document.getElementById('scoreText').textContent = `得分：${score}`;
    }

    userAnswers.push({
        question: q,
        userAnswer,
        correctAnswer,
        isCorrect
    });

    if (q.options) {
        document.querySelectorAll('.option-btn').forEach(btn => {
            const opt = btn.dataset.option;
            btn.disabled = true;
            if (correctAnswer.includes(opt)) {
                btn.classList.add('correct');
            } else if (selectedOptions.includes(opt) && !correctAnswer.includes(opt)) {
                btn.classList.add('wrong');
            }
        });
    }

    const submitBtn = document.getElementById('submitBtn');
    const nextBtn = document.getElementById('nextBtn');
    submitBtn.classList.add('hidden');

    if (currentIndex < QUESTION_COUNT - 1) {
        nextBtn.textContent = '下一题';
    } else {
        nextBtn.textContent = '查看结果';
    }
    nextBtn.classList.remove('hidden');
}

function nextQuestion() {
    currentIndex++;
    if (currentIndex < QUESTION_COUNT) {
        renderQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    showScreen('resultScreen');
    document.getElementById('finalScore').innerHTML = `${score}<span>/${QUESTION_COUNT * SCORE_PER_QUESTION}</span>`;

    let message = '';
    if (score === 100) {
        message = '满分！太棒了！送你个💥🐔';
    } else if (score >= 80) {
        message = '优秀！继续保持！给你画个🫓';
    } else if (score >= 60) {
        message = '及格了，还可以更好！';
    } else if (score >= 40) {
        message = '还需努力！给你个坤安慰一下';
    } else {
        message = '加油，多复习再来！给你个坤安慰一下';
    }
    document.getElementById('resultMessage').textContent = message;

    const detailsList = document.getElementById('detailsList');
    detailsList.innerHTML = '';

    userAnswers.forEach((ans, idx) => {
        const item = document.createElement('div');
        item.className = `detail-item ${ans.isCorrect ? 'correct-item' : 'wrong-item'}`;

        let answerHtml = '';
        if (ans.question.options) {
            answerHtml = `
                <div class="detail-answer">
                    你的答案：<span class="${ans.isCorrect ? 'correct-answer' : 'user-answer'}">${ans.userAnswer}</span>
                    ${!ans.isCorrect ? `<br>正确答案：<span class="correct-answer">${ans.correctAnswer}</span>` : ''}
                </div>
            `;
        } else {
            answerHtml = `
                <div class="detail-answer">
                    你的答案：<span class="${ans.isCorrect ? 'correct-answer' : 'user-answer'}">${ans.userAnswer}</span>
                    ${!ans.isCorrect ? `<br>正确答案：<span class="correct-answer">${ans.correctAnswer}</span>` : ''}
                </div>
            `;
        }

        item.innerHTML = `
            <div class="detail-question">${formatQuestionText(ans.question.question)}</div>
            ${answerHtml}
            ${ans.question.analysis ? `<div class="detail-analysis"><strong>解析：</strong>${formatQuestionText(ans.question.analysis)}</div>` : ''}
        `;

        detailsList.appendChild(item);
    });
}

function restart() {
    document.body.style.backgroundImage = '';
    showScreen('difficultyScreen');
}
