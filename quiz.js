import { firestore } from './firebase-config.js';
import { collection, doc, getDoc, getDocs } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

let questions = [];
let currentIndex = 0;
let correctAnswers = 0;
let timer;
let timePerQuestion = 24000; // Default time per question in milliseconds
let maxIndex = 0;
let pointsPerQuestion = 0;
let questionsCount = 0;
let fiftyFiftyCount = 0;
let audiencePollCount = 0;
const MAX_FIFTY_FIFTY_COUNT = 3;
const MAX_AUDIENCE_POLL_COUNT = 3;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('categoryId');
    const subcategoryId = urlParams.get('subcategoryId');

    if (categoryId && subcategoryId) {
        await loadQuestions(categoryId, subcategoryId);
        setNextQuestion();
    } else {
        alert("Erro: Parâmetros de categoria ou subcategoria ausentes.");
    }

    restoreCounts();
    setupOptionClickListeners();
    setupButtonsClickListeners();
});

async function loadQuestions(categoryId, subcategoryId) {
    try {
        const docRef = doc(firestore, 'categories', categoryId, 'subcategories', subcategoryId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            timePerQuestion = data.time || timePerQuestion;
            maxIndex = data.maxIndex || 0;
            pointsPerQuestion = data.pointsPerQuestion || 1;
            questionsCount = data.questionsCount || 0;

            const questionsSnapshot = await getDocs(collection(docRef, 'questions'));
            questions = questionsSnapshot.docs.map(doc => doc.data());
            shuffleArray(questions);

            if (questionsCount > 0 && questionsCount <= questions.length) {
                questions = questions.slice(0, questionsCount);
            }

        } else {
            alert("Quiz em manutenção.");
        }
    } catch (e) {
        console.error("Erro ao carregar as perguntas:", e);
        alert("Erro ao carregar as perguntas.");
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function setNextQuestion() {
    if (timer) {
        clearInterval(timer);
    }

    if (currentIndex >= questions.length || (maxIndex > 0 && currentIndex >= maxIndex)) {
        finishQuiz();
        return;
    }

    resetOptions();
    enableOptions();

    const question = questions[currentIndex];
    const options = shuffleOptions([
        { id: 'option1', text: question.option1 },
        { id: 'option2', text: question.option2 },
        { id: 'option3', text: question.option3 },
        { id: 'option4', text: question.option4 }
    ]);

    document.getElementById('question').textContent = question.question;

    // Limpar o conteúdo da seção de opções
    const optionsSection = document.getElementById('optionsSection');
    optionsSection.innerHTML = '';

    // Inserir as opções embaralhadas no DOM e associar o evento de clique
    options.forEach(option => {
        const optionElement = document.createElement('div');
        optionElement.id = option.id;
        optionElement.className = 'option';
        optionElement.textContent = option.text;
        optionElement.onclick = () => selectOption(option.text);
        optionsSection.appendChild(optionElement);
    });

    document.getElementById('questionCounter').textContent = `${currentIndex + 1}/${questions.length}`;

    if (question.imageUrl) {
        const questionImage = document.getElementById('questionImage');
        questionImage.src = question.imageUrl;
        questionImage.style.display = 'block';
    } else {
        document.getElementById('questionImage').style.display = 'none';
    }

    startTimer();
}


function shuffleOptions(options) {
    shuffleArray(options); // Embaralha a ordem das opções
    return options;
}

function startTimer() {
    const timerElement = document.getElementById('timer');
    let timeLeft = timePerQuestion / 1000;
    timerElement.textContent = timeLeft;

    timer = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            checkAnswer(null); // Time's up, no answer selected
        }
    }, 1000);
}

function selectOption(selectedOptionText) {
    clearInterval(timer);
    checkAnswer(selectedOptionText);
}

function checkAnswer(selectedAnswer) {
    const correctAnswer = questions[currentIndex].answer;

    // Comparar apenas o texto antes do "-"
    const cleanSelectedAnswer = selectedAnswer ? selectedAnswer.split(' - ')[0] : null;

    if (cleanSelectedAnswer === correctAnswer) {
        correctAnswers++; // Incrementa em 1 para cada resposta correta
        highlightCorrectOption();
    } else {
        highlightIncorrectOption(selectedAnswer);
    }

    disableOptions();
}


function highlightCorrectOption() {
    const correctOption = questions[currentIndex].answer;
    document.querySelectorAll('.option').forEach(option => {
        if (option.textContent.includes(correctOption)) {
            option.style.backgroundColor = '#4CAF50';
        }
    });
}

function highlightIncorrectOption(selectedAnswer) {
    document.querySelectorAll('.option').forEach(option => {
        if (option.textContent.includes(selectedAnswer)) {
            option.style.backgroundColor = '#F44336';
        } else if (option.textContent.includes(questions[currentIndex].answer)) {
            option.style.backgroundColor = '#4CAF50';
        }
    });
}

function resetOptions() {
    document.querySelectorAll('.option').forEach(option => {
        option.style.backgroundColor = '';
        option.style.display = 'block';
    });
}

function disableOptions() {
    document.querySelectorAll('.option').forEach(option => {
        option.style.pointerEvents = 'none';
    });
}

function enableOptions() {
    document.querySelectorAll('.option').forEach(option => {
        option.style.pointerEvents = 'auto';
    });
}

function finishQuiz() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('categoryId');
    const subcategoryId = urlParams.get('subcategoryId');
    
    window.location.href = `result.html?categoryId=${categoryId}&subcategoryId=${subcategoryId}&correct=${correctAnswers}&total=${questions.length}`;
}

function useFiftyFifty() {
    if (fiftyFiftyCount < MAX_FIFTY_FIFTY_COUNT) {
        fiftyFiftyCount++;
        saveCounts();

        const options = Array.from(document.querySelectorAll('.option')).filter(option => option.style.display !== 'none');
        const correctOption = options.find(option => option.textContent.includes(questions[currentIndex].answer));
        const incorrectOptions = options.filter(option => option !== correctOption);

        // Embaralhar as opções incorretas e esconder duas delas
        shuffleArray(incorrectOptions);
        incorrectOptions.slice(0, 2).forEach(option => {
            option.style.display = 'none';
        });
    } else {
        alert("Você usou todas as suas chances de 50-50 para hoje.");
    }
}


function useAudiencePoll() {
    if (audiencePollCount < MAX_AUDIENCE_POLL_COUNT) {
        audiencePollCount++;
        saveCounts();
        showAudiencePoll();
    } else {
        alert("Você usou todas as suas chances de Enquete da Audiência para hoje.");
    }
}

function showAudiencePoll() {
    const options = Array.from(document.querySelectorAll('.option')).filter(option => option.style.display !== 'none');
    const correctAnswer = questions[currentIndex].answer;
    const correctAnswerPercentage = Math.floor(Math.random() * 21) + 60; // Random between 60 and 80
    let remainingPercentage = 100 - correctAnswerPercentage;

    const percentages = options.map((option, index) => {
        if (option.textContent === correctAnswer) {
            return correctAnswerPercentage;
        }
        const percentage = Math.floor(Math.random() * (remainingPercentage / (options.length - index - 1)));
        remainingPercentage -= percentage;
        return percentage;
    });

    options.forEach((option, index) => {
        option.textContent = `${option.textContent.split(' - ')[0]} - ${percentages[index]}%`;
       
    });

}

function toggleFullscreenImage(imageUrl) {
    const fullscreenImageContainer = document.getElementById('fullscreenImage');
    
    // Verifica se o contêiner está oculto
    if (fullscreenImageContainer.style.display === 'none' || fullscreenImageContainer.style.display === '') {
        fullscreenImageContainer.style.backgroundImage = `url(${imageUrl})`; // Define a imagem de fundo
        fullscreenImageContainer.style.display = 'flex'; // Exibe o contêiner em modo flex para centralizar
        disableQuizNavigationButtons(); // Desabilita botões de navegação do quiz (se necessário)
    } else {
        fullscreenImageContainer.style.display = 'none'; // Oculta o contêiner
        fullscreenImageContainer.style.backgroundImage = ''; // Limpa a imagem de fundo
        enableQuizNavigationButtons(); // Reabilita botões de navegação do quiz (se necessário)
    }
}


function disableQuizNavigationButtons() {
    document.getElementById('quizBtn').disabled = true;
    document.getElementById('nextBtn').disabled = true;
}

function enableQuizNavigationButtons() {
    document.getElementById('quizBtn').disabled = false;
    document.getElementById('nextBtn').disabled = false;
}

function saveCounts() {
    const now = new Date();
    localStorage.setItem('fiftyFiftyCount', fiftyFiftyCount);
    localStorage.setItem('audiencePollCount', audiencePollCount);
    localStorage.setItem('lastResetDate', now.toDateString());
}

function restoreCounts() {
    const now = new Date();
    const lastResetDate = localStorage.getItem('lastResetDate');

    if (lastResetDate !== now.toDateString()) {
        // Reseta as contagens se a data tiver mudado
        fiftyFiftyCount = 0;
        audiencePollCount = 0;
        saveCounts(); // Salva as contagens resetadas e atualiza a última data de reset
    } else {
        // Restaura as contagens do localStorage
        fiftyFiftyCount = parseInt(localStorage.getItem('fiftyFiftyCount') || '0', 10);
        audiencePollCount = parseInt(localStorage.getItem('audiencePollCount') || '0', 10);
    }
}

function setupOptionClickListeners() {
    document.getElementById('option1').addEventListener('click', function() { selectOption(this); });
    document.getElementById('option2').addEventListener('click', function() { selectOption(this); });
    document.getElementById('option3').addEventListener('click', function() { selectOption(this); });
    document.getElementById('option4').addEventListener('click', function() { selectOption(this); });
}

function setupButtonsClickListeners() {
    // Configurar o clique no botão "Próximo"
    document.getElementById('nextBtn').addEventListener('click', function() {
        if (currentIndex < questions.length - 1) {
            currentIndex++;
            setNextQuestion(); // Carregar a próxima pergunta
        } else {
            finishQuiz(); // Finalizar o quiz se não houver mais perguntas
        }
    });

    // Configurar o clique no botão de finalizar o quiz
    document.getElementById('prevBtn').addEventListener('click', function() {
        window.location.href = 'main.html';
    });

    // Configurar os cliques dos botões de "50-50" e "Enquete da Audiência"
    document.getElementById('fiftyFiftyBtn').addEventListener('click', function() {
        useFiftyFifty();
    });

    document.getElementById('audiencePollBtn').addEventListener('click', function() {
        useAudiencePoll();
    });

    // Configurar o clique na imagem da pergunta para alternar para a visualização em tela cheia
    document.getElementById('questionImage').addEventListener('click', function() {
        toggleFullscreenImage(this.src);
    });

    // Configurar o clique na imagem em tela cheia para sair da visualização em tela cheia
    document.getElementById('fullscreenImage').addEventListener('click', function() {
        toggleFullscreenImage('');
    });

    // Configurar o clique no botão "Anterior" para redirecionar para a página principal
    document.getElementById('prevBtn').addEventListener('click', function() {
        window.location.href = 'main.html';
    });
}

