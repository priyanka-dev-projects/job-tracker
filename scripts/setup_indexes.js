// Run: mongosh "mongodb://jat_user:jat_pass@localhost:27017/jat" --file setup_indexes.js
const db = connect("mongodb://jat_user:jat_pass@localhost:27017/jat");
print("Creating indexes...");
db.users.createIndex({ email: 1 }, { unique: true });
db.resumes.createIndex({ user_id: 1 });
db.resumes.createIndex({ user_id: 1, created_at: -1 });
db.applications.createIndex({ user_id: 1 });
db.applications.createIndex({ user_id: 1, status: 1 });
db.applications.createIndex({ user_id: 1, updated_at: -1 });
db.job_descriptions.createIndex({ application_id: 1 }, { unique: true });
db.job_descriptions.createIndex({ user_id: 1 });
print("Done.");
