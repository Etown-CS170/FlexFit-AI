document.addEventListener('DOMContentLoaded', function() {
    const userInput = document.getElementById('userInput');
    const resumePreview = document.getElementById('response');
    const sendButton = document.getElementById('send-button');
    const downloadButton = document.getElementById('download-button');

    let selectedIntensity = 'Default Medium'; // Default intensity
    let conversationHistory = []; // Array to store conversation history

    // Event listeners for intensity buttons
    document.getElementById('low-intensity').addEventListener('click', function() {
        selectedIntensity = 'Low';
        updateIntensityButtons();
    });

    document.getElementById('medium-intensity').addEventListener('click', function() {
        selectedIntensity = 'Medium';
        updateIntensityButtons();
    });

    document.getElementById('high-intensity').addEventListener('click', function() {
        selectedIntensity = 'High';
        updateIntensityButtons();
    });

    function updateIntensityButtons() {
        const buttons = document.querySelectorAll('.intensity-button');
        buttons.forEach(button => {
            button.classList.remove('active'); // Remove active class from all buttons
        });
        document.getElementById(selectedIntensity.toLowerCase() + '-intensity').classList.add('active'); // Add active class to selected button
    }

    async function generateAIResponse(prompt) {
        try {
            console.log('Attempting to connect to LM Studio...');
            console.log('Sending prompt:', prompt);
            
            const requestBody = {
                messages: [
                    {
                        role: 'system',
                        content: 'Please provide specific suggestions for improvement while maintaining a professional tone. do not mention that you are professional tone. You are a workout trainer, based on how intense the user specifies, generate workout plans. use markdown format when generating responses, IF default medium is the intensity, mention that it.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                model: 'llama-3.2-3b-instruct',
                temperature: 0.1,
                max_tokens: 2000,
                stream: false
            };
            
            console.log('Request body:', JSON.stringify(requestBody, null, 2));
            
            const response = await fetch('http://localhost:1234/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response not OK:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Response received:', data);
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Detailed error:', error);
            return `Error communicating with AI service: ${error.message}`;
        }
    }

    // Simple Markdown to HTML converter
    function markdownToHtml(markdown) {// AI made the conversion 
        return markdown
            .replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>') // Bold
            .replace(/(\*|_)(.*?)\1/g, '<em>$2</em>') // Italic
            .replace(/`(.*?)`/g, '<code>$1</code>') // Inline code
            .replace(/~~(.*?)~~/g, '<del>$1</del>') // Strikethrough
            .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
            .replace(/\[.*?\]\(.*?\)/g, '') // Remove links
            .replace(/#{1,6}\s+(.*)/g, (match, p1) => `<h${match.length}>${p1}</h${match.length}>`) // Headers
            .replace(/\n/g, '<br>'); // New lines to <br>
    }

    sendButton.addEventListener('click', async function() {
        sendButton.disabled = true;
        sendButton.textContent = 'Processing...';
        
        resumePreview.innerHTML = 'Generating response...';
        
        // Create the user message and add it to the conversation history
        const userMessage = `Intensity Level: ${selectedIntensity}\nUser Input: ${userInput.value}`;
        conversationHistory.push(userMessage); // Add user message to history

        // Construct the prompt from the conversation history
        const prompt = conversationHistory.join('\n') + '\n\nPlease provide a workout schedule without asking if the workout is good. You are a workout trainer, based on how intense the user specifies, generate workout plans. Use markdown format when generating responses and display the schedule in a grid layout or a nice table. IF default medium is the intensity, mention that it.';

        const aiResponse = await generateAIResponse(prompt);
        
        // Add AI response to conversation history
        conversationHistory.push(aiResponse);
        
        // Convert Markdown to HTML for display
        const formattedResponse = `<h2>Generated Workout Plan</h2>
        <div>${markdownToHtml(aiResponse)}</div>`; // Convert Markdown to HTML using the custom function
        
        resumePreview.innerHTML = formattedResponse; // Use innerHTML to set formatted response
        
        downloadButton.style.display = 'block';
        downloadButton.dataset.response = aiResponse;
        
        sendButton.disabled = false;
        sendButton.textContent = 'Send to AI';
    });

    downloadButton.addEventListener('click', function() {
        const responseText = downloadButton.dataset.response;
        //const cleanedText = responseText; 
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        
        // Set font size for better readability
        doc.setFontSize(12); // Adjust font size as needed
        doc.text(responseText, 10, 10, { maxWidth: 190 }); // Set maxWidth to wrap text
        doc.save('ai_response.pdf'); // Name of the downloaded PDF file
    });
});