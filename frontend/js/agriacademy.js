const coursesContainer = document.getElementById('coursesList');
const courseDetail = document.getElementById('courseDetail');
const toastContainer = document.getElementById('toastContainer');
const token = localStorage.getItem('token');
const headersWithAuth = (extra = {}) => ({ Authorization: token ? `Bearer ${token}` : '', 'Content-Type': 'application/json', ...extra });

const showToast = (message, type = 'info') => {
  if (!toastContainer) return;
  const toast = document.createElement('section');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div class="toast-body"><span class="toast-text"></span></div><button class="close-toast">×</button>`;
  toast.querySelector('.toast-text').textContent = message;
  toast.querySelector('.close-toast').addEventListener('click', () => toast.remove());
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
};

const escape = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

const loadCourses = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/academy/courses`);
    if (!res.ok) throw new Error('Unable to load courses');
    const courses = await res.json();
    renderCourses(courses);
  } catch (error) {
    showToast(error.message, 'error');
  }
};

const renderCourses = (courses) => {
  coursesContainer.innerHTML = courses.map((c) => `<article class="card"><h3>${escape(c.title)}</h3><p>${escape(c.description)}</p><div class="card-actions"><button data-id="${c._id}">View</button></div></article>`).join('');
  coursesContainer.querySelectorAll('button[data-id]').forEach((btn) => btn.addEventListener('click', () => openCourse(btn.dataset.id)));
};

const openCourse = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/academy/courses/${id}`);
    if (!res.ok) throw new Error('Unable to load course');
    const course = await res.json();
    courseDetail.hidden = false;
    courseDetail.innerHTML = `<h2>${escape(course.title)}</h2><p>${escape(course.description)}</p><div id="lessons"></div>`;
    const lessonsDiv = document.getElementById('lessons');
    lessonsDiv.innerHTML = course.lessons.map((lesson) => `<div class="lesson card"><h4>${escape(lesson.title)}</h4><p>${escape(lesson.content.substring(0,200))}${lesson.content.length>200? '...':''}</p><div class="card-actions"><button data-course="${course._id}" data-lesson="${lesson._id}" class="enrollBtn">Enroll & Start</button><button data-course="${course._id}" data-lesson="${lesson._id}" class="openLessonBtn">Open lesson</button></div></div>`).join('');
    lessonsDiv.querySelectorAll('.enrollBtn').forEach((b) => b.addEventListener('click', enrollAndOpen));
    lessonsDiv.querySelectorAll('.openLessonBtn').forEach((b) => b.addEventListener('click', openLesson));
  } catch (error) {
    showToast(error.message, 'error');
  }
};

const enrollAndOpen = async (event) => {
  const courseId = event.currentTarget.dataset.course;
  const lessonId = event.currentTarget.dataset.lesson;
  if (!token) return showToast('Please login to enroll', 'error');
  try {
    const res = await fetch(`${API_BASE_URL}/academy/enroll/${courseId}`, { method: 'POST', headers: headersWithAuth() });
    if (!res.ok) throw new Error('Enroll failed');
    showToast('Enrolled successfully', 'success');
    openLessonByIds(courseId, lessonId);
  } catch (error) { showToast(error.message, 'error'); }
};

const openLesson = (event) => {
  const courseId = event.currentTarget.dataset.course;
  const lessonId = event.currentTarget.dataset.lesson;
  openLessonByIds(courseId, lessonId);
};

const openLessonByIds = async (courseId, lessonId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/academy/courses/${courseId}`);
    if (!res.ok) throw new Error('Unable to load course');
    const course = await res.json();
    const lesson = course.lessons.find((l) => String(l._id) === String(lessonId));
    if (!lesson) return showToast('Lesson not found', 'error');
    courseDetail.innerHTML = `<button id="backToCourse">← Back</button><h2>${escape(lesson.title)}</h2><article>${escape(lesson.content)}</article><div id="quizArea"></div><div style="margin-top:12px;"><button id="completeLessonBtn">Mark lesson complete</button></div>`;
    document.getElementById('backToCourse').addEventListener('click', () => openCourse(courseId));
    document.getElementById('completeLessonBtn').addEventListener('click', async () => {
      if (!token) return showToast('Please login to mark complete', 'error');
      try {
        const r = await fetch(`${API_BASE_URL}/academy/lesson/${courseId}/${lessonId}/complete`, { method: 'POST', headers: headersWithAuth() });
        if (!r.ok) throw new Error('Unable to mark complete');
        showToast('Lesson marked complete', 'success');
      } catch (err) { showToast(err.message, 'error'); }
    });
    // render quiz if present
    const quizArea = document.getElementById('quizArea');
    if (lesson.quiz && lesson.quiz.length) {
      quizArea.innerHTML = '<h3>Quiz</h3>' + lesson.quiz.map((q, idx) => `<div class="quiz-q"><p>${escape(q.question)}</p>${q.options.map((opt,i)=>`<label><input type="radio" name="q${idx}" value="${i}"> ${escape(opt)}</label>`).join('')}</div>`).join('') + '<button id="submitQuizBtn">Submit quiz</button>';
      document.getElementById('submitQuizBtn').addEventListener('click', async () => {
        if (!token) return showToast('Please login to submit quiz', 'error');
        const answers = lesson.quiz.map((_, idx) => {
          const sel = document.querySelector(`input[name="q${idx}"]:checked`);
          return sel ? Number(sel.value) : -1;
        });
        try {
          const r = await fetch(`${API_BASE_URL}/academy/lesson/${courseId}/${lessonId}/quiz`, { method: 'POST', headers: headersWithAuth(), body: JSON.stringify({ answers }) });
          if (!r.ok) throw new Error('Quiz submit failed');
          const res = await r.json();
          showToast(`Quiz score ${res.score}/${res.maxScore}. XP +${res.xpEarned}`, 'success');
        } catch (err) { showToast(err.message, 'error'); }
      });
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
};

loadCourses();
