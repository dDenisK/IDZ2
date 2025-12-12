const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Парсить святкові дні з текстового поля у масив об'єктів Date.
 * @returns {Array<string>} Масив рядків у форматі 'YYYY-MM-DD'
 */
function parseHolidays() {
    const text = document.getElementById('holidays').value;
    const holidayDates = text.split(/[\n,]+/)
        .map(s => s.trim())
        .filter(s => s.match(/^\d{4}-\d{2}-\d{2}$/)); // Фільтруємо лише коректний формат
    return holidayDates;
}

/**
 * Перевіряє, чи є дата неділею (день тижня = 0)
 * @param {Date} date
 * @returns {boolean}
 */
function isSunday(date) {
    return date.getDay() === 0;
}

/**
 * Перевіряє, чи є дата святковим днем
 * @param {Date} date
 * @param {Array<string>} holidays - Масив рядків 'YYYY-MM-DD'
 * @returns {boolean}
 */
function isHoliday(date, holidays) {
    const dateString = date.toISOString().slice(0, 10);
    return holidays.includes(dateString);
}

/**
 * Основна функція розрахунку
 */
function calculateVacation() {
    const startDateInput = document.getElementById('startDate').value;
    const endDateInput = document.getElementById('endDate').value;
    const durationInput = document.getElementById('duration').value;
    const holidays = parseHolidays();
    const output = document.getElementById('resultOutput');
    let warnings = [];

    // Перетворення вхідних даних
    let startDate = startDateInput ? new Date(startDateInput) : null;
    let endDate = endDateInput ? new Date(endDateInput) : null;
    let duration = durationInput ? parseInt(durationInput) : null;

    let resultDate, resultDuration;
    let calculationMode = 0; // 1: Знайти тривалість, 2: Знайти початок, 3: Знайти завершення

    // 1. Визначення режиму розрахунку
    if (startDate && endDate && !durationInput) {
        calculationMode = 1; // Знайти Тривалість
    } else if (endDate && duration && !startDateInput) {
        calculationMode = 2; // Знайти Початок
    } else if (startDate && duration && !endDateInput) {
        calculationMode = 3; // Знайти Завершення
    } else {
        output.innerHTML = "🛑 **Помилка:** Будь ласка, введіть рівно два з трьох параметрів (Дата Початку, Дата Завершення, Тривалість).";
        return;
    }

    // 2. Виконання розрахунку
    switch (calculationMode) {
        case 1: // Знайти Тривалість (Дата Початку і Дата Завершення відомі)
            if (startDate > endDate) {
                output.innerHTML = "🛑 **Помилка:** Дата початку не може бути пізнішою за дату завершення.";
                return;
            }
            resultDuration = calculateDuration(startDate, endDate, holidays);
            output.innerHTML = `✅ **Розрахункова Тривалість:** ${resultDuration} ${getNounCase(resultDuration)} (включно).`;
            break;

        case 2: // Знайти Початок (Дата Завершення і Тривалість відомі)
            resultDate = calculateStartDate(endDate, duration, holidays);
            output.innerHTML = `✅ **Розрахункова Дата Початку:** ${formatDate(resultDate)}.`;
            break;

        case 3: // Знайти Завершення (Дата Початку і Тривалість відомі)
            resultDate = calculateEndDate(startDate, duration, holidays);
            output.innerHTML = `✅ **Розрахункова Дата Завершення:** ${formatDate(resultDate)}.`;
            break;
    }

    // 3. Перевірка на Неділю
    const checkStart = calculationMode === 2 ? resultDate : startDate;
    const checkEnd = calculationMode === 3 ? resultDate : endDate;

    if (checkStart && isSunday(checkStart)) {
        warnings.push(`Дата початку (${formatDate(checkStart)}) припадає на неділю.`);
    }
    if (checkEnd && isSunday(checkEnd)) {
        warnings.push(`Дата завершення (${formatDate(checkEnd)}) припадає на неділю.`);
    }

    // 4. Виведення попереджень
    if (warnings.length > 0) {
        output.innerHTML += `<div class="warning">⚠️ Увага:<br>- ${warnings.join('<br>- ')}</div>`;
    }
}

// --- Функції для розрахунку ---

/**
 * Режим 1: Розрахунок тривалості між двома датами
 * @param {Date} start - Дата початку
 * @param {Date} end - Дата завершення
 * @param {Array<string>} holidays - Масив святкових днів
 * @returns {number} Тривалість у днях
 */
function calculateDuration(start, end, holidays) {
    let count = 0;
    let currentDate = new Date(start);

    // Цикл ітерує від дати початку до дати завершення ВКЛЮЧНО
    while (currentDate.getTime() <= end.getTime()) {
        if (!isHoliday(currentDate, holidays)) {
            count++;
        }
        // Перехід на наступний день
        currentDate.setTime(currentDate.getTime() + MS_PER_DAY);
    }
    return count;
}

/**
 * Режим 3: Розрахунок дати завершення
 * @param {Date} start - Дата початку
 * @param {number} duration - Тривалість у днях
 * @param {Array<string>} holidays - Масив святкових днів
 * @returns {Date} Дата завершення
 */
function calculateEndDate(start, duration, holidays) {
    let daysLeft = duration;
    let currentDate = new Date(start);

    // Відлік починається з дати початку (якщо вона не свято)
    while (daysLeft > 0) {
        if (!isHoliday(currentDate, holidays)) {
            daysLeft--;
        }

        // Якщо дні закінчилися, то це і є дата завершення
        if (daysLeft === 0) {
            break;
        }

        // Перехід на наступний день
        currentDate.setTime(currentDate.getTime() + MS_PER_DAY);
    }
    return currentDate;
}

/**
 * Режим 2: Розрахунок дати початку
 * @param {Date} end - Дата завершення
 * @param {number} duration - Тривалість у днях
 * @param {Array<string>} holidays - Масив святкових днів
 * @returns {Date} Дата початку
 */
function calculateStartDate(end, duration, holidays) {
    let daysLeft = duration;
    let currentDate = new Date(end);

    // Відлік починається з дати завершення (якщо вона не свято)
    while (daysLeft > 0) {
        if (!isHoliday(currentDate, holidays)) {
            daysLeft--;
        }

        // Якщо дні закінчилися, то це і є дата початку
        if (daysLeft === 0) {
            break;
        }

        // Перехід на попередній день
        currentDate.setTime(currentDate.getTime() - MS_PER_DAY);
    }
    return currentDate;
}

// --- Допоміжні функції ---

function formatDate(date) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return date.toLocaleDateString('uk-UA', options);
}

function getNounCase(number) {
    if (number % 10 === 1 && number % 100 !== 11) return 'день';
    if ([2, 3, 4].includes(number % 10) && ![12, 13, 14].includes(number % 100)) return 'дні';
    return 'днів';
}