import React, { useEffect, useMemo, useRef, useState } from "react";
import "./playlist.css";

const VideoPlaylist = ({ videos = [], headline = "Course playlist", course = null }) => {
  //use videos and title
  const courseVideos = course ? course.videos || [] : videos;
  const title = course ? course.title : headline;
  const courseKey = course ? course.id : "standalone";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const videoRef = useRef(null);

  const currentVideo = courseVideos[currentIndex] ?? null;

  useEffect(() => {
    setCurrentIndex(0);
  }, [courseKey, videos]);

  useEffect(() => {
    if (!videoRef.current || !currentVideo) {
      return;
    }

    const handleEnded = () => {
      setCurrentIndex((prevIndex) => {
        if (!isAutoplay) {
          return prevIndex;
        }
        const nextIndex = prevIndex + 1;
        return nextIndex < courseVideos.length ? nextIndex : prevIndex;
      });
    };

    const node = videoRef.current;
    node.addEventListener("ended", handleEnded);
    return () => {
      node.removeEventListener("ended", handleEnded);
    };
  }, [isAutoplay, courseVideos.length, currentVideo]);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }
    videoRef.current.load();
    videoRef.current.play().catch(() => {
      /* autoplay may be blocked, manual play */
    });
  }, [currentIndex]);

  const totalDuration = useMemo(() => {
    return courseVideos
      .map((item) => item.length)
      .filter(Boolean)
      .join(" • ");
  }, [courseVideos]);

  if (!currentVideo) {
    return null;
  }

  return (
    <div className="playlist playlist--course">
      <div className="playlist__player playlist__player--course">
        <div className="playlist__player-header">
          <div>
            <p className="playlist__eyebrow">{title}</p>
            <h3>{currentVideo.title}</h3>
            <p className="playlist__meta">{totalDuration}</p>
          </div>
          <div className="playlist__toggles">
            <label className="toggle">
              <input
                type="checkbox"
                checked={isAutoplay}
                onChange={(event) => setIsAutoplay(event.target.checked)}
              />
              <span className="toggle__slider" />
              <span className="toggle__label">Autoplay</span>
            </label>
          </div>
        </div>

        <div className="playlist__video-wrapper playlist__video-wrapper--course">
          <video ref={videoRef} controls poster={currentVideo.poster} className="playlist__video">
            <source src={currentVideo.url} type="video/mp4" />
            Your browser does not support embedded videos.
          </video>
        </div>
      </div>

      <aside className="playlist__sidebar playlist__sidebar--course">
        <header className="playlist__sidebar-header">
          <h4>Course outline</h4>
          <span>{courseVideos.length} lessons</span>
        </header>

        <div className="course-progress">
          <div className="progress-bar" style={{ width: `8%` }} />
          <div className="progress-meta">Progress • 8%</div>
        </div>

        <nav className="playlist__list" aria-label="Playlist">
          {courseVideos.map((video, index) => {
            const isActive = index === currentIndex;
            return (
              <button
                key={video.id || video.url}
                type="button"
                className={`playlist-item${isActive ? " is-active" : ""}`}
                onClick={() => setCurrentIndex(index)}
              >
                <span className="playlist-item__index">{String(index + 1).padStart(2, "0")}</span>
                <div className="playlist-item__content">
                  <span className="playlist-item__title">{video.title}</span>
                  <span className="playlist-item__length">{video.length}</span>
                </div>
                <span className="playlist-item__status" aria-hidden="true">
                  {isActive ? "Playing" : "Play"}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>
    </div>
  );
};

export default VideoPlaylist;
