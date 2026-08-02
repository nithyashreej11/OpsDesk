const KEYWORDS = {
  Critical: ['server down', 'outage', 'production down', 'data loss', 'security breach', 'cannot access'],
  High: ['not working', 'cannot login', 'crash', 'urgent', 'broken'],
  Medium: ['slow', 'error', 'issue', 'bug'],
  Low: ['minor', 'cosmetic', 'request', 'question'],
};

const CATEGORY_KEYWORDS = {
  Network: ['wifi', 'network', 'internet', 'connection', 'vpn'],
  Hardware: ['laptop', 'monitor', 'printer', 'mouse', 'keyboard', 'device'],
  Software: ['app', 'application', 'software', 'install', 'update', 'bug'],
  Account: ['login', 'password', 'account', 'access', 'permission'],
};

function classifyTicket(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  let priority = 'Medium';
  for (const level of ['Critical', 'High', 'Medium', 'Low']) {
    if (KEYWORDS[level].some((word) => text.includes(word))) {
      priority = level;
      break;
    }
  }

  let category = 'Other';
  for (const cat of Object.keys(CATEGORY_KEYWORDS)) {
    if (CATEGORY_KEYWORDS[cat].some((word) => text.includes(word))) {
      category = cat;
      break;
    }
  }

  return { category, priority };
}

module.exports = classifyTicket;