document.addEventListener("DOMContentLoaded", function() {
    const imageIntro = document.getElementById('imageintro');
    const textIntro = document.getElementById('textintro');

    // Entry animations
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

    // Wait for entry animations to complete before starting exit animations
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

        // Wait for exit animations to complete before redirecting to login page
        Promise.all([imageExitAnim.finished, textExitAnim.finished]).then(() => {
            // Hide the splash screen and show the main app
            document.getElementById('splash-screen').style.display = 'none';
            document.getElementById('app').style.display = 'block';
            
            // Redirect to the login page (assuming you have a login.html)
            window.location.href = 'login.html';
        });
    }, 2000); // Wait for 2 seconds (2000ms) for the entry animations to complete
});
