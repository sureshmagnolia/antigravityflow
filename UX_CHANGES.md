# UX Improvements: Native vs. UiModal

You asked about the changes anticipating with the new `ui-modal.js`. Here is the breakdown:

## 1. Visual Experience
*   **Old (Native)**: Using `alert()`, `promo()`, or `confirm()` generated a generic, unstylable grey popup provided by the browser. It looked like a system error and disconnected from your app's branding.
*   **New (UiModal)**:
    *   **Glassmorphism**: A semi-transparent dark blur overlay focuses attention on the message.
    *   **Animation**: The modal scales in smoothly ("pop" effect) instead of appearing abruptly.
    *   **Branding**: Use of your app's Indigo/Green color scheme, rounded corners, and clean typography (Inter/Sans).

## 2. User Interaction (Non-Blocking)
*   **Old**: Native prompts **freeze the entire browser tab**. You cannot click other tabs, scroll, or interact with the page until you close the prompt.
*   **New**: The modal is just HTML/CSS. The background page is still "alive" (though blocked by an overlay), but the browser itself is not frozen. It feels much more fluid.

## 3. Security & Logic
*   **Tesseat.html**: Previously, the password check ran immediately, often before the page even rendered white, looking like a browser crash. Now, the page loads a clean "Access Required" state first, then politely asks for the password.
