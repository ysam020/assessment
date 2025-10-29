import grpc from "@grpc/grpc-js";
import { BaseServiceController } from "@studyAbroad/grpc-utils";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { RecommendationResponse } from "@studyAbroad/proto-defs/recommendation";

class RecommendationController extends BaseServiceController {
  constructor() {
    super();
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.useMockData = !this.geminiApiKey;

    if (this.useMockData) {
      console.log("Using mock recommendations (GEMINI_API_KEY not set)");
    } else {
      // Initialize Gemini AI
      this.genAI = new GoogleGenerativeAI(this.geminiApiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    }
  }

  // Get course recommendations based on user preferences
  async getRecommendations(call, callback) {
    await this.execute(call, callback, async () => {
      const { topics, skill_level, preferred_duration, limit } = call.request;

      // Validation
      if (!topics || topics.length === 0) {
        return this.sendError(
          callback,
          grpc.status.INVALID_ARGUMENT,
          "At least one topic is required"
        );
      }

      if (!skill_level) {
        return this.sendError(
          callback,
          grpc.status.INVALID_ARGUMENT,
          "Skill level is required"
        );
      }

      const validSkillLevels = ["beginner", "intermediate", "advanced"];
      if (!validSkillLevels.includes(skill_level.toLowerCase())) {
        return this.sendError(
          callback,
          grpc.status.INVALID_ARGUMENT,
          `Skill level must be one of: ${validSkillLevels.join(", ")}`
        );
      }

      const recommendationLimit = limit || 5;

      try {
        let recommendations;

        if (this.useMockData) {
          recommendations = await this.getMockRecommendations(
            topics,
            skill_level,
            preferred_duration,
            recommendationLimit
          );
        } else {
          recommendations = await this.getGeminiRecommendations(
            topics,
            skill_level,
            preferred_duration,
            recommendationLimit
          );
        }

        // Validate recommendations array
        if (!Array.isArray(recommendations)) {
          throw new Error("Recommendations must be an array");
        }

        // Filter and validate each recommendation
        const validRecommendations = recommendations.filter((rec) => {
          return rec && rec.title && rec.description;
        });

        if (validRecommendations.length === 0) {
          throw new Error("No valid recommendations generated");
        }

        // Sanitize all fields to match proto definition
        const sanitizedRecommendations = validRecommendations.map((rec) => ({
          title: String(rec.title),
          description: String(rec.description),
          category: String(rec.category || "General"),
          skill_level: String(rec.skill_level),
          duration: String(rec.duration),
          instructor: String(rec.instructor),
          relevance_score: Number(rec.relevance_score),
          topics: Array.isArray(rec.topics) ? rec.topics.map(String) : [],
        }));

        // Send success response
        this.sendSuccess(callback, RecommendationResponse, {
          recommendations: sanitizedRecommendations,
          message: this.useMockData
            ? "Mock recommendations generated successfully (Set GEMINI_API_KEY for AI-powered recommendations)"
            : "Recommendations generated successfully",
          total_count: sanitizedRecommendations.length,
        });
      } catch (error) {
        console.error("Error generating recommendations:", error);
        this.sendError(
          callback,
          grpc.status.INTERNAL,
          `Failed to generate recommendations: ${error.message}`
        );
      }
    });
  }

  // Get recommendations from Gemini AI
  async getGeminiRecommendations(topics, skillLevel, preferredDuration, limit) {
    const prompt = `You are a course recommendation expert. Generate ${limit} course recommendations based on the following criteria:

    Topics: ${topics.join(", ")}
    Skill Level: ${skillLevel}
    ${preferredDuration ? `Preferred Duration: ${preferredDuration}` : ""}

    For each course, provide:
    1. Title (creative and engaging)
    2. Description (2-3 sentences describing what students will learn)
    3. Category (one of: Programming, Data Science, Web Development, Mobile Development, Cloud Computing, AI/ML, DevOps, Cybersecurity)
    4. Skill Level (beginner, intermediate, or advanced)
    5. Duration (e.g., "4 weeks", "10 hours", "3 months")
    6. Instructor name (fictional but professional-sounding)
    7. Relevance score (0.0 to 1.0, how relevant this course is to the requested topics)
    8. Matching topics (which of the requested topics this course covers)

    Format your response as a JSON array of objects with these exact fields:
    title, description, category, skill_level, duration, instructor, relevance_score, topics

    Example format:
    [
      {
        "title": "Advanced React Patterns and Best Practices",
        "description": "Master advanced React concepts including hooks, context API, and performance optimization. Learn to build scalable applications with modern React patterns.",
        "category": "Web Development",
        "skill_level": "advanced",
        "duration": "6 weeks",
        "instructor": "Dr. Sarah Chen",
        "relevance_score": 0.95,
        "topics": ["React", "JavaScript"]
      }
    ]

    IMPORTANT: Return ONLY the JSON array, no markdown formatting, no code blocks, just the raw JSON.`;

    try {
      // Call Gemini AI API
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      let jsonText = text.trim();

      // Remove markdown code blocks if present
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```\n?/g, "").trim();
      }

      // Extract array if wrapped in other text
      const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonText = arrayMatch[0];
      }

      const courses = JSON.parse(jsonText);

      // Validate that we got an array
      if (!Array.isArray(courses)) {
        throw new Error("Expected array of courses from Gemini AI");
      }

      // Validate and format response to match proto definition
      return courses
        .filter((course) => course && course.title && course.description)
        .map((course) => ({
          title: String(course.title || "Untitled Course"),
          description: String(course.description || "No description available"),
          category: String(course.category || "General"),
          skill_level: String(course.skill_level || skillLevel),
          duration: String(course.duration || "Variable"),
          instructor: String(course.instructor || "Expert Instructor"),
          relevance_score: Number(course.relevance_score || 0.5),
          topics: Array.isArray(course.topics)
            ? course.topics.map(String)
            : topics,
        }));
    } catch (error) {
      console.error("Gemini AI API error:", error);
      console.error("Error details:", error.message);
      // Fallback to mock data if AI fails
      console.log("Falling back to mock recommendations due to API error");
      return this.getMockRecommendations(
        topics,
        skillLevel,
        preferredDuration,
        limit
      );
    }
  }

  // Get mock recommendations
  async getMockRecommendations(topics, skillLevel, preferredDuration, limit) {
    // Mock course database
    const mockCourses = [
      {
        title: "Complete MongoDB Development Bootcamp",
        description:
          "Master MongoDB from basics to advanced. Learn data modeling, indexing, aggregation pipelines, and building scalable database solutions.",
        category: "Database",
        skill_level: "beginner",
        duration: "8 weeks",
        instructor: "Prof. David Kumar",
        topics: ["MongoDB", "Database", "NoSQL"],
        relevance_score: 0.95,
      },
      {
        title: "Advanced MongoDB Performance Optimization",
        description:
          "Deep dive into MongoDB performance tuning, sharding, replication, and production best practices for enterprise applications.",
        category: "Database",
        skill_level: "advanced",
        duration: "6 weeks",
        instructor: "Dr. Sarah Chen",
        topics: ["MongoDB", "Performance", "Database"],
        relevance_score: 0.88,
      },
      {
        title: "Complete Web Development Bootcamp",
        description:
          "Learn HTML, CSS, JavaScript, React, Node.js, and MongoDB. Build 10+ real-world projects and become a full-stack developer.",
        category: "Web Development",
        skill_level: "beginner",
        duration: "12 weeks",
        instructor: "Prof. John Smith",
        topics: [
          "JavaScript",
          "React",
          "Node.js",
          "MongoDB",
          "Web Development",
        ],
        relevance_score: 0.85,
      },
      {
        title: "MERN Stack Masterclass",
        description:
          "Build production-ready applications with MongoDB, Express, React, and Node.js. Includes authentication, API design, and deployment.",
        category: "Web Development",
        skill_level: "intermediate",
        duration: "10 weeks",
        instructor: "Dr. Emily Johnson",
        topics: ["MongoDB", "Express", "React", "Node.js"],
        relevance_score: 0.92,
      },
      {
        title: "Database Design and Architecture with MongoDB",
        description:
          "Learn database design patterns, schema optimization, and architectural best practices for building scalable MongoDB applications.",
        category: "Database",
        skill_level: "intermediate",
        duration: "7 weeks",
        instructor: "Prof. Michael Zhang",
        topics: ["MongoDB", "Database Design", "Architecture"],
        relevance_score: 0.87,
      },
      {
        title: "Python for Data Science and Machine Learning",
        description:
          "Comprehensive course covering NumPy, Pandas, Matplotlib, Scikit-learn, and TensorFlow for data analysis and ML projects.",
        category: "Data Science",
        skill_level: "beginner",
        duration: "10 weeks",
        instructor: "Dr. Lisa Anderson",
        topics: ["Python", "Data Science", "Machine Learning"],
        relevance_score: 0.65,
      },
      {
        title: "Advanced React Patterns and Performance",
        description:
          "Master advanced React concepts including hooks, context, Redux, and performance optimization techniques for production applications.",
        category: "Web Development",
        skill_level: "advanced",
        duration: "6 weeks",
        instructor: "Dr. Emily Chen",
        topics: ["React", "JavaScript", "Performance"],
        relevance_score: 0.7,
      },
      {
        title: "Node.js and Express Backend Development",
        description:
          "Build RESTful APIs, implement authentication, work with databases, and deploy Node.js applications to production.",
        category: "Backend Development",
        skill_level: "intermediate",
        duration: "8 weeks",
        instructor: "Prof. Robert Martinez",
        topics: ["Node.js", "Express", "Backend", "MongoDB"],
        relevance_score: 0.82,
      },
    ];

    // Filter courses by topics and skill level
    let filteredCourses = mockCourses.filter((course) => {
      // Check if course topics overlap with requested topics
      const topicMatch = topics.some((topic) =>
        course.topics.some(
          (courseTopic) =>
            courseTopic.toLowerCase().includes(topic.toLowerCase()) ||
            topic.toLowerCase().includes(courseTopic.toLowerCase())
        )
      );

      // Match skill level
      const skillMatch =
        course.skill_level.toLowerCase() === skillLevel.toLowerCase();

      // Prioritize courses that match both, but include topic matches even if skill doesn't match
      return topicMatch || skillMatch;
    });

    // Sort by relevance score
    filteredCourses.sort((a, b) => b.relevance_score - a.relevance_score);

    // If we have fewer results than requested, add some general courses
    if (filteredCourses.length < limit) {
      const remainingCourses = mockCourses.filter(
        (course) => !filteredCourses.includes(course)
      );
      filteredCourses = [...filteredCourses, ...remainingCourses];
    }

    // Return limited number of courses
    return filteredCourses.slice(0, limit);
  }
}

export default RecommendationController;
