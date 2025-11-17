// HOME.JS
if(checkuser){
  alert('⚠️ Anda sudah login. Logout otomatis...');
  localStorage.removeItem('mudengify_user');
  location.assign('index.html');
}