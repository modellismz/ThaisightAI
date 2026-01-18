
import { db } from '../src/db';

const MOCK_SURVEYS = [
    {
        title: 'ความพึงพอใจภาพรวมการใช้บริการเซ็นทรัล (General Satisfaction)',
        description: 'แบบสอบถามเพื่อประเมินความพึงพอใจในการใช้บริการห้างสรรพสินค้าเซ็นทรัลในภาพรวม ทั้งด้านสินค้า บรรยากาศ และการบริการ',
        defaultLanguage: 'th'
    },
    {
        title: 'ความพึงพอใจการใช้บริการศูนย์อาหาร (Food Court)',
        description: 'ขอความคิดเห็นเกี่ยวกับการให้บริการ รสชาติอาหาร และความสะอาดของศูนย์อาหาร',
        defaultLanguage: 'th'
    },
    {
        title: 'การให้บริการของพนักงาน (Customer Service)',
        description: 'แบบสอบถามความพึงพอใจต่อการให้บริการของพนักงานขายและประชาสัมพันธ์',
        defaultLanguage: 'th'
    },
    {
        title: 'ความสะดวกในการจอดรถ (Parking)',
        description: 'สำรวจความคิดเห็นเรื่องความเพียงพอและความสะดวกสบายของพื้นที่จอดรถ',
        defaultLanguage: 'th'
    },
    {
        title: 'ความสะอาดและสุขอนามัย (Cleanliness & Hygiene)',
        description: 'แบบสอบถามเรื่องความสะอาดของพื้นที่ส่วนกลางและห้องน้ำภายในห้างสรรพสินค้า',
        defaultLanguage: 'th'
    }
];

async function main() {
    console.log('Starting seed surveys...');

    // Get the first organization to assign surveys to
    let org = (await db.organizations.list())[0];
    if (!org) {
        console.log('No organization found. Creating default organization...');
        org = await db.organizations.create('Central Group', 'central-group');
    }

    const orgId = org.id;
    console.log(`Using Organization ID: ${orgId}`);

    for (const surveyData of MOCK_SURVEYS) {
        console.log(`Creating survey: ${surveyData.title}`);
        try {
            const survey = await db.surveys.create({ ...surveyData, orgId });
            console.log(`✓ Created survey ID: ${survey.id}`);

            // Optional: Publish them or add initial content if needed in the future
            // For now, just creating them as drafts is sufficient.
        } catch (error) {
            console.error(`Error creating survey ${surveyData.title}:`, error);
        }
    }

    console.log('Seed completed.');
    process.exit(0);
}

main().catch(console.error);
