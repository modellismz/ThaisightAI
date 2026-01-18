'use client';

import { motion } from 'framer-motion';
import styles from './LoadingAnimation.module.css';

interface LoadingAnimationProps {
    message?: string;
    fullScreen?: boolean;
}

export default function LoadingAnimation({ message = 'Loading...', fullScreen = false }: LoadingAnimationProps) {
    const containerClass = fullScreen ? styles.containerFullScreen : styles.container;

    const dotVariants = {
        initial: { y: 0 },
        animate: { y: -15 }
    };

    const dots = [0, 1, 2, 3, 4];

    return (
        <div className={containerClass}>
            <div className={styles.dotsWrapper}>
                {dots.map((index) => (
                    <motion.div
                        key={index}
                        className={styles.dot}
                        variants={dotVariants}
                        initial="initial"
                        animate="animate"
                        transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut",
                            delay: index * 0.1,
                        }}
                    />
                ))}
            </div>
            
            {/* Message removed as per user request */}
        </div>
    );
}
