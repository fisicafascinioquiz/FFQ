// wallet.js

import { auth, firestore } from './firebase-config.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const currentCoinsElement = document.getElementById('current-coins');
    const sendRequestButton = document.getElementById('send-request');
    const emailBox = document.getElementById('email-box');
    let user = null;

    auth.onAuthStateChanged(async (currentUser) => {
        if (currentUser) {
            const userId = currentUser.uid;
            console.log('User ID:', userId); // Log para verificar o ID do usuário

            try {
                const userDocRef = doc(firestore, "users", userId);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    user = userDoc.data();
                    console.log('Dados do usuário:', user); // Log para verificar os dados do usuário
                    currentCoinsElement.textContent = user.coins; // Atualiza o valor de coins imediatamente
                } else {
                    console.error("Dados do usuário não encontrados.");
                    alert("Dados do usuário não encontrados.");
                }
            } catch (error) {
                console.error("Erro ao carregar os dados do usuário:", error);
                alert("Erro ao carregar os dados do usuário.");
            }
        } else {
            console.error("Usuário não autenticado.");
            window.location.href = 'login.html'; // Redireciona para o login se o usuário não estiver logado
        }
    });

    sendRequestButton.addEventListener('click', async () => {
        if (!user) {
            alert("Dados do usuário não carregados.");
            return;
        }

        if (user.coins < 10000) {
            alert("Você precisa de mais PhysiCoins para trocar.");
            return;
        }

        const email = emailBox.value;
        const subject = "Solicitação de Troca de PhysiCoins";
        const message = `Nome: ${user.name}\nEmail: ${user.email}\nQuantidade de PhysiCoins: ${user.coins}\n\nGostaria de trocar minhas PhysiCoins por pontos.`;

        const emailIntent = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

        window.location.href = emailIntent;

        try {
            const updatedCoins = user.coins - 10000;
            await updateCoinsInDatabase(updatedCoins);
            user.coins = updatedCoins;
            currentCoinsElement.textContent = updatedCoins;
            alert("PhysiCoins debitados com sucesso.");
        } catch (error) {
            console.error("Erro ao debitar PhysiCoins:", error);
            alert("Erro ao debitar PhysiCoins.");
        }
    });

    async function updateCoinsInDatabase(updatedCoins) {
        const userId = auth.currentUser.uid;
        if (!userId) {
            throw new Error("Erro ao atualizar PhysiCoins. Usuário não autenticado.");
        }

        const userRef = doc(firestore, "users", userId);
        await updateDoc(userRef, {
            coins: updatedCoins
        });
    }
});
