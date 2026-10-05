const STORAGE_KEY = 'quest-board.quests.v1';

const addQuestBtn = document.getElementById('add-quest-btn');
const cancelBtn = document.getElementById('cancel-btn');
const emptyState = document.getElementById('empty-state');
const formTitle = document.getElementById('form-title');
const questCountDisplay = document.getElementById('quest-count');
const questDeadlineInput = document.getElementById('quest-deadline');
const questDescriptionInput = document.getElementById('quest-description');
const questForm = document.getElementById('quest-form');
const questFormSection = document.getElementById('quest-form-section');
const questList = document.getElementById('quest-list');
const questRewardInput = document.getElementById('quest-reward');
const questTitleInput = document.getElementById('quest-title');
const submitQuestBtn = document.getElementById('submit-quest-btn');
const xpTotalDisplay = document.getElementById('xp-total');

let quests = loadQuests();
let editingQuestId = null;

function loadQuests() {
    try {
        const savedQuests = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

        if (!Array.isArray(savedQuests)) return [];

        return savedQuests
            .filter((quest) => quest && typeof quest.title === 'string' && Number.isFinite(Number(quest.reward)))
            .map((quest) => ({
                id: String(quest.id ?? Date.now()),
                title: quest.title,
                description: String(quest.description ?? ''),
                reward: Number(quest.reward),
                deadline: String(quest.deadline ?? ''),
                completed: Boolean(quest.completed)
            }));
    } catch {
        return [];
    }
}

function saveQuests() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quests));
    } catch (error) {
        console.error('Could not save quests to localStorage.', error);
    }
}

function formatDeadline(value) {
    if (!value) return 'Tanpa tenggat';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Tanggal tidak valid';

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function updateSummary() {
    const earnedXP = quests.reduce((total, quest) => {
        return total + (quest.completed ? quest.reward : 0);
    }, 0);
    const openQuests = quests.filter((quest) => !quest.completed).length;

    xpTotalDisplay.textContent = String(earnedXP);
    questCountDisplay.textContent = String(openQuests);
}

function closeForm() {
    editingQuestId = null;
    questForm.reset();
    formTitle.textContent = 'Quest baru';
    submitQuestBtn.textContent = 'Tambah quest';
    questFormSection.hidden = true;
}

function openForm(quest = null) {
    editingQuestId = quest ? quest.id : null;
    questForm.reset();

    if (quest) {
        questTitleInput.value = quest.title;
        questDescriptionInput.value = quest.description;
        questRewardInput.value = quest.reward;
        questDeadlineInput.value = quest.deadline;
        formTitle.textContent = 'Edit quest';
        submitQuestBtn.textContent = 'Simpan perubahan';
    } else {
        formTitle.textContent = 'Quest baru';
        submitQuestBtn.textContent = 'Tambah quest';
    }

    questFormSection.hidden = false;
    questTitleInput.focus();
}

function createActionButton(label, className) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    return button;
}

function renderQuests() {
    questList.replaceChildren();
    emptyState.hidden = quests.length > 0;
    updateSummary();

    quests.forEach((quest) => {
        const item = document.createElement('li');
        item.className = quest.completed ? 'quest-item is-complete' : 'quest-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'quest-checkbox';
        checkbox.checked = quest.completed;
        checkbox.setAttribute('aria-label', `Tandai ${quest.title} selesai`);
        checkbox.addEventListener('change', () => {
            quest.completed = checkbox.checked;
            saveQuests();
            renderQuests();
        });

        const content = document.createElement('div');
        content.className = 'quest-content';

        const title = document.createElement('h3');
        title.className = 'quest-title';
        title.textContent = quest.title;

        const description = document.createElement('p');
        description.className = 'quest-description';
        description.textContent = quest.description;

        const metadata = document.createElement('div');
        metadata.className = 'quest-metadata';

        const reward = document.createElement('span');
        reward.className = 'quest-reward';
        reward.textContent = `${quest.reward} XP`;

        const deadline = document.createElement('span');
        deadline.className = 'quest-deadline';
        deadline.textContent = formatDeadline(quest.deadline);

        metadata.append(reward, deadline);
        content.append(title, description, metadata);

        const actions = document.createElement('details');
        actions.className = 'quest-actions';

        const menuToggle = document.createElement('summary');
        menuToggle.textContent = '...';
        menuToggle.setAttribute('aria-label', `Aksi untuk quest ${quest.title}`);

        const menu = document.createElement('div');
        menu.className = 'quest-menu';

        const editButton = createActionButton('Edit', 'menu-action');
        editButton.addEventListener('click', () => {
            actions.open = false;
            openForm(quest);
        });

        const deleteButton = createActionButton('Hapus', 'menu-action is-destructive');
        deleteButton.addEventListener('click', () => {
            quests = quests.filter((item) => item.id !== quest.id);
            if (editingQuestId === quest.id) closeForm();
            saveQuests();
            renderQuests();
        });

        menu.append(editButton, deleteButton);
        actions.append(menuToggle, menu);
        item.append(checkbox, content, actions);
        questList.appendChild(item);
    });
}

addQuestBtn.addEventListener('click', () => openForm());
cancelBtn.addEventListener('click', closeForm);

questForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const title = questTitleInput.value.trim();
    const description = questDescriptionInput.value.trim();
    const reward = Number(questRewardInput.value);

    if (!title || !description || !Number.isInteger(reward) || reward < 1) return;

    const questData = {
        title,
        description,
        reward,
        deadline: questDeadlineInput.value
    };

    if (editingQuestId) {
        quests = quests.map((quest) => quest.id === editingQuestId
            ? { ...quest, ...questData }
            : quest);
    } else {
        const id = globalThis.crypto?.randomUUID
            ? globalThis.crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`;

        quests.unshift({ id, ...questData, completed: false });
    }

    saveQuests();
    renderQuests();
    closeForm();
});

renderQuests();

