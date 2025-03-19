// Replace with your Google Sheet ID
const SHEET_ID = '1x7NDGL68seFYvrRUPsidoemPGZj-VB8cZMCgNcT285M';

async function fetchTradeData() {
    try {
        const response = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`);
        const text = await response.text();
        const json = JSON.parse(text.substr(47).slice(0, -2));
        const rows = json.table.rows;

        const headers = ['longTarget', 'shortTarget', 'longPrice', 'shortPrice', 'sl', 'tp', 'startTime', 'endTime', 'commission', 'commission_out', 'PnL'];
        const tradeData = rows.slice(1).map(row => {
            return headers.reduce((obj, header, index) => {
                obj[header] = row.c[index] ? row.c[index].v : '';
                return obj;
            }, {});
        });

        calculateStats(tradeData);
        displayTradeData(tradeData);
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('tradeBody').innerHTML = '<tr><td colspan="12">Error loading data</td></tr>';
    }
}

function calculateStats(tradeData) {
    let wins = 0, losses = 0, totalReturn = 0, totalProfit = 0, totalLoss = 0, totalDuration = 0;
    let profitSum = 0, lossSum = 0;

    tradeData.forEach(trade => {
        const pnl = parseFloat(trade.PnL);
        if (pnl > 0) {
            wins++;
            totalProfit += pnl;
            profitSum += pnl;
        } else if (pnl < 0) {
            losses++;
            totalLoss += Math.abs(pnl);
            lossSum += Math.abs(pnl);
        }
        totalReturn += pnl;

        // Calculate duration in hours
        const start = new Date(trade.startTime);
        const end = new Date(trade.endTime || new Date());
        const durationHours = (end - start) / (1000 * 60 * 60);
        totalDuration += durationHours;
    });

    const totalTrades = wins + losses;
    const winRate = totalTrades ? (wins / totalTrades * 100).toFixed(2) : 0;
    const avgReturn = totalTrades ? (totalReturn / totalTrades).toFixed(2) : 0;
    const profitFactor = lossSum ? (profitSum / lossSum).toFixed(2) : '∞';
    const avgReturnRatio = totalTrades ? (totalReturn / totalTrades).toFixed(2) : 0;
    const avgDuration = totalTrades ? (totalDuration / totalTrades).toFixed(1) : 0;

    document.getElementById('win-rate').textContent = `${winRate}%`;
    document.getElementById('win-loss').textContent = `${wins}/${losses}`;
    document.getElementById('total-return').textContent = `${totalReturn.toFixed(2)} R`;
    document.getElementById('avg-return').textContent = `${avgReturn} R`;
    document.getElementById('profit-factor').textContent = profitFactor;
    document.getElementById('profit-loss').textContent = `${profitSum.toFixed(2)}/${lossSum.toFixed(2)}`;
    document.getElementById('avg-return-ratio').textContent = `${avgReturnRatio} R`;
    document.getElementById('total-profit').textContent = `${totalProfit.toFixed(2)} R`;
    document.getElementById('total-loss').textContent = `${totalLoss.toFixed(2)} R`;
    document.getElementById('total-duration').textContent = avgDuration;
}

function displayTradeData(tradeData) {
    const tbody = document.getElementById('tradeBody');
    tbody.innerHTML = '';

    tradeData.forEach(trade => {
        const row = document.createElement('tr');
        const tradeName = `${trade.longTarget.split('/')[0]}/${trade.shortTarget.split('/')[0]}`;
        const status = trade.endTime ? '已結' : '未結';
        const statusClass = trade.endTime ? 'status-closed' : 'status-open';
        const netProfit = parseFloat(trade.PnL);
        const netProfitClass = netProfit >= 0 ? 'positive' : 'negative';
        const commissionTotal = (parseFloat(trade.commission) + parseFloat(trade.commission_out)).toFixed(2);
        const start = new Date(trade.startTime);
        const end = trade.endTime ? new Date(trade.endTime) : new Date();
        const durationHours = ((end - start) / (1000 * 60 * 60)).toFixed(1);
        const oneR = (parseFloat(trade.sl) * 100).toFixed(2); // Assuming 1R = SL amount in percentage
        const condition = `${trade.sl}%`;
        const expectedR = (parseFloat(trade.PnL) / parseFloat(trade.sl)).toFixed(2);

        row.innerHTML = `
            <td>${tradeName}</td>
            <td class="${statusClass}">${status}</td>
            <td class="${netProfitClass}">${netProfit.toFixed(2)} R</td>
            <td>${commissionTotal}</td>
            <td>${durationHours}</td>
            <td class="${netProfitClass}">${oneR}%</td>
            <td>${condition}</td>
            <td class="${netProfitClass}">${expectedR} R</td>
            <td class="${netProfitClass}">${netProfit.toFixed(2)}</td>
            <td>${trade.startTime}</td>
            <td>${trade.endTime || '-'}</td>
            <td><button>詳情</button></td>
        `;
        tbody.appendChild(row);
    });
}

// Fetch data on page load
fetchTradeData();