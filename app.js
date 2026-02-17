const STORAGE_KEY = "splitwise-lite-state";

const memberForm = document.getElementById("member-form");
const memberNameInput = document.getElementById("member-name");
const memberList = document.getElementById("member-list");
const expenseForm = document.getElementById("expense-form");
const expenseTitleInput = document.getElementById("expense-title");
const expenseAmountInput = document.getElementById("expense-amount");
const paidBySelect = document.getElementById("paid-by");
const participantsContainer = document.getElementById("participants");
const expenseList = document.getElementById("expense-list");
const balanceList = document.getElementById("balance-list");

let state = loadState();

function loadState() {
  const empty = { members: [], expenses: [] };
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return empty;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.members) || !Array.isArray(parsed.expenses)) {
      return empty;
    }
    return parsed;
  } catch {
    return empty;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  return crypto.randomUUID();
}

function addMember(name) {
  const cleaned = name.trim();
  if (!cleaned) return;
  if (state.members.some((m) => m.name.toLowerCase() === cleaned.toLowerCase())) return;

  state.members.push({ id: uid(), name: cleaned });
  saveState();
  render();
}

function removeMember(id) {
  state.members = state.members.filter((m) => m.id !== id);
  state.expenses = state.expenses.filter((e) => e.paidBy !== id && !e.participants.includes(id));
  saveState();
  render();
}

function addExpense(title, amount, paidBy, participants) {
  if (!title.trim() || Number.isNaN(amount) || amount <= 0 || !paidBy || participants.length === 0) {
    return;
  }

  state.expenses.push({
    id: uid(),
    title: title.trim(),
    amount,
    paidBy,
    participants,
    createdAt: Date.now(),
  });

  saveState();
  render();
}

function calculateBalances() {
  const balances = Object.fromEntries(state.members.map((m) => [m.id, 0]));

  for (const expense of state.expenses) {
    if (!expense.participants.length) continue;
    const share = expense.amount / expense.participants.length;
    balances[expense.paidBy] += expense.amount;
    for (const participantId of expense.participants) {
      balances[participantId] -= share;
    }
  }

  return balances;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function renderMembers() {
  memberList.innerHTML = "";
  for (const member of state.members) {
    const li = document.createElement("li");
    li.textContent = member.name;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "remove-btn";
    button.textContent = "✕";
    button.addEventListener("click", () => removeMember(member.id));

    li.appendChild(button);
    memberList.appendChild(li);
  }
}

function renderPaidByAndParticipants() {
  paidBySelect.innerHTML = "";
  participantsContainer.innerHTML = "";

  for (const member of state.members) {
    const option = document.createElement("option");
    option.value = member.id;
    option.textContent = member.name;
    paidBySelect.appendChild(option);

    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = member.id;
    checkbox.checked = true;
    label.append(checkbox, member.name);
    participantsContainer.appendChild(label);
  }
}

function renderExpenses() {
  expenseList.innerHTML = "";

  if (state.expenses.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No expenses yet.";
    expenseList.appendChild(li);
    return;
  }

  for (const expense of [...state.expenses].sort((a, b) => b.createdAt - a.createdAt)) {
    const paidBy = state.members.find((m) => m.id === expense.paidBy)?.name ?? "Unknown";
    const participantNames = expense.participants
      .map((id) => state.members.find((m) => m.id === id)?.name)
      .filter(Boolean)
      .join(", ");

    const li = document.createElement("li");
    li.textContent = `${expense.title}: ${formatCurrency(expense.amount)} paid by ${paidBy} · split with ${participantNames}`;
    expenseList.appendChild(li);
  }
}

function renderBalances() {
  balanceList.innerHTML = "";

  if (state.members.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Add members to start splitting expenses.";
    balanceList.appendChild(li);
    return;
  }

  const balances = calculateBalances();
  for (const member of state.members) {
    const amount = balances[member.id] ?? 0;
    const li = document.createElement("li");
    const cls = amount >= 0 ? "positive" : "negative";
    li.innerHTML = `<strong>${member.name}</strong>: <span class="${cls}">${formatCurrency(amount)}</span>`;
    balanceList.appendChild(li);
  }
}

function render() {
  renderMembers();
  renderPaidByAndParticipants();
  renderExpenses();
  renderBalances();
}

memberForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addMember(memberNameInput.value);
  memberNameInput.value = "";
  memberNameInput.focus();
});

expenseForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const checkedParticipants = [...participantsContainer.querySelectorAll("input:checked")].map(
    (input) => input.value,
  );

  addExpense(
    expenseTitleInput.value,
    Number.parseFloat(expenseAmountInput.value),
    paidBySelect.value,
    checkedParticipants,
  );

  expenseTitleInput.value = "";
  expenseAmountInput.value = "";
});

render();
