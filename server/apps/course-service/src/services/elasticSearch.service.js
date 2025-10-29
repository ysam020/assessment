import { Client } from "@elastic/elasticsearch";

export class ElasticsearchService {
  constructor() {
    // Initialize Elasticsearch client
    this.client = new Client({
      node: process.env.ELASTICSEARCH_NODE,
      auth:
        process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD
          ? {
              username: process.env.ELASTICSEARCH_USERNAME,
              password: process.env.ELASTICSEARCH_PASSWORD,
            }
          : undefined,
    });

    this.indexName = "courses";
    this.initializeIndex();
  }

  // Initialize Elasticsearch index
  async initializeIndex() {
    try {
      // Check if index exists
      const indexExists = await this.client.indices.exists({
        index: this.indexName,
      });

      if (!indexExists) {
        // Create index with mappings
        await this.client.indices.create({
          index: this.indexName,
          body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 1,
              analysis: {
                analyzer: {
                  course_analyzer: {
                    type: "custom",
                    tokenizer: "standard",
                    filter: ["lowercase", "asciifolding"],
                  },
                },
              },
            },
            mappings: {
              properties: {
                courseId: { type: "keyword" },
                title: {
                  type: "text",
                  analyzer: "course_analyzer",
                  fields: {
                    keyword: { type: "keyword" },
                  },
                },
                description: {
                  type: "text",
                  analyzer: "course_analyzer",
                },
                category: {
                  type: "keyword",
                },
                instructor: {
                  type: "text",
                  fields: {
                    keyword: { type: "keyword" },
                  },
                },
                duration: { type: "keyword" },
                skillLevel: { type: "keyword" },
                tags: { type: "keyword" },
              },
            },
          },
        });
      }
    } catch (error) {
      console.error("Error initializing Elasticsearch index:", error.message);
    }
  }

  // Bulk index multiple courses
  async bulkIndexCourses(courses) {
    try {
      const operations = courses.flatMap((course) => [
        { index: { _index: this.indexName, _id: course.id } },
        {
          courseId: course.courseId,
          title: course.title,
          description: course.description,
          category: course.category,
          instructor: course.instructor,
          duration: course.duration,
          skillLevel: course.skillLevel,
          tags: course.tags || [],
        },
      ]);

      const bulkResponse = await this.client.bulk({
        refresh: true,
        operations,
      });

      if (bulkResponse.errors) {
        const erroredDocuments = [];
        bulkResponse.items.forEach((action, i) => {
          const operation = Object.keys(action)[0];
          if (action[operation].error) {
            erroredDocuments.push({
              status: action[operation].status,
              error: action[operation].error,
              operation: operations[i * 2],
              document: operations[i * 2 + 1],
            });
          }
        });
        console.error("Bulk indexing errors:", erroredDocuments);
        return courses.length - erroredDocuments.length;
      }

      return courses.length;
    } catch (error) {
      console.error("Error bulk indexing courses:", error.message);
      return 0;
    }
  }

  // Search courses with filters
  async searchCourses({
    query,
    category,
    instructor,
    skill_level,
    limit = 10,
    offset = 0,
  }) {
    try {
      // Build Elasticsearch query
      const must = [];
      const filter = [];

      // Full-text search on title and description
      if (query && query.trim()) {
        must.push({
          multi_match: {
            query: query,
            fields: ["title^3", "description^2", "instructor", "tags"],
            type: "best_fields",
            fuzziness: "AUTO",
          },
        });
      }

      // Filter by category
      if (category && category.trim()) {
        filter.push({ term: { category: category.toLowerCase() } });
      }

      // Filter by instructor
      if (instructor && instructor.trim()) {
        filter.push({ match: { "instructor.keyword": instructor } });
      }

      // Filter by skill level
      if (skill_level && skill_level.trim()) {
        filter.push({ term: { skillLevel: skill_level.toLowerCase() } });
      }

      // If no query provided, match all
      if (must.length === 0) {
        must.push({ match_all: {} });
      }

      const searchQuery = {
        bool: {
          must,
          filter,
        },
      };

      // Execute search
      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: searchQuery,
          from: offset,
          size: limit,
          sort: [
            { _score: { order: "desc" } },
            { "title.keyword": { order: "asc" } },
          ],
        },
      });

      // Format results
      const courses = response.hits.hits.map((hit) => ({
        id: hit._id,
        course_id: hit._source.courseId,
        title: hit._source.title,
        description: hit._source.description,
        category: hit._source.category,
        instructor: hit._source.instructor,
        duration: hit._source.duration,
        skill_level: hit._source.skillLevel,
        tags: hit._source.tags || [],
        relevance_score: hit._score,
      }));

      return {
        courses,
        total: response.hits.total.value,
      };
    } catch (error) {
      console.error("Error searching courses:", error.message);
      throw error;
    }
  }

  // Index a single course
  async indexCourse(course) {
    try {
      await this.client.index({
        index: this.indexName,
        id: course.id,
        document: {
          courseId: course.courseId,
          title: course.title,
          description: course.description,
          category: course.category,
          instructor: course.instructor,
          duration: course.duration,
          skillLevel: course.skillLevel,
          tags: course.tags || [],
        },
        refresh: true,
      });
    } catch (error) {
      console.error(`Error indexing course ${course.courseId}:`, error.message);
      throw error;
    }
  }

  // Delete a course from the index
  async deleteCourse(courseId) {
    try {
      await this.client.delete({
        index: this.indexName,
        id: courseId,
        refresh: true,
      });
    } catch (error) {
      if (error.meta?.statusCode === 404) {
        console.warn(`Course not found in index: ${courseId}`);
      } else {
        console.error(`Error deleting course ${courseId}:`, error.message);
        throw error;
      }
    }
  }
}
