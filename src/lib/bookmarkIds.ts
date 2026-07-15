// Single source of truth for the id shape a lesson bookmark is stored under
// in storage.ts's BookmarkMap — keeps LearnScreen and LessonDetail (which
// toggle the same lesson's bookmark from two different screens) from
// drifting into two different id formats.
export function lessonBookmarkId(day: number): string {
  return `lesson-${day}`;
}
