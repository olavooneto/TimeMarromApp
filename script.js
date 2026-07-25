const configUrl = './config.json';

function formatCard(title, values) {
  return values
    .map(
      ({ label, value, small }) => `
      <div class="metric-row">
        <div>
          <strong>${value}</strong>
          <span class="row-label">${label}</span>
        </div>
        ${small ? `<span>${small}</span>` : ''}
      </div>`
    )
    .join('');
}

function renderPizza(percentage, element) {
  const color = percentage > 50 ? '#d69d59' : '#b86f43';
  element.style.background = `radial-gradient(circle at 45% 35%, #f4d099 16%, transparent 16%), conic-gradient(${color} 0deg ${percentage * 3.6}deg, rgba(255,255,255,0.06) ${percentage * 3.6}deg 360deg), radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 68%)`;
}

function renderMetricCard(sectionId, pizzaId, values, itemLabel, updateLabel) {
  const section = document.getElementById(sectionId);
  const pizza = document.getElementById(pizzaId);
  if (!section || !pizza) return;

  section.querySelector('.metric-summary').innerHTML = formatCard(itemLabel, values);
  const percentItem = values.find((item) => item.label.toLowerCase().includes('total arrecadado %'));
  const percentage = percentItem ? parseInt(percentItem.value, 10) : 0;
  renderPizza(percentage, pizza);
}

async function loadData() {
  try {
    const response = await fetch(configUrl, { cache: 'no-store' });
    const config = await response.json();

    renderMetricCard('cestometroCard', 'cestometroPizza', [
      { label: 'Total de cestas', value: config.cestometro.totalDeCestas },
      { label: 'Total arrecadadas', value: config.cestometro.totalArrecadadas },
      { label: 'Restam', value: config.cestometro.restam },
      { label: 'Total arrecadado %', value: config.cestometro.totalArrecadadoPercentual },
      { label: 'Última atualização', value: config.cestometro.ultimaAtualizacao, small: '' },
    ]);

    renderMetricCard('bazometroCard', 'bazometroPizza', [
      { label: 'Total de roupas', value: config.bazometro.totalDeRoupas },
      { label: 'Total arrecadadas', value: config.bazometro.totalArrecadadas },
      { label: 'Restam', value: config.bazometro.restam },
      { label: 'Total arrecadado %', value: config.bazometro.totalArrecadadoPercentual },
      { label: 'Última atualização', value: config.bazometro.ultimaAtualizacao, small: '' },
    ]);
  } catch (error) {
    console.error('Falha ao carregar config.json', error);
    const grid = document.getElementById('dashboardGrid');
    grid.innerHTML = '<p class="error-message">Não foi possível carregar os dados. Verifique se <code>config.json</code> está disponível.</p>';
  }
}

loadData();
