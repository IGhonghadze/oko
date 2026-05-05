/* ============================================
   ОКОННЫЙ ЗАВОД — B2B ПРЕЗЕНТАЦИЯ
   Interactive Features
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // ── Particles on title slide ──
    const particlesContainer = document.getElementById('particles1');
    if (particlesContainer) {
        for (let i = 0; i < 30; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = Math.random() * 100 + '%';
            p.style.top = Math.random() * 100 + '%';
            p.style.animationDelay = Math.random() * 8 + 's';
            p.style.animationDuration = (6 + Math.random() * 6) + 's';
            p.style.width = p.style.height = (2 + Math.random() * 4) + 'px';
            if (Math.random() > 0.5) {
                p.style.background = 'rgba(75,211,248,0.25)';
            }
            particlesContainer.appendChild(p);
        }
    }

    // ── Intersection Observer for scroll animations ──
    const animEls = document.querySelectorAll('.anim-fade-up, .anim-fade-right, .anim-fade-left');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('anim-visible');
                }, i * 100);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    animEls.forEach(el => observer.observe(el));

    // ── Navigation dots ──
    const dots = document.querySelectorAll('.nav-dot');
    const slides = document.querySelectorAll('.slide');

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const slideNum = dot.getAttribute('data-slide');
            const target = document.getElementById('slide-' + slideNum);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    });

    // Track which slide is in view
    const slideObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                const num = id.replace('slide-', '');
                dots.forEach(d => d.classList.remove('active'));
                const activeDot = document.querySelector(`.nav-dot[data-slide="${num}"]`);
                if (activeDot) activeDot.classList.add('active');
            }
        });
    }, { threshold: 0.5 });

    slides.forEach(slide => slideObserver.observe(slide));

    // ── Keyboard navigation ──
    document.addEventListener('keydown', (e) => {
        const current = document.querySelector('.nav-dot.active');
        if (!current) return;
        let num = parseInt(current.getAttribute('data-slide'));

        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            num = Math.min(num + 1, slides.length);
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            num = Math.max(num - 1, 1);
        } else {
            return;
        }

        const target = document.getElementById('slide-' + num);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
});
