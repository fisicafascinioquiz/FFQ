// leaderboard.js

import { firestore } from './firebase-config.js';
import { collection, query, orderBy, getDocs } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
    const leaderboardElement = document.getElementById('leaderboard');

    // Consulta para obter os usuários ordenados por moedas
    const usersQuery = query(collection(firestore, 'users'), orderBy('coins', 'desc'));
    const querySnapshot = await getDocs(usersQuery);

    let position = 1;

    querySnapshot.forEach((doc) => {
        const user = doc.data();

        // Criar um elemento HTML para cada usuário
        const userRow = document.createElement('div');
        userRow.classList.add('user-row');

        // Índice
        const indexElement = document.createElement('div');
        indexElement.textContent = `#${position++}`;
        userRow.appendChild(indexElement);

        // Nome do usuário
        const nameElement = document.createElement('div');
        nameElement.classList.add('user-name');
        nameElement.textContent = user.name;
        userRow.appendChild(nameElement);

        // Moedas do usuário
        const coinsElement = document.createElement('div');
        coinsElement.classList.add('user-coins');
        coinsElement.textContent = user.coins;
        userRow.appendChild(coinsElement);

        // Adiciona a linha do usuário ao leaderboard
        leaderboardElement.appendChild(userRow);
    });
});
