import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import LandingPage from "./components/page";
import CoursePage from "./components/course-page";

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/courses/:courseId" element={<CoursePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
