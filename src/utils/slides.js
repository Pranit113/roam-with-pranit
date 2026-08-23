/* ─────────────────────────────────────────────────────────────────────────────
   buildPlaceSlides — converts place + trips into HighlightViewer slide array
   Separated from HighlightViewer.jsx to satisfy React fast-refresh rules
   (fast-refresh only works when a file exports components, not mixed exports)
   ───────────────────────────────────────────────────────────────────────────── */
export function buildPlaceSlides(place, trips) {
  const slides = [];
  trips.forEach(trip => {
    if (trip.photos?.length) {
      trip.photos.forEach((photo, pi) => {
        slides.push({
          url:      photo.url,
          tripName: trip.name,
          status:   trip.status,
          emoji:    trip.emoji,
          // Show spots only on first photo of each trip
          spots:    pi === 0 ? (trip.spots || []) : [],
        });
      });
    } else {
      // No photos — show an emoji slide
      slides.push({
        url:      null,
        tripName: trip.name,
        status:   trip.status,
        emoji:    trip.emoji || place?.emoji || '✈️',
        spots:    trip.spots || [],
      });
    }
  });
  return slides;
}
