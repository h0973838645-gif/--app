const API_URL = "https://open.er-api.com/v6/latest/USD";
let allRates = {};
let records = JSON.parse(localStorage.getItem('myTravelRecords')) || [];
let myChart = null;

// 初始化
async function init() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        allRates = data.rates;
        
        document.getElementById('amount').addEventListener('input', updateExchange);
        document.getElementById('currencySelect').addEventListener('change', updateExchange);
        renderAll();
    } catch (e) { alert("無法載入匯率"); }
}

// 分頁切換
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
    document.querySelectorAll('.tab-bar button').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + pageId).classList.add('active');
    if(pageId === 'page2') updateChart();
}

function updateExchange() {
    const amt = document.getElementById('amount').value || 0;
    const rate = (1 / allRates[document.getElementById('currencySelect').value]) * allRates.TWD;
    document.getElementById('result').innerText = (amt * rate).toLocaleString(undefined, {maximumFractionDigits: 1});
}

function addLog() {
    const note = document.getElementById('note').value;
    const cost = document.getElementById('cost').value;
    const category = document.getElementById('categorySelect').value;
    if (!note || !cost) return;

    records.unshift({ id: Date.now(), note, cost: parseFloat(cost), category, time: new Date().toLocaleDateString() });
    localStorage.setItem('myTravelRecords', JSON.stringify(records));
    renderAll();
    alert("已記錄！可至分析頁查看");
    document.getElementById('note').value = '';
    document.getElementById('cost').value = '';
}

function deleteRec(id) {
    records = records.filter(r => r.id !== id);
    localStorage.setItem('myTravelRecords', JSON.stringify(records));
    renderAll();
    updateChart();
}

function renderAll() {
    const list = document.getElementById('logList');
    list.innerHTML = records.map(r => `
        <li>
            <span>${r.note} (${r.category})<br><small>${r.time}</small></span>
            <b>$${r.cost.toLocaleString()} <button class="del-btn" onclick="deleteRec(${r.id})">刪除</button></b>
        </li>
    `).join('');
}

function updateChart() {
    const categories = ["餐飲", "交通", "購物", "住宿", "其他"];
    const summaryDiv = document.getElementById('categorySummary');
    const totals = categories.map(cat => records.filter(r => r.category === cat).reduce((s, r) => s + r.cost, 0));
    const grandTotal = totals.reduce((a, b) => a + b, 0);

    summaryDiv.innerHTML = `<h4>總支出: $${grandTotal.toLocaleString()} TWD</h4>` + 
        categories.map((cat, i) => `<div class="summary-item"><span>${cat}</span><span>$${totals[i].toLocaleString()} (${grandTotal ? (totals[i]/grandTotal*100).toFixed(1) : 0}%)</span></div>`).join('');

    const ctx = document.getElementById('myChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'pie',
        data: { labels: categories, datasets: [{ data: totals, backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff'] }] },
        options: { plugins: { legend: { position: 'bottom' } } }
    });
}

init();
