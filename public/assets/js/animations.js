// Triggers .reveal / .reveal-scale entrance animations as elements scroll into view,
// and adds a shadow to the header once the page is scrolled.

document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('in');
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal, .reveal-scale').forEach(el => observer.observe(el));

  const header = document.querySelector('header');
  if (header) {
    window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 20));
  }
});