import { db } from './index';
import { user, quiz, question, answer, tag, quizTag } from './schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const quizData = [
  {
    title: 'World Geography Basics',
    description:
      'Test your knowledge of world geography with this fundamental quiz',
    tags: ['Geography', 'Nature'],
    questions: [
      {
        text: 'What is the capital of France?',
        answers: [
          { text: 'London', isCorrect: false },
          { text: 'Berlin', isCorrect: false },
          { text: 'Paris', isCorrect: true },
          { text: 'Madrid', isCorrect: false },
        ],
      },
      {
        text: 'Which is the largest ocean on Earth?',
        answers: [
          { text: 'Atlantic Ocean', isCorrect: false },
          { text: 'Indian Ocean', isCorrect: false },
          { text: 'Arctic Ocean', isCorrect: false },
          { text: 'Pacific Ocean', isCorrect: true },
        ],
      },
      {
        text: 'What is the longest river in the world?',
        answers: [
          { text: 'Amazon River', isCorrect: false },
          { text: 'Nile River', isCorrect: true },
          { text: 'Mississippi River', isCorrect: false },
          { text: 'Yangtze River', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'Ancient History',
    description: 'Explore the fascinating world of ancient civilizations',
    tags: ['History', 'Mythology'],
    questions: [
      {
        text: 'Who was the first Emperor of Rome?',
        answers: [
          { text: 'Julius Caesar', isCorrect: false },
          { text: 'Augustus', isCorrect: true },
          { text: 'Nero', isCorrect: false },
          { text: 'Caligula', isCorrect: false },
        ],
      },
      {
        text: 'Which ancient wonder of the world still stands today?',
        answers: [
          { text: 'Hanging Gardens of Babylon', isCorrect: false },
          { text: 'Great Pyramid of Giza', isCorrect: true },
          { text: 'Colossus of Rhodes', isCorrect: false },
          { text: 'Lighthouse of Alexandria', isCorrect: false },
        ],
      },
      {
        text: 'In which year did the Western Roman Empire fall?',
        answers: [
          { text: '476 AD', isCorrect: true },
          { text: '410 AD', isCorrect: false },
          { text: '500 AD', isCorrect: false },
          { text: '395 AD', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'Basic Mathematics',
    description: 'Test your fundamental math skills',
    tags: ['Mathematics'],
    questions: [
      {
        text: 'What is 15 + 27?',
        answers: [
          { text: '42', isCorrect: true },
          { text: '41', isCorrect: false },
          { text: '43', isCorrect: false },
          { text: '40', isCorrect: false },
        ],
      },
      {
        text: 'What is the square root of 144?',
        answers: [
          { text: '10', isCorrect: false },
          { text: '11', isCorrect: false },
          { text: '12', isCorrect: true },
          { text: '13', isCorrect: false },
        ],
      },
      {
        text: 'What is 8 × 7?',
        answers: [
          { text: '54', isCorrect: false },
          { text: '56', isCorrect: true },
          { text: '58', isCorrect: false },
          { text: '64', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'Classic Literature',
    description: 'How well do you know the classics?',
    tags: ['Literature', 'Art'],
    questions: [
      {
        text: 'Who wrote "Romeo and Juliet"?',
        answers: [
          { text: 'Charles Dickens', isCorrect: false },
          { text: 'William Shakespeare', isCorrect: true },
          { text: 'Jane Austen', isCorrect: false },
          { text: 'Mark Twain', isCorrect: false },
        ],
      },
      {
        text: 'In which novel would you find the character "Atticus Finch"?',
        answers: [
          { text: 'To Kill a Mockingbird', isCorrect: true },
          { text: '1984', isCorrect: false },
          { text: 'The Great Gatsby', isCorrect: false },
          { text: 'Pride and Prejudice', isCorrect: false },
        ],
      },
      {
        text: 'Who wrote "1984"?',
        answers: [
          { text: 'Aldous Huxley', isCorrect: false },
          { text: 'Ray Bradbury', isCorrect: false },
          { text: 'George Orwell', isCorrect: true },
          { text: 'Ernest Hemingway', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'Solar System',
    description: 'Journey through our cosmic neighborhood',
    tags: ['Space', 'Science'],
    questions: [
      {
        text: 'Which planet is known as the Red Planet?',
        answers: [
          { text: 'Venus', isCorrect: false },
          { text: 'Mars', isCorrect: true },
          { text: 'Jupiter', isCorrect: false },
          { text: 'Saturn', isCorrect: false },
        ],
      },
      {
        text: 'How many planets are in our Solar System?',
        answers: [
          { text: '7', isCorrect: false },
          { text: '8', isCorrect: true },
          { text: '9', isCorrect: false },
          { text: '10', isCorrect: false },
        ],
      },
      {
        text: 'Which planet has the most moons?',
        answers: [
          { text: 'Jupiter', isCorrect: false },
          { text: 'Saturn', isCorrect: true },
          { text: 'Uranus', isCorrect: false },
          { text: 'Neptune', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'World Sports Trivia',
    description: 'Test your sports knowledge from around the globe',
    tags: ['Sports'],
    questions: [
      {
        text: 'Which country won the FIFA World Cup in 2018?',
        answers: [
          { text: 'Germany', isCorrect: false },
          { text: 'Brazil', isCorrect: false },
          { text: 'France', isCorrect: true },
          { text: 'Argentina', isCorrect: false },
        ],
      },
      {
        text: 'How many players are on a basketball team on the court?',
        answers: [
          { text: '4', isCorrect: false },
          { text: '5', isCorrect: true },
          { text: '6', isCorrect: false },
          { text: '7', isCorrect: false },
        ],
      },
      {
        text: 'In which sport would you perform a slam dunk?',
        answers: [
          { text: 'Volleyball', isCorrect: false },
          { text: 'Tennis', isCorrect: false },
          { text: 'Basketball', isCorrect: true },
          { text: 'Football', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'Movie Classics',
    description: 'How well do you know classic cinema?',
    tags: ['Movies', 'Entertainment'],
    questions: [
      {
        text: 'Who directed "The Godfather"?',
        answers: [
          { text: 'Martin Scorsese', isCorrect: false },
          { text: 'Francis Ford Coppola', isCorrect: true },
          { text: 'Steven Spielberg', isCorrect: false },
          { text: 'Stanley Kubrick', isCorrect: false },
        ],
      },
      {
        text: 'In which year was the first "Star Wars" movie released?',
        answers: [
          { text: '1975', isCorrect: false },
          { text: '1977', isCorrect: true },
          { text: '1979', isCorrect: false },
          { text: '1980', isCorrect: false },
        ],
      },
      {
        text: 'Who played Jack in "Titanic"?',
        answers: [
          { text: 'Brad Pitt', isCorrect: false },
          { text: 'Leonardo DiCaprio', isCorrect: true },
          { text: 'Tom Cruise', isCorrect: false },
          { text: 'Johnny Depp', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'Technology Fundamentals',
    description: 'Basic tech knowledge for everyone',
    tags: ['Technology', 'Science'],
    questions: [
      {
        text: 'What does CPU stand for?',
        answers: [
          { text: 'Central Processing Unit', isCorrect: true },
          { text: 'Computer Personal Unit', isCorrect: false },
          { text: 'Central Program Utility', isCorrect: false },
          { text: 'Computer Processing Utility', isCorrect: false },
        ],
      },
      {
        text: 'Who is considered the father of computers?',
        answers: [
          { text: 'Steve Jobs', isCorrect: false },
          { text: 'Bill Gates', isCorrect: false },
          { text: 'Charles Babbage', isCorrect: true },
          { text: 'Alan Turing', isCorrect: false },
        ],
      },
      {
        text: 'What does HTML stand for?',
        answers: [
          { text: 'Hyper Text Markup Language', isCorrect: true },
          { text: 'High Tech Modern Language', isCorrect: false },
          { text: 'Home Tool Markup Language', isCorrect: false },
          { text: 'Hyper Transfer Markup Language', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'Musical Instruments',
    description: 'Identify and learn about different instruments',
    tags: ['Music', 'Art'],
    questions: [
      {
        text: 'Which instrument has 88 keys?',
        answers: [
          { text: 'Organ', isCorrect: false },
          { text: 'Piano', isCorrect: true },
          { text: 'Harpsichord', isCorrect: false },
          { text: 'Accordion', isCorrect: false },
        ],
      },
      {
        text: 'What family of instruments does the trumpet belong to?',
        answers: [
          { text: 'Woodwind', isCorrect: false },
          { text: 'Brass', isCorrect: true },
          { text: 'Percussion', isCorrect: false },
          { text: 'String', isCorrect: false },
        ],
      },
      {
        text: 'How many strings does a standard guitar have?',
        answers: [
          { text: '4', isCorrect: false },
          { text: '5', isCorrect: false },
          { text: '6', isCorrect: true },
          { text: '7', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'Animal Kingdom',
    description: 'Discover fascinating facts about animals',
    tags: ['Animals', 'Nature', 'Science'],
    questions: [
      {
        text: 'What is the largest land animal?',
        answers: [
          { text: 'Rhinoceros', isCorrect: false },
          { text: 'Hippopotamus', isCorrect: false },
          { text: 'African Elephant', isCorrect: true },
          { text: 'Giraffe', isCorrect: false },
        ],
      },
      {
        text: 'Which bird is known for its ability to mimic human speech?',
        answers: [
          { text: 'Eagle', isCorrect: false },
          { text: 'Parrot', isCorrect: true },
          { text: 'Crow', isCorrect: false },
          { text: 'Owl', isCorrect: false },
        ],
      },
      {
        text: 'What is the fastest land animal?',
        answers: [
          { text: 'Lion', isCorrect: false },
          { text: 'Cheetah', isCorrect: true },
          { text: 'Leopard', isCorrect: false },
          { text: 'Gazelle', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'Food & Cuisine',
    description: 'A delicious quiz about food from around the world',
    tags: ['Food & Drink'],
    questions: [
      {
        text: 'What is the main ingredient in guacamole?',
        answers: [
          { text: 'Tomato', isCorrect: false },
          { text: 'Avocado', isCorrect: true },
          { text: 'Lime', isCorrect: false },
          { text: 'Pepper', isCorrect: false },
        ],
      },
      {
        text: 'Which country is famous for sushi?',
        answers: [
          { text: 'China', isCorrect: false },
          { text: 'Korea', isCorrect: false },
          { text: 'Japan', isCorrect: true },
          { text: 'Thailand', isCorrect: false },
        ],
      },
      {
        text: 'What type of pasta is shaped like little tubes?',
        answers: [
          { text: 'Spaghetti', isCorrect: false },
          { text: 'Penne', isCorrect: true },
          { text: 'Linguine', isCorrect: false },
          { text: 'Fettuccine', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'Television Hits',
    description: 'Classic and modern TV shows quiz',
    tags: ['Television', 'Entertainment', 'Pop Culture'],
    questions: [
      {
        text: 'In which city is "Friends" set?',
        answers: [
          { text: 'Los Angeles', isCorrect: false },
          { text: 'New York', isCorrect: true },
          { text: 'Chicago', isCorrect: false },
          { text: 'Boston', isCorrect: false },
        ],
      },
      {
        text: 'What is the name of the coffee shop in "Friends"?',
        answers: [
          { text: 'Central Perk', isCorrect: true },
          { text: 'Coffee House', isCorrect: false },
          { text: "Java Joe's", isCorrect: false },
          { text: 'The Daily Grind', isCorrect: false },
        ],
      },
      {
        text: 'Who created "Game of Thrones" (the book series)?',
        answers: [
          { text: 'J.K. Rowling', isCorrect: false },
          { text: 'George R.R. Martin', isCorrect: true },
          { text: 'J.R.R. Tolkien', isCorrect: false },
          { text: 'Stephen King', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'Video Game Legends',
    description: 'Test your gaming knowledge',
    tags: ['Video Games', 'Entertainment', 'Technology'],
    questions: [
      {
        text: 'Who is the main character in "The Legend of Zelda"?',
        answers: [
          { text: 'Zelda', isCorrect: false },
          { text: 'Link', isCorrect: true },
          { text: 'Ganondorf', isCorrect: false },
          { text: 'Mario', isCorrect: false },
        ],
      },
      {
        text: 'What year was the first "Super Mario Bros." released?',
        answers: [
          { text: '1983', isCorrect: false },
          { text: '1985', isCorrect: true },
          { text: '1987', isCorrect: false },
          { text: '1990', isCorrect: false },
        ],
      },
      {
        text: 'Which company created Minecraft?',
        answers: [
          { text: 'Nintendo', isCorrect: false },
          { text: 'Sony', isCorrect: false },
          { text: 'Mojang', isCorrect: true },
          { text: 'Electronic Arts', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'Greek Mythology',
    description: 'Journey to ancient Greece and its legends',
    tags: ['Mythology', 'History', 'Literature'],
    questions: [
      {
        text: 'Who is the king of the Greek gods?',
        answers: [
          { text: 'Poseidon', isCorrect: false },
          { text: 'Hades', isCorrect: false },
          { text: 'Zeus', isCorrect: true },
          { text: 'Apollo', isCorrect: false },
        ],
      },
      {
        text: 'What is the name of the Greek goddess of wisdom?',
        answers: [
          { text: 'Hera', isCorrect: false },
          { text: 'Athena', isCorrect: true },
          { text: 'Aphrodite', isCorrect: false },
          { text: 'Artemis', isCorrect: false },
        ],
      },
      {
        text: 'Who was forced to hold up the sky?',
        answers: [
          { text: 'Hercules', isCorrect: false },
          { text: 'Atlas', isCorrect: true },
          { text: 'Prometheus', isCorrect: false },
          { text: 'Titan', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'Psychology 101',
    description: 'Basic principles of human psychology',
    tags: ['Psychology', 'Science', 'Health'],
    questions: [
      {
        text: 'Who is known as the father of psychoanalysis?',
        answers: [
          { text: 'Carl Jung', isCorrect: false },
          { text: 'Sigmund Freud', isCorrect: true },
          { text: 'B.F. Skinner', isCorrect: false },
          { text: 'Ivan Pavlov', isCorrect: false },
        ],
      },
      {
        text: 'What does IQ stand for?',
        answers: [
          { text: 'Intelligence Quotient', isCorrect: true },
          { text: 'Intelligent Query', isCorrect: false },
          { text: 'Internal Quality', isCorrect: false },
          { text: 'Intellectual Question', isCorrect: false },
        ],
      },
      {
        text: 'Which part of the brain is responsible for memory?',
        answers: [
          { text: 'Cerebellum', isCorrect: false },
          { text: 'Hippocampus', isCorrect: true },
          { text: 'Amygdala', isCorrect: false },
          { text: 'Medulla', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'Philosophy Basics',
    description: 'Fundamental questions about life and existence',
    tags: ['Philosophy', 'Literature'],
    questions: [
      {
        text: 'Who wrote "The Republic"?',
        answers: [
          { text: 'Aristotle', isCorrect: false },
          { text: 'Plato', isCorrect: true },
          { text: 'Socrates', isCorrect: false },
          { text: 'Descartes', isCorrect: false },
        ],
      },
      {
        text: 'What is the famous phrase by Descartes?',
        answers: [
          { text: 'I think, therefore I am', isCorrect: true },
          { text: 'To be or not to be', isCorrect: false },
          { text: 'Know thyself', isCorrect: false },
          { text: 'Life is suffering', isCorrect: false },
        ],
      },
      {
        text: 'Which philosopher is associated with the concept of the "Übermensch"?',
        answers: [
          { text: 'Kant', isCorrect: false },
          { text: 'Hegel', isCorrect: false },
          { text: 'Nietzsche', isCorrect: true },
          { text: 'Schopenhauer', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'World Languages',
    description: 'Explore languages from around the globe',
    tags: ['Language', 'Geography'],
    questions: [
      {
        text: 'What is the most spoken language in the world?',
        answers: [
          { text: 'English', isCorrect: false },
          { text: 'Mandarin Chinese', isCorrect: true },
          { text: 'Spanish', isCorrect: false },
          { text: 'Hindi', isCorrect: false },
        ],
      },
      {
        text: 'Which language uses Cyrillic script?',
        answers: [
          { text: 'Greek', isCorrect: false },
          { text: 'Russian', isCorrect: true },
          { text: 'Arabic', isCorrect: false },
          { text: 'Hebrew', isCorrect: false },
        ],
      },
      {
        text: 'What does "Bonjour" mean in French?',
        answers: [
          { text: 'Goodbye', isCorrect: false },
          { text: 'Hello', isCorrect: true },
          { text: 'Thank you', isCorrect: false },
          { text: 'Please', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'Business & Economics',
    description: 'Test your business acumen',
    tags: ['Business', 'Politics'],
    questions: [
      {
        text: 'What does GDP stand for?',
        answers: [
          { text: 'General Domestic Product', isCorrect: false },
          { text: 'Gross Domestic Product', isCorrect: true },
          { text: 'Global Development Plan', isCorrect: false },
          { text: 'General Development Program', isCorrect: false },
        ],
      },
      {
        text: 'Who is the founder of Amazon?',
        answers: [
          { text: 'Elon Musk', isCorrect: false },
          { text: 'Bill Gates', isCorrect: false },
          { text: 'Jeff Bezos', isCorrect: true },
          { text: 'Mark Zuckerberg', isCorrect: false },
        ],
      },
      {
        text: 'What is the currency of Japan?',
        answers: [
          { text: 'Yuan', isCorrect: false },
          { text: 'Won', isCorrect: false },
          { text: 'Yen', isCorrect: true },
          { text: 'Ringgit', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'Health & Wellness',
    description: 'Learn about staying healthy',
    tags: ['Health', 'Science'],
    questions: [
      {
        text: 'What vitamin do you get from sunlight?',
        answers: [
          { text: 'Vitamin A', isCorrect: false },
          { text: 'Vitamin C', isCorrect: false },
          { text: 'Vitamin D', isCorrect: true },
          { text: 'Vitamin E', isCorrect: false },
        ],
      },
      {
        text: 'How many bones are in the adult human body?',
        answers: [
          { text: '186', isCorrect: false },
          { text: '206', isCorrect: true },
          { text: '226', isCorrect: false },
          { text: '246', isCorrect: false },
        ],
      },
      {
        text: 'What is the normal human body temperature in Celsius?',
        answers: [
          { text: '35°C', isCorrect: false },
          { text: '36°C', isCorrect: false },
          { text: '37°C', isCorrect: true },
          { text: '38°C', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'Pop Culture Phenomena',
    description: 'Modern pop culture references and trends',
    tags: ['Pop Culture', 'Entertainment', 'Music'],
    questions: [
      {
        text: 'Who is known as the "King of Pop"?',
        answers: [
          { text: 'Elvis Presley', isCorrect: false },
          { text: 'Michael Jackson', isCorrect: true },
          { text: 'Prince', isCorrect: false },
          { text: 'David Bowie', isCorrect: false },
        ],
      },
      {
        text: 'What social media platform is known for 280-character posts?',
        answers: [
          { text: 'Facebook', isCorrect: false },
          { text: 'Instagram', isCorrect: false },
          { text: 'Twitter/X', isCorrect: true },
          { text: 'TikTok', isCorrect: false },
        ],
      },
      {
        text: 'Which artist released the album "1989"?',
        answers: [
          { text: 'Beyoncé', isCorrect: false },
          { text: 'Taylor Swift', isCorrect: true },
          { text: 'Ariana Grande', isCorrect: false },
          { text: 'Katy Perry', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'World Politics',
    description: 'Understanding government and political systems',
    tags: ['Politics', 'History', 'Geography'],
    questions: [
      {
        text: 'How many countries are in the United Nations?',
        answers: [
          { text: '175', isCorrect: false },
          { text: '193', isCorrect: true },
          { text: '200', isCorrect: false },
          { text: '210', isCorrect: false },
        ],
      },
      {
        text: 'What does NATO stand for?',
        answers: [
          { text: 'North Atlantic Treaty Organization', isCorrect: true },
          { text: 'National Alliance Treaty Organization', isCorrect: false },
          { text: 'North American Trade Organization', isCorrect: false },
          { text: 'Nordic Atlantic Treaty Organization', isCorrect: false },
        ],
      },
      {
        text: 'Who was the first female Prime Minister of the United Kingdom?',
        answers: [
          { text: 'Theresa May', isCorrect: false },
          { text: 'Margaret Thatcher', isCorrect: true },
          { text: 'Angela Merkel', isCorrect: false },
          { text: 'Elizabeth II', isCorrect: false },
        ],
      },
    ],
  },
  {
    title: 'Art History',
    description: 'Journey through the history of art',
    tags: ['Art', 'History', 'Literature'],
    questions: [
      {
        text: 'Who painted the Mona Lisa?',
        answers: [
          { text: 'Michelangelo', isCorrect: false },
          { text: 'Leonardo da Vinci', isCorrect: true },
          { text: 'Raphael', isCorrect: false },
          { text: 'Donatello', isCorrect: false },
        ],
      },
      {
        text: 'In which museum is the Mona Lisa displayed?',
        answers: [
          { text: 'British Museum', isCorrect: false },
          { text: 'The Louvre', isCorrect: true },
          { text: 'Metropolitan Museum', isCorrect: false },
          { text: 'Uffizi Gallery', isCorrect: false },
        ],
      },
      {
        text: 'Who painted "The Starry Night"?',
        answers: [
          { text: 'Claude Monet', isCorrect: false },
          { text: 'Pablo Picasso', isCorrect: false },
          { text: 'Vincent van Gogh', isCorrect: true },
          { text: 'Salvador Dalí', isCorrect: false },
        ],
      },
    ],
  },
];

async function seedQuizzesOnly() {
  console.log('🌱 Seeding quizzes for existing admin account...\n');

  try {
    const adminEmail = 'admin@funquiz.com';

    // 1. Find admin user
    console.log('👤 Looking for admin user...');
    const [adminUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, adminEmail))
      .limit(1);

    if (!adminUser) {
      console.error('❌ Admin user not found!');
      console.log('Please make sure admin@funquiz.com exists in the database.');
      process.exit(1);
    }

    console.log(`✓ Found admin user: ${adminUser.name} (ID: ${adminUser.id})\n`);

    // 2. Get or create tags
    console.log('📝 Setting up tags...');
    const existingTags = await db.select().from(tag);
    let tagRecords: Record<string, string> = {};

    if (existingTags.length > 0) {
      console.log(`✓ Found ${existingTags.length} existing tags`);
      existingTags.forEach((t) => {
        tagRecords[t.name] = t.id;
      });
    }

    // Create any missing tags
    const allTagNames = Array.from(
      new Set(quizData.flatMap((q) => q.tags))
    );
    const missingTags = allTagNames.filter((name) => !tagRecords[name]);

    if (missingTags.length > 0) {
      console.log(`Creating ${missingTags.length} missing tags...`);
      const newTagData = missingTags.map((name) => ({
        id: nanoid(),
        name,
        createdAt: new Date(),
      }));

      await db.insert(tag).values(newTagData);

      newTagData.forEach((t) => {
        tagRecords[t.name] = t.id;
      });
      console.log(`✓ Created ${missingTags.length} new tags`);
    }

    // 3. Create quizzes
    console.log(`\n📚 Creating ${quizData.length} quizzes...\n`);
    let quizCount = 0;

    for (const quizInput of quizData) {
      const quizId = nanoid();

      // Create quiz
      await db.insert(quiz).values({
        id: quizId,
        userId: adminUser.id,
        title: quizInput.title,
        description: quizInput.description,
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Associate tags
      const quizTagData = quizInput.tags
        .filter((tagName) => tagRecords[tagName])
        .map((tagName) => ({
          id: nanoid(),
          quizId,
          tagId: tagRecords[tagName],
          createdAt: new Date(),
        }));

      if (quizTagData.length > 0) {
        await db.insert(quizTag).values(quizTagData);
      }

      // Create questions and answers
      for (let i = 0; i < quizInput.questions.length; i++) {
        const questionInput = quizInput.questions[i];
        const questionId = nanoid();

        await db.insert(question).values({
          id: questionId,
          quizId,
          text: questionInput.text,
          order: i,
          points: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Create answers
        const answerData = questionInput.answers.map((answerInput, j) => ({
          id: nanoid(),
          questionId,
          text: answerInput.text,
          isCorrect: answerInput.isCorrect,
          order: j,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await db.insert(answer).values(answerData);
      }

      quizCount++;
      console.log(
        `  ✓ [${quizCount}/${quizData.length}] ${quizInput.title} (${quizInput.questions.length} questions)`
      );
    }

    console.log(`\n✅ Successfully created ${quizCount} quizzes!`);
    console.log('\n📊 Summary:');
    console.log(`   - Admin: ${adminUser.name} (${adminUser.email})`);
    console.log(`   - Admin ID: ${adminUser.id}`);
    console.log(`   - Total tags: ${Object.keys(tagRecords).length}`);
    console.log(`   - Quizzes created: ${quizCount}`);
    console.log(`   - Total questions: ${quizCount * 3}`);
    console.log(`   - Total answers: ${quizCount * 3 * 4}`);
    console.log('\n🎉 Seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding quizzes:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seedQuizzesOnly();
