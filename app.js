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
