const data = {
  patientId: 'PAT-1001',
  modality: 'CT',
  bodyRegion: 'HEAD_BRAIN',
  examinationCode: 'CT_BRAIN_NC',
  examinationName: 'CT Brain Without Contrast',
  contrast: 'WITHOUT_CONTRAST',
  clinicalIndication: 'Severe acute onset headache',
  referringDoctor: 'Dr. Sarah Jenkins (Neurology)',
  protocol: 'Axial 5mm non-contrast brain',
  additionalNotes: 'Stat read requested'
};

fetch('http://localhost:5000/api/examinations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
  .then(res => res.json())
  .then(json => {
    console.log('Examination Order Created:');
    console.log('Order ID:', json.data.orderId);
    console.log('Accession Number:', json.data.accessionNumber);
    console.log('Workflow Status:', json.data.workflowStatus);
    console.log('Patient:', json.data.patientName, `(${json.data.patientId})`);
  })
  .catch(err => console.error('Error:', err));
