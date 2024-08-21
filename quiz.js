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
        nextQuestion();
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


function formatScientificNotation(text) {
    // Expressão regular para detectar padrões de notação científica
    const regex = /(\d+[,.]?\d*)\s*[x×.]?\s*10\s*([-−]?\d+)/gi;

    // Substituir os padrões detectados pelo formato HTML com <sup> para sobrescrito
    return text.replace(regex, (match, base, exponent) => {
        // Normalizar o sinal de menos para um hífen padrão
        const normalizedExponent = exponent.replace('−', '-');
        return `${base.replace(',', '.')} × 10<sup>${normalizedExponent}</sup>`;
    });
}




function nextQuestion() {
    window.scrollTo(0, 0);
    
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

    const formattedQuestionText = formatScientificNotation(question.question)
    .replace(/\\n/g, '</p><p>') // Substitui \n por </p><p>
    .replace(/([a-zA-Z])\^(\d+)/g, '$1<sup>$2</sup>');

    document.getElementById('question').innerHTML = `<p>${formattedQuestionText}</p>`;

    const options = shuffleOptions([
        { id: 'option1', text: formatScientificNotation(question.option1) },
        { id: 'option2', text: formatScientificNotation(question.option2) },
        { id: 'option3', text: formatScientificNotation(question.option3) },
        { id: 'option4', text: formatScientificNotation(question.option4) }
    ]);

    const optionsSection = document.getElementById('optionsSection');
    optionsSection.innerHTML = '';

    options.forEach(option => {
        const optionElement = document.createElement('div');
        optionElement.id = option.id;
        optionElement.className = 'option';
        
        if (isValidURL(option.text)) {
            optionElement.innerHTML = `<img src="${option.text}" alt="Option Image" style="max-width: 100%; max-height: 150px;">`;
        } else {
            optionElement.innerHTML = option.text.replace(/([a-zA-Z])\^(\d+)/g, '$1<sup>$2</sup>'); // Aplica a formatação de expoentes
        }

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

function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
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



function stripHTML(text) {
    const div = document.createElement('div');
    div.innerHTML = text;

    // Extract text without HTML
    let strippedText = div.textContent || div.innerText || '';

    // Remove whitespace
    strippedText = strippedText.replace(/\s+/g, '');

    // Normalize commas to dots
    strippedText = strippedText.replace(/,/g, '.');

    // Normalize the special minus sign (U+2212) to the standard hyphen (U+002D)
    strippedText = strippedText.replace(/−/g, '-');

    // Correct scientific notation formats to E notation
    strippedText = strippedText.replace(/(\d+[,.]?\d*)[×.]10\^?([-−]?\d+)/g, '$1E$2');

    return strippedText;
}


function checkAnswer(selectedAnswer) {
    const correctAnswer = stripHTML(questions[currentIndex].answer.trim());
    const cleanSelectedAnswer = typeof selectedAnswer === 'string' ? stripHTML(selectedAnswer.trim()) : null;

    console.log("Correct Answer:", correctAnswer);
    console.log("Selected Answer:", cleanSelectedAnswer);

    if (cleanSelectedAnswer === correctAnswer) {
        correctAnswers++;
        highlightCorrectOption();
    } else {
        highlightIncorrectOption(cleanSelectedAnswer);
    }

    disableOptions();
}


function highlightCorrectOption() {
    const correctAnswer = stripHTML(questions[currentIndex].answer.trim());

    document.querySelectorAll('.option').forEach(option => {
        let optionText = stripHTML(option.innerHTML.trim().split(' - ')[0]);

        if (option.querySelector('img')) {
            const imgSrc = option.querySelector('img').getAttribute('src');
            if (imgSrc === correctAnswer) {
                option.style.backgroundColor = '#4CAF50'; // Highlight correct image option in green
                console.log("Correct image option highlighted:", option);
            }
        } else if (optionText === correctAnswer) {
            option.style.backgroundColor = '#4CAF50'; // Highlight correct text option in green
            console.log("Correct text option highlighted:", option);
        }
    });
}

function highlightIncorrectOption(selectedAnswer) {
    const correctAnswer = stripHTML(questions[currentIndex].answer.trim());

    document.querySelectorAll('.option').forEach(option => {
        let optionText = stripHTML(option.innerHTML.trim().split(' - ')[0]);

        if (option.querySelector('img')) {
            const imgSrc = option.querySelector('img').getAttribute('src');
            if (imgSrc === selectedAnswer) {
                option.style.backgroundColor = '#F44336'; // Highlight incorrect image option in red
                console.log("Incorrect image option highlighted:", option);
            }
            if (imgSrc === correctAnswer) {
                option.style.backgroundColor = '#4CAF50'; // Highlight correct image option in green
                console.log("Correct image option highlighted:", option);
            }
        } else if (optionText === selectedAnswer) {
            option.style.backgroundColor = '#F44336'; // Highlight incorrect text option in red
            console.log("Incorrect text option highlighted:", option);
        }
        if (optionText === correctAnswer) {
            option.style.backgroundColor = '#4CAF50'; // Highlight correct text option in green
            console.log("Correct text option highlighted:", option);
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
    const correctAnswerPercentage = Math.floor(Math.random() * 21) + 60; // Aleatório entre 60 e 80
    let remainingPercentage = 100 - correctAnswerPercentage;

    const percentages = options.map((option, index) => {
        if (stripHTML(option.innerHTML.trim()) === stripHTML(correctAnswer)) {
            return correctAnswerPercentage;
        }
        const percentage = Math.floor(Math.random() * (remainingPercentage / (options.length - index - 1)));
        remainingPercentage -= percentage;
        return percentage;
    });

    options.forEach((option, index) => {
        const optionText = option.innerHTML.trim().split(' - ')[0];
        option.innerHTML = `${optionText} - ${percentages[index]}%`;

        // Reaplica o listener de clique após a modificação do conteúdo
        option.onclick = () => selectOption(option.innerHTML.trim().split(' - ')[0]);
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
            nextQuestion(); // Carregar a próxima pergunta
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

