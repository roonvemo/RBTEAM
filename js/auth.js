// assets/js/auth.js
// Auth helper for the Royal Bee SPA
// - Precreates users 07 (admin) and 10 (user) with password "0007"
// - Supports multiple login form id conventions used in the project
// - Exposes protectPage(requiredRole) and logout()

(() => {
  // --- Utilities ---
  const $ = (q) => document.querySelector(q);
  const exists = (q) => !!document.querySelector(q);

  // --- Initialize users (only if not present) ---
  const STORAGE_USERS_KEY = 'rbt_users';
  const STORAGE_CURRENT_KEY = 'rbt_loggedInUser'; // stores full user object

  function getStoredUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || 'null') || [];
    } catch (e) {
      return [];
    }
  }
  function saveStoredUsers(users) {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  }

  // Pre-seeded users you requested:
  const seedUsers = [
    { id: '07', name: 'Admin', role: 'admin', password: '0007', active: true, firstLogin: false },
    { id: '10', name: 'User', role: 'user', password: '0007', active: true, firstLogin: false }
  ];

  // ensure seeded users exist (merge without duplicating)
  let users = getStoredUsers();
  if (!users || users.length === 0) {
    users = seedUsers.slice();
    saveStoredUsers(users);
  } else {
    // ensure seed ids exist and update them to match requested credentials
    seedUsers.forEach(s => {
      const idx = users.findIndex(u => u.id === s.id);
      if (idx === -1) users.push(s);
      else {
        // update password/role/name to ensure requested values (but keep other fields)
        users[idx].password = s.password;
        users[idx].role = s.role;
        users[idx].name = users[idx].name || s.name;
        users[idx].firstLogin = users[idx].firstLogin === undefined ? s.firstLogin : users[idx].firstLogin;
        users[idx].active = users[idx].active === undefined ? s.active : users[idx].active;
      }
    });
    saveStoredUsers(users);
  }

  // --- Helpers ---
  function findUserById(id) {
    if (!id) return null;
    return getStoredUsers().find(u => String(u.id) === String(id));
  }
  function setCurrentUser(userObj) {
    if (!userObj) localStorage.removeItem(STORAGE_CURRENT_KEY);
    else localStorage.setItem(STORAGE_CURRENT_KEY, JSON.stringify(userObj));
  }
  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_CURRENT_KEY) || 'null');
    } catch {
      return null;
    }
  }
  function logout(redirectTo = 'login.html') {
    localStorage.removeItem(STORAGE_CURRENT_KEY);
    if (redirectTo) window.location.href = redirectTo;
  }

  // Expose logout globally
  window.authLogout = logout;

  // protectPage: call on page load in other pages to enforce authentication/authorization
  // usage: protectPage(); or protectPage('admin');
  function protectPage(requiredRole) {
    const current = getCurrentUser();
    if (!current) {
      // not logged in -> go to login page
      const loginPage = 'login.html';
      window.location.replace(loginPage);
      return false;
    }
    if (requiredRole && current.role !== requiredRole) {
      // not authorized
      window.location.replace('homepage.html');
      return false;
    }
    return true;
  }
  window.protectPage = protectPage;

  // --- Login handlers supporting multiple HTML variants ---

  // Variant A (used in many of the earlier examples):
  // form id="loginForm"
  // inputs: id="userId" (identifier) , id="userName" , id="password" , id="confirmPassword"
  // returning variant uses id="loginPassword"
  function attachVariantA() {
    const form = $('#loginForm');
    if (!form) return false;

    const inputId = $('#userId');
    const inputName = $('#userName');
    const inputPass = $('#password');
    const inputConfirm = $('#confirmPassword');
    const returningPass = $('#loginPassword'); // optional
    const msg = document.createElement('div');
    msg.style.color = 'red';
    msg.style.marginTop = '8px';
    form.appendChild(msg);

    function showMsg(t) { msg.textContent = t || ''; }

    // toggle based on typed id
    if (inputId) {
      inputId.addEventListener('input', () => {
        const u = findUserById(inputId.value.trim());
        if (u && u.password) {
          // existing user -> hide first-time fields, show returning
          if (inputName) inputName.closest('label')?.classList?.add?.('hidden');
          if (inputName) inputName.style.display = 'none';
          if (inputPass) inputPass.placeholder = 'كلمة المرور';
          if (inputConfirm) inputConfirm.style.display = 'none';
          if (returningPass) returningPass.style.display = 'block';
        } else {
          // new user -> show name + confirm fields
          if (inputName) inputName.style.display = 'block';
          if (inputConfirm) inputConfirm.style.display = 'block';
          if (returningPass) returningPass.style.display = 'none';
        }
      });
    }

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      showMsg('');
      const id = inputId?.value?.trim();
      if (!id) { showMsg('ادخل الرقم التعريفي'); return; }
      const existing = findUserById(id);

      if (existing) {
        // existing user -> check password
        const passVal = (returningPass && returningPass.value) ? returningPass.value : (inputPass && inputPass.value) ? inputPass.value : '';
        if (!passVal) { showMsg('ادخل كلمة المرور'); return; }
        if (String(existing.password) === String(passVal)) {
          setCurrentUser(existing);
          // redirect based on role
          if (existing.role === 'admin') window.location.href = 'admin-dashboard.html';
          else window.location.href = 'homepage.html';
        } else {
          showMsg('كلمة المرور غير صحيحة');
        }
      } else {
        // new user -> must provide name, password, confirm
        const nameVal = inputName?.value?.trim();
        const passVal = inputPass?.value?.trim();
        const confVal = inputConfirm?.value?.trim();
        if (!nameVal || !passVal || !confVal) { showMsg('املأ كل الحقول للتسجيل'); return; }
        if (passVal !== confVal) { showMsg('تأكيد كلمة المرور غير متطابق'); return; }
        const newUser = { id, name: nameVal, role: id === '07' ? 'admin' : 'user', password: passVal, active: true, firstLogin: false };
        const all = getStoredUsers();
        all.push(newUser);
        saveStoredUsers(all);
        setCurrentUser(newUser);
        // redirect
        if (newUser.role === 'admin') window.location.href = 'admin-dashboard.html';
        else window.location.href = 'homepage.html';
      }
    });

    return true;
  }

  // Variant B (simpler login blocks used later):
  // first-login form ids: firstId / firstPass / firstPassConfirm / firstLoginBtn
  // normal login form ids: loginId / loginPass / loginBtn
  function attachVariantB() {
    // first-time form
    const firstId = $('#firstId');
    const firstPass = $('#firstPass');
    const firstPassConfirm = $('#firstPassConfirm');
    const firstLoginBtn = $('#firstLoginBtn');
    const loginId = $('#loginId');
    const loginPass = $('#loginPass');
    const loginBtn = $('#loginBtn');
    const errorMsg = $('#errorMsg');
    const errorLoginMsg = $('#errorLoginMsg');

    function setErr(el, t) { if (el) el.textContent = t || ''; }

    if (firstLoginBtn) {
      firstLoginBtn.addEventListener('click', () => {
        const id = firstId?.value?.trim();
        const pass = firstPass?.value?.trim();
        const passC = firstPassConfirm?.value?.trim();
        if (!id || !pass || !passC) { setErr(errorMsg, 'جميع الحقول مطلوبة'); return; }
        if (pass !== passC) { setErr(errorMsg, 'كلمتا المرور غير متطابقتين'); return; }
        if (findUserById(id)) { setErr(errorMsg, 'الرقم موجود مسبقاً'); return; }
        const newUser = { id, name: '', role: (id === '07' ? 'admin' : 'user'), password: pass, active: true, firstLogin: false };
        const all = getStoredUsers();
        all.push(newUser);
        saveStoredUsers(all);
        setCurrentUser(newUser);
        // redirect
        if (newUser.role === 'admin') window.location.href = 'admin-dashboard.html';
        else window.location.href = 'homepage.html';
      });
    }

    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        const id = loginId?.value?.trim();
        const pass = loginPass?.value?.trim();
        if (!id || !pass) { setErr(errorLoginMsg, 'أدخل الرقم وكلمة المرور'); return; }
        const u = findUserById(id);
        if (!u) { setErr(errorLoginMsg, 'المستخدم غير موجود'); return; }
        if (String(u.password) !== String(pass)) { setErr(errorLoginMsg, 'كلمة المرور خاطئة'); return; }
        setCurrentUser(u);
        if (u.role === 'admin') window.location.href = 'admin-dashboard.html';
        else window.location.href = 'homepage.html';
      });
    }

    return !!(firstLoginBtn || loginBtn);
  }

  // Attach to any supported variant present on the page
  const attachedA = attachVariantA();
  const attachedB = attachVariantB();

  // If no login forms found, do nothing (auth.js still exposes protectPage & logout)
  // but ensure seed users are present
  saveStoredUsers(getStoredUsers()); // persist any merges that occurred above

  // Expose some helpful functions on window for page scripts
  window.auth = {
    findUserById,
    getUsers: () => getStoredUsers(),
    saveUsers: (u) => saveStoredUsers(u),
    getCurrentUser,
    setCurrentUser,
    logout,
    protectPage
  };
})();
