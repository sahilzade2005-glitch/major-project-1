
import React, { useEffect, useState } from "react";
import {
  getJobs,
  addJob,
  getApplications,
  applyJob,
  getDashboard
} from "./api";

const menu = [
  "Dashboard",
  "Find Jobs",
  "Skill Matching",
  "My Applications",
  "Post a Job"
];

const emptyJob = {
  title: "",
  company: "",
  location: "",
  salary: "",
  type: "Full Time",
  skills: "",
  description: ""
};

const emptyApplication = {
  name: "",
  email: "",
  skills: ""
};

function parseSkills(text) {
  return [...new Set(
    text.split(",")
      .map(skill => skill.trim().toLowerCase())
      .filter(Boolean)
  )];
}

function matchScore(userSkills, requiredSkills) {
  const required = parseSkills(requiredSkills);
  if (required.length === 0) return 0;

  const user = parseSkills(userSkills);
  const matched = required.filter(skill =>
    user.includes(skill)
  );

  return Math.round(
    (matched.length / required.length) * 100
  );
}

export default function App() {
  const [page, setPage] = useState("Dashboard");
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [dashboard, setDashboard] = useState({});
  const [search, setSearch] = useState("");
  const [mySkills, setMySkills] = useState("");
  const [jobForm, setJobForm] = useState(emptyJob);
  const [applicationForm, setApplicationForm] =
    useState(emptyApplication);
  const [selectedJob, setSelectedJob] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const [jobData, appData, stats] =
        await Promise.all([
          getJobs(),
          getApplications(),
          getDashboard()
        ]);

      setJobs(jobData);
      setApplications(appData);
      setDashboard(stats);
    } catch (error) {
      setMessage("Connection error: " + error.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function navigate(nextPage) {
    setPage(nextPage);
    setMessage("");
    setSelectedJob(null);
  }

  async function submitJob(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      await addJob(jobForm);
      setJobForm({ ...emptyJob });
      await refresh();
      setMessage("Job posted successfully!");
      setPage("Find Jobs");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitApplication(e) {
    e.preventDefault();
    if (!selectedJob) return;

    setBusy(true);
    setMessage("");

    try {
      await applyJob({
        ...applicationForm,
        jobId: selectedJob.id
      });

      setApplicationForm({ ...emptyApplication });
      setSelectedJob(null);
      await refresh();
      setMessage("Application submitted successfully!");
      setPage("My Applications");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  const filteredJobs = jobs.filter(job => {
    const text = (
      job.title + " " +
      job.company + " " +
      job.location + " " +
      job.skills
    ).toLowerCase();

    return text.includes(search.toLowerCase());
  });

  const matchedJobs = jobs
    .map(job => ({
      ...job,
      score: matchScore(mySkills, job.skills)
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">S</div>
          <div>
            <h2>SkillHire</h2>
            <small>Smart Job Portal</small>
          </div>
        </div>

        <p className="menu-label">MAIN MENU</p>

        <nav>
          {menu.map(item => (
            <button
              key={item}
              className={
                page === item ? "nav-item active" : "nav-item"
              }
              onClick={() => navigate(item)}
            >
              <span className="nav-symbol">◆</span>
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span>✦</span>
            <h3>Find Your Dream Job</h3>
            <p>
              Discover opportunities matching your skills.
            </p>
          </div>
          <small>SkillHire © 2026</small>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{page}</h1>
            <p>Welcome to your smart career platform</p>
          </div>
          <div className="profile">
            <div className="avatar">U</div>
            <div>
              <strong>Demo User</strong>
              <small>Job Seeker</small>
            </div>
          </div>
        </header>

        {message && (
          <div className="alert" role="status">
            {message}
            <button onClick={() => setMessage("")}>
              ×
            </button>
          </div>
        )}

        {page === "Dashboard" && (
          <>
            <section className="hero">
              <div>
                <span className="hero-label">
                  ✦ YOUR CAREER STARTS HERE
                </span>
                <h2>Find the right job for your skills.</h2>
                <p>
                  Explore exciting career opportunities,
                  match your skills with job requirements,
                  and take the next step in your career.
                </p>
                <button
                  className="btn white-btn"
                  onClick={() => navigate("Find Jobs")}
                >
                  Explore Jobs →
                </button>
              </div>
              <div className="hero-art">✦</div>
            </section>

            <section className="stats">
              <Stat
                icon="▣"
                title="Total Jobs"
                value={dashboard.totalJobs ?? 0}
                color="purple"
              />
              <Stat
                icon="▦"
                title="Companies"
                value={dashboard.totalCompanies ?? 0}
                color="blue"
              />
              <Stat
                icon="✓"
                title="Applications"
                value={dashboard.totalApplications ?? 0}
                color="green"
              />
              <Stat
                icon="✦"
                title="Job Categories"
                value={dashboard.totalCategories ?? 0}
                color="orange"
              />
            </section>

            <section className="panel">
              <div className="section-heading">
                <div>
                  <h3>Latest Job Opportunities</h3>
                  <p>Discover recently posted jobs</p>
                </div>
                <button
                  className="btn outline-btn"
                  onClick={() => navigate("Find Jobs")}
                >
                  View All →
                </button>
              </div>

              <div className="job-grid">
                {jobs.slice(0, 4).map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onApply={() => setSelectedJob(job)}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {page === "Find Jobs" && (
          <section className="panel">
            <div className="section-heading">
              <div>
                <h3>Explore Available Jobs</h3>
                <p>Search by title, company, city, or skill</p>
              </div>
            </div>

            <input
              className="search-input"
              placeholder="Search jobs, skills, companies..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <p className="result-count">
              {filteredJobs.length} jobs found
            </p>

            <div className="job-grid">
              {filteredJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  onApply={() => setSelectedJob(job)}
                />
              ))}
            </div>

            {filteredJobs.length === 0 && (
              <p className="empty">No jobs found.</p>
            )}
          </section>
        )}

        {page === "Skill Matching" && (
          <>
            <section className="panel">
              <h3>Smart Skill Matching</h3>
              <p className="subtitle">
                Enter your skills separated by commas.
                We will calculate your match percentage.
              </p>

              <div className="skill-search">
                <input
                  placeholder="Example: HTML, CSS, JavaScript, React"
                  value={mySkills}
                  onChange={e => setMySkills(e.target.value)}
                />
              </div>

              <div className="info-box">
                <strong>How matching works</strong>
                <p>
                  Matching required skills ÷ Total required
                  skills × 100 = Match percentage
                </p>
              </div>
            </section>

            {mySkills.trim() && (
              <section className="panel">
                <div className="section-heading">
                  <div>
                    <h3>Recommended Jobs</h3>
                    <p>Sorted by skill match percentage</p>
                  </div>
                </div>

                <div className="job-grid">
                  {matchedJobs.map(job => (
                    <JobCard
                      key={job.id}
                      job={job}
                      score={job.score}
                      onApply={() => setSelectedJob(job)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {page === "My Applications" && (
          <section className="panel">
            <div className="section-heading">
              <div>
                <h3>Application History</h3>
                <p>View submitted job applications</p>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Match</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => (
                    <tr key={app.id}>
                      <td>{app.name}</td>
                      <td>{app.jobTitle}</td>
                      <td>{app.company}</td>
                      <td>
                        <span className="match-pill">
                          {app.matchScore}%
                        </span>
                      </td>
                      <td>
                        <span className="status">
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {applications.length === 0 && (
                    <tr>
                      <td colSpan="5" className="empty">
                        No applications submitted yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {page === "Post a Job" && (
          <section className="panel form-panel">
            <h3>Post a New Job</h3>
            <p className="subtitle">
              Add a new opportunity to the job portal.
            </p>

            <form className="form-grid" onSubmit={submitJob}>
              <Field
                label="Job Title"
                value={jobForm.title}
                onChange={v => setJobForm({
                  ...jobForm, title: v
                })}
                placeholder="Frontend Developer"
              />

              <Field
                label="Company Name"
                value={jobForm.company}
                onChange={v => setJobForm({
                  ...jobForm, company: v
                })}
                placeholder="Company name"
              />

              <Field
                label="Location"
                value={jobForm.location}
                onChange={v => setJobForm({
                  ...jobForm, location: v
                })}
                placeholder="Nagpur, Maharashtra"
              />

              <Field
                label="Salary"
                value={jobForm.salary}
                onChange={v => setJobForm({
                  ...jobForm, salary: v
                })}
                placeholder="₹3 - 5 LPA"
              />

              <label className="field">
                Job Type
                <select
                  value={jobForm.type}
                  onChange={e => setJobForm({
                    ...jobForm,
                    type: e.target.value
                  })}
                >
                  <option>Full Time</option>
                  <option>Part Time</option>
                  <option>Internship</option>
                  <option>Remote</option>
                </select>
              </label>

              <Field
                label="Required Skills"
                value={jobForm.skills}
                onChange={v => setJobForm({
                  ...jobForm, skills: v
                })}
                placeholder="HTML, CSS, JavaScript"
              />

              <label className="field full">
                Job Description
                <textarea
                  required
                  maxLength={1000}
                  rows={4}
                  value={jobForm.description}
                  onChange={e => setJobForm({
                    ...jobForm,
                    description: e.target.value
                  })}
                  placeholder="Describe the job role..."
                />
              </label>

              <button className="btn primary-btn" disabled={busy}>
                {busy ? "Posting..." : "Post Job"}
              </button>
            </form>
          </section>
        )}

        {selectedJob && (
          <div
            className="modal-overlay"
            onClick={() => setSelectedJob(null)}
          >
            <div
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-label="Apply for job"
              onClick={e => e.stopPropagation()}
            >
              <button
                className="close-modal"
                onClick={() => setSelectedJob(null)}
              >
                ×
              </button>

              <h2>Apply for {selectedJob.title}</h2>
              <p className="subtitle">
                {selectedJob.company}
              </p>

              <form onSubmit={submitApplication}>
                <Field
                  label="Your Full Name"
                  value={applicationForm.name}
                  onChange={v => setApplicationForm({
                    ...applicationForm, name: v
                  })}
                  placeholder="Enter your name"
                />

                <Field
                  label="Email Address"
                  type="email"
                  value={applicationForm.email}
                  onChange={v => setApplicationForm({
                    ...applicationForm, email: v
                  })}
                  placeholder="example@email.com"
                />

                <Field
                  label="Your Skills"
                  value={applicationForm.skills}
                  onChange={v => setApplicationForm({
                    ...applicationForm, skills: v
                  })}
                  placeholder="HTML, CSS, React"
                />

                <button
                  className="btn primary-btn"
                  disabled={busy}
                >
                  {busy ? "Submitting..." : "Submit Application"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ icon, title, value, color }) {
  return (
    <div className="stat-card">
      <div className={"stat-icon " + color}>
        {icon}
      </div>
      <p>{title}</p>
      <h2>{value}</h2>
      <small>SkillHire Portal</small>
    </div>
  );
}

function JobCard({ job, score, onApply }) {
  return (
    <div className="job-card">
      <div className="job-card-top">
        <div className="company-icon">
          {job.company.charAt(0).toUpperCase()}
        </div>
        <span className="job-type">{job.type}</span>
      </div>

      <h3>{job.title}</h3>
      <p className="company-name">{job.company}</p>

      <div className="job-details">
        <span>⌖ {job.location}</span>
        <span>₹ {job.salary.replace(/^₹\s*/, "")}</span>
      </div>

      <div className="skills">
        {job.skills.split(",").map((skill, index) => (
          <span key={index}>{skill.trim()}</span>
        ))}
      </div>

      {score !== undefined && (
        <div className="match-section">
          <div className="match-heading">
            <strong>Skill Match</strong>
            <strong>{score}%</strong>
          </div>
          <div className="progress">
            <div style={{ width: score + "%" }} />
          </div>
        </div>
      )}

      <button className="apply-btn" onClick={onApply}>
        Apply Now →
      </button>
    </div>
  );
}

function Field({ label, onChange, ...props }) {
  return (
    <label className="field">
      {label}
      <input
        {...props}
        required
        maxLength={props.maxLength || 150}
        onChange={e => onChange(e.target.value)}
      />
    </label>
  );
}
