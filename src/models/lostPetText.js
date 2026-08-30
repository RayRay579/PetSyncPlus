const LOST_PET_META_PREFIX = '__petsync_lost_pet_meta__';

const parseLostPetDescription = (description) => {
  const text = String(description || '');
  const [firstLine, ...rest] = text.split('\n');

  if (!firstLine.startsWith(LOST_PET_META_PREFIX)) {
    return {
      description: text.trim(),
      contactPhone: '',
      reward: '',
    };
  }

  const metaParts = firstLine.slice(LOST_PET_META_PREFIX.length).split(';');
  const meta = metaParts.reduce((acc, part) => {
    const [rawKey, ...rawValue] = String(part || '').split('=');
    const key = String(rawKey || '').trim();
    const value = rawValue.join('=').trim();

    if (!key || !value) return acc;
    acc[key] = value;
    return acc;
  }, {});

  return {
    description: rest.join('\n').trim(),
    contactPhone: meta.contactPhone || '',
    reward: meta.reward || '',
  };
};

const buildLostPetStoredDescription = ({ description, contactPhone, reward }) => {
  const metaParts = [];

  if (contactPhone) {
    metaParts.push(`contactPhone=${String(contactPhone).trim()}`);
  }

  if (reward) {
    metaParts.push(`reward=${String(reward).trim()}`);
  }

  const visibleDescription = String(description || '').trim();

  if (metaParts.length === 0) {
    return visibleDescription;
  }

  return `${LOST_PET_META_PREFIX}${metaParts.join(';')}\n${visibleDescription}`.trim();
};

const buildLostPetContactLine = (contactPhone, reward) => {
  const parts = [];
  if (contactPhone) parts.push(`Contact: ${contactPhone}`);
  if (reward) parts.push(`Reward: ${reward}`);
  return parts.join(' ? ');
};

const buildProfileText = ({ pet, report, contactPhone, reward }) => {
  const lines = [
    'Lost Pet SOS',
    '',
    `Pet: ${pet?.name || report?.petName || 'Unknown'}`,
    pet?.breed || report?.breed ? `Breed: ${pet?.breed || report?.breed || ''}` : '',
    pet?.species || report?.species ? `Type: ${pet?.species || report?.species || ''}` : '',
    report?.lastSeenLocation ? `Last seen: ${report.lastSeenLocation}` : '',
    report?.description ? `Features: ${report.description}` : '',
    buildLostPetContactLine(contactPhone, reward),
  ].filter(Boolean);

  return lines.join('\n');
};

const buildFlyerText = ({ pet, report, contactPhone, reward }) => {
  const lines = [
    'LOST PET ALERT',
    '',
    `Name: ${pet?.name || report?.petName || 'Unknown'}`,
    pet?.breed || report?.breed ? `Breed: ${pet?.breed || report?.breed || ''}` : '',
    pet?.species || report?.species ? `Type: ${pet?.species || report?.species || ''}` : '',
    report?.lastSeenLocation ? `Last seen: ${report.lastSeenLocation}` : '',
    report?.description ? `Identifying features: ${report.description}` : '',
    buildLostPetContactLine(contactPhone, reward),
    '',
    'Please share this flyer and contact the owner right away if seen.',
  ].filter(Boolean);

  return lines.join('\n');
};

export {
  LOST_PET_META_PREFIX,
  parseLostPetDescription,
  buildLostPetStoredDescription,
  buildLostPetContactLine,
  buildProfileText,
  buildFlyerText,
};
