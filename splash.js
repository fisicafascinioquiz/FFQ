
document.addEventListener("DOMContentLoaded", function() {
    const imageIntro = document.getElementById('imageintro');
    const textIntro = document.getElementById('textintro');

    
    imageIntro.animate([
        { opacity: 0, transform: 'translateY(-100px)' },
        { opacity: 1, transform: 'translateY(0)' }
    ], {
        duration: 2000,
        fill: 'forwards'
    });

    textIntro.animate([
        { opacity: 0, transform: 'translateY(100px)' },
        { opacity: 1, transform: 'translateY(0)' }
    ], {
        duration: 2000,
        fill: 'forwards'
    });

    
    setTimeout(() => {
        const scaleFactor = 2.5;
        
        const imageExitAnim = imageIntro.animate([
            { transform: 'scale(1)', opacity: 1 },
            { transform: `scale(${scaleFactor})`, opacity: 0 }
        ], {
            duration: 2000,
            fill: 'forwards'
        });

        const textExitAnim = textIntro.animate([
            { transform: 'scale(1)', opacity: 1 },
            { transform: `scale(${scaleFactor})`, opacity: 0 }
        ], {
            duration: 2000,
            fill: 'forwards'
        });

        
        Promise.all([imageExitAnim.finished, textExitAnim.finished]).then(() => {
           
            document.getElementById('splash-screen').style.display = 'none';
            document.getElementById('app').style.display = 'block';
            
            
            window.location.href = 'login.html';
        });
    }, 2000); 
});
