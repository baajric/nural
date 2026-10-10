import type { KnowledgeLevel, SpiritualOption } from '@/contexts/onboarding-context';

/** `category` is the reading category (and illustration) the path maps to. */
export const SPIRITUAL_OPTIONS: {
  id: SpiritualOption;
  label: string;
  description: string;
  category: string;
}[] = [
  { id: 'islam', label: 'Islam', description: 'A passage from the Quran each day', category: 'Islam' },
  { id: 'christianity', label: 'Christianity', description: 'A chapter from the Bible each day', category: 'Christianity' },
  { id: 'buddhism', label: 'Buddhism', description: 'Verses from the Dhammapada', category: 'Buddhism' },
  { id: 'stoicism', label: 'Stoicism', description: 'Marcus Aurelius and Epictetus', category: 'Stoicism' },
  { id: 'meditation', label: 'Mindfulness', description: 'The Tao Te Ching and stillness', category: 'Mindfulness' },
  { id: 'none', label: 'None / Secular', description: 'Skip the spiritual reading', category: 'General Knowledge' },
];

export const LEARNING_AREAS = [
  'Psychology',
  'Finance',
  'Business',
  'Technology',
  'Philosophy',
  'History',
  'Science',
  'Health & Fitness',
  'Leadership',
  'Productivity',
  'Economics',
  'Neuroscience',
  'Literature',
  'Politics',
  'Art & Creativity',
  'Law',
] as const;

export const MAX_LEARNING_AREAS = 4;

export const KNOWLEDGE_LEVELS: { value: KnowledgeLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export const INTERVIEW_QUESTIONS = {
  q1: 'What is your biggest challenge right now?',
  q2: 'What do you want to achieve in the next 30 days?',
  q3: 'How would you describe your current knowledge level?',
  q4: 'What does growth mean to you?',
} as const;
