import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react'; 
import Footer from '../components/layout/Footer';
import FeedbackModal from '../components/ui/FeedbackModal';
import styles from '../styles/HomePage.module.css';
import { FaArrowRight } from "react-icons/fa";


export default function HomePage() {
  const navigate = useNavigate();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const handleFeedbackSuccess = () => {
    // Could add a toast notification here
    console.log('Feedback submitted successfully');
  };

  // DYNAMIC IMAGES FOR WHY CHOOSE SECTION
  const images = [
    "https://media.timeout.com/images/101599123/750/422/image.jpg",
    "https://i.pinimg.com/736x/79/ba/46/79ba463c09cae3f2543c6b237a11f8d8.jpg",
    "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0e/75/5e/5a/treebo-grand-emerald.jpg",
    "https://thevendry.com/cdn-cgi/image/height=1920,width=1920,fit=contain,metadata=none/https://s3.us-east-1.amazonaws.com/uploads.thevendry.co/36211/1733407787744_74119393_XL.jpg"
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const amenities = [
    {
      title: 'Free WiFi',
      desc: 'High-speed internet throughout the resort',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
          <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
          <circle cx="12" cy="20" r="1" fill="currentColor"/>
        </svg>
      ),
    },
    {
      title: 'Infinity Pool',
      desc: 'Stunning pool with panoramic garden views',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M2 12h20"/>
          <path d="M2 17c1.5-1.5 3-2 4.5-2s3 .5 4.5 2 3 2 4.5 2 3-.5 4.5-2"/>
          <path d="M2 7c1.5-1.5 3-2 4.5-2s3 .5 4.5 2 3 2 4.5 2 3-.5 4.5-2"/>
        </svg>
      ),
    },
    {
      title: 'Room Service',
      desc: '24/7 in-room dining available',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
          <line x1="6" y1="1" x2="6" y2="4"/>
          <line x1="10" y1="1" x2="10" y2="4"/>
          <line x1="14" y1="1" x2="14" y2="4"/>
        </svg>
      ),
    },
  ];

  const whyItems = [
    {
      title: 'Accommodation',
      desc: 'Elegantly designed rooms and villas with amenities',
    },
    {
      title: 'Comfortable Rooms',
      desc: 'Relax in clean, cozy, and well-designed accommodations',
    },
    {
      title: 'Exceptional Service',
      desc: 'Dedicated staff committed to making your stay memorable',
    },
    {
      title: 'Prime Location',
      desc: 'Peaceful retreat yet close to local attractions in Agoo',
    },
  ];

  return (
    <div className="page">
      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <span className={styles.heroEyebrow}>Resort Hotel &amp; Pavilion</span>
          <h1 className={styles.heroTitle}>
            Welcome to<br />
            <span>Infinity Garden</span>
          </h1>
          <p className={styles.heroSub}>Your Tropical Paradise Awaits</p>
          <p className={styles.heroDesc}>
            Experience luxury accommodation surrounded by lush gardens and world-class amenities.
          </p>
          <button className="btn-navy" onClick={() => navigate('/rooms')}>
            <span>Book Your Stay</span>
            <FaArrowRight className="arrow" />
          </button>
        </div>
      </section>

      {/* ── AMENITIES ── */}
      <section className={`section section-bg ${styles.amenitiesSection}`}>
        <div className="container">
          <div className="section-header">
            <h2>Resort Amenities</h2>
            <p>Everything you need for a perfect stay</p>
          </div>
          <div className={styles.amenitiesGrid}>
            {amenities.map((a) => (
              <div key={a.title} className={styles.amenityCard}>
                <div className={styles.amenityIcon}>{a.icon}</div>
                <h3>{a.title}</h3>
                <p>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE ── */}
      <section className="section section-white">
        <div className="container">
          <div className={styles.whyGrid}>
            <div className={styles.whyImg}>
              <img
                key={currentIndex}
                src={images[currentIndex]}
                alt="Infinity Garden dining"
                className={styles.fadeImage}
              />
            </div>
            <div className={styles.whyContent}>
              <h2>Why Choose Infinity Garden?</h2>
              <div className={styles.whyList}>
                {whyItems.map((item) => (
                  <div key={item.title} className={styles.whyItem}>
                    <span className={styles.whyStar}>★</span>
                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn-navy" onClick={() => navigate('/rooms')}>
                <span>Explore Rooms</span>
                <FaArrowRight className="arrow" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className={styles.ctaBand}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2>Ready to Experience Paradise?</h2>
          <p>Experience the perfect natural retreat. Book your stay today!</p>
        </div>
      </section>

      {/* ── FEEDBACK SECTION ── */}
      <section className={styles.feedbackSection}>
        <div className="container">
          <button 
            className={styles.feedbackButton}
            onClick={() => setShowFeedbackModal(true)}
            aria-label="Share feedback"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Share Your Feedback</span>
          </button>
        </div>
      </section>

      <Footer />

      {showFeedbackModal && (
        <FeedbackModal 
          onClose={() => setShowFeedbackModal(false)}
          onSubmit={handleFeedbackSuccess}
        />
      )}
    </div>
  );
}
