const buildChannelStatement = ({ name, score, rationale }) => {
  const topReason = Array.isArray(rationale) && rationale.length ? rationale[0] : 'Strong performance indicators';
  return `${name} (score ${score}/100) — ${topReason}.`;
};

const formatOutcome = (label, value) => {
  const units = ['K', 'M'];
  let formatted = value;
  let index = -1;
  while (formatted >= 1000 && index < units.length - 1) {
    formatted = formatted / 1000;
    index += 1;
  }
  const rounded = index >= 0 ? `${formatted.toFixed(1)}${units[index]}` : `${Math.round(formatted)}`;
  return `${label}: ${rounded}`;
};

const generateSummary = ({ entityProfile, topChannels = [], allocation, outcomes }) => {
  const entityName = entityProfile?.name || 'your brand';
  const goal = entityProfile?.goals || 'growth';
  const channelLines = topChannels.slice(0, 3).map(buildChannelStatement).join(' ');
  const totals = outcomes?.totals || { reach: 0, awareness: 0, leads: 0, sales: 0 };
  const outcomeLine = [
    formatOutcome('Reach', totals.reach || 0),
    formatOutcome('Awareness', totals.awareness || 0),
    formatOutcome('Leads', totals.leads || 0),
    formatOutcome('Sales', totals.sales || 0)
  ].join(' · ');

  const budgetLine = allocation?.length
    ? `Budget leaning ${Math.round(allocation[0].budget.avg)} USD towards ${allocation[0].name}, with healthy support for ${allocation.slice(1, 3).map((item) => item.name).join(' & ')}.`
    : 'Budget currently balanced across active channels.';

  return `For ${entityName}, the CORE engine targets ${goal} outcomes. ${channelLines} ${budgetLine} Expected outcomes → ${outcomeLine}.`;
};

const generateRecommendations = async (payload) => {
  return generateSummary(payload);
};

module.exports = {
  generateRecommendations
};


