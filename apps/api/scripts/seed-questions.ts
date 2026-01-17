
import { db } from '../src/db';
import { randomUUID } from 'crypto';

// Helper to generate IDs
const id = () => randomUUID();

// Define configs for each survey title
const SURVEY_CONFIGS: Record<string, any> = {
    'ความพึงพอใจภาพรวมการใช้บริการเซ็นทรัล (General Satisfaction)': {
        version: '1.0',
        settings: {},
        blocks: [
            {
                id: id(),
                title: 'ข้อมูลทั่วไป',
                questions: [
                    {
                        id: id(),
                        type: 'single_choice',
                        text: 'คุณมาใช้บริการที่สาขานี้บ่อยแค่ไหน?',
                        choices: [
                            { id: id(), text: 'ครั้งแรก' },
                            { id: id(), text: 'น้อยกว่าเดือนละครั้ง' },
                            { id: id(), text: '1-2 ครั้งต่อเดือน' },
                            { id: id(), text: '3-4 ครั้งต่อเดือน' },
                            { id: id(), text: 'มากกว่า 4 ครั้งต่อเดือน' }
                        ]
                    }
                ]
            },
            {
                id: id(),
                title: 'ประเมินความพึงพอใจ',
                questions: [
                    {
                        id: id(),
                        type: 'nps',
                        text: 'จากประสบการณ์ในวันนี้ คุณมีแนวโน้มจะแนะนำเซ็นทรัลให้เพื่อนหรือคนรู้จักมากน้อยเพียงใด?',
                        minLabel: 'ไม่แนะนำเลย',
                        maxLabel: 'แนะนำแน่นอน'
                    },
                    {
                        id: id(),
                        type: 'matrix',
                        text: 'โปรดระบุระดับความพึงพอใจในด้านต่างๆ ต่อไปนี้',
                        rows: [
                            { id: id(), text: 'ความหลากหลายของสินค้า' },
                            { id: id(), text: 'โปรโมชั่นและราคา' },
                            { id: id(), text: 'บรรยากาศภายในห้าง' },
                            { id: id(), text: 'การให้บริการของพนักงาน' }
                        ],
                        columns: [
                            { id: id(), text: 'ไม่พึงพอใจมาก', value: 1 },
                            { id: id(), text: 'ไม่พึงพอใจ', value: 2 },
                            { id: id(), text: 'ปานกลาง', value: 3 },
                            { id: id(), text: 'พึงพอใจ', value: 4 },
                            { id: id(), text: 'พึงพอใจมาก', value: 5 }
                        ]
                    }
                ]
            }
        ]
    },
    'ความพึงพอใจการใช้บริการศูนย์อาหาร (Food Court)': {
        version: '1.0',
        settings: {},
        blocks: [
            {
                id: id(),
                title: 'ประเมินศูนย์อาหาร',
                questions: [
                    {
                        id: id(),
                        type: 'slider',
                        text: 'ความสะอาดโดยรวมของบริเวณที่นั่งรับประทานอาหาร',
                        min: 0,
                        max: 10,
                        minLabel: 'สกปรกมาก',
                        maxLabel: 'สะอาดมาก',
                        step: 1
                    },
                    {
                        id: id(),
                        type: 'multiple_choice',
                        text: 'คุณเลือกรับประทานอาหารประเภทใดบ้างในวันนี้? (เลือกได้มากกว่า 1 ข้อ)',
                        choices: [
                            { id: id(), text: 'อาหารไทย' },
                            { id: id(), text: 'อาหารญี่ปุ่น' },
                            { id: id(), text: 'ก๋วยเตี๋ยว/เส้น' },
                            { id: id(), text: 'อาหารจานด่วน/ฟาสต์ฟู้ด' },
                            { id: id(), text: 'ของหวาน/เครื่องดื่ม' }
                        ]
                    },
                    {
                        id: id(),
                        type: 'text',
                        text: 'ข้อเสนอแนะเพิ่มเติมเกี่ยวกับศูนย์อาหาร',
                        multiline: true
                    }
                ]
            }
        ]
    },
    'การให้บริการของพนักงาน (Customer Service)': {
        version: '1.0',
        settings: {},
        blocks: [
            {
                id: id(),
                title: 'แผนกที่เข้าใช้บริการ',
                questions: [
                    {
                        id: id(),
                        type: 'single_choice',
                        text: 'วันนี้คุณได้ติดต่อหรือใช้บริการที่แผนกใดเป็นหลัก?',
                        choices: [
                            { id: id(), text: 'แผนกเครื่องสำอาง' },
                            { id: id(), text: 'แผนกเสื้อผ้าแฟชั่น' },
                            { id: id(), text: 'แผนกเครื่องใช้ไฟฟ้า' },
                            { id: id(), text: 'เคาน์เตอร์ประชาสัมพันธ์' },
                            { id: id(), text: 'อื่นๆ', allowOther: true }
                        ]
                    }
                ]
            },
            {
                id: id(),
                title: 'ประเมินพนักงาน',
                questions: [
                    {
                        id: id(),
                        type: 'matrix',
                        text: 'ความพึงพอใจต่อพนักงานที่ให้บริการคุณ',
                        rows: [
                            { id: id(), text: 'ความสุภาพและยิ้มแย้ม' },
                            { id: id(), text: 'ความรวดเร็วในการให้บริการ' },
                            { id: id(), text: 'ความรู้เกี่ยวกับสินค้า/บริการ' },
                            { id: id(), text: 'ความกระตือรือร้นในการช่วยเหลือ' }
                        ],
                        columns: [
                            { id: id(), text: 'ควรปรับปรุง' },
                            { id: id(), text: 'พอใช้' },
                            { id: id(), text: 'ดี' },
                            { id: id(), text: 'ดีมาก' }
                        ]
                    }
                ]
            }
        ]
    },
    'ความสะดวกในการจอดรถ (Parking)': {
        version: '1.0',
        settings: {},
        blocks: [
            {
                id: id(),
                title: 'การเข้าถึงและจอดรถ',
                questions: [
                    {
                        id: id(),
                        type: 'single_choice',
                        text: 'วันนี้คุณนำรถยนต์ส่วนตัวมาหรือไม่?',
                        choices: [
                            { id: id(), text: 'ใช่' },
                            { id: id(), text: 'ไม่ใช่ (เดินทางโดยวิธีอื่น)' }
                        ]
                    }
                ]
            },
            {
                id: id(),
                title: 'ประเมินลานจอดรถ',
                questions: [
                    {
                        id: id(),
                        type: 'slider',
                        text: 'ความยาก-ง่าย ในการหาที่จอดรถวันนี้ (0 = ยากมาก, 100 = ง่ายมาก)',
                        min: 0,
                        max: 100
                    },
                    {
                        id: id(),
                        type: 'matrix',
                        text: 'ความพึงพอใจด้านต่างๆ ของลานจอดรถ',
                        rows: [
                            { id: id(), text: 'ความกว้างของช่องจอด' },
                            { id: id(), text: 'แสงสว่างในลานจอด' },
                            { id: id(), text: 'ป้ายบอกทาง/สัญลักษณ์ชัดเจน' },
                            { id: id(), text: 'ความปลอดภัย' }
                        ],
                        columns: [
                            { id: id(), text: 'ไม่พอใจ' },
                            { id: id(), text: 'เฉยๆ' },
                            { id: id(), text: 'พอใจ' }
                        ]
                    }
                ]
            }
        ]
    },
    'ความสะอาดและสุขอนามัย (Cleanliness & Hygiene)': {
        version: '1.0',
        settings: {},
        blocks: [
            {
                id: id(),
                title: 'ความสะอาดทั่วไป',
                questions: [
                    {
                        id: id(),
                        type: 'matrix',
                        text: 'โปรดให้คะแนนความสะอาดของพื้นที่ต่อไปนี้',
                        rows: [
                            { id: id(), text: 'ทางเดิน/พื้นที่ส่วนกลาง' },
                            { id: id(), text: 'ห้องน้ำ' },
                            { id: id(), text: 'ลิฟต์/บันไดเลื่อน' },
                            { id: id(), text: 'จุดสัมผัสร่วม (เช่น ราวจับ)' }
                        ],
                        columns: [
                            { id: id(), text: 'สกปรก' },
                            { id: id(), text: 'พอใช้' },
                            { id: id(), text: 'สะอาด' },
                            { id: id(), text: 'สะอาดมาก' }
                        ]
                    }
                ]
            },
            {
                id: id(),
                title: 'ห้องน้ำ',
                questions: [
                    {
                        id: id(),
                        type: 'multiple_choice',
                        text: 'หากคุณพบปัญหาในห้องน้ำ โปรดระบุ (เลือกได้มากกว่า 1 ข้อ)',
                        choices: [
                            { id: id(), text: 'ไม่มีกระดาษชำระ' },
                            { id: id(), text: 'พื้นเปียก/สกปรก' },
                            { id: id(), text: 'มีกลิ่นเหม็น' },
                            { id: id(), text: 'อ่างล้างมือชำรุด/สกปรก' },
                            { id: id(), text: 'ไม่พบปัญหา' }
                        ]
                    }
                ]
            }
        ]
    }
};

async function main() {
    console.log('Finding surveys to populate questions...');

    // Fetch all surveys (limiting to reasonable number to check titles)
    const surveys = await db.surveys.list({ limit: 50, offset: 0 });

    for (const survey of surveys) {
        if (SURVEY_CONFIGS[survey.title]) {
            console.log(`Updating questions for: ${survey.title}`);
            const config = SURVEY_CONFIGS[survey.title];

            try {
                await db.surveyDrafts.upsert(survey.id, config);
                console.log(`✓ Updated config for survey ID: ${survey.id}`);
            } catch (error) {
                console.error(`Failed to update ${survey.title}:`, error);
            }
        }
    }

    console.log('Done population questions.');
    process.exit(0);
}

main().catch(console.error);
