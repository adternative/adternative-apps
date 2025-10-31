const DEFAULT_SALES_CONVERSION = 0.25;

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const normalizeWeights = (scores) => {
  const total = scores.reduce((sum, item) => sum + Math.max(item.score || 0, 0), 0);
  if (!total) {
    const evenWeight = scores.length ? 1 / scores.length : 0;
    return scores.map((item) => ({ ...item, weight: evenWeight }));
  }
  return scores.map((item) => ({
    ...item,
    weight: Math.max(item.score || 0, 0) / total
  }));
};

const calculateBudgetDistribution = (channelScores, { minBudget = 0, maxBudget = 0 } = {}) => {
  const normalized = normalizeWeights(channelScores);
  const min = safeNumber(minBudget, 0);
  const max = Math.max(safeNumber(maxBudget, min), min);
  const midpoint = (min + max) / 2;

  return normalized.map((item) => {
    const minAllocation = min * item.weight;
    const maxAllocation = max * item.weight;
    const avgAllocation = midpoint * item.weight;

    return {
      channelId: item.channelId,
      name: item.name,
      category: item.category,
      weight: item.weight,
      budget: {
        min: Number(minAllocation.toFixed(2)),
        max: Number(maxAllocation.toFixed(2)),
        avg: Number(avgAllocation.toFixed(2))
      }
    };
  });
};

const estimateChannelOutcomes = (allocationEntry, metrics = {}) => {
  const budget = safeNumber(allocationEntry?.budget?.avg, 0);
  const avgCpm = safeNumber(metrics.avgCpm, 12);
  const avgCtr = safeNumber(metrics.avgCtr, 0.02);
  const avgConvRate = safeNumber(metrics.avgConvRate, 0.03);
  const awarenessMultiplier = safeNumber(metrics.awarenessIndex || metrics.awareness_index, 1);

  const reach = avgCpm > 0 ? (budget / avgCpm) * 1000 : 0;
  const awareness = reach * avgCtr * awarenessMultiplier;
  const leads = awareness * avgConvRate;
  const sales = leads * safeNumber(metrics.salesConversion || DEFAULT_SALES_CONVERSION, DEFAULT_SALES_CONVERSION);

  return {
    channelId: allocationEntry.channelId,
    name: allocationEntry.name,
    reach: Math.round(reach),
    awareness: Math.round(awareness),
    leads: Math.round(leads),
    sales: Math.round(sales),
    efficiency: {
      cpm: avgCpm,
      cpc: safeNumber(metrics.avgCpc, budget && awareness ? budget / awareness : 0),
      ctr: avgCtr,
      convRate: avgConvRate
    }
  };
};

const projectOutcomes = (allocations, lookupMetrics, benchmark = {}) => {
  const channelOutcomes = allocations.map((allocation) => {
    const channelMetrics = lookupMetrics(allocation.channelId) || {};
    return estimateChannelOutcomes(allocation, { ...channelMetrics, ...benchmark.metrics });
  });

  const totals = channelOutcomes.reduce((acc, outcome) => ({
    reach: acc.reach + outcome.reach,
    awareness: acc.awareness + outcome.awareness,
    leads: acc.leads + outcome.leads,
    sales: acc.sales + outcome.sales
  }), { reach: 0, awareness: 0, leads: 0, sales: 0 });

  return {
    totals,
    byChannel: channelOutcomes
  };
};

module.exports = {
  calculateBudgetDistribution,
  estimateChannelOutcomes,
  projectOutcomes
};


