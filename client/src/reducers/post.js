import {
  GET_POSTS,
  GET_TAGS,
  POST_ERROR,
  UPDATE_LIKES,
  DELETE_POST,
  ADD_POST,
  GET_SINGLE_POST,
  UPDATE_POST,
  TOGGLE_PIN,
  SAVE_POST,
  GET_SAVED_POSTS,
  DELETE_SAVED_POST,
  GET_MY_POSTS,
  GET_USER_POSTS,
  REQUEST_USER_POSTS,
  CLEAR_USER_POSTS,
  GET_USER_POST_ARCHIVE,
  REQUEST_USER_POST_ARCHIVE,
  CLEAR_USER_POST_ARCHIVE,
  GET_FOLLOWING_FEED,
  GET_TRENDING_POSTS,
  FOLLOW_UPDATE,
  UPDATE_COMMENT_LIKES,
  GET_LIKED_POSTS,
  DELETE_LIKED_POST,
  ADD_COMMENT,
  UPDATE_COMMENT,
  REMOVE_COMMENT
} from '../actions/types';

const initialState = {
  posts: [],
  tags: [],
  post: null,
  savedPosts: [],
  likedPosts: [],
  myPosts: [],
  userPosts: [],
  userPostsFor: null,
  userPostsTotal: 0,
  userPostsLoading: false,
  archive: {
    userId: null,
    posts: [],
    page: 0,
    total: 0,
    perPage: 8,
    sort: 'recent',
    requestId: 0,
    loading: false
  },
  followingFeed: [],
  trendingPosts: [],
  loading: true,
  error: {},
  page: 1,
  total: 0,
  perPage: 8,
  sort: 'recent'
};

export default function postReducer(state = initialState, action) {
  switch (action.type) {
    case GET_POSTS: {
      const { posts, page, total, perPage, sort } = action.payload;
      // page 1 replaces the list; later pages append without duplicates.
      const allPosts =
        page === 1
          ? posts
          : Array.from(
              new Map(
                [...state.posts, ...posts].map((p) => [p._id, p])
              ).values()
            );
      return {
        ...state,
        posts: allPosts,
        page,
        total,
        perPage,
        sort: sort || state.sort,
        loading: false
      };
    }
    case GET_TAGS:
      return {
        ...state,
        tags: action.payload
      };
    case GET_SINGLE_POST:
      // A null payload is the "clear before fetch" signal: keep the spinner up
      // until the real post (or an error) arrives.
      return {
        ...state,
        post: action.payload,
        loading: action.payload === null
      };
    case GET_SAVED_POSTS:
      return {
        ...state,
        savedPosts: action.payload,
        loading: false
      };
    case GET_LIKED_POSTS:
      return {
        ...state,
        likedPosts: action.payload,
        loading: false
      };
    case DELETE_LIKED_POST:
      return {
        ...state,
        likedPosts: state.likedPosts.filter((p) => p._id !== action.payload),
        loading: false
      };
    case GET_MY_POSTS:
      return {
        ...state,
        myPosts: action.payload,
        loading: false
      };
    case REQUEST_USER_POSTS:
      return {
        ...state,
        userPostsFor: action.payload.userId,
        userPosts: [],
        userPostsTotal: 0,
        userPostsLoading: true
      };
    case GET_USER_POSTS: {
      // Ignore a response for a profile the viewer already navigated away from.
      const { userId, posts, total } = action.payload;
      if (state.userPostsFor !== userId) return state;

      return {
        ...state,
        userPosts: posts,
        userPostsTotal: total || posts.length,
        userPostsLoading: false,
        loading: false
      };
    }
    case CLEAR_USER_POSTS:
      return {
        ...state,
        userPosts: [],
        userPostsFor: null,
        userPostsTotal: 0,
        userPostsLoading: false
      };
    case REQUEST_USER_POST_ARCHIVE: {
      const { userId, page, requestId } = action.payload;
      // Starting a new user or a new sort replaces the list; fetching a later
      // page keeps what is already on screen.
      const reset = state.archive.userId !== userId || page === 1;

      return {
        ...state,
        archive: {
          ...state.archive,
          userId,
          requestId,
          posts: reset ? [] : state.archive.posts,
          page: reset ? 0 : state.archive.page,
          total: reset ? 0 : state.archive.total,
          loading: true
        }
      };
    }
    case GET_USER_POST_ARCHIVE: {
      const { userId, posts, page, total, perPage, sort, requestId } =
        action.payload;

      // Ignore stale responses (the viewer switched profiles or changed sort
      // while this request was still in flight).
      if (
        state.archive.userId !== userId ||
        state.archive.requestId !== requestId
      ) {
        return state;
      }

      const allPosts =
        page === 1
          ? posts
          : Array.from(
              new Map(
                [...state.archive.posts, ...posts].map((p) => [p._id, p])
              ).values()
            );

      return {
        ...state,
        archive: {
          ...state.archive,
          posts: allPosts,
          page,
          total,
          perPage,
          sort: sort || state.archive.sort,
          loading: false
        }
      };
    }
    case CLEAR_USER_POST_ARCHIVE:
      return {
        ...state,
        archive: initialState.archive
      };
    case GET_FOLLOWING_FEED:
      return {
        ...state,
        followingFeed: action.payload,
        loading: false
      };
    case GET_TRENDING_POSTS:
      return {
        ...state,
        trendingPosts: action.payload,
        loading: false
      };
    case FOLLOW_UPDATE: {
      // Reflect an inline feed follow/unfollow on every card by that author that
      // carries follow state (the GET /api/posts lists).
      const { userId, isFollowing } = action.payload;
      const apply = (list) =>
        list.map((p) => (p.user === userId ? { ...p, isFollowing } : p));
      return {
        ...state,
        posts: apply(state.posts),
        followingFeed: apply(state.followingFeed)
      };
    }
    case SAVE_POST:
      // Un-saving removes the post from the saved list, no matter where the
      // toggle happened (bookmark icon or the Saved page's own button).
      return {
        ...state,
        posts: state.posts.map((p) =>
          p._id === action.payload.postId
            ? { ...p, saved: action.payload.saved }
            : p
        ),
        post:
          state.post && state.post._id === action.payload.postId
            ? { ...state.post, saved: action.payload.saved }
            : state.post,
        savedPosts: action.payload.saved
          ? state.savedPosts.map((p) =>
              p._id === action.payload.postId
                ? { ...p, saved: true }
                : p
            )
          : state.savedPosts.filter((p) => p._id !== action.payload.postId),
        likedPosts: state.likedPosts.map((p) =>
          p._id === action.payload.postId
            ? { ...p, saved: action.payload.saved }
            : p
        ),
        archive: {
          ...state.archive,
          posts: state.archive.posts.map((p) =>
            p._id === action.payload.postId
              ? { ...p, saved: action.payload.saved }
              : p
          )
        },
        loading: false
      };
    case DELETE_SAVED_POST:
      return {
        ...state,
        savedPosts: state.savedPosts.filter((p) => p._id !== action.payload),
        loading: false
      };
    case ADD_POST:
      return {
        ...state,
        posts: [action.payload, ...state.posts],
        myPosts: [action.payload, ...state.myPosts],
        total: state.total + 1,
        loading: false
      };
    case UPDATE_POST: {
      // Merge the server's updated post over the existing copy instead of
      // replacing it. The server response has no `isFollowing`, so replacing
      // would silently remove the inline Follow button from a feed card.
      const merge = (p) =>
        p._id === action.payload._id ? { ...p, ...action.payload } : p;
      return {
        ...state,
        post: state.post ? merge(state.post) : state.post,
        posts: state.posts.map(merge),
        myPosts: state.myPosts.map(merge),
        savedPosts: state.savedPosts.map(merge),
        likedPosts: state.likedPosts.map(merge),
        userPosts: state.userPosts.map(merge),
        archive: {
          ...state.archive,
          posts: state.archive.posts.map(merge)
        },
        followingFeed: state.followingFeed.map(merge),
        trendingPosts: state.trendingPosts.map(merge),
        loading: false
      };
    }
    case TOGGLE_PIN: {
      // A user can pin at most one post. Set the target's flag and clear every
      // other post by the same author across all lists, so the highlight moves
      // immediately instead of waiting for a refetch.
      const { postId, userId, pinned } = action.payload;
      const apply = (list) =>
        list.map((p) => {
          if (p._id === postId) return { ...p, pinned };
          if (pinned && userId && p.user === userId) {
            return { ...p, pinned: false };
          }
          return p;
        });

      let post = state.post;
      if (post) {
        if (post._id === postId) {
          post = { ...post, pinned };
        } else if (pinned && userId && post.user === userId) {
          post = { ...post, pinned: false };
        }
      }

      // Keep the owner's own list ordered the way the server returns it:
      // pinned first, then newest. This makes a freshly pinned row jump to the
      // top immediately instead of on the next refetch.
      const myPosts = apply(state.myPosts).sort((a, b) => {
        const pinDiff = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        if (pinDiff !== 0) return pinDiff;
        return new Date(b.date) - new Date(a.date);
      });

      return {
        ...state,
        post,
        posts: apply(state.posts),
        myPosts,
        savedPosts: apply(state.savedPosts),
        likedPosts: apply(state.likedPosts),
        userPosts: apply(state.userPosts),
        archive: {
          ...state.archive,
          posts: apply(state.archive.posts)
        },
        followingFeed: apply(state.followingFeed),
        trendingPosts: apply(state.trendingPosts),
        loading: false
      };
    }
    case POST_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
        userPostsLoading: false,
        archive: {
          ...state.archive,
          loading: false
        }
      };
    case UPDATE_LIKES:
      return {
        ...state,
        posts: state.posts.map(post =>
          post._id === action.payload.postId
            ? { ...post, likes: action.payload.likes }
            : post
        ),
        post:
          state.post && state.post._id === action.payload.postId
            ? { ...state.post, likes: action.payload.likes }
            : state.post,
        myPosts: state.myPosts.map((post) =>
          post._id === action.payload.postId
            ? { ...post, likes: action.payload.likes }
            : post
        ),
        likedPosts: state.likedPosts.map((post) =>
          post._id === action.payload.postId
            ? { ...post, likes: action.payload.likes }
            : post
        ),
        savedPosts: state.savedPosts.map((post) =>
          post._id === action.payload.postId
            ? { ...post, likes: action.payload.likes }
            : post
        ),
        userPosts: state.userPosts.map((post) =>
          post._id === action.payload.postId
            ? { ...post, likes: action.payload.likes }
            : post
        ),
        archive: {
          ...state.archive,
          posts: state.archive.posts.map((post) =>
            post._id === action.payload.postId
              ? { ...post, likes: action.payload.likes }
              : post
          )
        },
        followingFeed: state.followingFeed.map((post) =>
          post._id === action.payload.postId
            ? { ...post, likes: action.payload.likes }
            : post
        ),
        trendingPosts: state.trendingPosts.map((post) =>
          post._id === action.payload.postId
            ? { ...post, likes: action.payload.likes }
            : post
        ),
        loading: false
      };
case DELETE_POST:
      return {
        ...state,
        posts: state.posts.filter((post) => post._id !== action.payload),
        post:
          state.post && state.post._id === action.payload ? null : state.post,
        savedPosts: state.savedPosts.filter(
          (p) => p._id !== action.payload
        ),
        likedPosts: state.likedPosts.filter((p) => p._id !== action.payload),
        myPosts: state.myPosts.filter((p) => p._id !== action.payload),
        userPosts: state.userPosts.filter((p) => p._id !== action.payload),
        archive: {
          ...state.archive,
          posts: state.archive.posts.filter((p) => p._id !== action.payload),
          total: Math.max(state.archive.total - 1, 0)
        },
        followingFeed: state.followingFeed.filter(
          (p) => p._id !== action.payload
        ),
        trendingPosts: state.trendingPosts.filter(
          (p) => p._id !== action.payload
        ),
        total: Math.max(state.total - 1, 0),
        loading: false
      };
    case ADD_COMMENT:
    case UPDATE_COMMENT: {
      // The new comment list replaces the one on the post being viewed; mirror
      // it onto every list that can render the same post, and bail out safely if
      // no post is loaded (previously this dereferenced a null state.post).
      const targetId = state.post && state.post._id;
      if (!targetId) return state;
      const setComments = (p) =>
        p._id === targetId ? { ...p, comments: action.payload } : p;
      return {
        ...state,
        post: { ...state.post, comments: action.payload },
        posts: state.posts.map(setComments),
        myPosts: state.myPosts.map(setComments),
        savedPosts: state.savedPosts.map(setComments),
        likedPosts: state.likedPosts.map(setComments),
        userPosts: state.userPosts.map(setComments),
        archive: {
          ...state.archive,
          posts: state.archive.posts.map(setComments)
        },
        followingFeed: state.followingFeed.map(setComments),
        trendingPosts: state.trendingPosts.map(setComments),
        loading: false
      };
    }
    case UPDATE_COMMENT_LIKES: {
      const { postId, comments } = action.payload;
      const setComments = (p) => (p._id === postId ? { ...p, comments } : p);
      return {
        ...state,
        post:
          state.post && state.post._id === postId
            ? { ...state.post, comments }
            : state.post,
        posts: state.posts.map(setComments),
        myPosts: state.myPosts.map(setComments),
        savedPosts: state.savedPosts.map(setComments),
        likedPosts: state.likedPosts.map(setComments),
        userPosts: state.userPosts.map(setComments),
        archive: {
          ...state.archive,
          posts: state.archive.posts.map(setComments)
        },
        followingFeed: state.followingFeed.map(setComments),
        trendingPosts: state.trendingPosts.map(setComments),
        loading: false
      };
    }
    case REMOVE_COMMENT: {
      // Drop the comment and every reply threaded under it (the backend removes
      // the whole descendant chain too), so the UI stays consistent without a
      // refetch even for replies to replies.
      const removeFrom = (comments) => {
        const removedIds = new Set([String(action.payload)]);

        let foundNew = true;
        while (foundNew) {
          foundNew = false;
          for (const comment of comments) {
            if (!comment.parent) continue;

            const parentId = String(comment.parent);
            const commentId = String(comment._id);

            if (removedIds.has(parentId) && !removedIds.has(commentId)) {
              removedIds.add(commentId);
              foundNew = true;
            }
          }
        }

        return comments.filter(
          (comment) => !removedIds.has(String(comment._id))
        );
      };
      const strip = (p) => ({ ...p, comments: removeFrom(p.comments) });
      const targetId = state.post && state.post._id;
      const stripIfTarget = (p) => (p._id === targetId ? strip(p) : p);
      return {
        ...state,
        post: state.post ? strip(state.post) : state.post,
        posts: state.posts.map(stripIfTarget),
        myPosts: state.myPosts.map(stripIfTarget),
        savedPosts: state.savedPosts.map(stripIfTarget),
        likedPosts: state.likedPosts.map(stripIfTarget),
        userPosts: state.userPosts.map(stripIfTarget),
        archive: {
          ...state.archive,
          posts: state.archive.posts.map(stripIfTarget)
        },
        followingFeed: state.followingFeed.map(stripIfTarget),
        trendingPosts: state.trendingPosts.map(stripIfTarget),
        loading: false
      };
    }
    default:
      return state;
  }
}
