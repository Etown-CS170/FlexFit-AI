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
                        content: 'DO NOT USE MARKDOWN FORMAT. If the prompt has nothing to do with a workout, muscles, or physical activity, mention that to the user and do not make a schedule or workout suggestions. Please provide a workout schedule in HTML format in a grid or table(e.g., using <h2>, <div>, <p>, etc.) without asking if the workout is good. When giving workouts with weights or bands, add the pounds, Have a decription column, sets and reps, and workout name atleast when creating the tables, do not put data that should be in one box or column that belongs in another. Make sure to center the tables. You are a workout trainer, based on how intense the user specifies, generate workout plans. If default medium is the intensity, mention that it. If High intensity, make the workout very very very VERY intense with many different workouts. Use <h2> for main headings. Use <b> to bold not *. DO NOT USE * in the response. Use <h4> for smaller headings like days or days of the week.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                model: 'meta-llama-3.1-8b-instruct',
                temperature: 0.1,
                max_tokens: 10000,
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

    sendButton.addEventListener('click', async function() {
        sendButton.disabled = true;
        sendButton.textContent = 'Processing...';
        
        resumePreview.innerHTML = 'Generating response...';
        
        // Create the user message and add it to the conversation history
        const userMessage = `Intensity Level: ${selectedIntensity}\nUser Input: ${userInput.value}`;
        conversationHistory.push(userMessage); // Add user message to history
        // Construct the prompt from the conversation history
        const prompt = conversationHistory.join('\n') + '\n\n DO NOT USE MARKDOWN FORMAT. If the prompt has nothing to do with a workout, muscles, or physical activity, mention that to the user and do not make a schedule or workout suggestions. Please provide a workout schedule in HTML format in a grid or table(e.g., using <h2>, <div>, <p>, etc.) without asking if the workout is good. When giving workouts with weights or bands, add the pounds, Have a decription column, sets and reps, and workout name atleast when creating the tables, do not put data that should be in one box or column that belongs in another. Make sure to center the tables. You are a workout trainer, based on how intense the user specifies, generate workout plans. If default medium is the intensity, mention that it. If High intensity, make the workout very very very VERY intense with many different workouts. Use <h2> for main headings. Use <b> to bold not *. DO NOT USE * in the response. Use <h4> for smaller headings like days or days of the week.';

        const aiResponse = await generateAIResponse(prompt);
        
        // Add AI response to conversation history
        conversationHistory.push(aiResponse);
        
        // Directly set the AI response as HTML
        resumePreview.innerHTML = aiResponse;
        
        // Ensure the download button has the correct response
        downloadButton.style.display = 'block';
        downloadButton.dataset.response = aiResponse; // Store the response for PDF download
        
        sendButton.disabled = false;
        sendButton.textContent = 'Send to AI';
    });

    downloadButton.addEventListener('click', function() {
        const responseText = downloadButton.dataset.response; // Get the response from the dataset
        if (!responseText) {
            console.error('No response text available for download.'); // Check if responseText is empty
            return; // Exit if there's no response
        }
        
        const { jsPDF } = window.jspdf; // Ensure jsPDF is available
        if (!jsPDF) {
            console.error('jsPDF is not loaded.'); // Check if jsPDF is loaded
            return; // Exit if jsPDF is not available
        }
        
        const doc = new jsPDF();

        // Set font size for better readability
        doc.setFontSize(12); // Adjust font size as needed

        // Use the HTML content directly for PDF generation
        const htmlContent = responseText;

        // Convert HTML to PDF
        doc.html(htmlContent, {
            callback: function (doc) {
                doc.save('ai_response.pdf'); // Name of the downloaded PDF file
            },
            x: 10,
            y: 10,
            width: 190, // Adjust width as needed
            windowWidth: 650 // Adjust window width for better rendering
        });
    });
});