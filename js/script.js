document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    const calendarContainer = document.getElementById('calendar-container');
    const courseForm = document.getElementById('course-form');
    const coursesContainer = document.getElementById('courses');
    const monthYearDisplay = document.getElementById('month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');

    let currentDate = new Date();

    // Load assignments from localStorage
    const loadAssignments = () => JSON.parse(localStorage.getItem('assignments')) || [];
    const saveAssignments = (assignments) => localStorage.setItem('assignments', JSON.stringify(assignments));

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

        const assignments = loadAssignments();
        assignments.push({ name, date, time, description, class: currentPage });
        saveAssignments(assignments);

        courseForm.reset();
        loadClassAssignments();
        if (currentPage === 'index') updateCalendar(); // Update calendar on index page
    };

    const loadClassAssignments = () => {
        const assignments = loadAssignments().filter(a => a.class === currentPage);
        coursesContainer.innerHTML = assignments
            .map(a => `
                <div class="assignment-item">
                    <h3>${a.name}</h3>
                    <p><strong>Due:</strong> ${a.date} at ${a.time}</p>
                    <p>${a.description}</p>
                    <button class="delete-btn" data-id="${a.date}-${a.time}-${a.name}">Delete</button>
                </div>
            `)
            .join('');
    };

    const deleteAssignment = (id) => {
        let assignments = loadAssignments();
        assignments = assignments.filter(a => `${a.date}-${a.time}-${a.name}` !== id);
        saveAssignments(assignments);
        loadClassAssignments();
        updateCalendar();
    };

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
                tooltipContent = dueToday
                    .map(a => `<p><strong>${a.name}</strong> at ${a.time}</p>`)
                    .join('');
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

    const updateCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        monthYearDisplay.textContent = `${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate)} ${year}`;
        generateCalendar(loadAssignments(), year, month);
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

    if (currentPage === 'index') {
        updateCalendar();
    } else {
        courseForm.addEventListener('submit', addAssignment);
        coursesContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const assignmentId = e.target.getAttribute('data-id');
                deleteAssignment(assignmentId);
            }
        });
        loadClassAssignments();
    }
});
