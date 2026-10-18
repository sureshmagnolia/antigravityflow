import sys

with open('invigilation.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace button onclick and text
old_btn = '''<button onclick="clearOldData()"
                                    class="col-span-2 sm:col-span-1 justify-center bg-white border border-red-200 text-red-600 px-4 py-2 rounded shadow-sm hover:bg-red-50 text-xs font-bold flex items-center gap-2 transition sm:ml-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Clear Old Data
                                </button>'''

new_btn = '''<button onclick="openManageHistoricalDataModal()"
                                    class="col-span-2 sm:col-span-1 justify-center bg-white border border-red-200 text-red-600 px-4 py-2 rounded shadow-sm hover:bg-red-50 text-xs font-bold flex items-center gap-2 transition sm:ml-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Manage Historical Data
                                </button>'''

html = html.replace(old_btn, new_btn)

# Insert the new modal before staff-conflict-modal
new_modal = '''
    <!-- 📦 MANAGE HISTORICAL DATA MODAL -->
    <div id="historical-data-modal"
        class="hidden fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-[60] backdrop-blur-sm transition-opacity duration-300 opacity-0 pointer-events-none">
        
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md transform scale-95 transition-transform duration-300 p-6">
            <!-- Header -->
            <div class="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <div class="flex items-center gap-3 text-red-600">
                    <div class="p-2 bg-red-50 rounded-lg">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold">Manage Historical Data</h3>
                </div>
                <button onclick="closeModal('historical-data-modal')" class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>

            <!-- Body -->
            <div class="mb-5">
                <div class="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm mb-4">
                    <strong>⚠️ WARNING:</strong> Deleting an Academic Year is permanent. All duties, attendance slots, and records for that specific year will be erased from the cloud.
                </div>

                <label class="block text-sm font-semibold text-gray-700 mb-1">Select Academic Year to Delete:</label>
                <select id="historical-ay-select" class="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-800 bg-white">
                    <!-- Options populated via JS -->
                </select>
                <p class="text-xs text-gray-500 mt-2">Note: The current Academic Year is protected and cannot be deleted here.</p>
            </div>

            <!-- Footer -->
            <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                <button onclick="closeModal('historical-data-modal')" class="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                    Cancel
                </button>
                <button onclick="confirmDeleteHistoricalData()" class="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Surgically Delete
                </button>
            </div>
        </div>
    </div>
    
    <div id="staff-conflict-modal"'''

html = html.replace('    <div id="staff-conflict-modal"', new_modal)

with open('invigilation.html', 'w', encoding='utf-8') as f:
    f.write(html)
