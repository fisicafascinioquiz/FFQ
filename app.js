import { auth, firestore } from './firebase-config.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { loadCategories, loadSubcategories } from './categories.js';

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userId = user.uid;
            const userDocRef = doc(firestore, "users", userId);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists() || !userDoc.data().askedAdaptedActivities) {
                showAdaptedActivitiesPopup(userId);
            } else {
                loadSection('home', userId);
            }
        } else {
            window.location.href = 'login.html';
        }
    });

    const contentDiv = document.getElementById('content');
    const bottomBtns = document.querySelectorAll('.bottom-btn');
    const logoutBtn = document.getElementById('logoutBtn');

    bottomBtns.forEach(btn => {
        btn.addEventListener('click', (event) => {
            const section = event.currentTarget.getAttribute('data-section');
            loadSection(section, auth.currentUser.uid);
        });
    });

    logoutBtn.addEventListener('click', () => {
        alert("Voltando para a tela de login.");
        window.location.href = 'login.html';
    });

    function loadSection(section, userId) {
        switch(section) {
            case 'home':
                loadCategories(contentDiv, firestore);
                break;
            case 'leaderboards':
                window.location.href = 'leaderboard.html';
                break;
            case 'wallet':
                window.location.href = 'wallet.html';
                break;
            case 'profile':
                window.location.href = 'profile.html';
                break;
        }
    }

    window.selectCategory = function(categoryId) {
        const userId = auth.currentUser.uid;
        loadSubcategories(contentDiv, firestore, categoryId, userId);
    };
});

function showAdaptedActivitiesPopup(userId) {
    const popupHtml = `
        <div class="popup">
            <div class="popup-content">
                <h2>Você precisa de atividades adaptadas?</h2>
                <button id="btnYes">Sim</button>
                <button id="btnNo">Não</button>
            </div>
        </div>
    `;
    
    const body = document.querySelector('body');
    body.insertAdjacentHTML('beforeend', popupHtml);

    document.getElementById('btnYes').addEventListener('click', () => {
        saveUserPreference(userId, true);
        closePopup();
        loadSection('home', userId);
    });

    document.getElementById('btnNo').addEventListener('click', () => {
        saveUserPreference(userId, false);
        closePopup();
        loadSection('home', userId);
    });
}

function closePopup() {
    const popup = document.querySelector('.popup');
    if (popup) {
        popup.remove();
    }
}

async function saveUserPreference(userId, needsAdaptedActivities) {
    const userDocRef = doc(firestore, "users", userId);
    try {
        await updateDoc(userDocRef, {
            needsAdaptedActivities: needsAdaptedActivities,
            askedAdaptedActivities: true
        });
        alert("Preferência salva com sucesso.");
    } catch (error) {
        console.error("Erro ao salvar preferência: ", error);
        alert("Erro ao salvar preferência.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const inviteFriendsBtn = document.getElementById('inviteFriendsBtn');

    inviteFriendsBtn.addEventListener('click', async () => {
        await shareApp(firestore);
    });
});

async function shareApp(firestore) {
    try {
        // Acessar o Firestore para obter a mensagem de compartilhamento
        const messageDocRef = doc(firestore, "messages", "A4IzCUpk1AtMiYupUjxV", "shareMessage", "PkjwzT2BQcrX02ZXt3gQ");
        const messageDoc = await getDoc(messageDocRef);

        if (messageDoc.exists()) {
            const message = messageDoc.get('message');

            // Verificar se a API Web Share está disponível
            if (navigator.share) {
                // Utilizar a API Web Share para compartilhar a mensagem
                navigator.share({
                    title: 'Física Fascínio Quiz',
                    text: message,
                }).catch((error) => console.error('Erro ao compartilhar: ', error));
            } else {
                // Fallback: copiar a mensagem para a área de transferência e alertar o usuário
                navigator.clipboard.writeText(message)
                    .then(() => {
                        alert("Mensagem copiada para a área de transferência. Cole-a no seu app de mensagens para compartilhar.");
                    })
                    .catch((error) => console.error('Erro ao copiar a mensagem: ', error));
            }
        } else {
            console.log("Documento shareMessage não encontrado");
            alert("Desculpe, não foi possível carregar a mensagem de compartilhamento.");
        }
    } catch (error) {
        console.error("Erro ao acessar o Firestore: ", error);
        alert("Erro ao acessar a mensagem de compartilhamento.");
    }
}