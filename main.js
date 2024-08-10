// main.js
document.addEventListener('DOMContentLoaded', () => {
    const appDiv = document.getElementById('app');
    appDiv.innerHTML = `
        <h1>Física Fascínio Quiz</h1>
        <p>Selecione a página de navegação:</p>
        <ul>
            <li><a href="login.html">Login</a></li>
            <li><a href="signup.html">Criar conta</a></li>
            <li><a href="quiz.html">Quiz</a></li>
            <li><a href="pages/busca.html">busca</a></li>
            <li><a href="pages/main.html">Main</a></li>
            <li><a href="pages/profile.html">Profile</a></li>
            <li><a href="wallet.html">Wallet</a></li>
        </ul>
    `;
});
