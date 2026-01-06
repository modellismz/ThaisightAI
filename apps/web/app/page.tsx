'use client';

import Link from 'next/link';
import { Plus, FileText, BarChart2 } from 'lucide-react';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>📊</span>
          <h1>ThaisightAI</h1>
        </div>
        <p className={styles.tagline}>Build intelligent surveys that deliver insights</p>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <h2>Create your first survey</h2>
          <p>Get started by creating a new survey or browse your existing ones.</p>

          <div className={styles.actions}>
            <Link href="/builder/new" className="btn btn-primary">
              <Plus size={18} />
              Create New Survey
            </Link>
            <Link href="/surveys" className="btn btn-secondary">
              <FileText size={18} />
              My Surveys
            </Link>
          </div>
        </section>

        <section className={styles.features}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎨</div>
            <h3>Drag & Drop Builder</h3>
            <p>Intuitive editor with 8+ question types, branching logic, and real-time preview.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📱</div>
            <h3>Multi-Channel Distribution</h3>
            <p>Share via email, SMS, QR codes, or embed anywhere. Track opens and completions.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📈</div>
            <h3>Real-time Analytics</h3>
            <p>Instant insights with charts, exports, and NPS tracking. No waiting for results.</p>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>© 2026 ThaisightAI. Built for scalability.</p>
      </footer>
    </div>
  );
}
