import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { firebaseConfig } from './firebase-config.js'; 

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const correctAnswers = parseInt(urlParams.get('correct'));
    const totalQuestions = parseInt(urlParams.get('total'));
    const categoryId = urlParams.get('categoryId');
    const subcategoryId = urlParams.get('subcategoryId');

    // Adicionando logs para verificar os valores de correctAnswers e totalQuestions
    console.log("Valor de correctAnswers:", correctAnswers);
    console.log("Valor de totalQuestions:", totalQuestions);

    if (!categoryId || !subcategoryId) {
        alert("Erro ao carregar os dados da categoria.");
        console.error("categoryId ou subcategoryId são nulos.");
        return;
    }

    let pointsPerQuestion = 0;

    try {
        const subcategoryDoc = doc(db, 'categories', categoryId, 'subcategories', subcategoryId);
        const subcategorySnapshot = await getDoc(subcategoryDoc);

        if (subcategorySnapshot.exists() && subcategorySnapshot.data().pointsPerQuestion) {
            pointsPerQuestion = subcategorySnapshot.data().pointsPerQuestion;
            calculateAndDisplayResults(correctAnswers, totalQuestions, pointsPerQuestion);
        } else {
            alert("Dados da subcategoria não encontrados.");
            console.error("Documento não encontrado ou campo pointsPerQuestion não existe.");
        }
    } catch (error) {
        alert("Erro ao carregar dados do Firestore.");
        console.error("Erro ao carregar dados do Firestore: ", error);
    }

    document.getElementById('restartBtn').addEventListener('click', () => {
        window.location.href = 'main.html';
    });

    document.getElementById('shareBtn').addEventListener('click', () => {
        shareApp();
    });
});

function shareApp() {
    // Exemplo de texto para compartilhar
    const score = document.getElementById('score').innerText;
    const earnedCoins = document.getElementById('earnedCoins').innerText;
    const shareText = `Acabei o quiz com ${score} pontos! Ganhei ${earnedCoins} PhysiCoins!`;

    if (navigator.share) {
        navigator.share({
            title: 'Compartilhar Pontuação',
            text: shareText,
            url: window.location.href // opcional: compartilha a URL atual junto com o texto
        }).then(() => {
            console.log('Conteúdo compartilhado com sucesso');
        }).catch((error) => {
            console.error('Erro ao compartilhar:', error);
        });
    } else {
        // Fallback caso o navegador não suporte a API de compartilhamento
        alert('O compartilhamento não é suportado neste navegador.');
    }
}

function calculateAndDisplayResults(correctAnswers, totalQuestions, pointsPerQuestion) {
    // Certifique-se de que essa linha define o texto corretamente
    console.log("Valor correto de correctAnswers antes de exibir:", correctAnswers);

    document.getElementById('score').textContent = `${correctAnswers}/${totalQuestions}`;
    console.log("Score atualizado:", document.getElementById('score').textContent);

    // Essa linha calcula os pontos e exibe no campo `earnedCoins`
    const points = correctAnswers * pointsPerQuestion;
    document.getElementById('earnedCoins').innerHTML = `<img src="images/cronometro.png" alt="Dollar Icon" class="icon">${points}`;

    // Atualiza as moedas do usuário no Firestore
    const user = auth.currentUser;
    if (user) {
        const userDoc = doc(db, 'users', user.uid);
        updateDoc(userDoc, {
            coins: increment(points)
        }).then(() => {
            console.log("Moedas atualizadas com sucesso.");
        }).catch((error) => {
            console.error("Erro ao atualizar moedas: ", error);
        });
    }
}
