// profile.js

import { firestore } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
    const updateMessageBox = document.getElementById('updateMessageBox');
    const aboutMessageBox = document.getElementById('aboutMessageBox');

    // Função para carregar as mensagens do Firestore
    async function loadMessages() {
        const docRef = doc(firestore, 'profile/QOdQH1grEFykVK41Nodc/messages/m4L3xwEZE5mzvFMcVIuD');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            updateMessageBox.textContent = data.updates;
            aboutMessageBox.textContent = data.about;
        } else {
            console.log('Documento não encontrado.');
        }
    }

    // Carregar as mensagens
    loadMessages();
});
