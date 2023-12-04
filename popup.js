document.addEventListener("DOMContentLoaded", function () {
  const apiKey = ''; 
   const questionsAndAnswersContainer = document.getElementById("questionsAndAnswersContainer"); 
    let questions; 
  
    function clearQuestionsAndAnswers() {
        questionsAndAnswersContainer.innerHTML = ""; 
    }
  
    function scanPageForQuestions() {
        console.log("Scanning page for questions...");
        const keywords = ["who", "what", "where", "when", "why", "how", "Which", "which"];
        
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const activeTab = tabs[0];
            chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                function: (keywords) => {
                    const textContent = document.body.textContent;
                    const sentences = textContent.match(/[^.!?]*[.!?]/g) || [];
                    
                    return sentences.filter(sentence => {
                        const trimmedSentence = sentence.trim(); 
                        return keywords.some(keyword => 
                            new RegExp(`\\b${keyword}\\b`, "i").test(trimmedSentence)) && 
                            /[A-Z]/.test(trimmedSentence[0]); 
                    });
                },
                args: [keywords]
                }, (results) => {
                    questions = results[0]?.result || [];
                    clearQuestionsAndAnswers();
                    if (questions.length === 0) {
                        questionsAndAnswersContainer.textContent = "No questions found.";
                        return;
                    }
  
                    for (let i = 0; i < questions.length; i++) {
                        const question = questions[i];
                        const questionElement = document.createElement("div");
                        questionElement.classList.add("question");
  
                        const questionText = document.createElement("p");
                        questionText.classList.add("question-text");
                        questionText.innerHTML = `<strong>Question:</strong> ${question}`;
                        questionElement.appendChild(questionText);
  
                        const url = 'https://api.openai.com/v1/engines/davinci/completions'; 
                        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };
                        const data = { prompt: `Answer simply and directly: ${question}`, max_tokens: 60, temperature: 0.1, top_p: 1.0 };
  
                        fetch(url, { method: 'POST', headers, body: JSON.stringify(data) })
                            .then(res => res.json())
                            .then(response => {
                                let answer = response.choices[0]?.text.trim() || "No answer available."; 
                                answer = answer.replace(question, ""); // Remove echo of the question
                                answer = answer.split('.')[0] + '.'; // Keep only the first sentence or clause
                                if (answer.length === 0 || answer === '.') {
                                    answer = "Answer not clear or unavailable.";
                                }
  
                                const answerText = document.createElement("p");
                                answerText.innerHTML = `<strong>Answer:</strong> ${answer}`;
                                answerText.addEventListener('click', function (e) { 
                                    navigator.clipboard.writeText(answer).then(function () {
                                        const copiedPopup = document.getElementById('copiedPopup'); 
                                        copiedPopup.style.left = `${e.pageX - copiedPopup.offsetWidth / 2}px`; 
                                        copiedPopup.style.top = `${e.pageY - copiedPopup.offsetHeight - 10}px`; 
                                        copiedPopup.style.display = 'block'; 
                                        copiedPopup.classList.add('active');
                                        
                                        setTimeout(function () {
                                            copiedPopup.classList.remove('active');
                                            copiedPopup.style.display = 'none'; 
                                        }, 1000);
                                    });
                                });
                                
                                questionElement.appendChild(answerText);
                            })
                            .catch(error => {
                                console.error(`Error: API request for question ${i + 1} failed.`, error); 
                                const errorMessage = error.response ? "Error fetching answer." : "Network error."; 
                                questionElement.innerHTML += `<p><strong>Answer:</strong> ${errorMessage}</p>`; 
                            });
                        questionsAndAnswersContainer.appendChild(questionElement);
                    }
                });
            });
        }
    scanPageForQuestions();
});

