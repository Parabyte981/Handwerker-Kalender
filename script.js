// 1. Global state object
const state = {
    currentDate: new Date(),
    view: 'month', // 'day', 'week', 'month'
    appointments: [],
    selectedAppointmentId: null,
    isModalOpen: false,
    isEditMode: false, // true when creating new or editing existing
};

const APPOINTMENTS_STORAGE_KEY = 'handwerker-appointments';

// --- DOM Element References (Global for Modal for convenience) ---
let modalOverlay, modalContent, modalAppointmentIdInput, appointmentForm;
let modalTitleInput, modalDateInput, modalTimeInput; // Add other form fields as needed
let modalBtnClose, modalBtnEdit, modalBtnSave, modalBtnDelete, modalBtnCancel, modalBtnAddMaterial;
let modalTitleDisplay;


// Load appointments from localStorage
function loadAppointmentsFromStorage() {
    const storedAppointments = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (storedAppointments) {
        try {
            const parsedAppointments = JSON.parse(storedAppointments);
            state.appointments = parsedAppointments.map(apt => ({
                ...apt,
                date: new Date(apt.date),
            }));
        } catch (error) {
            console.error("Error parsing appointments from localStorage:", error);
            initializeSampleData();
        }
    } else {
        initializeSampleData();
    }
    console.log("Appointments loaded:", state.appointments);
}

function initializeSampleData() {
    state.appointments = [
        {
            id: "1", title: 'Badezimmer Fliesen erneuern',
            date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 2, 10, 0),
            duration: 120, category: 'sanitaer', status: 'geplant',
            contact: { name: 'Max Mustermann', phone: '0123456789', email: 'max@example.com' },
            materials: [{ name: 'Fliesenkleber', quantity: '5 Sack' }, { name: 'Fugenmasse', quantity: '2 Eimer' }]
        },
        {
            id: "2", title: 'Heizungswartung Musterwohnung',
            date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 3, 14, 30),
            duration: 90, category: 'heizung', status: 'geplant',
            contact: { name: 'Erika Musterfrau', phone: '0987654321', email: 'erika@example.com' },
            materials: [{ name: 'Dichtungen', quantity: '1 Set' }]
        },
        {
            id: "3", title: 'Test Termin Heute',
            date: new Date(new Date().setHours(12,0,0,0)),
            duration: 60, category: 'elektrik', status: 'geplant',
            contact: { name: 'Test Person', phone: '111', email: 'test@example.com' },
            materials: []
          }
    ];
    console.log("Initialized with sample data.");
    saveAppointmentsToStorage();
}

function saveAppointmentsToStorage() {
    try {
        localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(state.appointments));
        console.log("Appointments saved to localStorage.");
    } catch (error) {
        console.error("Error saving appointments to localStorage:", error);
    }
}

function render() {
    console.log("Rendering application state:", state);
    renderHeader();
    renderCalendarView();
    // Modal is rendered via open/close functions
}

function renderHeader() {
    const currentDateDisplay = document.getElementById('current-date-display');
    if (!currentDateDisplay) return;
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const monthYearOptions = { year: 'numeric', month: 'long' };
    if (state.view === 'month') currentDateDisplay.textContent = state.currentDate.toLocaleDateString('de-DE', monthYearOptions);
    else if (state.view === 'week') currentDateDisplay.textContent = `Woche ${getWeekNumber(state.currentDate)} / ${state.currentDate.getFullYear()}`;
    else if (state.view === 'day') currentDateDisplay.textContent = state.currentDate.toLocaleDateString('de-DE', options);
}

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function renderCalendarView() {
    const calendarContainer = document.getElementById('calendar-container');
    if (!calendarContainer) return;
    calendarContainer.innerHTML = '';
    switch (state.view) {
        case 'month': renderMonthView(calendarContainer); break;
        case 'week': renderWeekView(calendarContainer); break;
        case 'day': renderDayView(calendarContainer); break;
        default: calendarContainer.innerHTML = '<p>Unknown view.</p>';
    }
}

function renderMonthView(container) {
    const now = new Date();
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    let firstDayToDisplay = new Date(firstDayOfMonth);
    firstDayToDisplay.setDate(firstDayToDisplay.getDate() - (firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1));

    let html = '<div class="calendar-grid month-view">';
    const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    html += '<div class="calendar-header-row">';
    dayNames.forEach(name => html += `<div class="calendar-header-cell">${name}</div>`);
    html += '</div>';

    let currentDay = new Date(firstDayToDisplay);
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 7; j++) {
            const dateStr = toYYYYMMDD(currentDay);
            let cellClass = 'day-cell';
            if (currentDay.getMonth() !== month) cellClass += ' other-month';
            if (toYYYYMMDD(currentDay) === toYYYYMMDD(now)) cellClass += ' today';

            html += `<div class="${cellClass}" data-date="${dateStr}">`;
            html += `<div class="day-number">${currentDay.getDate()}</div>`;
            html += '<div class="appointments-list">';
            const appointmentsForDay = state.appointments.filter(apt => toYYYYMMDD(apt.date) === dateStr);
            appointmentsForDay.forEach(apt => {
                html += `<div class="appointment-item" data-appointment-id="${apt.id}">${apt.title}</div>`;
            });
            html += '</div></div>';
            currentDay.setDate(currentDay.getDate() + 1);
        }
        if (currentDay.getMonth() > month && i >= 3 && currentDay.getDay() === 1 && currentDay > lastDayOfMonth) break;
    }
    html += '</div>';
    container.innerHTML = html;
}

function renderWeekView(container) { container.innerHTML = '<p style="text-align:center; padding:20px;">Week View - Coming Soon</p>'; }
function renderDayView(container) { container.innerHTML = '<p style="text-align:center; padding:20px;">Day View - Coming Soon</p>'; }

// --- Modal Functions ---
function openModal(appointmentId = null) {
    state.selectedAppointmentId = appointmentId;
    appointmentForm.reset(); // Clear form fields

    if (appointmentId) { // Viewing/Editing existing appointment
        const appointment = state.appointments.find(apt => apt.id === appointmentId);
        if (appointment) {
            modalTitleDisplay.textContent = "Appointment Details";
            modalAppointmentIdInput.value = appointment.id;
            modalTitleInput.value = appointment.title;
            modalDateInput.value = toYYYYMMDD(appointment.date);
            modalTimeInput.value = toHHMM(appointment.date);
            // TODO: Populate other fields (duration, category, contact, materials)
            setFormInputsDisabled(true);
            state.isEditMode = false;
            modalBtnEdit.classList.remove('hidden');
            modalBtnDelete.classList.remove('hidden');
        } else {
            console.error("Appointment not found for ID:", appointmentId);
            closeModal();
            return;
        }
    } else { // Creating new appointment
        modalTitleDisplay.textContent = "New Appointment";
        modalAppointmentIdInput.value = '';
        // Set default date to current date in view or today
        modalDateInput.value = toYYYYMMDD(state.currentDate);
        modalTimeInput.value = toHHMM(new Date());
        setFormInputsDisabled(false);
        state.isEditMode = true;
        modalBtnEdit.classList.add('hidden');
        modalBtnDelete.classList.add('hidden');
    }

    modalOverlay.classList.remove('hidden');
    state.isModalOpen = true;
}

function closeModal() {
    modalOverlay.classList.add('hidden');
    state.isModalOpen = false;
    state.selectedAppointmentId = null;
    state.isEditMode = false;
    appointmentForm.reset();
}

function saveAppointment() {
    const title = modalTitleInput.value.trim();
    const dateStr = modalDateInput.value;
    const timeStr = modalTimeInput.value;

    if (!title || !dateStr || !timeStr) {
        alert("Title, Date, and Time are required.");
        return;
    }

    // Combine date and time strings and parse into a Date object
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const appointmentDate = new Date(year, month - 1, day, hours, minutes);


    const appointmentId = modalAppointmentIdInput.value;

    if (appointmentId) { // Editing existing
        const appointmentIndex = state.appointments.findIndex(apt => apt.id === appointmentId);
        if (appointmentIndex > -1) {
            state.appointments[appointmentIndex] = {
                ...state.appointments[appointmentIndex], // Preserve other properties
                title: title,
                date: appointmentDate,
                // TODO: Update other fields (duration, category, contact, materials)
            };
        }
    } else { // Creating new
        const newAppointment = {
            id: Date.now().toString(), // Simple unique ID
            title: title,
            date: appointmentDate,
            duration: 60, // Default or get from form
            category: 'allgemein', // Default or get from form
            status: 'geplant',
            contact: {}, // Default or get from form
            materials: [], // Default or get from form
        };
        state.appointments.push(newAppointment);
    }

    saveAppointmentsToStorage();
    closeModal();
    render();
}

function deleteAppointment() {
    if (!state.selectedAppointmentId) return;
    if (confirm("Are you sure you want to delete this appointment?")) {
        state.appointments = state.appointments.filter(apt => apt.id !== state.selectedAppointmentId);
        saveAppointmentsToStorage();
        closeModal();
        render();
    }
}

function toggleEditMode() {
    state.isEditMode = !state.isEditMode;
    setFormInputsDisabled(!state.isEditMode);
}

function setFormInputsDisabled(disabled) {
    // Query all relevant input fields within the form
    const inputs = appointmentForm.querySelectorAll('input:not([type="hidden"]), select, textarea, button[id="modal-btn-add-material"]');
    inputs.forEach(input => {
        // Don't disable the save/cancel/edit/delete buttons themselves, only form fields.
        // The main action buttons (save, cancel, delete, edit) are handled separately.
        if (input.id !== 'modal-btn-save' && input.id !== 'modal-btn-cancel' && input.id !== 'modal-btn-delete' && input.id !== 'modal-btn-edit') {
             input.disabled = disabled;
        }
    });
    // Show/hide save button based on edit mode
     modalBtnSave.classList.toggle('hidden', disabled);

}

// --- Helper Date Functions ---
function toYYYYMMDD(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function toHHMM(date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}


// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    // Assign modal elements (already declared globally)
    modalOverlay = document.getElementById('modal-overlay');
    modalContent = document.getElementById('modal-content');
    modalAppointmentIdInput = document.getElementById('modal-appointment-id');
    appointmentForm = document.getElementById('appointment-form');
    modalTitleInput = document.getElementById('modal-title');
    modalDateInput = document.getElementById('modal-date');
    modalTimeInput = document.getElementById('modal-time');
    modalTitleDisplay = document.getElementById('modal-title-display');

    modalBtnClose = document.getElementById('modal-btn-close');
    modalBtnEdit = document.getElementById('modal-btn-edit');
    modalBtnSave = document.getElementById('modal-btn-save'); // This is type="submit"
    modalBtnDelete = document.getElementById('modal-btn-delete');
    modalBtnCancel = document.getElementById('modal-btn-cancel');
    modalBtnAddMaterial = document.getElementById('modal-btn-add-material');

    const btnViewDay = document.getElementById('btn-view-day');
    const btnViewWeek = document.getElementById('btn-view-week');
    const btnViewMonth = document.getElementById('btn-view-month');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnToday = document.getElementById('btn-today');
    const btnNewAppointment = document.getElementById('btn-new-appointment');
    const calendarContainer = document.getElementById('calendar-container');

    loadAppointmentsFromStorage();
    render();

    // Event Listeners
    if (calendarContainer) {
        calendarContainer.addEventListener('click', (event) => {
            const appointmentElement = event.target.closest('[data-appointment-id]');
            if (appointmentElement) {
                const appointmentId = appointmentElement.getAttribute('data-appointment-id');
                openModal(appointmentId);
            }
        });
    }

    if (btnViewDay) btnViewDay.addEventListener('click', () => { state.view = 'day'; render(); });
    if (btnViewWeek) btnViewWeek.addEventListener('click', () => { state.view = 'week'; render(); });
    if (btnViewMonth) btnViewMonth.addEventListener('click', () => { state.view = 'month'; render(); });

    if (btnPrev) btnPrev.addEventListener('click', () => {
        if (state.view === 'month') state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        else if (state.view === 'week') state.currentDate.setDate(state.currentDate.getDate() - 7);
        else state.currentDate.setDate(state.currentDate.getDate() - 1);
        render();
    });
    if (btnNext) btnNext.addEventListener('click', () => {
        if (state.view === 'month') state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        else if (state.view === 'week') state.currentDate.setDate(state.currentDate.getDate() + 7);
        else state.currentDate.setDate(state.currentDate.getDate() + 1);
        render();
    });
    if (btnToday) btnToday.addEventListener('click', () => { state.currentDate = new Date(); render(); });
    if (btnNewAppointment) btnNewAppointment.addEventListener('click', () => openModal(null));

    // Modal Listeners
    if (modalBtnClose) modalBtnClose.addEventListener('click', closeModal);
    if (modalBtnCancel) modalBtnCancel.addEventListener('click', closeModal);
    if (modalBtnDelete) modalBtnDelete.addEventListener('click', deleteAppointment);
    if (modalBtnEdit) modalBtnEdit.addEventListener('click', toggleEditMode);
    if (modalBtnAddMaterial) modalBtnAddMaterial.addEventListener('click', () => console.log('Add material clicked - placeholder'));

    if (appointmentForm) {
        appointmentForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevent default form submission
            saveAppointment();
        });
    }
    console.log("All event listeners (including modal) attached.");
});

console.log("script.js loaded, modal logic included.");
