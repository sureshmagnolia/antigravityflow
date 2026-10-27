const UiModal = {

    // --- TEMPLATES ---
    _overlayClass: "fixed inset-0 z-[150] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200 opacity-0",
    _cardClass: "bg-white rounded-2xl shadow-2xl max-w-md w-full transform scale-95 transition-all duration-200 overflow-hidden",
    _headerClass: "px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between",
    _titleClass: "text-lg font-bold text-gray-800",
    _bodyClass: "px-6 py-6 text-gray-600 text-sm leading-relaxed whitespace-pre-line break-words max-h-[70vh] overflow-y-auto",
    _footerClass: "px-6 py-4 bg-gray-50 flex justify-end gap-3",
    _btnBase: "px-4 py-2 rounded-lg text-sm font-bold transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1",

    _close(overlay, resolve, value) {
        const card = overlay.firstElementChild;
        overlay.classList.add('opacity-0');
        if (card) {
            card.classList.remove('scale-100');
            card.classList.add('scale-95');
        }

        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
            }
            resolve(value);
        }, 200);
    },

    // --- PUBLIC METHODS ---

    async alert(titleOrMessage, message) {
        let title = titleOrMessage;
        let body = message;
        if (message === undefined) {
            if (typeof titleOrMessage === 'string' && titleOrMessage.includes('\n\n')) {
                const parts = titleOrMessage.split('\n\n');
                title = parts[0].trim();
                body = parts.slice(1).join('\n\n').trim();
            } else {
                title = 'Notice';
                body = titleOrMessage;
            }
        }

        const isDanger = (typeof title === 'string' && /delete|danger|warning|critical|error|failed/i.test(title)) ||
                         (typeof body === 'string' && /error|failed|warning/i.test(body));
        const iconBg = isDanger ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500';

        const content = `
            <div class="${this._headerClass}">
                <h3 class="${this._titleClass}">${title}</h3>
                <div class="p-2 ${iconBg} rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                </div>
            </div>
            <div class="${this._bodyClass}">${body}</div>
        `;

        await this._create(content, [
            { text: 'OK', classes: "bg-gray-800 text-white hover:bg-gray-900 focus:ring-gray-500", value: true }
        ], true);
    },

    async confirm(titleOrMessage, message) {
        let title = titleOrMessage;
        let body = message;
        if (message === undefined) {
            if (typeof titleOrMessage === 'string' && titleOrMessage.includes('\n\n')) {
                const parts = titleOrMessage.split('\n\n');
                title = parts[0].trim();
                body = parts.slice(1).join('\n\n').trim();
            } else {
                title = 'Confirm Action';
                body = titleOrMessage;
            }
        }

        const isDanger = (typeof title === 'string' && /delete|danger|warning|critical|remove|clear|wipe/i.test(title)) ||
                         (typeof body === 'string' && /delete|danger|warning|critical|permanently|remove|clear|wipe/i.test(body));
        const confirmBtnClass = isDanger ? "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500" : "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500";
        const iconBg = isDanger ? "bg-rose-100 text-rose-500" : "bg-indigo-100 text-indigo-500";

        const content = `
             <div class="${this._headerClass}">
                <h3 class="${this._titleClass}">${title}</h3>
                <div class="p-2 ${iconBg} rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
                </div>
            </div>
            <div class="${this._bodyClass}">${body}</div>
        `;

        return await this._create(content, [
            { text: 'Cancel', classes: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-300", value: false },
            { text: 'Confirm', classes: confirmBtnClass, value: true }
        ], false);
    },

    async prompt(title, message, defaultValue = "", inputType = "text") {
        const isExample = typeof defaultValue === 'string' && defaultValue.toLowerCase().startsWith('e.g.');
        const initialVal = isExample ? '' : (defaultValue !== null && defaultValue !== undefined ? String(defaultValue) : '');
        const placeholderText = defaultValue !== null && defaultValue !== undefined ? String(defaultValue) : '';

        const isDanger = typeof title === 'string' && /delete|danger|warning|critical|lock/i.test(title);
        const iconBg = isDanger ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600';
        const submitBtnClass = isDanger ? 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500' : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500';

        const safeInitial = initialVal.replace(/"/g, '&quot;');
        const safePlaceholder = placeholderText.replace(/"/g, '&quot;');

        const content = `
             <div class="${this._headerClass}">
                <h3 class="${this._titleClass}">${title}</h3>
                <div class="p-2 ${iconBg} rounded-full">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                </div>
            </div>
            <div class="${this._bodyClass}">
                <div class="mb-3">${message}</div>
                <form onsubmit="return false;">
                    ${inputType === 'password' ? '<input type="text" name="username" autocomplete="username" style="display:none;" aria-hidden="true">' : ''}
                    <input type="${inputType}" id="ui-modal-input" class="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-gray-800" value="${safeInitial}" placeholder="${safePlaceholder}" autocomplete="${inputType === 'password' ? 'new-password' : 'off'}">
                </form>
            </div>
        `;

        return await this._create(content, [
            { text: 'Cancel', classes: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-300", value: null },
            {
                text: 'Submit',
                classes: submitBtnClass,
                id: 'ui-modal-ok-btn',
                onClick: () => {
                    const inputEl = document.getElementById('ui-modal-input');
                    return inputEl ? inputEl.value : "";
                },
                value: true
            }
        ]);
    },

    // Override _create to handle dynamic values better
    _create(contentHtml, buttons = [], cancelValue = null) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = this._overlayClass;
            const card = document.createElement('div');
            card.className = this._cardClass;
            card.innerHTML = contentHtml;
            const footer = document.createElement('div');
            footer.className = this._footerClass;

            let isClosed = false;
            const closeWith = (val) => {
                if (isClosed) return;
                isClosed = true;
                window.removeEventListener('keydown', keyListener);
                this._close(overlay, resolve, val);
            };

            const keyListener = (e) => {
                if (e.key === 'Escape') {
                    closeWith(cancelValue);
                }
            };
            window.addEventListener('keydown', keyListener);

            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    closeWith(cancelValue);
                }
            };

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
                    closeWith(finalValue);
                };
                footer.appendChild(b);
            });

            if (buttons.length > 0) card.appendChild(footer);
            overlay.appendChild(card);
            document.body.appendChild(overlay);

            // Handle Input auto-focus, auto-select and Enter key
            const input = card.querySelector('input:not([style*="display:none"])');
            if (input) {
                setTimeout(() => {
                    input.focus();
                    if (input.value) input.select();
                }, 50);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        footer.lastElementChild.click();
                    }
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

