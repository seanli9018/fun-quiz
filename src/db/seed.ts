import { db } from './index';
import { tag } from './schema';
import { nanoid } from 'nanoid';

const initialTags = [
  'Science',
  'History',
  'Geography',
  'Mathematics',
  'Literature',
  'Technology',
  'Sports',
  'Entertainment',
  'Music',
  'Art',
  'Movies',
  'Television',
  'Video Games',
  'Food & Drink',
  'Nature',
  'Animals',
  'Space',
  'Pop Culture',
  'Politics',
  'Business',
  'Health',
  'Psychology',
  'Philosophy',
  'Mythology',
  'Language',
];

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Check if tags already exist
    const existingTags = await db.select().from(tag);

    if (existingTags.length > 0) {
      console.log('✓ Tags already seeded, skipping...');
      return;
    }

    // Insert initial tags
    const tagData = initialTags.map((name) => ({
      id: nanoid(),
      name,
      createdAt: new Date(),
    }));

    await db.insert(tag).values(tagData);

    console.log(`✓ Seeded ${tagData.length} tags`);
    console.log('🎉 Seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
