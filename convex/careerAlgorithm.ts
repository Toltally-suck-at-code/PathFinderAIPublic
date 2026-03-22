// Deterministic career map algorithm — same inputs always produce the same outputs.

interface QuizResponses {
  interests: string[];
  strengths: string[];
  workingStyle: {
    teamPreference: string;
    planningStyle: string;
  };
  values: string[];
  goals: string[];
}

interface ClusterResult {
  name: string;
  description: string;
  whyItFits: string;
}

interface SubjectResult {
  name: string;
  priority: "high" | "medium" | "low";
  reason: string;
}

interface SkillResult {
  name: string;
  howToPractice: string;
}

interface LearningPathStep {
  step: number;
  title: string;
  description: string;
  timeframe: string;
}

interface CareerMapResult {
  clusters: ClusterResult[];
  subjects: SubjectResult[];
  skills: { hard: SkillResult[]; soft: SkillResult[] };
  learningPaths: LearningPathStep[];
  extracurriculars: string[];
}

// ─── Career cluster definitions ───────────────────────────────────────────────

const CLUSTERS: Record<
  string,
  { name: string; description: string }
> = {
  stem: {
    name: "STEM & Engineering",
    description: "Apply math and science to design, build, and optimize systems and structures.",
  },
  tech: {
    name: "Technology & Computer Science",
    description: "Develop software, manage data, and create digital solutions for modern problems.",
  },
  health: {
    name: "Healthcare & Medicine",
    description: "Diagnose, treat, and support human health through science and compassion.",
  },
  business: {
    name: "Business & Finance",
    description: "Lead organizations, manage resources, and drive economic growth.",
  },
  arts: {
    name: "Arts & Creative Industries",
    description: "Express ideas through visual arts, performing arts, and creative media.",
  },
  education: {
    name: "Education & Social Services",
    description: "Teach, mentor, and support individuals and communities to thrive.",
  },
  law: {
    name: "Law & Government",
    description: "Uphold justice, shape policy, and serve the public interest.",
  },
  media: {
    name: "Media & Communications",
    description: "Tell stories, inform audiences, and shape public discourse through various media.",
  },
  environment: {
    name: "Environmental Science & Sustainability",
    description: "Study and protect natural systems to build a sustainable future.",
  },
  psychology: {
    name: "Psychology & Counseling",
    description: "Understand human behavior and support mental health and well-being.",
  },
};

// ─── Scoring tables ───────────────────────────────────────────────────────────

const INTEREST_SCORES: Record<string, Record<string, number>> = {
  "Mathematics & Logic":        { stem: 3, tech: 2, business: 1 },
  "Science & Experiments":      { stem: 3, health: 2, environment: 2 },
  "Literature & Writing":       { media: 3, education: 2, arts: 1 },
  "History & Social Studies":   { law: 3, education: 2 },
  "Art & Design":               { arts: 3, media: 2 },
  "Music & Performance":        { arts: 3, media: 1, education: 1 },
  "Technology & Coding":        { tech: 3, stem: 2 },
  "Sports & Physical Activities": { health: 1, education: 1 },
  "Business & Economics":       { business: 3, law: 1 },
  "Languages & Communication":  { media: 2, education: 2, law: 1 },
  "Environmental Studies":      { environment: 3, stem: 1 },
  "Psychology & Human Behavior": { psychology: 3, health: 2, education: 1 },
};

const STRENGTH_SCORES: Record<string, Record<string, number>> = {
  "Analytical thinking":          { stem: 2, tech: 2, business: 1 },
  "Creative problem-solving":     { arts: 2, tech: 2, stem: 1 },
  "Communication & presentation": { media: 2, business: 2, law: 1, education: 1 },
  "Leadership & organizing":      { business: 2, law: 1, education: 1 },
  "Attention to detail":          { stem: 1, health: 2, tech: 1 },
  "Working with hands":           { stem: 1, arts: 2, health: 1 },
  "Understanding people":         { psychology: 3, education: 2, health: 1 },
  "Learning quickly":             { tech: 1, stem: 1 },
  "Staying calm under pressure":  { health: 2, law: 1, business: 1 },
  "Thinking outside the box":     { arts: 2, tech: 2 },
  "Collaborating with others":    { education: 1, business: 1, health: 1 },
  "Working independently":        { stem: 1, arts: 1, tech: 1 },
};

const VALUE_SCORES: Record<string, Record<string, number>> = {
  "Making a positive impact":       { education: 2, environment: 2, psychology: 1 },
  "Financial stability":            { business: 2, tech: 1, health: 1 },
  "Creative freedom":               { arts: 3, media: 2 },
  "Continuous learning":            { stem: 1, tech: 1, education: 1 },
  "Work-life balance":              { education: 1 },
  "Leadership opportunities":       { business: 2, law: 1 },
  "Helping others directly":        { health: 2, psychology: 2, education: 1 },
  "Recognition and prestige":       { law: 1, business: 1, media: 1 },
  "Innovation and cutting-edge work": { tech: 2, stem: 2 },
  "Job security":                   { health: 1, law: 1, education: 1 },
  "Travel and new experiences":     { media: 1, business: 1, environment: 1 },
  "Flexibility and autonomy":       { tech: 1, arts: 1, business: 1 },
};

const GOAL_SCORES: Record<string, Record<string, number>> = {
  "Start my own business":          { business: 3, tech: 1 },
  "Become an expert in my field":   { stem: 2, health: 2, tech: 1 },
  "Lead teams or organizations":    { business: 2, law: 1 },
  "Create art or content":          { arts: 3, media: 2 },
  "Solve global problems":          { stem: 2, environment: 2, tech: 1 },
  "Help my local community":        { education: 2, psychology: 1, health: 1 },
  "Achieve financial independence":  { business: 2, tech: 1 },
  "Balance career with family life": { education: 1 },
  "Continuously learn and grow":    { stem: 1, tech: 1 },
  "Travel and work internationally": { media: 1, business: 1, environment: 1 },
  "Make scientific discoveries":    { stem: 3, environment: 2, health: 1 },
  "Teach and mentor others":        { education: 3, psychology: 1 },
};

// ─── Per-cluster recommendation data ──────────────────────────────────────────

const CLUSTER_SUBJECTS: Record<string, Array<{ name: string; reason: string }>> = {
  stem: [
    { name: "Mathematics", reason: "Foundation for all engineering and scientific analysis" },
    { name: "Physics", reason: "Core principles behind engineering design and problem-solving" },
    { name: "Chemistry", reason: "Essential for materials science and research applications" },
    { name: "Computer Science", reason: "Programming and computational thinking are key STEM tools" },
  ],
  tech: [
    { name: "Computer Science", reason: "Core subject for software development and system design" },
    { name: "Mathematics", reason: "Algorithms, data structures, and logic all rely on strong math" },
    { name: "Physics", reason: "Understanding hardware, networks, and computational systems" },
    { name: "English", reason: "Technical writing and documentation are essential developer skills" },
  ],
  health: [
    { name: "Biology", reason: "Foundation for understanding human anatomy and diseases" },
    { name: "Chemistry", reason: "Essential for pharmacology and biochemical processes" },
    { name: "Mathematics", reason: "Statistics and data analysis in medical research" },
    { name: "Psychology", reason: "Understanding patient behavior and mental health" },
  ],
  business: [
    { name: "Mathematics", reason: "Financial modeling, accounting, and economic analysis" },
    { name: "Economics", reason: "Understanding markets, trade, and business strategy" },
    { name: "English", reason: "Business communication, proposals, and presentations" },
    { name: "Computer Science", reason: "Data analysis and digital tools are essential in modern business" },
  ],
  arts: [
    { name: "Art & Design", reason: "Develop your visual language and creative portfolio" },
    { name: "Literature", reason: "Storytelling and narrative skills enrich all art forms" },
    { name: "History", reason: "Art movements and cultural context deepen creative work" },
    { name: "Technology", reason: "Digital tools are increasingly central to creative industries" },
  ],
  education: [
    { name: "Psychology", reason: "Understanding how people learn and develop" },
    { name: "Literature", reason: "Communication and content development for teaching" },
    { name: "Social Studies", reason: "Context for community development and social policy" },
    { name: "Sciences", reason: "Broad knowledge base needed for effective teaching" },
  ],
  law: [
    { name: "History & Social Studies", reason: "Understanding legal systems and their historical context" },
    { name: "Literature & Writing", reason: "Legal writing, argumentation, and critical reading" },
    { name: "Economics", reason: "Economic policy, contracts, and regulatory frameworks" },
    { name: "Ethics & Philosophy", reason: "Moral reasoning and justice theory" },
  ],
  media: [
    { name: "Literature & Writing", reason: "Storytelling, journalism, and content creation" },
    { name: "Art & Design", reason: "Visual communication and multimedia production" },
    { name: "Social Studies", reason: "Understanding audiences, culture, and public discourse" },
    { name: "Technology", reason: "Digital platforms and media production tools" },
  ],
  environment: [
    { name: "Biology", reason: "Ecology, biodiversity, and environmental systems" },
    { name: "Chemistry", reason: "Pollution analysis, sustainable materials, and green chemistry" },
    { name: "Geography", reason: "Climate systems, land use, and resource management" },
    { name: "Mathematics", reason: "Data modeling and environmental impact analysis" },
  ],
  psychology: [
    { name: "Psychology", reason: "Core discipline for understanding human behavior" },
    { name: "Biology", reason: "Neuroscience and biological bases of behavior" },
    { name: "Mathematics", reason: "Research methods and statistical analysis" },
    { name: "Social Studies", reason: "Social influences on behavior and mental health" },
  ],
};

const CLUSTER_HARD_SKILLS: Record<string, SkillResult[]> = {
  stem: [
    { name: "Scientific Research Methods", howToPractice: "Design and conduct small experiments, document findings in a lab journal" },
    { name: "Data Analysis", howToPractice: "Learn Excel or Google Sheets for statistical calculations, try analyzing real datasets" },
    { name: "Technical Drawing & CAD", howToPractice: "Practice with free tools like Tinkercad or FreeCAD to create 3D models" },
    { name: "Programming Fundamentals", howToPractice: "Start with Python on platforms like Codecademy or freeCodeCamp" },
  ],
  tech: [
    { name: "Programming", howToPractice: "Build small projects on GitHub, start with Python or JavaScript tutorials" },
    { name: "Web Development", howToPractice: "Create a personal website using HTML, CSS, and JavaScript" },
    { name: "Database Management", howToPractice: "Learn SQL basics through interactive courses like SQLZoo" },
    { name: "Version Control (Git)", howToPractice: "Use Git for all your coding projects, contribute to open-source" },
  ],
  health: [
    { name: "First Aid & CPR", howToPractice: "Take a certified first aid course through Red Cross Vietnam" },
    { name: "Biology Lab Techniques", howToPractice: "Participate in biology lab sessions, practice microscopy and dissection" },
    { name: "Health Data Literacy", howToPractice: "Read and interpret health statistics from WHO and Vietnam MOH reports" },
    { name: "Medical Terminology", howToPractice: "Study common medical prefixes, suffixes, and root words in English" },
  ],
  business: [
    { name: "Financial Literacy", howToPractice: "Track personal spending, learn basic accounting with free courses" },
    { name: "Spreadsheet Modeling", howToPractice: "Build budget templates and simple financial models in Google Sheets" },
    { name: "Market Research", howToPractice: "Survey classmates about a product idea and analyze the results" },
    { name: "Business Plan Writing", howToPractice: "Draft a one-page business plan for a hypothetical student venture" },
  ],
  arts: [
    { name: "Digital Design Tools", howToPractice: "Learn Canva, Figma, or Adobe Creative Suite through YouTube tutorials" },
    { name: "Portfolio Development", howToPractice: "Create an online portfolio showcasing your best work on Behance or a personal site" },
    { name: "Photography & Composition", howToPractice: "Practice daily photography using rule of thirds and lighting techniques" },
    { name: "Sketching & Drawing", howToPractice: "Draw for 15 minutes daily, try Drawabox.com for structured practice" },
  ],
  education: [
    { name: "Tutoring & Mentoring", howToPractice: "Volunteer to tutor younger students in subjects you're strong in" },
    { name: "Curriculum Design", howToPractice: "Create study guides or lesson summaries for your own classes" },
    { name: "Presentation Skills", howToPractice: "Present topics to your class, practice with visual aids and clear structure" },
    { name: "Educational Technology", howToPractice: "Explore tools like Kahoot, Quizlet, or Notion for learning enhancement" },
  ],
  law: [
    { name: "Debate & Argumentation", howToPractice: "Join a debate club and practice constructing logical arguments" },
    { name: "Legal Research", howToPractice: "Read simplified legal cases, learn to identify key legal principles" },
    { name: "Persuasive Writing", howToPractice: "Write opinion essays with clear thesis statements and evidence" },
    { name: "Critical Reading", howToPractice: "Analyze news articles for bias, logical fallacies, and unsupported claims" },
  ],
  media: [
    { name: "Content Creation", howToPractice: "Start a blog, YouTube channel, or social media page about a topic you love" },
    { name: "Video Editing", howToPractice: "Learn CapCut or DaVinci Resolve by editing short videos" },
    { name: "Copywriting", howToPractice: "Practice writing headlines, social media posts, and short-form content" },
    { name: "Journalism Basics", howToPractice: "Write articles for your school newspaper or start a student newsletter" },
  ],
  environment: [
    { name: "Field Research", howToPractice: "Conduct local biodiversity surveys or water quality tests" },
    { name: "GIS & Mapping", howToPractice: "Explore Google Earth Engine or QGIS for geographic data analysis" },
    { name: "Sustainability Auditing", howToPractice: "Audit your school's energy and waste practices, propose improvements" },
    { name: "Data Visualization", howToPractice: "Create charts and infographics about environmental data using free tools" },
  ],
  psychology: [
    { name: "Active Listening", howToPractice: "Practice reflective listening in conversations, summarize what others say" },
    { name: "Research Methods", howToPractice: "Design simple surveys and learn to interpret results statistically" },
    { name: "Behavioral Observation", howToPractice: "Observe and journal about social interactions and group dynamics" },
    { name: "Empathetic Communication", howToPractice: "Practice validating others' feelings before offering solutions" },
  ],
};

const CLUSTER_SOFT_SKILLS: Record<string, SkillResult[]> = {
  stem: [
    { name: "Logical Reasoning", howToPractice: "Solve puzzles, play strategy games, and practice breaking problems into smaller parts" },
    { name: "Patience & Persistence", howToPractice: "Work through challenging math problems without giving up, track your progress" },
    { name: "Precision & Accuracy", howToPractice: "Double-check your work, develop a habit of reviewing before submitting" },
  ],
  tech: [
    { name: "Problem Decomposition", howToPractice: "Break large tasks into smaller subtasks before starting" },
    { name: "Self-Learning", howToPractice: "Pick a new technology each month and learn it through documentation and tutorials" },
    { name: "Debugging Mindset", howToPractice: "When something fails, investigate systematically rather than guessing" },
  ],
  health: [
    { name: "Empathy", howToPractice: "Volunteer at community health events, practice seeing situations from others' perspectives" },
    { name: "Stress Management", howToPractice: "Develop a routine with exercise, sleep, and mindfulness techniques" },
    { name: "Attention to Detail", howToPractice: "Practice careful note-taking and observation in science classes" },
  ],
  business: [
    { name: "Negotiation", howToPractice: "Practice finding win-win solutions in group projects and everyday situations" },
    { name: "Strategic Thinking", howToPractice: "Analyze case studies of successful companies and what decisions led to their growth" },
    { name: "Networking", howToPractice: "Attend school events, introduce yourself to new people, and maintain connections" },
  ],
  arts: [
    { name: "Creative Confidence", howToPractice: "Share your work regularly, accept feedback without taking it personally" },
    { name: "Storytelling", howToPractice: "Practice narrating experiences clearly and engagingly to friends" },
    { name: "Openness to Feedback", howToPractice: "Ask for specific critique on your work and use it to improve" },
  ],
  education: [
    { name: "Patience", howToPractice: "Tutor a struggling student and focus on explaining concepts in multiple ways" },
    { name: "Adaptability", howToPractice: "Try different approaches when your first explanation doesn't work" },
    { name: "Public Speaking", howToPractice: "Present in front of your class regularly, join a speaking club" },
  ],
  law: [
    { name: "Critical Thinking", howToPractice: "Question assumptions, evaluate evidence from multiple angles" },
    { name: "Ethical Reasoning", howToPractice: "Discuss ethical dilemmas with peers, consider different stakeholders" },
    { name: "Persuasion", howToPractice: "Practice presenting your viewpoint clearly and backing it with evidence" },
  ],
  media: [
    { name: "Creativity Under Deadlines", howToPractice: "Set yourself timed creative challenges, like writing a story in 30 minutes" },
    { name: "Audience Awareness", howToPractice: "Before creating content, define who your audience is and what they care about" },
    { name: "Collaboration", howToPractice: "Work on group creative projects, practice giving and receiving constructive feedback" },
  ],
  environment: [
    { name: "Systems Thinking", howToPractice: "Map out cause-and-effect relationships in environmental issues" },
    { name: "Advocacy", howToPractice: "Present an environmental issue to your class with data and proposed solutions" },
    { name: "Interdisciplinary Thinking", howToPractice: "Connect environmental topics to economics, health, and social justice" },
  ],
  psychology: [
    { name: "Emotional Intelligence", howToPractice: "Journal about your emotions daily, practice naming what you feel" },
    { name: "Non-Judgmental Listening", howToPractice: "Listen to friends without immediately offering advice or opinions" },
    { name: "Self-Reflection", howToPractice: "Review your own reactions and decisions weekly, identify patterns" },
  ],
};

const CLUSTER_EXTRACURRICULARS: Record<string, string[]> = {
  stem: ["Science Olympiad", "Math Club", "Robotics Team", "Science Fair Projects", "Coding Workshops", "Engineering Summer Camp"],
  tech: ["Coding Club", "Hackathons", "Open-Source Contributions", "App Development Projects", "Cybersecurity Challenges", "Tech Blog"],
  health: ["Red Cross Youth Club", "Biology Olympiad", "Hospital Volunteer Program", "First Aid Training", "Health Awareness Campaigns", "Medical Science Fair"],
  business: ["Business Club", "Junior Achievement Vietnam", "Model United Nations", "Student Council", "Entrepreneurship Competitions", "Financial Literacy Workshops"],
  arts: ["Art Club", "School Theater/Drama", "Photography Club", "Design Competitions", "Music Ensemble", "Creative Writing Group"],
  education: ["Peer Tutoring Program", "Teaching Assistant Volunteer", "Community Education Projects", "Youth Mentorship", "Study Group Leader", "Educational Content Creation"],
  law: ["Debate Club", "Model United Nations", "Mock Trial", "Student Government", "Community Service Projects", "Legal Essay Competitions"],
  media: ["School Newspaper", "Film/Video Club", "Podcast Team", "Social Media Management", "Creative Writing Club", "Photography Club"],
  environment: ["Environmental Club", "Tree Planting Campaigns", "Sustainability Projects", "Beach/Park Cleanups", "Climate Action Group", "Nature Photography"],
  psychology: ["Peer Counseling Program", "Psychology Club", "Community Outreach", "Mindfulness & Well-being Club", "Social Research Projects", "Anti-Bullying Campaigns"],
};

// ─── Scoring function ─────────────────────────────────────────────────────────

function scoreCluster(
  responses: QuizResponses
): Array<{ id: string; score: number; matchedInterests: string[]; matchedStrengths: string[] }> {
  const scores: Record<string, number> = {};
  const matchedInterests: Record<string, string[]> = {};
  const matchedStrengths: Record<string, string[]> = {};

  // Initialize
  for (const id of Object.keys(CLUSTERS)) {
    scores[id] = 0;
    matchedInterests[id] = [];
    matchedStrengths[id] = [];
  }

  // Score interests (weight: highest — these are what the student enjoys)
  for (const interest of responses.interests) {
    const mapping = INTEREST_SCORES[interest];
    if (mapping) {
      for (const [clusterId, pts] of Object.entries(mapping)) {
        scores[clusterId] += pts;
        if (pts >= 2) matchedInterests[clusterId].push(interest);
      }
    }
  }

  // Score strengths
  for (const strength of responses.strengths) {
    const mapping = STRENGTH_SCORES[strength];
    if (mapping) {
      for (const [clusterId, pts] of Object.entries(mapping)) {
        scores[clusterId] += pts;
        if (pts >= 2) matchedStrengths[clusterId].push(strength);
      }
    }
  }

  // Score values
  for (const value of responses.values) {
    const mapping = VALUE_SCORES[value];
    if (mapping) {
      for (const [clusterId, pts] of Object.entries(mapping)) {
        scores[clusterId] += pts;
      }
    }
  }

  // Score goals
  for (const goal of responses.goals) {
    const mapping = GOAL_SCORES[goal];
    if (mapping) {
      for (const [clusterId, pts] of Object.entries(mapping)) {
        scores[clusterId] += pts;
      }
    }
  }

  // Sort deterministically: by score desc, then by cluster id alphabetically for ties
  return Object.keys(CLUSTERS)
    .map((id) => ({
      id,
      score: scores[id],
      matchedInterests: matchedInterests[id],
      matchedStrengths: matchedStrengths[id],
    }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

// ─── "Why it fits" generator ──────────────────────────────────────────────────

function buildWhyItFits(
  cluster: { id: string; matchedInterests: string[]; matchedStrengths: string[] },
  responses: QuizResponses
): string {
  const parts: string[] = [];

  if (cluster.matchedInterests.length > 0) {
    const interestList = cluster.matchedInterests.slice(0, 2).join(" and ");
    parts.push(`your interest in ${interestList}`);
  }

  if (cluster.matchedStrengths.length > 0) {
    const strengthList = cluster.matchedStrengths.slice(0, 2).join(" and ");
    parts.push(`your strength in ${strengthList.toLowerCase()}`);
  }

  // Add working style context
  const styleMap: Record<string, string> = {
    solo: "independent work style",
    "small-team": "preference for small collaborative teams",
    "large-team": "comfort working in large groups",
    mixed: "flexible approach to teamwork",
  };
  const style = styleMap[responses.workingStyle.teamPreference] || "adaptable work style";

  if (parts.length > 0) {
    return `This cluster aligns with ${parts.join(" and ")}, combined with your ${style}.`;
  }
  return `Your ${style} and overall profile suggest you would thrive in this area.`;
}

// ─── Learning path generator ──────────────────────────────────────────────────

function buildLearningPath(topCluster: string, responses: QuizResponses): LearningPathStep[] {
  const clusterName = CLUSTERS[topCluster]?.name || "your top career area";

  const planningDescriptions: Record<string, string> = {
    planner: "Create a structured study schedule with weekly goals and milestones",
    flexible: "Explore different resources and adjust your focus based on what resonates most",
    mixed: "Set big-picture goals each month, then adapt your daily approach as needed",
    deadline: "Set clear deadlines for each learning milestone and use time pressure to stay motivated",
  };

  const planDesc = planningDescriptions[responses.workingStyle.planningStyle]
    || planningDescriptions.mixed;

  return [
    {
      step: 1,
      title: "Self-Discovery Complete",
      description: "You've identified your interests, strengths, and values. Use these insights as a compass for your next steps.",
      timeframe: "Now",
    },
    {
      step: 2,
      title: `Explore ${clusterName}`,
      description: `Research careers in ${clusterName}. Watch videos, read articles, and talk to professionals or teachers in this field.`,
      timeframe: "Next 1-2 months",
    },
    {
      step: 3,
      title: "Build Foundational Skills",
      description: `${planDesc}. Focus on the high-priority subjects and technical skills recommended in your career map.`,
      timeframe: "Next 3-6 months",
    },
    {
      step: 4,
      title: "Gain Real Experience",
      description: "Join relevant clubs, volunteer, or start personal projects to build a portfolio and test your interests in practice.",
      timeframe: "Grade 10-11",
    },
    {
      step: 5,
      title: "Explore Higher Education Paths",
      description: "Research universities and programs in Vietnam and abroad that align with your top career clusters. Attend open days and info sessions.",
      timeframe: "Grade 11",
    },
    {
      step: 6,
      title: "Prepare Applications & Portfolio",
      description: "Compile your achievements, refine your portfolio, and prepare strong applications for your target programs.",
      timeframe: "Grade 11-12",
    },
  ];
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function generateDeterministicCareerMap(responses: QuizResponses): CareerMapResult {
  const ranked = scoreCluster(responses);
  const top3 = ranked.slice(0, 3);

  // Clusters
  const clusters: ClusterResult[] = top3.map((c) => ({
    name: CLUSTERS[c.id].name,
    description: CLUSTERS[c.id].description,
    whyItFits: buildWhyItFits(c, responses),
  }));

  // Subjects — take from top 3 clusters, assign priority by rank, deduplicate
  const seenSubjects = new Set<string>();
  const subjects: SubjectResult[] = [];
  const priorities: Array<"high" | "medium" | "low"> = ["high", "medium", "low"];

  for (let i = 0; i < top3.length; i++) {
    const clusterSubjects = CLUSTER_SUBJECTS[top3[i].id] || [];
    for (const s of clusterSubjects) {
      if (!seenSubjects.has(s.name)) {
        seenSubjects.add(s.name);
        subjects.push({ name: s.name, priority: priorities[i], reason: s.reason });
      }
    }
  }
  // Keep 4-6 subjects
  const finalSubjects = subjects.slice(0, 6);

  // Hard skills — 2 from primary, 1 from secondary, 1 from tertiary
  const hardSkills: SkillResult[] = [];
  const seenHard = new Set<string>();
  const hardCounts = [2, 1, 1];
  for (let i = 0; i < top3.length; i++) {
    const pool = CLUSTER_HARD_SKILLS[top3[i].id] || [];
    let added = 0;
    for (const sk of pool) {
      if (!seenHard.has(sk.name) && added < hardCounts[i]) {
        seenHard.add(sk.name);
        hardSkills.push(sk);
        added++;
      }
    }
  }

  // Soft skills — 2 from primary, 1 from secondary
  const softSkills: SkillResult[] = [];
  const seenSoft = new Set<string>();
  const softCounts = [2, 1];
  for (let i = 0; i < Math.min(top3.length, 2); i++) {
    const pool = CLUSTER_SOFT_SKILLS[top3[i].id] || [];
    let added = 0;
    for (const sk of pool) {
      if (!seenSoft.has(sk.name) && added < softCounts[i]) {
        seenSoft.add(sk.name);
        softSkills.push(sk);
        added++;
      }
    }
  }

  // Learning path
  const learningPaths = buildLearningPath(top3[0].id, responses);

  // Extracurriculars — 2 from each top cluster, deduplicated
  const seenExtra = new Set<string>();
  const extracurriculars: string[] = [];
  for (let i = 0; i < top3.length; i++) {
    const pool = CLUSTER_EXTRACURRICULARS[top3[i].id] || [];
    let added = 0;
    for (const ex of pool) {
      if (!seenExtra.has(ex) && added < 2) {
        seenExtra.add(ex);
        extracurriculars.push(ex);
        added++;
      }
    }
  }

  return {
    clusters,
    subjects: finalSubjects,
    skills: { hard: hardSkills, soft: softSkills },
    learningPaths,
    extracurriculars,
  };
}

// ─── Deterministic summary generator ──────────────────────────────────────────

export function generateDeterministicSummary(responses: QuizResponses): string {
  const ranked = scoreCluster(responses);
  const top2 = ranked.slice(0, 2);
  const topCluster1 = CLUSTERS[top2[0].id].name;
  const topCluster2 = CLUSTERS[top2[1].id].name;

  const interestList = responses.interests.slice(0, 3).join(", ");
  const strengthList = responses.strengths.slice(0, 3).map((s) => s.toLowerCase()).join(", ");
  const valueList = responses.values.slice(0, 2).join(" and ").toLowerCase();

  return `You're someone who's drawn to ${interestList}, with natural strengths in ${strengthList}. You care deeply about ${valueList}, which shapes the kind of career where you'll find meaning. Your profile suggests strong alignment with ${topCluster1} and ${topCluster2} — both areas where your unique combination of interests and abilities can make a real difference.`;
}
