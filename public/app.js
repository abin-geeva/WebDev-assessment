const menuItems = ['Home', 'About me', 'Feedback'];
const nav = document.querySelector('#main-nav');

// Keep the menu easy to extend while click behavior is planned for later.
menuItems.forEach((label, index) => {
  const item = document.createElement('button');
  item.type = 'button';
  item.className = `nav-item${index === 0 ? ' active' : ''}`;
  item.textContent = label;
  item.setAttribute('aria-current', index === 0 ? 'page' : 'false');
  item.addEventListener('click', () => selectMenuItem(label, item));
  nav.append(item);
});

const homeView = document.querySelector('#home-view');
const aboutView = document.querySelector('#about-view');
const feedbackView = document.querySelector('#feedback-view');
const savedProfile = document.querySelector('#saved-profile');
function selectMenuItem(label, selectedItem) {
  nav.querySelectorAll('.nav-item').forEach(item => {
    const active = item === selectedItem;
    item.classList.toggle('active', active);
    item.setAttribute('aria-current', active ? 'page' : 'false');
  });
  if (label === 'Home') {
    aboutView.hidden = true;
    feedbackView.hidden = true;
    homeView.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (label === 'About me') {
    homeView.hidden = true;
    feedbackView.hidden = true;
    aboutView.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadSavedProfile();
  } else {
    homeView.hidden = true;
    aboutView.hidden = true;
    feedbackView.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function addProfileValue(parent, title, value) {
  if (!value || (Array.isArray(value) && value.length === 0)) return;
  const row = document.createElement('div');
  row.className = 'profile-detail';
  const heading = document.createElement('h3');
  heading.textContent = title;
  const content = document.createElement('p');
  content.textContent = Array.isArray(value) ? value.join(' · ') : value;
  row.append(heading, content);
  parent.append(row);
}

async function loadSavedProfile() {
  const id = localStorage.getItem('latestPortfolioId');
  if (!id) {
    savedProfile.innerHTML = '<div class="profile-empty"><span>✳</span><h3>Your story starts here.</h3><p>Save your details from Home and they’ll show up here.</p><button type="button" class="text-action" id="make-profile">Create your profile ↗</button></div>';
    document.querySelector('#make-profile').addEventListener('click', () => selectMenuItem('Home', nav.querySelector('.nav-item')));
    return;
  }
  savedProfile.innerHTML = '<p class="profile-loading">Loading your saved profile…</p>';
  try {
    const response = await fetch(`/api/portfolios/${encodeURIComponent(id)}`);
    const profile = await response.json();
    if (!response.ok) throw new Error(profile.message || 'Unable to load your portfolio.');
    savedProfile.replaceChildren();
    const card = document.createElement('article');
    card.className = 'profile-sheet';
    const intro = document.createElement('div');
    intro.className = 'profile-intro';
    const avatar = document.createElement('span');
    avatar.className = 'profile-big-avatar';
    avatar.textContent = (profile.name || '?').trim().charAt(0).toUpperCase();
    const identity = document.createElement('div');
    const name = document.createElement('h3');
    name.textContent = profile.name;
    const tagline = document.createElement('p');
    tagline.textContent = [profile.course, profile.institution].filter(Boolean).join(' · ') || 'Student portfolio';
    identity.append(name, tagline);
    intro.append(avatar, identity);
    card.append(intro);
    const details = document.createElement('div');
    details.className = 'profile-details-grid';
    addProfileValue(details, 'Email', profile.email);
    addProfileValue(details, 'Age', profile.age);
    addProfileValue(details, 'Location', profile.location);
    addProfileValue(details, 'Gender', profile.gender);
    addProfileValue(details, 'Academic year', profile.academicYear);
    addProfileValue(details, 'Institution', profile.institution);
    addProfileValue(details, 'Course', profile.course);
    addProfileValue(details, 'Skills', profile.skills);
    addProfileValue(details, 'Hobbies & interests', profile.hobbies);
    addProfileValue(details, 'Projects', profile.projects);
    addProfileValue(details, 'Certificates & awards', profile.certificates);
    addProfileValue(details, 'About me', profile.aboutMe);
    card.append(details);
    savedProfile.append(card);
  } catch (error) {
    savedProfile.innerHTML = '';
    const message = document.createElement('p');
    message.className = 'profile-error';
    message.textContent = error.message;
    savedProfile.append(message);
  }
}

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));

const aboutField = document.querySelector('[name="aboutMe"]');
const characterCount = document.querySelector('.character-count');
aboutField.addEventListener('input', () => {
  characterCount.textContent = `${aboutField.value.length} / 2000`;
});

const feedbackForm = document.querySelector('#feedback-form');
const feedbackStatus = document.querySelector('#feedback-status');
const feedbackButton = feedbackForm.querySelector('button[type="submit"]');
feedbackForm.addEventListener('submit', async event => {
  event.preventDefault();
  feedbackStatus.textContent = '';
  feedbackStatus.className = 'feedback-status';
  feedbackButton.disabled = true;
  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(feedbackForm).entries()))
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Could not send feedback. Please try again.');
    feedbackStatus.textContent = 'Thank you — your feedback has been saved.';
    feedbackStatus.classList.add('success');
    feedbackForm.reset();
  } catch (error) {
    feedbackStatus.textContent = error.message || 'We couldn’t reach the server. Please try again.';
    feedbackStatus.classList.add('error');
  } finally {
    feedbackButton.disabled = false;
  }
});

function splitList(value) {
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

const form = document.querySelector('#portfolio-form-element');
const status = document.querySelector('#form-status');
const submitButton = form.querySelector('button[type="submit"]');
form.addEventListener('submit', async event => {
  event.preventDefault();
  status.textContent = '';
  status.className = 'form-status';
  submitButton.disabled = true;
  submitButton.classList.add('is-saving');

  const fields = new FormData(form);
  const payload = Object.fromEntries(fields.entries());
  for (const field of ['skills', 'hobbies', 'projects', 'certificates']) {
    payload[field] = splitList(payload[field] || '');
  }

  try {
    const response = await fetch('/api/portfolios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Something went wrong. Please try again.');
    localStorage.setItem('latestPortfolioId', result.id);
    status.textContent = 'Lovely — your details have been saved.';
    status.classList.add('success');
    loadSavedProfile();
    form.reset();
    characterCount.textContent = '0 / 2000';
  } catch (error) {
    status.textContent = error.message || 'We couldn’t reach the server. Please try again.';
    status.classList.add('error');
  } finally {
    submitButton.disabled = false;
    submitButton.classList.remove('is-saving');
  }
});
