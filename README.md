📜 Overview

This project is a frontend-only application designed to interact with your Node.js + Express REST API for book management.
It uses only HTML, CSS, and vanilla JavaScript, meaning no frameworks or libraries are required.

The webpage is fully responsive (mobile, tablet, desktop), visually attractive, and packed with animations to give users a modern, interactive experience while performing CRUD operations (Create, Read, Update, Delete) on books.

⸻

🎯 Purpose
	•	To demonstrate how a clean, interactive UI can be built using only core web technologies.
	•	To practice connecting frontend JavaScript with backend REST API endpoints.
	•	To explore responsive design and animations without relying on frameworks.

⸻

⚡ Features

1. Responsive Layout
	•	Mobile-first design that adapts to any screen size using CSS Flexbox and Grid.
	•	Auto-adjusting card layout:
	•	1 column for mobile
	•	2–3 columns for tablets and desktops

⸻

2. Animated Book Cards
	•	Each book is displayed in a stylish card format with:
	•	Shadow effects for depth
	•	Hover scaling animation using CSS transform and transition
	•	Smooth fade-in when loaded from the API

⸻

3. Book Form with Smooth Transitions
	•	The “Add New Book” form slides down when the Add Book button is clicked.
	•	Input fields have:
	•	Focus animations (border glow)
	•	Button hover animations with color transitions

⸻

4. Interactive CRUD Actions
	•	GET → Loads all books from the backend API when the page loads.
	•	POST → Adds a new book when the form is submitted.
	•	PUT → Updates a selected book when the edit option is used.
	•	DELETE → Removes a book with a fade-out animation before disappearing.

⸻

5. CSS Animations
	•	Hover effects on buttons and cards
	•	Keyframe animations for entry transitions
	•	Smooth color transitions for interactive elements

⸻

🔗 How it Works
	1.	Page Load
	•	JavaScript sends a GET /books request to the backend.
	•	All books are rendered as animated cards.
	2.	Add Book
	•	User fills in the form → JavaScript sends a POST /books request.
	•	On success, a new animated card appears instantly.
	3.	Update Book
	•	Clicking “Edit” pre-fills the form → JavaScript sends a PUT /books/:id request.
	•	Card updates with an animation.
	4.	Delete Book
	•	Clicking “Delete” triggers a fade-out animation → JavaScript sends a DELETE /books/:id request.
	•	Card is removed from the DOM.

⸻

🛠 Technologies Used
	•	HTML5 → Structure of the webpage
	•	CSS3 → Styling, responsiveness, and animations
	•	Vanilla JavaScript → DOM manipulation, event handling, and API calls
	•	Fetch API → Communication with the backend REST API
