import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BottomSheet({ open, onClose, title, children }) {
  /* lock scroll when open */
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* overlay */}
          <motion.div
            className="overlay"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:.2 }}
            onClick={onClose}
          />
          {/* sheet */}
          <motion.div
            className="sheet"
            initial={{ y:'100%' }}
            animate={{ y:0 }}
            exit={{ y:'100%' }}
            transition={{ type:'spring', damping:28, stiffness:320 }}
          >
            <div className="sheet-handle" />
            <div className="sheet-hd">
              <div className="sheet-title">{title}</div>
              <button className="sheet-close" onClick={onClose}>✕</button>
            </div>
            <div className="sheet-body">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
