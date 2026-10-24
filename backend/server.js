
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = 5000;
const DB_FILE = path.join(__dirname, "data.json");

app.use(cors({
  origin: "http://127.0.0.1:5173"
}));
app.use(express.json({ limit: "30kb" }));

function initialData() {
  return {
    jobs: [
      {
        id: "job-1",
        title: "Frontend Developer",
        company: "TechNova Solutions",
        location: "Nagpur",
        salary: "3 - 5 LPA",
        type: "Full Time",
        skills: "HTML, CSS, JavaScript, React",
        description: "Build responsive web applications."
      },
      {
        id: "job-2",
        title: "Backend Developer",
        company: "CodeCraft Technologies",
        location: "Pune",
        salary: "4 - 7 LPA",
        type: "Full Time",
        skills: "Node.js, Express, MongoDB, JavaScript",
        description: "Develop APIs and backend systems."
      },
      {
        id: "job-3",
        title: "Python Developer",
        company: "DataSphere",
        location: "Mumbai",
        salary: "4 - 6 LPA",
        type: "Full Time",
        skills: "Python, Django, SQL, Git",
        description: "Build Python applications."
      },
      {
        id: "job-4",
        title: "UI UX Designer",
        company: "PixelStudio",
        location: "Bengaluru",
        salary: "3 - 5 LPA",
        type: "Remote",
        skills: "Figma, UI Design, UX Design, CSS",
        description: "Design user-friendly interfaces."
      },
      {
        id: "job-5",
        title: "React Developer Intern",
        company: "NextGen Digital",
        location: "Nagpur",
        salary: "15000/month",
        type: "Internship",
        skills: "HTML, CSS, JavaScript, React",
        description: "Assist in React development."
      },
      {
        id: "job-6",
        title: "Data Analyst",
        company: "Insight Analytics",
        location: "Hyderabad",
        salary: "4 - 6 LPA",
        type: "Full Time",
        skills: "Python, SQL, Excel, Power BI",
        description: "Analyze data and create reports."
      }
    ],
    applications: []
  };
}

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(initialData(), null, 2)
  );
}

function readDB() {
  return JSON.parse(
    fs.readFileSync(DB_FILE, "utf8")
  );
}

function saveDB(data) {
  const tempFile = DB_FILE + ".tmp";
  fs.writeFileSync(
    tempFile,
    JSON.stringify(data, null, 2)
  );
  fs.renameSync(tempFile, DB_FILE);
}

function validText(value, max = 150) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= max
  );
}

function parseSkills(text) {
  return [...new Set(
    text.split(",")
      .map(skill => skill.trim().toLowerCase())
      .filter(Boolean)
  )];
}

function calculateMatch(userSkills, jobSkills) {
  const required = parseSkills(jobSkills);
  const user = parseSkills(userSkills);

  if (required.length === 0) return 0;

  const matched = required.filter(skill =>
    user.includes(skill)
  );

  return Math.round(
    (matched.length / required.length) * 100
  );
}

app.get("/", (req, res) => {
  res.json({
    message: "Smart Job Portal API is running"
  });
});

// Get dashboard statistics
app.get("/api/dashboard", (req, res) => {
  const db = readDB();

  const companies = new Set(
    db.jobs.map(job => job.company)
  );

  const categories = new Set(
    db.jobs.map(job => job.type)
  );

  res.json({
    totalJobs: db.jobs.length,
    totalCompanies: companies.size,
    totalApplications: db.applications.length,
    totalCategories: categories.size
  });
});

// Get all jobs
app.get("/api/jobs", (req, res) => {
  const db = readDB();
  res.json(db.jobs.slice().reverse());
});

// Post a new job
app.post("/api/jobs", (req, res) => {
  const {
    title,
    company,
    location,
    salary,
    type,
    skills,
    description
  } = req.body;

  const allowedTypes = [
    "Full Time",
    "Part Time",
    "Internship",
    "Remote"
  ];

  if (
    !validText(title) ||
    !validText(company) ||
    !validText(location) ||
    !validText(salary) ||
    !allowedTypes.includes(type) ||
    !validText(skills, 500) ||
    parseSkills(skills).length === 0 ||
    !validText(description, 1000)
  ) {
    return res.status(400).json({
      message: "Please enter valid job details."
    });
  }

  const db = readDB();

  const newJob = {
    id: crypto.randomUUID(),
    title: title.trim(),
    company: company.trim(),
    location: location.trim(),
    salary: salary.trim(),
    type,
    skills: skills.trim(),
    description: description.trim()
  };

  db.jobs.push(newJob);
  saveDB(db);

  res.status(201).json({
    message: "Job posted successfully",
    job: newJob
  });
});

// Get applications
app.get("/api/applications", (req, res) => {
  const db = readDB();

  // Email addresses are not included in demo listings.
  const applications = db.applications.map(
    ({ email, skills, ...publicData }) => publicData
  );

  res.json(applications.reverse());
});

// Apply for a job
app.post("/api/applications", (req, res) => {
  const { jobId, name, email, skills } = req.body;

  if (
    !validText(jobId) ||
    !validText(name, 150) ||
    !validText(email, 254) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !validText(skills, 500)
  ) {
    return res.status(400).json({
      message: "Please enter valid application details."
    });
  }

  const db = readDB();
  const job = db.jobs.find(j => j.id === jobId);

  if (!job) {
    return res.status(404).json({
      message: "Job not found."
    });
  }

  const application = {
    id: crypto.randomUUID(),
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    name: name.trim(),
    email: email.trim(),
    skills: skills.trim(),
    matchScore: calculateMatch(skills, job.skills),
    status: "Pending"
  };

  db.applications.push(application);
  saveDB(db);

  res.status(201).json({
    message: "Application submitted successfully",
    id: application.id,
    matchScore: application.matchScore
  });
});

// Handle invalid JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      message: "Invalid JSON data."
    });
  }

  console.error(err);

  res.status(500).json({
    message: "Internal server error."
  });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(
    `Smart Job Portal Backend running at http://127.0.0.1:${PORT}`
  );
});
