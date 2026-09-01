export const createCalculateAgeLabelFromBirthday = ({} = {}) => {
const calculateAgeLabelFromBirthday = (birthdayKey) => {
  if (!birthdayKey || !/^\d{4}-\d{2}-\d{2}$/.test(birthdayKey)) return '';

  const [year, month, day] = birthdayKey.split('-').map(Number);
  const birthDate = new Date(year, month - 1, day);
  if (Number.isNaN(birthDate.getTime())) return '';

  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    years -= 1;
  }

  if (years >= 1) {
    return `${years} yr${years === 1 ? '' : 's'}`;
  }

  const months = Math.max(
    1,
    (today.getFullYear() - birthDate.getFullYear()) * 12
      + (today.getMonth() - birthDate.getMonth())
      - (today.getDate() < birthDate.getDate() ? 1 : 0)
  );

  return `${months} mo${months === 1 ? '' : 's'}`;
};
  return calculateAgeLabelFromBirthday;
};
