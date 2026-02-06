const transactionsKey = '@financeflow:transactions';
const setupKey = '@financeflow:setup-done';

let transactions = JSON.parse(localStorage.getItem(transactionsKey)) || [];

const categoryColors = {
    'Moradia': '#05CD99',
    'Alimentação': '#4318FF',
    'Transporte': '#FFB547',
    'Lazer': '#EE5D50',
    'Salário': '#2B3674',
    'Outros': '#A3AED0'
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

function updateDashboard() {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const total = income - expense;

    document.getElementById('balance-display').innerText = formatCurrency(total);
    document.getElementById('income-display').innerText = formatCurrency(income);
    document.getElementById('expense-display').innerText = formatCurrency(expense);

    renderTable();
    updateDonutChart();
    updateBarChart();

    localStorage.setItem(transactionsKey, JSON.stringify(transactions));
}

function renderTable() {
    const tbody = document.getElementById('transaction-table');
    tbody.innerHTML = '';

    const latest = transactions.slice().reverse().slice(0, 5);

    latest.forEach(t => {
        const row = document.createElement('tr');
        const colorClass = t.type === 'income' ? '#05CD99' : '#EE5D50';
        const sign = t.type === 'income' ? '+' : '-';

        row.innerHTML = `
            <td><strong>${t.desc}</strong></td>
            <td>${t.category}</td>
            <td>${new Date(t.date).toLocaleDateString('pt-BR')}</td>
            <td style="color: ${colorClass}; font-weight: 700">${sign} ${formatCurrency(t.amount)}</td>
        `;
        tbody.appendChild(row);
    });
}

function updateDonutChart() {
    const expenses = transactions.filter(t => t.type === 'expense' && t.category !== 'Salário');
    const totalExpense = expenses.reduce((acc, t) => acc + t.amount, 0);

    const categoryTotals = {};
    expenses.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const legendList = document.getElementById('category-list');
    legendList.innerHTML = '';
    let gradientStr = '';
    let startDeg = 0;

    for (const [cat, val] of Object.entries(categoryTotals)) {
        const percent = (val / totalExpense) * 360;
        const color = categoryColors[cat] || '#ccc';
        const endDeg = startDeg + percent;

        gradientStr += `${color} ${startDeg}deg ${endDeg}deg, `;
        startDeg = endDeg;

        const li = document.createElement('li');
        li.innerHTML = `
            <span><span class="cat-color" style="background: ${color}"></span> ${cat}</span>
            <span class="val">${formatCurrency(val)}</span>
        `;
        legendList.appendChild(li);
    }

    const chart = document.getElementById('donut-chart');
    if (totalExpense > 0) {
        chart.style.background = `conic-gradient(${gradientStr.slice(0, -2)})`;
    } else {
        chart.style.background = `conic-gradient(#1B254B 0% 100%)`;
    }
    document.getElementById('donut-total').innerText = formatCurrency(totalExpense);
}

function updateBarChart() {
    const container = document.getElementById('bar-chart');
    container.innerHTML = '';
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    let maxVal = Math.max(totalIncome, totalExpense, 100);

    monthNames.forEach((month, index) => {
        let inc, exp;

        if (index === 5) {
            inc = totalIncome;
            exp = totalExpense;
        } else {
            inc = totalIncome * (0.3 + Math.random() * 0.5);
            exp = totalExpense * (0.3 + Math.random() * 0.5);
        }

        const hIncome = (inc / maxVal) * 80;
        const hExpense = (exp / maxVal) * 80;

        const html = `
            <div class="bar-group">
                <div class="bars-wrapper">
                    <div class="bar income" style="height: ${hIncome}%" title="Receita"></div>
                    <div class="bar expense" style="height: ${hExpense}%" title="Despesa"></div>
                </div>
                <span class="month-label">${month}</span>
            </div>
        `;
        container.innerHTML += html;
    });
}

const modal = document.getElementById('modal');
const form = document.getElementById('form');

function openModal() { modal.classList.remove('hidden'); }
function closeModal() { modal.classList.add('hidden'); }

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('desc').value;
    const amount = Number(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;

    if(!desc || !amount) return;

    transactions.push({
        id: Date.now(),
        desc,
        amount,
        type,
        category,
        date: new Date().toISOString().split('T')[0]
    });

    updateDashboard();
    closeModal();
    form.reset();
});

modal.addEventListener('click', (e) => {
    if(e.target === modal) closeModal();
});

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
}

const setupModal = document.getElementById('setup-modal');
const setupForm = document.getElementById('setup-form');

function checkFirstVisit() {
    const isSetupDone = localStorage.getItem(setupKey);
    if (!isSetupDone) {
        setupModal.classList.remove('hidden');
    }
}

setupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const salary = Number(document.getElementById('setup-salary').value);
    const rent = Number(document.getElementById('setup-rent').value);
    const transport = Number(document.getElementById('setup-transport').value);
    const bills = Number(document.getElementById('setup-bills').value);

    transactions = [];
    const today = new Date().toISOString().split('T')[0];

    if (salary > 0) transactions.push({ id: 1, desc: 'Salário Mensal', amount: salary, type: 'income', category: 'Salário', date: today });
    if (rent > 0) transactions.push({ id: 2, desc: 'Aluguel/Moradia', amount: rent, type: 'expense', category: 'Moradia', date: today });
    if (transport > 0) transactions.push({ id: 3, desc: 'Transporte Fixo', amount: transport, type: 'expense', category: 'Transporte', date: today });
    if (bills > 0) transactions.push({ id: 4, desc: 'Contas Fixas', amount: bills, type: 'expense', category: 'Outros', date: today });

    localStorage.setItem(setupKey, 'true');
    
    updateDashboard();
    setupModal.classList.add('hidden');
});

checkFirstVisit();
updateDashboard();