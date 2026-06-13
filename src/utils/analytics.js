const calculateSummary = (transactions) => {
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach(t => {
    const amount = Number(t.amount) || 0;
    if (t.type === 'income') {
      totalIncome += amount;
    } else if (t.type === 'expense') {
      totalExpense += amount;
    }
  });

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    transactionCount: transactions.length
  };
};

const getCategoryWiseExpenses = (transactions) => {
  const expenseMap = {};

  transactions.forEach(t => {
    if (t.type === 'expense') {
      const amount = Number(t.amount) || 0;
      expenseMap[t.category] = (expenseMap[t.category] || 0) + amount;
    }
  });

  return Object.keys(expenseMap).map(category => ({
    category,
    total: expenseMap[category]
  }));
};

const getMonthlyTrends = (transactions) => {
  const monthlyData = {};

  transactions.forEach(t => {
    if (!t.date) return;
    const parts = t.date.split('-');
    if (parts.length < 2) return;
    const monthKey = `${parts[0]}-${parts[1]}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expense: 0 };
    }

    const amount = Number(t.amount) || 0;
    if (t.type === 'income') {
      monthlyData[monthKey].income += amount;
    } else if (t.type === 'expense') {
      monthlyData[monthKey].expense += amount;
    }
  });

  const trends = Object.keys(monthlyData).map(month => {
    const { income, expense } = monthlyData[month];
    return {
      month,
      income,
      expense,
      balance: income - expense
    };
  });

  return trends.sort((a, b) => a.month.localeCompare(b.month));
};

const getTopCategories = (transactions, limit) => {
  const expenseMap = {};

  transactions.forEach(t => {
    if (t.type === 'expense') {
      const amount = Number(t.amount) || 0;
      expenseMap[t.category] = (expenseMap[t.category] || 0) + amount;
    }
  });

  const categoriesList = Object.keys(expenseMap).map(category => ({
    category,
    amount: expenseMap[category]
  }));

  categoriesList.sort((a, b) => b.amount - a.amount);

  if (limit !== undefined && limit !== null) {
    const numLimit = parseInt(limit, 10);
    if (!isNaN(numLimit) && numLimit > 0) {
      return categoriesList.slice(0, numLimit);
    }
  }

  return categoriesList;
};

module.exports = {
  calculateSummary,
  getCategoryWiseExpenses,
  getMonthlyTrends,
  getTopCategories
};

