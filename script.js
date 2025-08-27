// Menu hamburger responsive
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Fermer menu mobile au clic sur lien
document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Scroll fluide ancre
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetSelector = this.getAttribute('href');
        if(targetSelector.length > 1) {
            const target = document.querySelector(targetSelector);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
            }
        }
    });
});

// Animation fade-in / translation au scroll avec IntersectionObserver
const sections = document.querySelectorAll('.section');
const observerOptions = {
    threshold: 0.1,
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

sections.forEach(section => observer.observe(section));

// Gestion formulaire contact
const contactForm = document.querySelector('.contact-form');
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !message) {
        alert('Veuillez remplir tous les champs');
        return;
    }

    // Simple validation email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Veuillez entrer une adresse email valide');
        return;
    }

    alert('Message envoyé avec succès ! Je vous répondrai bientôt.');
    contactForm.reset();
});

// Effet d'impression (typewriter) sur titre hero
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';

    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

window.addEventListener('load', () => {
    const heroTitle = document.querySelector('.hero-title');
    // On enlève les balises HTML pour ne garder que le texte
    const fullText = heroTitle.textContent;
    typeWriter(heroTitle, fullText);
});

// Changement actif lien navigation selon scroll
window.addEventListener('scroll', () => {
    const current = window.pageYOffset + 80; // +80 pour compenser navbar fixe

    const navLinks = document.querySelectorAll('.nav-link');
    document.querySelectorAll('section').forEach((section, index) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;

        if (current >= sectionTop && current < sectionTop + sectionHeight) {
            navLinks.forEach(link => link.classList.remove('active'));
            if(navLinks[index]) navLinks[index].classList.add('active');
        }
    });
});