import { 
  insertUser, 
  getUserByEmail, 
  getUserById, 
  insertDebate, 
  getDebateById, 
  getAllDebates, 
  getDebatesCountToday,
  insertTranslation,
  getTranslation,
  getDatabaseMetrics
} from '../db.js';

describe('Database Helpers Unit Tests', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  const testUser = {
    id: 'user-test-uuid',
    email: 'test@debate.com',
    password_hash: 'hashedPassword123',
    created_at: new Date().toISOString()
  };

  test('should insert and retrieve a user by email and ID', () => {
    insertUser(testUser);

    const userByEmail = getUserByEmail('test@debate.com');
    expect(userByEmail).not.toBeNull();
    expect(userByEmail.id).toBe(testUser.id);
    expect(userByEmail.password_hash).toBe(testUser.password_hash);

    const userById = getUserById(testUser.id);
    expect(userById).not.toBeNull();
    expect(userById.email).toBe(testUser.email);
  });

  test('should return null for non-existing users', () => {
    expect(getUserByEmail('doesnotexist@debate.com')).toBeNull();
    expect(getUserById('non-existent-uuid')).toBeNull();
  });

  test('should insert a debate and fetch it by ID and user scope', () => {
    const debate = {
      id: 'debate-test-uuid',
      user_id: testUser.id,
      topic: 'Should AI replace coding tools?',
      transcript: JSON.stringify([{ speaker: 'A', text: 'Yes', round: 1 }]),
      verdict: JSON.stringify({ winner: 'A', reasoning: 'Logical coherence' }),
      created_at: new Date().toISOString(),
      language: 'English',
      duration_ms: 2500
    };

    insertDebate(debate);

    const fetched = getDebateById(debate.id);
    expect(fetched).not.toBeNull();
    expect(fetched.topic).toBe(debate.topic);
    expect(fetched.user_id).toBe(testUser.id);

    const allDebates = getAllDebates(testUser.id);
    expect(allDebates).toHaveLength(1);
    expect(allDebates[0].topic).toBe(debate.topic);
  });

  test('should respect user rate limits', () => {
    // We already inserted 1 debate today. Today count should be 1.
    const count = getDebatesCountToday(testUser.id);
    expect(count).toBe(1);
  });

  test('should insert and fetch debate translations', () => {
    const translation = {
      debate_id: 'debate-test-uuid',
      target_language: 'Spanish',
      translated_transcript: JSON.stringify([{ speaker: 'A', text: 'Sí', round: 1 }]),
      translated_verdict: JSON.stringify({ winner: 'A', reasoning: 'Coherencia lógica' })
    };

    insertTranslation(translation);

    const fetched = getTranslation(translation.debate_id, translation.target_language);
    expect(fetched).not.toBeNull();
    expect(fetched.translated_transcript).toContain('Sí');
  });

  test('should aggregate database metrics correctly', () => {
    const metrics = getDatabaseMetrics();
    expect(metrics.total_debates).toBe(1);
    expect(metrics.win_split.A).toBe(1);
    expect(metrics.win_split.B).toBe(0);
    expect(metrics.languages.English).toBe(1);
  });
});
