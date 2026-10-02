import { useMemo } from "react";
import { useAuthStore } from "../../stores/auth";
import { useBookmarks, useBookmark, useUnbookmark } from "./useLists";

/**
 * Single entry point for the star toggle used by the problem list and the
 * workspace header. The bookmarked set comes from `GET /users/me/bookmarks`,
 * so the icon state stays consistent across every surface. The query is
 * skipped entirely for anonymous visitors - the toggle is then hidden by the
 * caller because `/users/me/**` requires a token.
 */
export default function useToggleBookmark() {
    const isAuthenticated = useAuthStore((state) => state.auth.isAuthenticated);
    const { bookmarkedIds } = useBookmarks({ enabled: isAuthenticated });
    const star = useBookmark();
    const unstar = useUnbookmark();

    const isBookmarked = useMemo(
        () => (problemId: string) => isAuthenticated && bookmarkedIds.includes(problemId),
        [bookmarkedIds, isAuthenticated],
    );

    return {
        isBookmarked,
        available: isAuthenticated,
        loading: star.loading || unstar.loading,
        toggle: (problemId: string) =>
            isBookmarked(problemId) ? unstar.unbookmark(problemId) : star.bookmark(problemId),
    };
}