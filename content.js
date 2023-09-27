
console.log('Content script loaded!'); // For debugging

function createPopup(answer) {
  const popup = document.createElement('div');
  popup.textContent = answer;
  popup.style.position = 'fixed';
  popup.style.backgroundColor = '#f4f4e8';
  popup.style.padding = '5px';
  popup.style.border = '1px solid #003300';
  popup.style.borderRadius = '5px';
  popup.style.bottom = '10px';
  popup.style.right = '10px';
  document.body.appendChild(popup);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'createPopup') {
    createPopup(request.answer);
  }
});

