// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let auth, db;

async function loadFirebaseConfig() {
  const response = await fetch('no.env');
  if (!response.ok) throw new Error('Unable to load no.env');
  const text = await response.text();
  const kv = Object.fromEntries(
    text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => line.split('='))
      .map(([key, ...rest]) => [key, rest.join('=').trim()])
  );


}

async function initFirebase() {
  const config = await loadFirebaseConfig();
  const app = initializeApp(config);
  getAnalytics(app);
  auth = getAuth(app);
  db = getFirestore(app);
}

initFirebase().catch(err => {
  console.error('Firebase initialization failed:', err);
  alert('Could not start app; check no.env and network.');
});

const loginForm = document.getElementById('loginForm');
const Dashboard = document.getElementById('Dashboard');
const login = document.getElementById('login');
const submitBtn = document.getElementById('submitBtn');
const loginError = document.getElementById('loginError');

Dashboard.style.display = 'none';

loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (!auth || !db) {
        alert('App is still initializing. Please wait a moment and try again.');
        return;
    }

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }

    // Clear previous error
    loginError.style.display = 'none';
    loginError.textContent = '';

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            console.log('User signed in:', user);
            login.style.display = 'none';
            Dashboard.style.display = 'block';
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error('Login error:', errorCode, errorMessage);
            loginError.textContent = 'Credentials invalid';
            loginError.style.display = 'block';
        });
});

submitBtn.addEventListener('click', async function(e) {
    e.preventDefault();
    if (!auth || !db) {
        alert('App is still initializing. Please wait a moment and try again.');
        return;
    }

    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const subjects = Array.from(document.querySelectorAll('input[name="subjects"]:checked')).map(cb => cb.value);

    if (!name || !phone || subjects.length === 0) {
        alert('Please fill in all fields and select at least one subject');
        return;
    }

    try {
        console.log('Attempting to save data for user:', auth.currentUser?.uid);
        await addDoc(collection(db, "teachers"), {
            name,
            phone,
            subjects,
            userId: auth.currentUser.uid,
            timestamp: new Date()
        });
        alert(`Submitted successfully!\nName: ${name}\nPhone: ${phone}\nSubjects: ${subjects.join(', ')}`);
        console.log('Teacher Info saved:', { name, phone, subjects });
    } catch (error) {
        console.error('Error saving data:', error);
        alert(`Failed to save data: ${error.message}`);
    }
});
