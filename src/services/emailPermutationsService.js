function generateEmailPermutations({ firstName, lastName, domain }) {
  if (!firstName || !lastName || !domain) return [];

  const first = firstName.toLowerCase();
  const last = lastName.toLowerCase();
  const initial = first[0];
  const lastInitial = last[0];

  const separators = ["", "."];
  const emails = new Set();

  separators.forEach((sep) => {
    emails.add(`${first}${sep}${last}@${domain}`);
    emails.add(`${last}${sep}${first}@${domain}`);
    emails.add(`${initial}${sep}${last}@${domain}`);
    emails.add(`${first}${sep}${lastInitial}@${domain}`);
    emails.add(`${first}@${domain}`);
    emails.add(`${last}@${domain}`);
    emails.add(`${initial}${last}@${domain}`);
    emails.add(`${first}${lastInitial}@${domain}`);
  });

  return [...emails];
}


module.exports = {
  generateEmailPermutations,
};
  
