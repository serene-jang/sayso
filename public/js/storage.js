const CONTACTS_STORAGE_KEY = 'sayso_contacts';

function loadContacts() {
  try {
    const contacts = JSON.parse(localStorage.getItem(CONTACTS_STORAGE_KEY) || '[]');
    return Array.isArray(contacts) ? contacts : [];
  } catch {
    return [];
  }
}

function saveContact(contact) {
  const contacts = loadContacts();
  const existingIndex = contacts.findIndex((item) => item.name === contact.name);
  const savedContact = {
    ...contact,
    id: existingIndex >= 0 ? contacts[existingIndex].id : (crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`),
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    contacts[existingIndex] = savedContact;
  } else {
    contacts.unshift(savedContact);
  }

  localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
  return savedContact;
}

function deleteContact(contactId) {
  const contacts = loadContacts().filter((contact) => contact.id !== contactId);
  localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
}
