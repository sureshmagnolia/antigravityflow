const UiModal = {

    // --- TEMPLATES ---
    _overlayClass: "fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200 opacity-0",
    _cardClass: "bg-white rounded-2xl shadow-2xl max-w-sm w-full transform scale-95 transition-all duration-200 overflow-hidden",
    _headerClass: "px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between",
    _titleClass: "text-lg font-bold text-gray-800",
    _bodyClass: "px-6 py-6 text-gray-600 text-sm leading-relaxed",
    _footerClass: "px-6 py-4 bg-gray-50 flex justify-end gap-3",
    _btnBase: "px-4 py-2 rounded-lg text-sm font-bold transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1",

    // --- CORE CREATE FUNCTION ---
    _create(contentHtml, buttons = []) {
        return new Promise((resolve) => {
            // 1. Create Overlay
            const overlay = document.createElement('div');
            overlay.className = this._overlayClass;

            // 2. Create Modal Card
            const card = document.createElement('div');
            card.className = this._cardClass;
            card.innerHTML = contentHtml;

            // 3. Create Footer & Buttons
            const footer = document.createElement('div');
            footer.className = this._footerClass;

            buttons.forEach(btn => {
                const b = document.createElement('button');
                b.className = `${this._btnBase} ${btn.classes}`;
                b.textContent = btn.text;
                if (btn.id) b.id = btn.id;
                b.onclick = () => {
                    const shouldClose = btn.onClick ? btn.onClick() : true;
                    if (shouldClose !== false) {
                        this._close(overlay, resolve, btn.value);
                    }
                };
                footer.appendChild(b);
            });

            if (buttons.length > 0) card.appendChild(footer);
            overlay.appendChild(card);
            document.body.appendChild(overlay);

            // 4. Animate In
            requestAnimationFrame(() => {
                overlay.classList.remove('opacity-0');
                card.classList.remove('scale-95');
                card.classList.add('scale-100');
            });

            // Focus first input if exists
            const input = card.querySelector('input');
            if (input) input.focus();
        });
    },

    _close(overlay, resolve, value) {
        // Animate Out
        const card = overlay.firstElementChild;
        overlay.classList.add('opacity-0');
        card.classList.remove('scale-100');
        card.classList.add('scale-95');

        setTimeout(() => {
            overlay.remove();
            resolve(value);
        }, 200);
    },

    // --- PUBLIC METHODS ---

    async alert(title, message) {
        const content = `
            <div class="${this._headerClass}">
                <h3 class="${this._titleClass}">${title}</h3>
                <div class="p-2 bg-red-100 rounded-full text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                </div>
            </div>
            <div class="${this._bodyClass}">${message}</div>
        `;

        await this._create(content, [
            { text: 'OK', classes: "bg-gray-800 text-white hover:bg-gray-900 focus:ring-gray-500", value: true }
        ]);
    },

    async confirm(title, message) {
        const content = `
             <div class="${this._headerClass}">
                <h3 class="${this._titleClass}">${title}</h3>
                <div class="p-2 bg-indigo-100 rounded-full text-indigo-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
                </div>
            </div>
            <div class="${this._bodyClass}">${message}</div>
        `;

        return await this._create(content, [
            { text: 'Cancel', classes: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-300", value: false },
            { text: 'Confirm', classes: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500", value: true }
        ]);
    },

    async prompt(title, message, placeholder = "", inputType = "text") {
        const content = `
             <div class="${this._headerClass}">
                <h3 class="${this._titleClass}">${title}</h3>
                <div class="p-2 bg-blue-100 rounded-full text-blue-500">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                </div>
            </div>
            <div class="${this._bodyClass}">
                <p class="mb-2">${message}</p>
                <input type="${inputType}" id="ui-modal-input" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" placeholder="${placeholder}">
            </div>
        `;

        let resolveFunc;

        return await this._create(content, [
            { text: 'Cancel', classes: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-300", value: null },
            {
                text: 'Submit',
                classes: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
                onClick: () => {
                    const val = document.getElementById('ui-modal-input').value;
                    return val; // This value is passed to resolve
                },
                value: true // Placeholder, overridden byonClick return
            }
        ]).then(result => {
            // If result is strict boolean (cancel), return null. If it's the input value, return it.
            // The logic in _create resolves with `btn.value` if onClick is undefined, OR with the return of onClick if defined (Wait, logic in _click was: if onClick returns !== false, call close(..., result)).
            // Let's adjust _create logic slightly or trust the onClick return.
            // Actually, my _create logic says: toggle close if onClick returns something other than false.

            // Update logic:
            // To capture input, I need to extract it in onClick.
            // The simple implementation above might not pass the dynamic value.

            return result;
        });
    },

    // Override _create to handle dynamic values better
    _create(contentHtml, buttons = []) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = this._overlayClass;
            const card = document.createElement('div');
            card.className = this._cardClass;
            card.innerHTML = contentHtml;
            const footer = document.createElement('div');
            footer.className = this._footerClass;

            buttons.forEach(btn => {
                const b = document.createElement('button');
                b.className = `${this._btnBase} ${btn.classes}`;
                b.textContent = btn.text;
                b.onclick = () => {
                    let finalValue = btn.value;
                    if (btn.onClick) {
                        const manualVal = btn.onClick();
                        if (manualVal === false) return; // Don't close
                        if (manualVal !== undefined) finalValue = manualVal;
                    }
                    this._close(overlay, resolve, finalValue);
                };
                footer.appendChild(b);
            });

            if (buttons.length > 0) card.appendChild(footer);
            overlay.appendChild(card);
            document.body.appendChild(overlay);

            // Handle Enter key for prompts
            const input = card.querySelector('input');
            if (input) {
                input.focus();
                input.addEventListener('keyup', (e) => {
                    if (e.key === 'Enter') footer.lastElementChild.click();
                });
            }

            requestAnimationFrame(() => {
                overlay.classList.remove('opacity-0');
                card.classList.remove('scale-95');
                card.classList.add('scale-100');
            });
        });
    },

    // Toast Notification (Non-blocking)
    toast(message, type = 'info') {
        const toast = document.createElement('div');
        const colors = type === 'error' ? 'bg-red-500' : (type === 'success' ? 'bg-green-500' : 'bg-gray-800');
        toast.className = `fixed bottom-4 right-4 ${colors} text-white px-6 py-3 rounded-lg shadow-lg transform translate-y-10 opacity-0 transition-all duration-300 z-[200] font-medium flex items-center gap-2`;
        toast.innerHTML = `<span>${message}</span>`;

        document.body.appendChild(toast);
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-10', 'opacity-0');
        });
        setTimeout(() => {
            toast.classList.add('translate-y-10', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

window.UiModal = UiModal;
