export const getHealthRecordIcon = (type) => {
  const iconMap = {
    vaccination: 'needle',
    medication: 'pill',
    appointment: 'calendar-clock',
    weight: 'scale-bathroom',
    symptom: 'alert-circle-outline',
    surgery: 'scalpel',
    allergy: 'allergy',
    diagnosis: 'file-document-outline',
    lab: 'test-tube',
    fish: 'fish',
    imported_file: 'file-import-outline',
  };

  return iconMap[type] || 'file-document-outline';
};

export const getHealthRecordNotes = (type, details = {}, fallback = '') => {
  const detailMap = {
    vaccination: details.vaccineNotes,
    medication: details.medicationNotes,
    appointment: details.appointmentNotes,
    weight: details.weightNotes,
    symptom: details.symptomNotes,
    surgery: details.recoveryNotes,
    allergy: details.allergyNotes,
    diagnosis: details.diagnosisNotes,
    lab: details.labNotes,
    fish: details.readingNotes,
  };

  return String(detailMap[type] || fallback || '').trim();
};

export const normalizeHealthRecordFromSupabase = (row) => ({
  id: row.id,
  petId: row.pet_id,
  type: row.type,
  title: row.title,
  date: row.record_date,
  nextDue: row.next_due,
  details: row.details || {},
  notes: row.notes || '',
  icon: getHealthRecordIcon(row.type),
  status: 'current',
  fileUri:
    row.type === 'imported_file'
      ? (row.details?.fileUrl || row.details?.fileUri || row.details?.file_uri || '')
      : '',
  fileUrl:
    row.type === 'imported_file'
      ? (row.details?.fileUrl || row.details?.fileUri || row.details?.file_uri || '')
      : '',
  filePath:
    row.type === 'imported_file'
      ? (row.details?.filePath || row.details?.file_path || '')
      : '',
  fileName:
    row.type === 'imported_file'
      ? (row.details?.fileName || row.title || '')
      : '',
  mimeType:
    row.type === 'imported_file'
      ? (row.details?.mimeType || row.details?.mime_type || '')
      : '',
  size:
    row.type === 'imported_file'
      ? (row.details?.size || null)
      : null,
  provider:
    row.details?.provider ||
    row.details?.providerClinic ||
    row.details?.vetClinic ||
    row.details?.prescribingVet ||
    row.details?.diagnosisVet ||
    row.details?.labVet ||
    row.details?.clinicVet ||
    '',
});
