const configUrl = './config.json';

function formatCard(values) {
  return values
    .map(
      ({ label, value }) => `
      <div class="metric-row">
        <div>
          <strong>${value}</strong>
          <span class="row-label">${label}</span>
        </div>
      </div>`
    )
    .join('');
}

function parseNumber(v) {
  if (typeof v === 'number') return v;
  if (!v) return 0;
  return Number(String(v).replace(/[^0-9\-\.]/g, '')) || 0;
}

function createPieChart(canvasId, collected, remaining) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  const data = [collected, remaining];
  const total = collected + remaining || 1;

  // register datalabels plugin if available
  if (window.Chart && window.ChartDataLabels) {
    window.Chart.register(window.ChartDataLabels);
  }

  return new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Total arrecadadas', 'Restam'],
      datasets: [
        {
          data,
          backgroundColor: ['#d69d59', '#6b4126'],
          borderColor: '#2d1b11',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#f5e6d4' },
        },
        datalabels: {
          color: '#ffffff',
          formatter: (value) => {
            const pct = Math.round((value / total) * 100);
            return pct + '%';
          },
          font: { weight: '600', size: 14 },
        },
      },
    },
  });
}

async function loadData() {
  try {
    const res = await fetch(configUrl, { cache: 'no-store' });
    const config = await res.json();

    // Cestometro values
    const cest_col = parseNumber(config.cestometro.totalArrecadadas);
    const cest_rest = parseNumber(config.cestometro.restam);

    // Bazometro values
    const baz_col = parseNumber(config.bazometro.totalArrecadadas);
    const baz_rest = parseNumber(config.bazometro.restam);

    // render summaries
    const cestSummary = [
      { label: 'Total de cestas', value: config.cestometro.totalDeCestas },
      { label: 'Total arrecadadas', value: config.cestometro.totalArrecadadas },
      { label: 'Restam', value: config.cestometro.restam },
      { label: 'Total arrecadado %', value: config.cestometro.totalArrecadadoPercentual },
      { label: 'Última atualização', value: config.cestometro.ultimaAtualizacao },
    ];

    const bazSummary = [
      { label: 'Total de roupas', value: config.bazometro.totalDeRoupas },
      { label: 'Total arrecadadas', value: config.bazometro.totalArrecadadas },
      { label: 'Restam', value: config.bazometro.restam },
      { label: 'Total arrecadado %', value: config.bazometro.totalArrecadadoPercentual },
      { label: 'Última atualização', value: config.bazometro.ultimaAtualizacao },
    ];

    document.getElementById('cestometroSummary').innerHTML = formatCard(cestSummary);
    document.getElementById('bazometroSummary').innerHTML = formatCard(bazSummary);

    // create charts
    createPieChart('cestometroChart', cest_col, cest_rest);
    createPieChart('bazometroChart', baz_col, baz_rest);
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
    const grid = document.getElementById('dashboardGrid');
    grid.innerHTML = '<p class="error-message">Não foi possível carregar os dados. Verifique se config.json está disponível.</p>';
  }
}

loadData();
