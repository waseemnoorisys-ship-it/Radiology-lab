import { connectDB, disconnectDB } from '../config/db.js';
import { ExaminationOrder } from '../models/ExaminationOrder.js';
import { Patient } from '../models/Patient.js';

async function seedMore() {
  await connectDB();

  const jane = await Patient.findOne({ patientId: 'PAT-1002' });
  if (!jane) {
    console.log('Jane not found');
    await disconnectDB();
    return;
  }

  // 1. Create MR Lumbar Spine
  const mrExisting = await ExaminationOrder.findOne({ accessionNumber: 'ACC-20261022-7721' });
  if (!mrExisting) {
    await ExaminationOrder.create({
      orderId: 'ORD-20261022-7721',
      accessionNumber: 'ACC-20261022-7721',
      patient: jane._id,
      patientId: jane.patientId,
      patientName: jane.fullName,
      modality: 'MR',
      bodyRegion: 'SPINE_LUMBAR',
      examinationCode: 'MR_LUMBAR_SPINE_NC',
      examinationName: 'MRI Lumbar Spine Without Contrast',
      laterality: 'NOT_APPLICABLE',
      contrast: 'WITHOUT_CONTRAST',
      protocol: 'Sagittal T1, T2; Axial T2 4mm',
      clinicalIndication: 'Chronic severe lower back pain radiating down left L5 dermatome',
      referringDoctor: 'Dr. Sarah Jenkins (Neurology)',
      performingFacility: 'Main Radiology Suite',
      additionalNotes: 'Patient has mild claustrophobia; wide-bore scanner used',
      workflowStatus: 'PENDING_UPLOAD',
      imageAvailability: 'NO_IMAGES',
    });
    console.log('Created MR order');
  }

  // 2. Create Ultrasound Abdomen
  const usExisting = await ExaminationOrder.findOne({ accessionNumber: 'ACC-20261022-9142' });
  if (!usExisting) {
    await ExaminationOrder.create({
      orderId: 'ORD-20261022-9142',
      accessionNumber: 'ACC-20261022-9142',
      patient: jane._id,
      patientId: jane.patientId,
      patientName: jane.fullName,
      modality: 'US',
      bodyRegion: 'ABDOMEN_PELVIS',
      examinationCode: 'US_ABDOMEN_COMPLETE',
      examinationName: 'Ultrasound Abdomen Complete',
      laterality: 'NOT_APPLICABLE',
      contrast: 'NOT_APPLICABLE',
      protocol: 'Complete abdominal survey with biliary tree assessment',
      clinicalIndication: 'Right upper quadrant pain post-prandial, rule out cholelithiasis',
      referringDoctor: 'Dr. Marcus Vance (Internal Medicine)',
      performingFacility: 'Main Radiology Suite',
      additionalNotes: 'Fasting 8 hours confirmed',
      workflowStatus: 'PENDING_UPLOAD',
      imageAvailability: 'NO_IMAGES',
    });
    console.log('Created US order');
  }

  await disconnectDB();
  console.log('Seeding finished successfully');
}

seedMore().catch(err => {
  console.error(err);
  process.exit(1);
});
