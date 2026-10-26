import { connectDB, disconnectDB } from '../config/db.js';
import { Patient } from '../models/Patient.js';
import { ExaminationOrder } from '../models/ExaminationOrder.js';
import { ModalityMaster } from '../models/ModalityMaster.js';
import { BodyRegionMaster } from '../models/BodyRegionMaster.js';
import { ExaminationMaster } from '../models/ExaminationMaster.js';
import { ReportTemplate } from '../models/ReportTemplate.js';
import { SupportingMaster } from '../models/SupportingMaster.js';
import {
  modalitiesData,
  bodyRegionsData,
  examinationsData,
  reportTemplatesData,
  supportingMastersData,
} from './masterData.js';

export async function runSeed() {
  console.log('[Seed] Starting complete database seed...');
  await connectDB();

  try {
    // 1. Seed Modalities
    for (const item of modalitiesData) {
      await ModalityMaster.findOneAndUpdate({ code: item.code }, item, { upsert: true, new: true });
    }
    console.log(`[Seed] Seeded ${modalitiesData.length} Modalities`);

    // 2. Seed Body Regions
    for (const item of bodyRegionsData) {
      await BodyRegionMaster.findOneAndUpdate({ code: item.code }, item, { upsert: true, new: true });
    }
    console.log(`[Seed] Seeded ${bodyRegionsData.length} Body Regions`);

    // 3. Seed Examinations
    for (const item of examinationsData) {
      await ExaminationMaster.findOneAndUpdate({ code: item.code }, item, { upsert: true, new: true });
    }
    console.log(`[Seed] Seeded ${examinationsData.length} Examination Catalogs`);

    // 4. Seed Report Templates
    for (const item of reportTemplatesData) {
      await ReportTemplate.findOneAndUpdate({ templateCode: item.templateCode }, item, { upsert: true, new: true });
    }
    console.log(`[Seed] Seeded ${reportTemplatesData.length} Dynamic Report Templates`);

    // 5. Seed Supporting Masters (Doctors, Facilities, Departments)
    for (const item of supportingMastersData) {
      await SupportingMaster.findOneAndUpdate({ category: item.category, code: item.code }, item, { upsert: true, new: true });
    }
    console.log(`[Seed] Seeded ${supportingMastersData.length} Supporting Masters`);

    // 6. Seed Demo Patients
    const demoPatients = [
      {
        patientId: 'PAT-1001',
        fullName: 'John Doe',
        dateOfBirth: new Date('1981-05-14'),
        age: 45,
        gender: 'M',
        contactPhone: '+1-555-0199',
        email: 'john.doe@example.com',
        address: '123 Health Ave, Medical District',
      },
      {
        patientId: 'PAT-1002',
        fullName: 'Jane Smith',
        dateOfBirth: new Date('1990-11-23'),
        age: 35,
        gender: 'F',
        contactPhone: '+1-555-0244',
        email: 'jane.smith@example.com',
        address: '456 Oakwood Terrace',
      },
    ];

    for (const p of demoPatients) {
      await Patient.findOneAndUpdate({ patientId: p.patientId }, p, { upsert: true, new: true });
    }
    console.log(`[Seed] Seeded ${demoPatients.length} Demo Patients`);

    console.log('[Seed] Master data seeding completed successfully!');
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
    throw error;
  }
}

// Execute standalone if directly invoked
if (process.argv[1]?.includes('seed.ts') || process.argv[1]?.includes('seed.js')) {
  runSeed()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async () => {
      await disconnectDB();
      process.exit(1);
    });
}
