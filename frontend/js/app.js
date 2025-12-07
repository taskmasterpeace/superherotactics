// SHT Asset Generator - Frontend Application

const API_BASE = '/api/v1';

// State
let currentSoundId = null;

// DOM Elements
const elements = {
    apiStatus: document.getElementById('api-status'),
    soundForm: document.getElementById('sound-form'),
    generateBtn: document.getElementById('generate-btn'),
    refreshBtn: document.getElementById('refresh-pending'),
    pendingList: document.getElementById('pending-list'),
    pendingCount: document.getElementById('pending-count'),
    approvalModal: document.getElementById('approval-modal'),
    approvalForm: document.getElementById('approval-form'),
    modalAudio: document.getElementById('modal-audio'),
    modalSoundInfo: document.getElementById('modal-sound-info'),
    rejectBtn: document.getElementById('reject-btn'),
    regenerateBtn: document.getElementById('regenerate-btn'),
    cancelBtn: document.getElementById('cancel-btn')
};

// Tab Navigation
document.querySelectorAll('#main-nav button').forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.disabled) return;

        // Update nav
        document.querySelectorAll('#main-nav button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update panels
        const tabId = btn.dataset.tab;
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(`${tabId}-panel`).classList.add('active');
    });
});

// API Calls
async function checkHealth() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();

        if (data.status === 'healthy') {
            elements.apiStatus.textContent = 'API Connected';
            elements.apiStatus.classList.add('connected');
            elements.apiStatus.classList.remove('disconnected');

            if (!data.config.elevenlabs_configured) {
                elements.apiStatus.textContent += ' (11Labs not configured)';
            }
        }
    } catch (error) {
        elements.apiStatus.textContent = 'API Disconnected';
        elements.apiStatus.classList.add('disconnected');
        elements.apiStatus.classList.remove('connected');
    }
}

async function generateSound(formData) {
    const tags = formData.get('tags')
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

    const payload = {
        prompt: formData.get('prompt'),
        duration: parseFloat(formData.get('duration')),
        category: formData.get('category'),
        tags: tags
    };

    const response = await fetch(`${API_BASE}/sounds/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Generation failed');
    }

    return response.json();
}

async function fetchPendingSounds() {
    const response = await fetch(`${API_BASE}/sounds/pending`);
    if (!response.ok) throw new Error('Failed to fetch pending sounds');
    return response.json();
}

async function approveSound(soundId, options) {
    const response = await fetch(`${API_BASE}/sounds/${soundId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Approval failed');
    }

    return response.json();
}

async function rejectSound(soundId) {
    const response = await fetch(`${API_BASE}/sounds/${soundId}/reject`, {
        method: 'POST'
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Rejection failed');
    }

    return response.json();
}

async function regenerateSound(soundId) {
    const response = await fetch(`${API_BASE}/sounds/${soundId}/regenerate`, {
        method: 'POST'
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Regeneration failed');
    }

    return response.json();
}

// UI Updates
function renderPendingSounds(data) {
    elements.pendingCount.textContent = `(${data.count})`;

    if (data.count === 0) {
        elements.pendingList.innerHTML = `
            <div class="empty-state">
                <p>No sounds pending approval</p>
            </div>
        `;
        return;
    }

    elements.pendingList.innerHTML = data.pending.map(sound => `
        <div class="pending-item" data-id="${sound.id}">
            <div class="pending-item-header">
                <h4>${sound.id}</h4>
                <span class="category">${sound.metadata.category}</span>
            </div>
            <p class="pending-item-prompt">${sound.metadata.prompt}</p>
            <audio controls src="${sound.audio_url}"></audio>
            <div class="pending-item-actions">
                <button class="btn-primary approve-quick-btn">Quick Approve</button>
                <button class="btn-secondary approve-options-btn">Options</button>
                <button class="btn-danger reject-quick-btn">Reject</button>
            </div>
        </div>
    `).join('');

    // Attach event listeners
    document.querySelectorAll('.approve-quick-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const item = e.target.closest('.pending-item');
            const id = item.dataset.id;
            try {
                btn.disabled = true;
                btn.textContent = 'Processing...';
                await approveSound(id, {});
                refreshPending();
            } catch (error) {
                alert(`Error: ${error.message}`);
                btn.disabled = false;
                btn.textContent = 'Quick Approve';
            }
        });
    });

    document.querySelectorAll('.approve-options-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const item = e.target.closest('.pending-item');
            const id = item.dataset.id;
            const sound = data.pending.find(s => s.id === id);
            openApprovalModal(sound);
        });
    });

    document.querySelectorAll('.reject-quick-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const item = e.target.closest('.pending-item');
            const id = item.dataset.id;
            if (confirm('Are you sure you want to reject this sound?')) {
                try {
                    await rejectSound(id);
                    refreshPending();
                } catch (error) {
                    alert(`Error: ${error.message}`);
                }
            }
        });
    });
}

function openApprovalModal(sound) {
    currentSoundId = sound.id;

    elements.modalSoundInfo.innerHTML = `
        <strong>Prompt:</strong> ${sound.metadata.prompt}<br>
        <strong>Category:</strong> ${sound.metadata.category}<br>
        <strong>Duration:</strong> ${sound.metadata.duration}s
    `;

    elements.modalAudio.src = sound.audio_url;

    // Reset form
    document.getElementById('volume-adjust').value = 0;
    document.getElementById('custom-name').value = '';
    document.getElementById('trim-start').value = 0;
    document.getElementById('trim-end').value = 0;
    document.getElementById('fade-in').value = 0;
    document.getElementById('fade-out').value = 0;

    elements.approvalModal.classList.remove('hidden');
}

function closeApprovalModal() {
    elements.approvalModal.classList.add('hidden');
    currentSoundId = null;
    elements.modalAudio.pause();
}

async function refreshPending() {
    try {
        const data = await fetchPendingSounds();
        renderPendingSounds(data);
    } catch (error) {
        console.error('Failed to refresh:', error);
    }
}

// Event Listeners
elements.soundForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const prompt = formData.get('prompt').trim();

    if (!prompt) {
        alert('Please enter a sound description');
        return;
    }

    try {
        elements.generateBtn.disabled = true;
        elements.generateBtn.innerHTML = '<span class="spinner"></span> Generating...';

        const result = await generateSound(formData);

        alert(`Sound generated! ID: ${result.id}\nCheck the pending queue.`);
        e.target.reset();
        refreshPending();

    } catch (error) {
        alert(`Error: ${error.message}`);
    } finally {
        elements.generateBtn.disabled = false;
        elements.generateBtn.textContent = 'Generate Sound';
    }
});

elements.refreshBtn.addEventListener('click', refreshPending);

elements.approvalForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentSoundId) return;

    const options = {
        volume_adjustment: parseFloat(document.getElementById('volume-adjust').value),
        custom_name: document.getElementById('custom-name').value || null,
        trim_start: parseFloat(document.getElementById('trim-start').value),
        trim_end: parseFloat(document.getElementById('trim-end').value),
        fade_in: parseFloat(document.getElementById('fade-in').value),
        fade_out: parseFloat(document.getElementById('fade-out').value)
    };

    try {
        await approveSound(currentSoundId, options);
        closeApprovalModal();
        refreshPending();
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
});

elements.rejectBtn.addEventListener('click', async () => {
    if (!currentSoundId) return;

    if (confirm('Are you sure you want to reject this sound?')) {
        try {
            await rejectSound(currentSoundId);
            closeApprovalModal();
            refreshPending();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }
});

elements.regenerateBtn.addEventListener('click', async () => {
    if (!currentSoundId) return;

    try {
        elements.regenerateBtn.disabled = true;
        elements.regenerateBtn.textContent = 'Regenerating...';

        await regenerateSound(currentSoundId);
        closeApprovalModal();
        refreshPending();
    } catch (error) {
        alert(`Error: ${error.message}`);
    } finally {
        elements.regenerateBtn.disabled = false;
        elements.regenerateBtn.textContent = 'Regenerate';
    }
});

elements.cancelBtn.addEventListener('click', closeApprovalModal);

// Close modal on backdrop click
elements.approvalModal.addEventListener('click', (e) => {
    if (e.target === elements.approvalModal) {
        closeApprovalModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !elements.approvalModal.classList.contains('hidden')) {
        closeApprovalModal();
    }
});

// Initialize
checkHealth();
refreshPending();

// Periodic refresh
setInterval(checkHealth, 30000);
setInterval(refreshPending, 10000);
