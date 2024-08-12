import { auth, firestore } from './firebase-config.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('wheelCanvas');
    const context = canvas.getContext('2d');
    const spinBtn = document.getElementById('spinBtn');
    const tvRemainingSpins = document.getElementById('tvRemainingSpins');
    const tvCountdownTimer = document.getElementById('tvCountdownTimer');
    const btnBack = document.getElementById('btnback');

    const items = [
        { text: '5 PHYSCOINS', color: '#eceff1', textColor: '#212121', value: 5 },
        { text: '10 PHYSCOINS', color: '#00cf00', textColor: '#ffffff', value: 10 },
        { text: '15 PHYSCOINS', color: '#eceff1', textColor: '#212121', value: 15 },
        { text: '20 PHYSCOINS', color: '#7f00d9', textColor: '#ffffff', value: 20 },
        { text: '25 PHYSCOINS', color: '#eceff1', textColor: '#212121', value: 25 },
        { text: '30 PHYSCOINS', color: '#dc0000', textColor: '#ffffff', value: 30 },
        { text: '35 PHYSCOINS', color: '#eceff1', textColor: '#212121', value: 35 },
        { text: '0 PHYSCOINS', color: '#008bff', textColor: '#ffffff', value: 0 }
    ];

    const wheelRadius = canvas.width / 2;
    const arcSize = (2 * Math.PI) / items.length;
    let startAngle = 0;
    let isSpinning = false;
    let remainingSpins = 0;
    let userId = null;
    let lastUpdate = null;

    async function fetchRemainingSpins() {
        if (!userId) return;

        const userDocRef = doc(firestore, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            remainingSpins = userDoc.data().remainingSpins || 0;
            lastUpdate = userDoc.data().lastUpdate || null;
            tvRemainingSpins.textContent = `Tentativas restantes: ${remainingSpins}`;
        } else {
            console.log("Documento de usuário não encontrado.");
        }
    }

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            userId = user.uid;
            await fetchRemainingSpins();
            drawWheel();
            startCountdownTimer();
        } else {
            console.log("Nenhum usuário autenticado.");
        }
    });

    function drawWheel() {
        context.clearRect(0, 0, canvas.width, canvas.height);
    
        items.forEach((item, index) => {
            const angle = startAngle + index * arcSize;
            context.beginPath();
            context.fillStyle = item.color;
            context.moveTo(wheelRadius, wheelRadius);
            context.arc(wheelRadius, wheelRadius, wheelRadius, angle, angle + arcSize, false);
            context.lineTo(wheelRadius, wheelRadius);
            context.fill();
            context.save();
    
            context.translate(
                wheelRadius + Math.cos(angle + arcSize / 2) * (wheelRadius - 40),
                wheelRadius + Math.sin(angle + arcSize / 2) * (wheelRadius - 40)
            );
            context.rotate(angle + arcSize / 2 + Math.PI / 2);
    
            context.fillStyle = item.textColor;
            context.font = 'bold 18px Arial';
            context.fillText(item.value, -context.measureText(item.value).width / 2, -10);
            context.font = '12px Arial';
            context.fillText('PHYSCOINS', -context.measureText('PHYSCOINS').width / 2, 10);
            
            context.restore();
        });
    }

    async function spinWheel() {
        if (isSpinning || remainingSpins <= 0) return;
        isSpinning = true;

        remainingSpins--;
        tvRemainingSpins.textContent = `Tentativas restantes: ${remainingSpins}`;
        const userDocRef = doc(firestore, "users", userId);
        await updateDoc(userDocRef, { remainingSpins: remainingSpins });

        const spinDuration = 5000;
        const totalRotations = 7;

        const winningIndex = Math.floor(Math.random() * items.length);
        const winningItem = items[winningIndex];
        const finalAngle = (Math.PI * 3 / 2) - (winningIndex * arcSize) - (arcSize / 2) + Math.PI * 2 * totalRotations;
        let startTime = null;

        async function updateCoins() {
            const userDocRef = doc(firestore, "users", userId);
            const userDoc = await getDoc(userDocRef);
            const currentCoins = userDoc.data().coins || 0;
            await updateDoc(userDocRef, { coins: currentCoins + winningItem.value });
        }

        function animateSpin(time) {
            if (!startTime) startTime = time;
            const elapsed = time - startTime;
    
            startAngle = easeOut(elapsed, 0, finalAngle, spinDuration);
            drawWheel();
    
            if (elapsed < spinDuration) {
                requestAnimationFrame(animateSpin);
            } else {
                startAngle = finalAngle % (2 * Math.PI);
                drawWheel();
                alert(`Você ganhou: ${winningItem.text}`);
                
                updateCoins().then(() => {
                    isSpinning = false;
                }).catch((error) => {
                    console.error("Erro ao atualizar os PHYSCOINS:", error);
                    isSpinning = false;
                });
            }
        }
    
        requestAnimationFrame(animateSpin);
    }
    
    function easeOut(t, b, c, d) {
        t /= d;
        t--;
        return c * (t * t * t + 1) + b;
    }

    function startCountdownTimer() {
        function updateCountdown() {
            const now = new Date();
            const nextReset = new Date();
            nextReset.setHours(now.getHours() < 12 ? 12 : 24, 0, 0, 0);
    
            const timeDiff = nextReset - now;
            const hours = Math.floor(timeDiff / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
            tvCountdownTimer.textContent = `Reinicia em: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
            if (timeDiff <= 0) {
                resetSpins();
                setTimeout(updateCountdown, 1000);
            } else {
                setTimeout(updateCountdown, 1000);
            }
        }
    
        async function resetSpins() {
            if (!userId) return;
        
            const now = new Date();
            const userDocRef = doc(firestore, "users", userId);
        
            try {
                const userDoc = await getDoc(userDocRef);
                const lastUpdate = userDoc.data().lastUpdate?.toDate();
        
                const currentHour = now.getHours();
                let shouldUpdate = false;
        
                if (currentHour >= 12) {
                    // Período de meio-dia até meia-noite
                    shouldUpdate = !lastUpdate || lastUpdate.getHours() < 12;
                } else {
                    // Período de meia-noite até meio-dia
                    shouldUpdate = !lastUpdate || lastUpdate.getHours() >= 12;
                }
        
                if (shouldUpdate) {
                    await updateDoc(userDocRef, { remainingSpins: 3, lastUpdate: now });
                    console.log("Tentativas restantes atualizadas para 3.");
                    remainingSpins = 3;
                    tvRemainingSpins.textContent = `Tentativas restantes: ${remainingSpins}`;
                }
            } catch (error) {
                console.error("Erro ao atualizar remainingSpins:", error);
            }
        }
        
    
        updateCountdown();
    }
    
    spinBtn.addEventListener('click', spinWheel);

    btnBack.addEventListener('click', () => {
        window.location.href = 'main.html';
    });
});
