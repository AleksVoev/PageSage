document.addEventListener("DOMContentLoaded", function () {
  const apiKey = ''; 
  const questionsAndAnswersContainer = document.getElementById("questionsAndAnswersContainer"); 
  let questions; 

  function clearQuestionsAndAnswers() {
      questionsAndAnswersContainer.innerHTML = ""; // Removing questions and answers 
  }

  function scanPageForQuestions() {
      console.log("Scanning page for questions...");
      const keywords = ["who", "what", "where", "when", "why", "how"]; // Keywords for scanning webpage, add as needed.
      
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) { // Getting the current active tab
      const activeTab = tabs[0];
      chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          function: (keywords) => {
              const textContent = document.body.textContent;
              const sentences = textContent.match(/[^.!?]*[.!?]/g) || []; // Matching the characters that represent sentences for all instances in string, or defaults to empty array
              
              return sentences.filter(sentence => {
                  const trimmedSentence = sentence.trim(); // Remove trailing white spaces
                  return keywords.some(keyword =>  //
                      new RegExp(`\\b${keyword}\\b`, "i").test(trimmedSentence)) && // Check for present keywords in sentence
                      /[A-Z]/.test(trimmedSentence[0]); // Using capital letters to ensure beginning of sentence
              });
          },
          args: [keywords] // Send keywords array to function
          }, (results) => { // Callback after execution
              questions = results[0]?.result || []; // Assigns results to questions variable, if undefined, returns empty array
              clearQuestionsAndAnswers();
              if (questions.length === 0) { // Checks array to see if empty, if it is, returns the next line
                  questionsAndAnswersContainer.textContent = "No questions found.";
                  return;
              }

              // Loop through all questions without slicing
              for (let i = 0; i < questions.length; i++) {
                  const question = questions[i];
                  const questionElement = document.createElement("div");
                  questionElement.classList.add("question");

                  const questionText = document.createElement("p");
                  questionText.classList.add("question-text");
                  questionText.innerHTML = `<strong>Question:</strong> ${question}`;
                  questionElement.appendChild(questionText);

                  const url = 'https://api.openai.com/v1/engines/davinci/completions'; // Initializing API model, change as needed 
                  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }; // Makes connection using API key
                  const data = { prompt: `You cannot by any means reply to the following question with the word "Answer". In addition to this, you must answer in the most concise and brief answer, but full. Remember, CONCISE with as few words as possible. If there is input that does not seem to be a question, simply reply with "No Question Detected": ${question}`, max_tokens: 20, temperature: 0.1, top_p: 1.0 }; // Change prompts, temperature, tokens, etc as needed.

                  fetch(url, { method: 'POST', headers, body: JSON.stringify(data) }) // Sending POST request to the URL, converting the headers and body into JSON string
                      .then(res => res.json()) // Converts response body into JSON object
                      .then(response => {
                          let answer = response.choices[0].text.trim() || "No answer available."; // Get text from answer andremove trailing white spaces
                          answer = answer.replace(new RegExp(`^${question}`, "i"), "").trim(); // Remove question if included in the beginning of answer
                          answer = answer.replace(/^Answer:\s*/i, "").trim(); // Remove "Answer:" from the answer. (Issue with ChatGPT, even if asked not to include the word "Answer" in the answer it sometimes still does)
                          answer = answer.replace(/\?/g, "").trim(); // Remove question marks from answer (Another issue where question marks would appear right after the answer)
                          if (answer.length === 0) answer = "No answer available."; // If everything else was removed, then this returns no answer availiable

                          const answerText = document.createElement("p"); // Displaying answers
                          answerText.innerHTML = `<strong>Answer:</strong> ${answer}`;
                          
                          answerText.addEventListener('click', function (e) { // Event listener
                              navigator.clipboard.writeText(answer).then(function () {
                                  const copiedPopup = document.getElementById('copiedPopup'); // Copy popup when clicked on
                                  copiedPopup.style.left = `${e.pageX - copiedPopup.offsetWidth / 2}px`; // Placement of answer copied popup
                                  copiedPopup.style.top = `${e.pageY - copiedPopup.offsetHeight - 10}px`; // Placement of answer copied popup
                                  copiedPopup.style.display = 'block'; // Styling
                                  copiedPopup.classList.add('active');
                                  
                                  setTimeout(function () {
                                      copiedPopup.classList.remove('active');
                                      copiedPopup.style.display = 'none'; // Add timeout for popup
                                  }, 1000);
                              });
                          });
                          
                          questionElement.appendChild(answerText);
                      })
                      .catch(error => {
                          console.error(`Error: API request for question ${i + 1} failed.`, error); // Catch errors
                          const errorMessage = error.response ? "Error fetching answer." : "Network error."; // Catch errors (Likely occurs if network is missing, can't connect to API, OR if API key is missing)
                          questionElement.innerHTML += `<p><strong>Answer:</strong> ${errorMessage}</p>`; // Display in answer section
                      });
                  questionsAndAnswersContainer.appendChild(questionElement);
              }
          });
      });
  }
  scanPageForQuestions();
});
