chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "answerQuestion",
    title: "Answer this Question",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "answerQuestion") {
    const question = info.selectionText;
    try {
      const answer = await getAnswerFromChatGPT(question);
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, { action: "createPopup", answer: answer });
      }, 1000);
    } catch (error) {
      console.error('Error getting answer:', error);
    }
  }
});

async function getAnswerFromChatGPT(question) {
  const apiKey = ''; //replace with your API Key
  const url = 'https://api.openai.com/v1/engines/davinci/completions';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };
  const data = {
    prompt: `Answer the question concisely: ${question}`,
    max_tokens: 30,
    temperature: 0.5,
    top_p: 1.0
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return result.choices[0]?.text.trim() || "No answer available.";
  } catch (error) {
    console.error('Error getting answer:', error);
    return "Error fetching answer.";
  }
}
