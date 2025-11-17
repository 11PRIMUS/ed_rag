import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import courseCatalog from "../data/courses";
import "./page.css";

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [featuredCourse, setFeaturedCourse] = useState(courseCatalog[0]);

  const categories = useMemo(
    () => ["All", ...new Set(courseCatalog.map((course) => course.category))],
    [],
  );

  const visibleCourses = useMemo(() => {
    if (activeCategory === "All") {
      return courseCatalog;
    }
    return courseCatalog.filter((course) => course.category === activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    if (!visibleCourses.length) {
      return;
    }

    if (!featuredCourse || !visibleCourses.some((course) => course.id === featuredCourse.id)) {
      setFeaturedCourse(visibleCourses[0]);
    }
  }, [visibleCourses, featuredCourse]);

  const handleFeatureCourse = (course) => {
    setFeaturedCourse(course);
  };

  const handleOpenCourse = (course) => {
    navigate(`/courses/${course.id}`);
  };

  const heroCourse = featuredCourse ?? courseCatalog[0];

  return (
    <main className="landing">
      <div className="landing__glow landing__glow--primary" />
      <div className="landing__glow landing__glow--secondary" />

      <nav className="landing-nav">
        <div className="landing-nav__brand">
          <span className="landing-nav__badge">Allaritech</span>
          <span className="landing-nav__title">Learning Resources</span>
        </div>
        <div className="landing-nav__links">
          {["Home", "Courses", "Paths", "Career Advice", "Contact"].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}>
              {item}
            </a>
          ))}
        </div>
        <button type="button" className="landing-nav__cta">
          Book a Call
        </button>
      </nav>

      <header className="landing-hero" id="home">
        <div className="landing-hero__copy">
          <p className="eyebrow">Training that helps you succeed</p>
          <h1>
            Move your career forward with
            <span className="gradient-text"> job-ready courses</span>
          </h1>
          <p className="subtitle">
            We build practical learning paths so you can master the skills employers expect. Start a new
            journey or level up the role you already love.
          </p>
          <div className="landing-hero__actions">
            <button type="button" className="btn btn--primary">
              Browse catalog
            </button>
            <button type="button" className="btn btn--ghost">
              Continue learning
            </button>
          </div>
          <div className="landing-hero__stats">
            <div className="stat">
              <span className="stat__value">120k+</span>
              <span className="stat__label">Learners onboarded</span>
            </div>
            <div className="stat">
              <span className="stat__value">4.9/5</span>
              <span className="stat__label">Average course rating</span>
            </div>
            <div className="stat">
              <span className="stat__value">38</span>
              <span className="stat__label">Career-ready tracks</span>
            </div>
          </div>
        </div>

        <div className="landing-hero__preview">
          <article className="hero-preview" style={{ background: heroCourse.accent }}>
            <header className="hero-preview__header">
              <span className="hero-preview__pill">Continue course</span>
              <span className="hero-preview__rating">⭐ {heroCourse.rating.toFixed(2)}</span>
            </header>
            <h3>{heroCourse.title}</h3>
            <p>{heroCourse.description}</p>
            <div className="hero-preview__meta">
              <span>{heroCourse.duration}</span>
              <span>{heroCourse.level}</span>
            </div>
            <div className="hero-preview__mentor">
              <img src={heroCourse.cover} alt={heroCourse.title} />
              <div>
                <p>Mentor</p>
                <strong>{heroCourse.instructor}</strong>
                <small>{heroCourse.students.toLocaleString()} learners enrolled</small>
              </div>
            </div>
            <button
              type="button"
              className="hero-preview__cta"
              onClick={() => handleOpenCourse(heroCourse)}
            >
              Continue course
            </button>
          </article>
        </div>
      </header>

      <section className="course-section" id="courses">
        <div className="course-section__header">
          <div>
            <p className="eyebrow">Explore</p>
            <h2>Browse courses led by working experts</h2>
            <p className="subtitle">
              Switch categories to discover what fits your ambition. Tap a course card to open the full
              playlist and meet your mentor.
            </p>
          </div>
          <div className="course-section__filters">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`filter-pill${category === activeCategory ? " is-active" : ""}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="course-grid">
          {visibleCourses.map((course) => {
            const isActive = heroCourse && heroCourse.id === course.id;
            const skillSummary = Array.isArray(course.skills)
              ? course.skills.slice(0, 3).join(", ")
              : "";

            return (
              <article
                key={course.id}
                className={`course-card${isActive ? " is-active" : ""}`}
                onMouseEnter={() => handleFeatureCourse(course)}
                onFocus={() => handleFeatureCourse(course)}
                onClick={() => handleOpenCourse(course)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleOpenCourse(course);
                  }
                }}
              >
                <div className="course-card__media">
                  <img src={course.cover} alt={course.title} />
                  {/* <span className="course-card__tag">{course.level}</span> */}
                </div>
                <div className="course-card__body">
                  <span className="course-card__category">{course.category}</span>
                  <h3>{course.title}</h3>
                  {skillSummary ? (
                    <p className="course-card__skills">Key skills: {skillSummary}</p>
                  ) : (
                    <p className="course-card__skills">{course.description}</p>
                  )}
                  <p className="course-card__instructor">Instructor: {course.instructor}</p>
                  <div className="course-card__divider" />
                  <div className="course-card__metrics">
                    <span className="course-card__rating">
                      ⭐ {course.rating.toFixed(1)} ({course.reviews.toLocaleString()} reviews)
                    </span>
                    <span>{course.duration}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default LandingPage;
