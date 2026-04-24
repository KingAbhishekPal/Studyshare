const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studyshare';
const publicDir = path.join(__dirname, 'public');
const allowedSubjects = ['math', 'science', 'english', 'history', 'coding', 'geo'];

const seedMaterials = [
  {
    id: 1,
    title: 'Algebra Basics: Linear Equations',
    subject: 'math',
    grade: 'Grade 6-8',
    desc: 'Step-by-step guide to solving linear equations with variables on both sides. Includes worked examples and practice problems.',
    downloads: 142,
    author: 'Priya S.',
    createdAt: new Date('2026-04-24T00:00:00.000Z')
  },
  {
    id: 2,
    title: 'Quadratic Equations - Complete Notes',
    subject: 'math',
    grade: 'Grade 9-10',
    desc: 'Factorization, completing the square, and the quadratic formula explained clearly with diagrams and example sets.',
    downloads: 98,
    author: 'Rahul M.',
    createdAt: new Date('2026-04-24T00:00:00.000Z')
  },
  {
    id: 3,
    title: 'Photosynthesis - Full Study Guide',
    subject: 'science',
    grade: 'Grade 9-10',
    desc: 'Light and dark reactions, chloroplasts, and the Calvin cycle. Includes labeled diagrams and key definitions for exam revision.',
    downloads: 217,
    author: 'Anika R.',
    createdAt: new Date('2026-04-24T00:00:00.000Z')
  },
  {
    id: 4,
    title: 'Periodic Table and Chemical Bonding',
    subject: 'science',
    grade: 'Grade 11-12',
    desc: 'Ionic, covalent, and metallic bonding explained with electron dot diagrams. Covers periodic trends and reactivity series.',
    downloads: 176,
    author: 'Vikram K.',
    createdAt: new Date('2026-04-24T00:00:00.000Z')
  },
  {
    id: 5,
    title: 'Essay Writing: Structure and Techniques',
    subject: 'english',
    grade: 'Grade 9-10',
    desc: 'How to write a strong introduction, well-structured body paragraphs, and a powerful conclusion. Includes essay templates.',
    downloads: 134,
    author: 'Sneha P.',
    createdAt: new Date('2026-04-24T00:00:00.000Z')
  },
  {
    id: 6,
    title: 'Romeo and Juliet - Character Analysis',
    subject: 'english',
    grade: 'Grade 11-12',
    desc: 'Detailed analysis of main characters, key themes, important quotes, and historical context of the play.',
    downloads: 89,
    author: 'StudyShare',
    createdAt: new Date('2026-04-24T00:00:00.000Z')
  },
  {
    id: 7,
    title: 'World War II: Complete Timeline',
    subject: 'history',
    grade: 'Grade 11-12',
    desc: 'Chronological overview of World War II from 1939 to 1945, covering major battles, key figures, turning points, and the aftermath.',
    downloads: 203,
    author: 'Arjun T.',
    createdAt: new Date('2026-04-24T00:00:00.000Z')
  },
  {
    id: 8,
    title: 'Indian Independence Movement',
    subject: 'history',
    grade: 'Grade 9-10',
    desc: 'Key events from 1857 to 1947, important leaders, major movements, and the path to independence.',
    downloads: 167,
    author: 'Meera D.',
    createdAt: new Date('2026-04-24T00:00:00.000Z')
  },
  {
    id: 9,
    title: 'Python for Beginners - Variables and Loops',
    subject: 'coding',
    grade: 'University',
    desc: 'Variables, data types, if/else statements, for loops, and while loops explained with clear code examples for absolute beginners.',
    downloads: 312,
    author: 'Dev C.',
    createdAt: new Date('2026-04-24T00:00:00.000Z')
  },
  {
    id: 10,
    title: 'HTML and CSS Fundamentals',
    subject: 'coding',
    grade: 'Grade 11-12',
    desc: 'Building your first webpage from scratch. Covers HTML tags, CSS selectors, flexbox layout, and responsive design basics.',
    downloads: 258,
    author: 'StudyShare',
    createdAt: new Date('2026-04-24T00:00:00.000Z')
  },
  {
    id: 11,
    title: 'Climate Zones and Biomes of the World',
    subject: 'geo',
    grade: 'Grade 6-8',
    desc: 'Overview of Earth major climate zones, corresponding biomes, flora and fauna, and how human activity affects each region.',
    downloads: 95,
    author: 'Natasha G.',
    createdAt: new Date('2026-04-24T00:00:00.000Z')
  },
  {
    id: 12,
    title: 'Rivers, Landforms and Erosion',
    subject: 'geo',
    grade: 'Grade 9-10',
    desc: 'How rivers shape landscapes through erosion, transportation, and deposition. Includes diagrams of valleys, ox-bow lakes, and deltas.',
    downloads: 78,
    author: 'StudyShare',
    createdAt: new Date('2026-04-24T00:00:00.000Z')
  }
];

const materialSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, enum: allowedSubjects },
    grade: { type: String, required: true, trim: true },
    desc: { type: String, required: true, trim: true },
    downloads: { type: Number, default: 0 },
    author: { type: String, default: 'Anonymous', trim: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    msg: { type: String, required: true, trim: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

materialSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  }
});

contactSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  }
});

const Material = mongoose.model('Material', materialSchema);
const Contact = mongoose.model('Contact', contactSchema);

app.use(express.json());
app.use(express.static(publicDir));

function normalizeText(value) {
  return String(value || '').trim();
}

async function seedDatabase() {
  const count = await Material.countDocuments();
  if (count === 0) {
    await Material.insertMany(seedMaterials);
  }
}

app.get('/api/health', async (_req, res, next) => {
  try {
    const [materials, contacts] = await Promise.all([
      Material.countDocuments(),
      Contact.countDocuments()
    ]);

    res.json({
      ok: true,
      port: PORT,
      mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      database: mongoose.connection.name,
      materials,
      contacts
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/materials', async (req, res, next) => {
  try {
    const search = normalizeText(req.query.search);
    const subject = normalizeText(req.query.subject).toLowerCase();
    const query = {};

    if (subject && subject !== 'all') {
      query.subject = subject;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { desc: { $regex: search, $options: 'i' } },
        { grade: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const [items, total] = await Promise.all([
      Material.find(query).sort({ createdAt: -1, id: -1 }).lean(),
      Material.countDocuments()
    ]);

    res.json({
      items,
      total,
      filtered: items.length
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/materials', async (req, res, next) => {
  try {
    const title = normalizeText(req.body.title);
    const subject = normalizeText(req.body.subject).toLowerCase();
    const grade = normalizeText(req.body.grade);
    const desc = normalizeText(req.body.desc);
    const author = normalizeText(req.body.author) || 'Anonymous';

    if (!title || !subject || !grade || !desc) {
      return res.status(400).json({ error: 'title, subject, grade, and desc are required' });
    }

    if (!allowedSubjects.includes(subject)) {
      return res.status(400).json({ error: 'invalid subject' });
    }

    const lastMaterial = await Material.findOne().sort({ id: -1 }).lean();
    const material = await Material.create({
      id: (lastMaterial?.id || 0) + 1,
      title,
      subject,
      grade,
      desc,
      author,
      downloads: 0
    });

    res.status(201).json(material.toJSON());
  } catch (error) {
    next(error);
  }
});

app.post('/api/materials/:id/download', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const material = await Material.findOneAndUpdate(
      { id },
      { $inc: { downloads: 1 } },
      { new: true }
    );

    if (!material) {
      return res.status(404).json({ error: 'material not found' });
    }

    res.json(material.toJSON());
  } catch (error) {
    next(error);
  }
});

app.post('/api/contact', async (req, res, next) => {
  try {
    const name = normalizeText(req.body.name);
    const email = normalizeText(req.body.email);
    const msg = normalizeText(req.body.msg);

    if (!name || !email || !msg) {
      return res.status(400).json({ error: 'name, email, and msg are required' });
    }

    await Contact.create({ name, email, msg });
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
  await mongoose.connect(MONGO_URI);
  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`StudyShare server running on http://localhost:${PORT}`);
    console.log(`MongoDB connected at ${MONGO_URI}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
