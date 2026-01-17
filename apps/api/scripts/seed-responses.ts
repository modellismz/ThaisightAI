
import { db } from '../src/db';
import { randomUUID } from 'crypto';

// Helper to pick random item from array
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
// Helper to pick n random items
const pickN = <T>(arr: T[], n: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
};
// Helper for random int
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

async function main() {
    console.log('Starting seed responses...');

    const surveys = await db.surveys.list({ limit: 100, offset: 0 });
    console.log(`Found ${surveys.length} surveys.`);

    for (const survey of surveys) {
        console.log(`Processing survey: ${survey.title}`);

        // 1. Get Draft Config
        const draft = await db.surveyDrafts.getBySurveyId(survey.id);
        if (!draft || !draft.config) {
            console.log(`- No draft config found, skipping.`);
            continue;
        }

        const config = draft.config as any; // Type assertion

        // 2. Create/Get Version (Publish it)
        // Check if version exists first to avoid duplicates if run multiple times
        let version = await db.surveyVersions.getLatest(survey.id);
        if (!version) {
            console.log(`- Publishing version 1...`);
            version = await db.surveyVersions.create({
                surveyId: survey.id,
                versionNumber: 1,
                config: config
            });
        }

        // 3. Generate 10+ Responses
        const responseCount = 10;
        console.log(`- Generating ${responseCount} responses...`);

        for (let i = 0; i < responseCount; i++) {
            // Create Session
            const session = await db.sessions.create({
                surveyId: survey.id,
                versionId: version.id,
                resumeToken: randomUUID(),
                metadata: { source: 'seed_script' },
                ipHash: 'mock_ip',
                userAgent: 'MockAgent/1.0'
            });

            // Generate Answers
            const answers: Record<string, any> = {};

            for (const block of config.blocks) {
                for (const question of block.questions) {
                    let value: any = null;

                    switch (question.type) {
                        case 'text':
                            value = `Mock answer ${i + 1}`;
                            break;
                        case 'nps':
                            // Bias towards positive
                            value = Math.random() > 0.3 ? randomInt(8, 10) : randomInt(0, 10);
                            break;
                        case 'slider':
                            value = randomInt(question.min || 0, question.max || 100);
                            break;
                        case 'single_choice':
                            if (question.choices && question.choices.length > 0) {
                                value = pick(question.choices).id;
                            }
                            break;
                        case 'multiple_choice':
                            if (question.choices && question.choices.length > 0) {
                                const count = randomInt(1, Math.min(3, question.choices.length));
                                value = pickN(question.choices, count).map((c: any) => c.id);
                            }
                            break;
                        case 'matrix':
                            if (question.rows && question.columns) {
                                value = {};
                                for (const row of question.rows) {
                                    // Typically store column ID or value? 
                                    // Assuming value if present, else id. schema says columns have value.
                                    // Storing column ID usually for stricter reference, but let's check schema/convention.
                                    // Usually matrix answers are { rowId: colId/val }.
                                    const col = pick(question.columns);
                                    value[row.id] = col.value !== undefined ? col.value : col.id;
                                }
                            }
                            break;
                        case 'rank_order':
                            if (question.items) {
                                const items = [...question.items];
                                // Simple ranking by reordering IDs
                                value = pickN(items, items.length).map((item: any) => item.id);
                            }
                            break;
                    }

                    if (value !== null) {
                        answers[question.id] = value;
                    }
                }
            }

            // Create Response
            await db.responses.create({
                sessionId: session.id,
                surveyId: survey.id,
                versionId: version.id,
                answers: answers,
                durationSeconds: randomInt(30, 300)
            });

            // Mark session completed
            await db.sessions.complete(session.id);
        }
        console.log(`- Done.`);
    }

    console.log('Seed responses completed.');
    process.exit(0);
}

main().catch(console.error);
