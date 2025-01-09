document.addEventListener('DOMContentLoaded', () => {
    // Firebase configuration (replace with your actual config)
    const firebaseConfig = {
        apiKey: "AIzaSyAFQZmqYQCbctH2C_wTJ0h8gQHVEJX_FDo",
        authDomain: "course-tracker-de45b.firebaseapp.com",
        databaseURL: "https://course-tracker-de45b-default-rtdb.firebaseio.com",
        projectId: "course-tracker-de45b",
        storageBucket: "course-tracker-de45b.firebasestorage.app",
        messagingSenderId: "851018339444",
        appId: "1:851018339444:web:4d794ecd3a1da3195aed21"
    };

    // Initialize Firebase
    const app = firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    const calendarContainer = document.getElementById('calendar-container');
    const courseForm = document.getElementById('course-form');
    const coursesContainer = document.getElementById('courses');
    const monthYearDisplay = document.getElementById('month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');

    let currentDate = new Date();

    // Save assignment to Firebase
    const saveAssignment = (assignment) => {
        db.ref(`assignments/${assignment.class}`).push(assignment);
    };

    // Load assignments from Firebase
    const loadAssignments = (callback) => {
        db.ref('assignments/').on('value', (snapshot) => {
            const data = snapshot.val();
            const assignments = [];
            for (const classKey in data) {
                for (const assignmentKey in data[classKey]) {
                    assignments.push(data[classKey][assignmentKey]);
                }
            }
            callback(assignments);
        });
    };

    // Add a new assignment
    const addAssignment = (e) => {
        e.preventDefault();
        const name = document.getElementById('course_name').value.trim();
        const date = document.getElementById('due_date').value;
        const time = document.getElementById('due_time').value;
        const description = document.getElementById('description').value.trim();

        if (!name || !date || !time) {
            alert('Assignment name, date, and time are required!');
            return;
        }

        const newAssignment = { name, date, time, description, class: currentPage };
        saveAssignment(newAssignment);
        courseForm.reset();
    };

    // Load and display assignments for the current class
    const loadClassAssignments = () => {
        loadAssignments((assignments) => {
            const filtered = assignments.filter(a => a.class === currentPage);
            coursesContainer.innerHTML = filtered
                .map(a => `
                    <div class="assignment-item">
                        <h3>${a.name}</h3>
                        <p><strong>Due:</strong> ${a.date} at ${a.time}</p>
                        <p>${a.description}</p>
                        <button class="delete-btn" data-id="${a.date}-${a.time}-${a.name}">Delete</button>
                    </div>
                `)
                .join('');
        });
    };

    // Generate calendar
    const generateCalendar = (assignments, year, month) => {
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let calendarHTML = '<div class="calendar-days-of-week">';
        daysOfWeek.forEach(day => {
            calendarHTML += `<div class="day-name">${day}</div>`;
        });
        calendarHTML += '</div><div class="calendar-grid">';

        // Fill empty slots before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            calendarHTML += '<div class="empty"></div>';
        }

        // Generate days with assignments
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dueToday = assignments.filter(a => a.date === dateStr);

            let tooltipContent = '';
            if (dueToday.length > 0) {
                tooltipContent = dueToday.map(a => `<p><strong>${a.name}</strong> at ${a.time}</p>`).join('');
            }

            calendarHTML += `
                <div class="calendar-day${dueToday.length ? ' due' : ''}" data-date="${dateStr}">
                    <span>${day}</span>
                    ${dueToday.length ? `<div class="tooltip">${tooltipContent}</div>` : ''}
                </div>`;
        }

        calendarHTML += '</div>';
        calendarContainer.innerHTML = calendarHTML;

        attachTooltipListeners(); // Attach tooltips after rendering
    };

    // Update calendar
    const updateCalendar = () => {
        loadAssignments((assignments) => {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            monthYearDisplay.textContent = `${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate)} ${year}`;
            generateCalendar(assignments, year, month);
        });
    };

    const attachTooltipListeners = () => {
        document.querySelectorAll('.calendar-day.due').forEach(day => {
            const tooltip = day.querySelector('.tooltip');
            day.addEventListener('mouseenter', (e) => {
                tooltip.style.top = `${e.clientY + 15}px`;
                tooltip.style.left = `${e.clientX + 15}px`;
                tooltip.style.display = 'block';
            });
            day.addEventListener('mousemove', (e) => {
                tooltip.style.top = `${e.clientY + 15}px`;
                tooltip.style.left = `${e.clientX + 15}px`;
            });
            day.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        });
    };

    prevMonthBtn?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar();
    });

    nextMonthBtn?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar();
    });

    // Initialize
    if (currentPage === 'index') {
        updateCalendar();
    } else {
        courseForm.addEventListener('submit', addAssignment);
        loadClassAssignments();
    }
});
