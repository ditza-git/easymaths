# Easy Maths

An interactive arithmetic learning game built with vanilla HTML, CSS, and JavaScript. Designed for beginner learners to practise addition and subtraction in a fun, gamified environment.

> **SET08101/401/801 Web Technologies — Trimester 2 Coursework**  
> Student ID: 40735791

---

## Live Demo

[https://ditza-git.github.io/easymaths-webapp/](https://ditza-git.github.io/easymaths-webapp/)

---

## How to Play

1. Choose **Addition** or **Subtraction** from the home screen
2. Select **3 numbers** from the number grid to practise with
3. Answer **5 questions** — each with 4 multiple-choice options
4. You start with **3 lives** (❤️❤️❤️) — a wrong answer costs one
5. Complete all 5 questions without losing all your lives to **win!**

---

## Features

| Feature | Description |
|---|---|
| Two game modes | Addition and Subtraction |
| Number selection | Pick 3 numbers from 1–9 to customise difficulty |
| Lives system | 3 hearts — lose one per wrong answer |
| Progress tracker | "Question X of 5" badge during gameplay |
| Sound effects | Web Audio API tones for correct, wrong, win, and lose |
| High score | Stored locally via `localStorage` across sessions |
| Feedback animations | Answer buttons flash green/red, hearts animate on loss |
| Beginner-friendly | Subtraction results are always non-negative |
| Responsive | Works on desktop and mobile |

--- knlk

## Built With

- **HTML5** — Single-page application structure
- **CSS3** — Flexbox, Grid, custom properties, keyframe animations
- **Vanilla JavaScript (ES6+)** — Game logic, DOM manipulation, event handling
- **Web Audio API** — Synthesised sound effects (no audio files required)
- **localStorage** — Persistent high score storage
