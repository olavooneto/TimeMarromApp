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
  if (v === null || v === undefined || v === '') return 0;
  return Number(String(v).replace(/[^0-9\-\.]/g, '')) || 0;
}

function safePercent(collected, total) {
  if (total <= 0) return 0;
  return Math.round((collected / total) * 100);
}

function createPieChart(canvasId, collected, remaining, labelCollected = 'Total arrecadadas', labelRemaining = 'Restam') {
  const ctx = document.getElementById(canvasId).getContext('2d');
  const data = [collected, remaining];
  const total = collected + remaining || 1;

  if (window.Chart && window.ChartDataLabels) {
    window.Chart.register(window.ChartDataLabels);
  }

  return new Chart(ctx, {
    type: 'pie',
    data: {
      labels: [labelCollected, labelRemaining],
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

function buildSummary(metric) {
  return [
    { label: metric.firstLabel, value: metric.firstValue },
    { label: metric.secondLabel, value: metric.secondValue },
    { label: 'Total de doações', value: metric.totalCollectedLabel },
    { label: 'Restam', value: metric.restamLabel },
    { label: 'Total arrecadado %', value: metric.percentLabel },
    { label: 'Última atualização', value: metric.ultimaAtualizacao },
  ];
}

function computeMetric(totalTarget, collected) {
  const target = Math.max(parseNumber(totalTarget), 0);
  const earned = Math.max(parseNumber(collected), 0);
  const rest = Math.max(target - earned, 0);
  const percent = safePercent(earned, target);
  return { target, earned, rest, percent };
}

function validateBloodConfig(config) {
  const naIgreja = parseNumber(config.totalNaIgreja);
  const foraIgreja = parseNumber(config.totalForaIgreja);
  const declaredTotal = parseNumber(config.totalDeDoacoes);
  const computedTotal = naIgreja + foraIgreja;
  const target = parseNumber(config.totalMetaDeDoacoes);

  if (declaredTotal && declaredTotal !== computedTotal) {
    console.warn('Inconsistência em doações de sangue: totalDeDoacoes não corresponde a totalNaIgreja + totalForaIgreja. Usando valor calculado.');
  }

  return {
    totalNaIgreja: naIgreja,
    totalForaIgreja: foraIgreja,
    totalCollected: computedTotal,
    target,
    ultimaAtualizacao: config.ultimaAtualizacao || '',
  };
}

const gcGroups = {
  'Somos 1': 109,
  School: 10,
  Uni: 25,
  Vert: 16,
  RMC: 88,
};
const cestaPrice = 35;

function updateGcCalculator() {
  const select = document.getElementById('gcSelect');
  const input = document.getElementById('gcMemberCount');
  const result = document.getElementById('gcResult');
  if (!select || !input || !result) return;

  const group = select.value;
  const totalCestas = gcGroups[group] || 0;
  const members = Math.max(parseInt(input.value, 10) || 1, 1);
  const exactCestas = totalCestas / members;
  const roundedCestas = Math.ceil(exactCestas);
  const exactValue = exactCestas * cestaPrice;
  const roundedValue = roundedCestas * cestaPrice;

  result.innerHTML = `
    <p><strong>Meta total por GC de ${group}:</strong> ${totalCestas} cestas</p>
    <p>Se tivermos ${members} membros no grupo, a meta é de apenas ${roundedCestas} cestas por membro!</p>
    <p>Como cada cesta custa R$ ${cestaPrice.toFixed(2)}, o valor por membro fica em torno de R$ ${roundedValue.toFixed(2)} (ou R$ ${exactValue.toFixed(2)} no cálculo exato).</p>
  `;
}

function setupGcCalculator() {
  const select = document.getElementById('gcSelect');
  const input = document.getElementById('gcMemberCount');
  if (!select || !input) return;

  select.addEventListener('change', updateGcCalculator);
  input.addEventListener('input', updateGcCalculator);
  updateGcCalculator();
}

async function loadData() {
  try {
    const res = await fetch(configUrl, { cache: 'no-store' });
    const config = await res.json();

    const cestData = computeMetric(config.cestometro.totalDeCestas, config.cestometro.totalArrecadadas);
    const bazData = computeMetric(config.bazometro.totalDeRoupas, config.bazometro.totalArrecadadas);
    const sangueConfig = validateBloodConfig(config.doacoesSangue);
    const sangueData = computeMetric(sangueConfig.target, sangueConfig.totalCollected);
    const suaNfData = computeMetric(config.suaNfTemValor.totalDeNfACadastrar, config.suaNfTemValor.totalDeDoacoes);

    document.getElementById('cestometroSummary').innerHTML = formatCard([
      { label: 'Total de cestas', value: config.cestometro.totalDeCestas },
      { label: 'Total arrecadadas', value: config.cestometro.totalArrecadadas },
      { label: 'Restam', value: String(cestData.rest) },
      { label: 'Total arrecadado %', value: `${cestData.percent}%` },
      { label: 'Última atualização', value: config.cestometro.ultimaAtualizacao },
    ]);

    document.getElementById('bazometroSummary').innerHTML = formatCard([
      { label: 'Total de roupas', value: config.bazometro.totalDeRoupas },
      { label: 'Total arrecadadas', value: config.bazometro.totalArrecadadas },
      { label: 'Restam', value: String(bazData.rest) },
      { label: 'Total arrecadado %', value: `${bazData.percent}%` },
      { label: 'Última atualização', value: config.bazometro.ultimaAtualizacao },
    ]);

    document.getElementById('sangueSummary').innerHTML = formatCard([
      { label: 'Total na Igreja', value: String(sangueConfig.totalNaIgreja) },
      { label: 'Total fora Igreja', value: String(sangueConfig.totalForaIgreja) },
      { label: 'Total de doações', value: String(sangueConfig.totalCollected) },
      { label: 'Restam', value: String(sangueData.rest) },
      { label: 'Total arrecadado %', value: `${sangueData.percent}%` },
      { label: 'Última atualização', value: sangueConfig.ultimaAtualizacao },
    ]);

    document.getElementById('suaNfSummary').innerHTML = formatCard([
      { label: 'Total de NF à cadastrar', value: config.suaNfTemValor.totalDeNfACadastrar },
      { label: 'Total de doações', value: config.suaNfTemValor.totalDeDoacoes },
      { label: 'Restam', value: String(suaNfData.rest) },
      { label: 'Total arrecadado %', value: `${suaNfData.percent}%` },
      { label: 'Última atualização', value: config.suaNfTemValor.ultimaAtualizacao },
    ]);

    createPieChart('cestometroChart', cestData.earned, cestData.rest, 'Arrecadadas', 'Restam');
    createPieChart('bazometroChart', bazData.earned, bazData.rest, 'Arrecadadas', 'Restam');
    createPieChart('sangueChart', sangueData.earned, sangueData.rest, 'Doações', 'Restam');
    createPieChart('suaNfChart', suaNfData.earned, suaNfData.rest, 'Doações', 'Restam');
    setupGcCalculator();
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
    const grid = document.getElementById('dashboardGrid');
    grid.innerHTML = '<p class="error-message">Não foi possível carregar os dados. Verifique se config.json está disponível.</p>';
  }
}

loadData();
