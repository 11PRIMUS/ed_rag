import React, { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import courseCatalog from "../data/courses";
import VideoPlaylist from "./playlist";
import Chatbot from "./chatbot";
import "./course-page.css";

const CoursePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const course = useMemo(() => {
    return courseCatalog.find((item) => item.id === courseId);
  }, [courseId]);

  useEffect(() => {
    const existing = document.getElementById("model-viewer-script");
    if (!existing) {
      const script = document.createElement("script");
      script.id = "model-viewer-script";
      script.type = "module";
      script.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
      document.body.appendChild(script);
    }
  }, []);

  const openGlobalChat = () => {
    try {
      window.dispatchEvent(new CustomEvent("open-chat", { detail: { from: "course-page" } }));
    } catch (error) {
      // ignore
    }
  };

  if (!course) {
    return (
      <main className="course-page course-page--missing">
        <div className="course-page__missing-card">
          <h1>Course unavailable</h1>
          <p>head back to browse the catalog and pick another path.</p>
          <button type="button" onClick={() => navigate("/")}>Return to catalog</button>
        </div>
      </main>
    );
  }

  return (
    <main className="course-page">
      <div className="course-page__back">
        <button type="button" onClick={() => navigate("/")}>← Back to catalog</button>
      </div>

      <header className="course-page__header" style={{ background: course.accent }}>
        <div className="course-page__header-content">
          <span className="course-page__pill">Now playing</span>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
          <div className="course-page__meta">
            <span>{course.duration}</span>
            <span>{course.level}</span>
            <span>{course.students.toLocaleString()} learners</span>
          </div>
          <div className="course-page__mentor">
            <img src={course.cover} alt={course.instructor} />
            <div>
              <p>Mentor</p>
              <strong>{course.instructor}</strong>
            </div>
          </div>
        </div>
        <div className="course-page__cover">
          <img src={course.cover} alt={course.title} />
        </div>
      </header>

      <section className="course-page__body">
        <VideoPlaylist course={course} />
      </section>

      <div
        className="course-page__nova"
        role="button"
        tabIndex={0}
        onClick={openGlobalChat}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openGlobalChat();
          }
        }}
        aria-label="Open Nova chat"
      >
        <model-viewer
          src="https://modelviewer.dev/shared-assets/models/Astronaut.glb"
          autoplay
          disable-zoom
          disable-pan
          camera-controls
          exposure="0.9"
        />
      </div>

      <Chatbot />
    </main>
  );
};

export default CoursePage;
