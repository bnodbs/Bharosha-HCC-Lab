import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const testsData = [
    {
      code: 'CBC',
      name: 'Complete Blood Count (CBC)',
      category: 'Hematology',
      displayOrder: 1,
      parameters: [
        { name: 'Hemoglobin', unit: 'g/dL', dataType: 'NUMERIC' },
        { name: 'RBC Count', unit: 'millions/cu.mm', dataType: 'NUMERIC' },
        { name: 'Total Leukocyte Count (WBC)', shortName: 'TLC', unit: 'cells/cu.mm', dataType: 'NUMERIC' },
        { name: 'Platelet Count', unit: 'lakhs/cu.mm', dataType: 'NUMERIC' },
        { name: 'Hematocrit (PCV)', shortName: 'PCV', unit: '%', dataType: 'NUMERIC' },
        { name: 'MCV', unit: 'fL', dataType: 'NUMERIC' },
        { name: 'MCH', unit: 'pg', dataType: 'NUMERIC' },
        { name: 'MCHC', unit: 'g/dL', dataType: 'NUMERIC' },
        { name: 'RDW-CV', shortName: 'RDW', unit: '%', dataType: 'NUMERIC' },
        { name: 'Neutrophils', unit: '%', dataType: 'NUMERIC' },
        { name: 'Lymphocytes', unit: '%', dataType: 'NUMERIC' },
        { name: 'Monocytes', unit: '%', dataType: 'NUMERIC' },
        { name: 'Eosinophils', unit: '%', dataType: 'NUMERIC' },
        { name: 'Basophils', unit: '%', dataType: 'NUMERIC' },
      ],
    },
    {
      code: 'RFT',
      name: 'Renal Function Test (RFT)',
      category: 'Biochemistry',
      displayOrder: 2,
      parameters: [
        { name: 'Urea', unit: 'mg/dL', dataType: 'NUMERIC' },
        { name: 'Creatinine', unit: 'mg/dL', dataType: 'NUMERIC' },
        { name: 'Uric Acid', unit: 'mg/dL', dataType: 'NUMERIC' },
        { name: 'Sodium', unit: 'mEq/L', dataType: 'NUMERIC' },
        { name: 'Potassium', unit: 'mEq/L', dataType: 'NUMERIC' },
        { name: 'Chloride', unit: 'mEq/L', dataType: 'NUMERIC' },
        { name: 'Calcium', unit: 'mg/dL', dataType: 'NUMERIC' },
      ],
    },
    {
      code: 'BS',
      name: 'Blood Sugar',
      category: 'Biochemistry',
      displayOrder: 3,
      parameters: [
        { name: 'Fasting Blood Sugar', shortName: 'FBS', unit: 'mg/dL', dataType: 'NUMERIC' },
        { name: 'Postprandial Blood Sugar', shortName: 'PPBS', unit: 'mg/dL', dataType: 'NUMERIC' },
        { name: 'Random Blood Sugar', shortName: 'RBS', unit: 'mg/dL', dataType: 'NUMERIC' },
      ],
    },
    {
      code: 'LFT',
      name: 'Liver Function Test (LFT)',
      category: 'Biochemistry',
      displayOrder: 4,
      parameters: [
        { name: 'Total Bilirubin', unit: 'mg/dL', dataType: 'NUMERIC' },
        { name: 'Direct Bilirubin', unit: 'mg/dL', dataType: 'NUMERIC' },
        { name: 'Indirect Bilirubin', unit: 'mg/dL', dataType: 'NUMERIC' },
        { name: 'AST / SGOT', shortName: 'AST', unit: 'U/L', dataType: 'NUMERIC' },
        { name: 'ALT / SGPT', shortName: 'ALT', unit: 'U/L', dataType: 'NUMERIC' },
        { name: 'ALP', unit: 'U/L', dataType: 'NUMERIC' },
        { name: 'Total Protein', unit: 'g/dL', dataType: 'NUMERIC' },
        { name: 'Albumin', unit: 'g/dL', dataType: 'NUMERIC' },
        { name: 'Globulin', unit: 'g/dL', dataType: 'NUMERIC' },
        { name: 'A/G Ratio', dataType: 'NUMERIC' },
      ],
    },
    {
      code: 'LIPID',
      name: 'Lipid Profile',
      category: 'Biochemistry',
      displayOrder: 5,
      parameters: [
        { name: 'Total Cholesterol', unit: 'mg/dL', dataType: 'NUMERIC' },
        { name: 'Triglycerides', unit: 'mg/dL', dataType: 'NUMERIC' },
        { name: 'HDL Cholesterol', unit: 'mg/dL', dataType: 'NUMERIC' },
        { name: 'LDL Cholesterol', unit: 'mg/dL', dataType: 'NUMERIC' },
        { name: 'VLDL Cholesterol', unit: 'mg/dL', dataType: 'NUMERIC' },
        { name: 'Total Cholesterol / HDL Ratio', dataType: 'NUMERIC' },
      ],
    },
    {
      code: 'URINE_RME',
      name: 'Urine RME',
      category: 'Urine',
      displayOrder: 6,
      parameters: [
        { name: 'Colour', dataType: 'TEXT' },
        { name: 'Appearance', dataType: 'TEXT' },
        { name: 'Specific Gravity', dataType: 'TEXT' },
        { name: 'pH', dataType: 'TEXT' },
        { name: 'Protein', dataType: 'SELECT' }, // Options like Trace, 1+, etc can be mapped later
        { name: 'Glucose', dataType: 'SELECT' },
        { name: 'Ketone', dataType: 'SELECT' },
        { name: 'Bilirubin', dataType: 'SELECT' },
        { name: 'Urobilinogen', dataType: 'SELECT' },
        { name: 'Blood', dataType: 'SELECT' },
        { name: 'Nitrite', dataType: 'SELECT' },
        { name: 'Leukocyte Esterase', dataType: 'SELECT' },
        { name: 'RBC', unit: '/HPF', dataType: 'TEXT' },
        { name: 'WBC / Pus Cells', unit: '/HPF', dataType: 'TEXT' },
        { name: 'Epithelial Cells', unit: '/HPF', dataType: 'TEXT' },
        { name: 'Crystals', dataType: 'TEXT' },
        { name: 'Casts', dataType: 'TEXT' },
        { name: 'Bacteria', dataType: 'TEXT' },
        { name: 'Yeast', dataType: 'TEXT' },
        { name: 'Other', dataType: 'TEXT' },
      ],
    },
    {
      code: 'STOOL_RME',
      name: 'Stool RME',
      category: 'Stool',
      displayOrder: 7,
      parameters: [
        { name: 'Colour', dataType: 'TEXT' },
        { name: 'Consistency', dataType: 'TEXT' },
        { name: 'Blood', dataType: 'SELECT' },
        { name: 'Mucus', dataType: 'SELECT' },
        { name: 'Ova', dataType: 'TEXT' },
        { name: 'Cyst', dataType: 'TEXT' },
        { name: 'Parasites', dataType: 'TEXT' },
        { name: 'RBC', unit: '/HPF', dataType: 'TEXT' },
        { name: 'Pus Cells', unit: '/HPF', dataType: 'TEXT' },
        { name: 'Other', dataType: 'TEXT' },
      ],
    },
    {
      code: 'CRP',
      name: 'C-Reactive Protein (CRP)',
      category: 'Serology',
      displayOrder: 8,
      parameters: [
        { name: 'CRP', unit: 'mg/L', dataType: 'NUMERIC' }, // Support quantitative
      ],
    },
    {
      code: 'ESR',
      name: 'Erythrocyte Sedimentation Rate (ESR)',
      category: 'Hematology',
      displayOrder: 9,
      parameters: [
        { name: 'ESR', unit: 'mm/hr', dataType: 'NUMERIC' },
      ],
    },
    {
      code: 'HBA1C',
      name: 'HbA1c',
      category: 'Diabetes',
      displayOrder: 10,
      parameters: [
        { name: 'HbA1c', unit: '%', dataType: 'NUMERIC' },
      ],
    },
    {
      code: 'UPT',
      name: 'Urine Pregnancy Test',
      category: 'Other',
      displayOrder: 11,
      parameters: [
        { name: 'Result', dataType: 'POSITIVE_NEGATIVE' },
      ],
    },
    {
      code: 'WIDAL',
      name: 'Widal Test',
      category: 'Serology',
      displayOrder: 12,
      parameters: [
        { name: 'Salmonella typhi O', dataType: 'SELECT' }, // For titer selection
        { name: 'Salmonella typhi H', dataType: 'SELECT' },
        { name: 'Salmonella paratyphi AH', dataType: 'SELECT' },
        { name: 'Salmonella paratyphi BH', dataType: 'SELECT' },
      ],
    },
    {
      code: 'TYPHOID_IGG_IGM',
      name: 'Typhoid IgG / IgM',
      category: 'Serology',
      displayOrder: 13,
      parameters: [
        { name: 'Typhoid IgG', dataType: 'POSITIVE_NEGATIVE' },
        { name: 'Typhoid IgM', dataType: 'POSITIVE_NEGATIVE' },
      ],
    },
    {
      code: 'MALARIA',
      name: 'Malaria',
      category: 'Serology',
      displayOrder: 14,
      parameters: [
        { name: 'Result', dataType: 'POSITIVE_NEGATIVE' },
        { name: 'Details', dataType: 'TEXT' },
      ],
    },
    {
      code: 'DENGUE',
      name: 'Dengue Profile',
      category: 'Serology',
      displayOrder: 15,
      parameters: [
        { name: 'Dengue NS1', dataType: 'POSITIVE_NEGATIVE' },
        { name: 'Dengue IgG', dataType: 'POSITIVE_NEGATIVE' },
        { name: 'Dengue IgM', dataType: 'POSITIVE_NEGATIVE' },
      ],
    },
    {
      code: 'HIV',
      name: 'HIV Screening',
      category: 'Immunology',
      displayOrder: 16,
      parameters: [
        { name: 'Result', dataType: 'POSITIVE_NEGATIVE' },
      ],
    },
    {
      code: 'HBSAG',
      name: 'HBsAg',
      category: 'Immunology',
      displayOrder: 17,
      parameters: [
        { name: 'Result', dataType: 'POSITIVE_NEGATIVE' },
      ],
    },
    {
      code: 'HCV',
      name: 'HCV Screening',
      category: 'Immunology',
      displayOrder: 18,
      parameters: [
        { name: 'Result', dataType: 'POSITIVE_NEGATIVE' },
      ],
    },
    {
      code: 'H_PYLORI',
      name: 'H. Pylori',
      category: 'Immunology',
      displayOrder: 19,
      parameters: [
        { name: 'H. pylori Antibody', dataType: 'POSITIVE_NEGATIVE' },
        { name: 'H. pylori Antigen', dataType: 'POSITIVE_NEGATIVE' },
      ],
    },
  ];

  for (const test of testsData) {
    const { parameters, ...testFields } = test;

    // UPSERT ensures idempotency. It will create if not found, or update if found.
    const createdTest = await prisma.test.upsert({
      where: { code: test.code },
      update: testFields,
      create: testFields,
    });

    console.log(`Upserted Test: ${createdTest.name} (${createdTest.code})`);

    // Add parameters idempotenly (using name + testId as a proxy for unique matching, though we don't have a unique constraint on it)
    // We fetch existing parameters to avoid duplicates
    const existingParams = await prisma.testParameter.findMany({
        where: { testId: createdTest.id }
    });

    for (let i = 0; i < parameters.length; i++) {
        const param = parameters[i];
        const existingParam = existingParams.find(p => p.name === param.name);

        if (existingParam) {
            await prisma.testParameter.update({
                where: { id: existingParam.id },
                data: { ...param, orderIndex: i }
            });
        } else {
             await prisma.testParameter.create({
                data: {
                    testId: createdTest.id,
                    ...param,
                    orderIndex: i
                }
             })
        }
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
