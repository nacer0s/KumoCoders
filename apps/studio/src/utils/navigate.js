export function navigateTo(path) {
  window.history.pushState(null, '', '/studio' + path);
  window.dispatchEvent(new Event('popstate'));
}
