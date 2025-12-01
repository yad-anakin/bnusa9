'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import api from '@/utils/api';

const COMMENTS_PER_PAGE = 10;

interface BookCommentType {
  _id: string;
  content: string;
  createdAt: string;
  userName: string;
  userProfileImage: string;
  userId: string;
  parentId?: string;
  parentUserName?: string;
  replies?: BookCommentType[];
}

interface BookCommentSectionProps {
  bookSlug: string;
  bookOwnerId: string;
}

export default function BookCommentSection({ bookSlug, bookOwnerId }: BookCommentSectionProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const { notify } = useToast();
  const [comments, setComments] = useState<BookCommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyPages, setReplyPages] = useState<{ [commentId: string]: number }>({});
  const [replyHasMore, setReplyHasMore] = useState<{ [commentId: string]: boolean }>({});
  const [replyTotals, setReplyTotals] = useState<{ [commentId: string]: number }>({});
  const [submittingReply, setSubmittingReply] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<string[]>([]);
  const [deletingComments, setDeletingComments] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalComments, setTotalComments] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loadingReplies, setLoadingReplies] = useState<{ [commentId: string]: boolean }>({});
  
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ku-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Fetch comments
  useEffect(() => {
    const fetchComments = async (page = 1) => {
      try {
        setLoading(true);
        const data = await api.get(`/api/ktebnus/books/${bookSlug}/comments?page=${page}&limit=${COMMENTS_PER_PAGE}`);
        if (data.success) {
          if (page === 1) {
            setComments(data.comments);
          } else {
            setComments(prev => [...prev, ...data.comments]);
          }
          setHasMore(data.hasMore);

          // Prefetch direct reply totals for each top-level comment (for accurate counts)
          try {
            const topLevel = page === 1 ? data.comments : data.comments;
            await Promise.all(
              (topLevel || []).map(async (c: any) => {
                try {
                  const json = await api.get(`/api/ktebnus/books/${bookSlug}/comments/replies/${c._id}?page=1&limit=1`);
                  if (json && json.success !== false) {
                    const total = json?.pagination?.total ?? (c.replies?.length || 0);
                    const hasMore = json?.pagination?.hasMore ?? false;
                    setReplyTotals(prev => ({ ...prev, [c._id]: total }));
                    setReplyHasMore(prev => ({ ...prev, [c._id]: hasMore }));
                    setReplyPages(prev => ({ ...prev, [c._id]: 1 }));
                  }
                } catch {}
              })
            );
          } catch {}
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
        setError('هەڵە لە بارکردنی کۆمێنتەکان. تکایە دووبارە هەوڵ بدەوە.');
      } finally {
        setLoading(false);
      }
    };

    fetchComments(page);
  }, [bookSlug, page, currentUser]);

  // Load more comments
  const loadMoreComments = () => {
    setPage(prev => prev + 1);
  };

  // Calculate total comments including replies
  const calculateTotalComments = React.useMemo(() => {
    let total = 0;
    const countReplies = (commentsList: BookCommentType[]) => {
      for (const comment of commentsList) {
        total++;
        if (comment.replies && comment.replies.length > 0) {
          countReplies(comment.replies);
        }
      }
    };
    countReplies(comments);
    return total;
  }, [comments]);

  // Overall known total = loaded nested total + remaining direct replies for each top-level
  const overallKnownTotal = React.useMemo(() => {
    // Sum remaining direct replies for each node in the tree where we know totals
    const sumRemainingForTree = (nodes: BookCommentType[]): number => {
      let acc = 0;
      for (const node of nodes) {
        const loadedDirect = node.replies?.length || 0;
        const totalDirect = replyTotals[node._id] || 0;
        acc += Math.max(0, totalDirect - loadedDirect);
        if (node.replies && node.replies.length > 0) {
          acc += sumRemainingForTree(node.replies);
        }
      }
      return acc;
    };
    const remainingDirectAllLevels = sumRemainingForTree(comments);
    return calculateTotalComments + remainingDirectAllLevels;
  }, [comments, replyTotals, calculateTotalComments]);

  // Submit a new comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError('پێویستە چوونە ژوورەوە بکەیت بۆ ناردنی کۆمێنت');
      return;
    }
    
    if (!newComment.trim()) {
      setError('کۆمێنت نابێت بێ ناوەڕۆک بێت');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const data = await api.post(`/api/ktebnus/books/${bookSlug}/comments`, { content: newComment });
      
      if (data.success) {
        setComments(prev => [data.data, ...prev]);
        setNewComment('');
        setTotalComments(prev => prev + 1);
      } else {
        setError(data.message || 'نەتوانرا کۆمێنت بنێردرێت');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('هەڵە لە ناردنی کۆمێنت. تکایە دووبارە هەوڵ بدەوە.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle reply form
  const toggleReplyForm = (commentId: string) => {
    if (!isAuthenticated) {
      setError('پێویستە چوونە ژوورەوە بکەیت بۆ وەڵامدانەوە');
      return;
    }
    
    setReplyingTo(commentId);
    
    // Focus the reply input after a short delay to ensure the form is rendered
    setTimeout(() => {
      if (replyInputRef.current) {
        replyInputRef.current.focus();
      }
    }, 100);
  };

  // Hide reply form
  const hideReplyForm = () => {
    setReplyingTo(null);
    setReplyText('');
  };

  // Submit a reply
  const handleSubmitReply = async (commentId: string) => {
    if (!isAuthenticated || !currentUser) {
      setError('پێویستە چوونە ژوورەوە بکەیت بۆ ناردنی وەڵام');
      return;
    }
    
    if (!replyText.trim()) {
      setError('وەڵام نابێت بێ ناوەڕۆک بێت');
      return;
    }
    
    try {
      setSubmittingReply(true);
      setError(null);
      
      const data = await api.post(`/api/ktebnus/books/${bookSlug}/comments`, {
        content: replyText,
        parentId: commentId,
      });
      
      if (data) {
        if (data.success) {
          // Ensure the reply data has the correct structure and set parentUserName immediately
          const getParentUserName = (list: BookCommentType[], id: string): string | null => {
            for (const item of list) {
              if (item._id === id) return item.userName || 'User';
              if (item.replies && item.replies.length > 0) {
                const found = getParentUserName(item.replies, id);
                if (found) return found;
              }
            }
            return null;
          };
          const replyData = {
            ...data.data,
            replies: data.data?.replies || [],
            parentUserName: getParentUserName(comments, commentId) || ''
          };
          
          // Add the new reply to the correct parent
          setComments(prev => {
            const newComments = [...prev];
            
            // Helper function to check if a reply ID exists in the replies tree
            const findReplyInTree = (replies: BookCommentType[], targetId: string): boolean => {
              for (const reply of replies) {
                if (reply._id === targetId) {
                  return true;
                }
                if (reply.replies && reply.replies.length > 0) {
                  if (findReplyInTree(reply.replies, targetId)) {
                    return true;
                  }
                }
              }
              return false;
            };
            
            // Recursive function to add reply to the correct nested location
            const addReplyToNestedLocation = (replies: BookCommentType[], targetId: string): BookCommentType[] => {
              return replies.map(reply => {
                if (reply._id === targetId) {
                  // Found the target reply, add the new reply to its replies array
                  const currentNestedReplies = reply.replies || [];
                  const newNestedReplies = [replyData, ...currentNestedReplies];
                  
                  return {
                    ...reply,
                    replies: newNestedReplies
                  };
                } else if (reply.replies && reply.replies.length > 0) {
                  // Check nested replies recursively
                  const updatedReplies = addReplyToNestedLocation(reply.replies, targetId);
                  return {
                    ...reply,
                    replies: updatedReplies
                  };
                }
                return reply;
              });
            };
            
            // First, check if this is a reply to a nested reply
            let foundInNested = false;
            const updatedComments = newComments.map(comment => {
              if (comment.replies && comment.replies.length > 0) {
                // Check if the commentId is actually a reply ID in this comment's replies
                const isReplyId = findReplyInTree(comment.replies, commentId);
                
                if (isReplyId) {
                  const updatedReplies = addReplyToNestedLocation(comment.replies, commentId);
                  if (updatedReplies !== comment.replies) {
                    // A nested reply was found and updated
                    foundInNested = true;
                    return { 
                      ...comment, 
                      replies: updatedReplies
                    };
                  }
                }
              }
              return comment;
            });
            
            // If not found in nested replies, it must be a reply to a top-level comment
            if (!foundInNested) {
              // Find the comment to add the reply to
              const commentIndex = updatedComments.findIndex(c => c._id === commentId);
              
              if (commentIndex !== -1) {
                const currentComment = updatedComments[commentIndex];
                const currentReplies = currentComment.replies || [];
                
                // Add the new reply to the top (newest first)
                const newReplies = [replyData, ...currentReplies];
                
                // Update the comment with the new replies
                updatedComments[commentIndex] = {
                  ...currentComment,
                  replies: newReplies
                };
              }
            }
            
            return updatedComments;
          });
          
          // Automatically expand replies for the comment that received the reply
          const findTopLevelCommentId = (targetId: string): string => {
            for (const comment of comments) {
              if (comment._id === targetId) {
                return targetId;
              }
              if (comment.replies) {
                const findInReplies = (replies: BookCommentType[]): string | null => {
                  for (const reply of replies) {
                    if (reply._id === targetId) {
                      return comment._id;
                    }
                    if (reply.replies && reply.replies.length > 0) {
                      const found = findInReplies(reply.replies);
                      if (found) return found;
                    }
                  }
                  return null;
                };
                const found = findInReplies(comment.replies);
                if (found) return found;
              }
            }
            return targetId;
          };
          
          const topLevelId = findTopLevelCommentId(commentId);
          setExpandedReplies(prev => {
            if (!prev.includes(topLevelId)) {
              return [...prev, topLevelId];
            }
            return prev;
          });

          // Clear the reply content and hide the form
          setReplyText('');
          setReplyingTo(null);
          setTotalComments(prev => prev + 1);
          // Increment direct reply total for the parent this reply belongs to
          setReplyTotals(prev => ({ ...prev, [commentId]: (prev[commentId] || 0) + 1 }));
        } else {
          setError('نەتوانرا وەڵام بنێردرێت');
        }
      } else {
        setError('نەتوانرا وەڵام بنێردرێت');
      }
    } catch (err) {
      console.error('Error posting reply:', err);
      setError('هەڵە لە ناردنی وەڵام. تکایە دووبارە هەوڵ بدەوە.');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Toggle replies visibility
  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      if (prev.includes(commentId)) {
        return prev.filter(id => id !== commentId);
      } else {
        return [...prev, commentId];
      }
    });
  };

  // Delete a comment
  const handleDeleteClick = (commentId: string) => {
    setConfirmDeleteId(commentId);
  };

  const confirmDeleteComment = async () => {
    if (!confirmDeleteId) return;
    const commentId = confirmDeleteId;
    setConfirmDeleteId(null);
    
    if (!isAuthenticated) {
      setError('پێویستە چوونە ژوورەوە بکەیت بۆ سڕینەوەی کۆمێنت');
      return;
    }
    
    try {
      setDeletingComments(prev => [...prev, commentId]);
      
      const data = await api.delete(`/api/ktebnus/books/${bookSlug}/comments/${commentId}`);
      
      if (data.success) {
        // Count how many nodes (the comment and all its descendants) will be removed
        const countNodesToRemove = (() => {
          const countTree = (node: BookCommentType): number => {
            const children = node.replies || [];
            return 1 + children.reduce((sum, child) => sum + countTree(child), 0);
          };
          const findAndCount = (list: BookCommentType[]): number | null => {
            for (const item of list) {
              if (item._id === commentId) return countTree(item);
              if (item.replies && item.replies.length > 0) {
                const res = findAndCount(item.replies);
                if (res !== null) return res;
              }
            }
            return null;
          };
          const res = findAndCount(comments);
          return res ?? 1;
        })();

        setTimeout(() => {
          // Remove the comment/reply from the state
          setComments(prev => {
            const removeComment = (commentsList: BookCommentType[]): BookCommentType[] => {
              return commentsList.filter(comment => comment._id !== commentId).map(comment => ({
                ...comment,
                replies: comment.replies ? removeComment(comment.replies) : []
              }));
            };
            return removeComment(prev);
          });
          
          setTotalComments(prev => Math.max(0, prev - countNodesToRemove));
          setDeletingComments(prev => prev.filter(id => id !== commentId));
        }, 400);
      } else {
        setDeletingComments(prev => prev.filter(id => id !== commentId));
        setError(data.message || 'نەتوانرا کۆمێنت بسڕدرێتەوە');
      }
    } catch (err) {
      setDeletingComments(prev => prev.filter(id => id !== commentId));
      console.error('Error deleting comment:', err);
      setError('هەڵە لە سڕینەوەی کۆمێنت. تکایە دووبارە هەوڵ بدەوە.');
    }
  };

  const cancelDeleteComment = () => {
    setConfirmDeleteId(null);
  };

  // Load replies for a comment
  const loadReplies = async (commentId: string, loadMore: boolean = false) => {
    // Toggle expanded state if not loading more
    if (!loadMore) {
      const isCurrentlyExpanded = expandedReplies.includes(commentId);
      
      if (isCurrentlyExpanded) {
        // Hide replies
        setExpandedReplies(prev => prev.filter(id => id !== commentId));
        return;
      }
    }
    
    // Check if replies are already loaded and we're not loading more
    const comment = comments.find(c => c._id === commentId);
    if (!loadMore && comment && comment.replies && comment.replies.length > 0) {
      // Replies exist from initial fetch (first-level). Ensure deeper nested replies are loaded.
      try {
        setLoadingReplies(prev => ({ ...prev, [commentId]: true }));
        // Also fetch pagination metadata for direct replies to compute remaining counts
        try {
          const metaJson = await api.get(`/api/ktebnus/books/${bookSlug}/comments/replies/${commentId}?page=1&limit=1`);
          if (metaJson) {
            const total = metaJson?.pagination?.total ?? comment.replies.length;
            const hasMore = metaJson?.pagination?.hasMore ?? false;
            setReplyTotals(prev => ({ ...prev, [commentId]: total }));
            setReplyHasMore(prev => ({ ...prev, [commentId]: hasMore }));
            setReplyPages(prev => ({ ...prev, [commentId]: 1 }));
          }
        } catch {}

        const fetchNestedRepliesRecursively = async (reply: any): Promise<any> => {
          try {
            const nestedData = await api.get(`/api/ktebnus/books/${bookSlug}/comments/replies/${reply._id}?limit=50`);
            if (nestedData) {
              if (nestedData.success && nestedData.data.length > 0) {
                // Record total direct replies for this reply id
                if (typeof nestedData.pagination?.total === 'number') {
                  setReplyTotals(prev => ({ ...prev, [reply._id]: nestedData.pagination.total }));
                  setReplyHasMore(prev => ({ ...prev, [reply._id]: nestedData.pagination.hasMore || false }));
                  setReplyPages(prev => ({ ...prev, [reply._id]: 1 }));
                } else {
                  setReplyTotals(prev => ({ ...prev, [reply._id]: nestedData.data.length }));
                }
                const nestedRepliesWithDeepNesting = await Promise.all(
                  nestedData.data.map(async (nestedReply: any) => {
                    const replyWithParentInfo = {
                      ...nestedReply,
                      parentUserName: reply.userName || reply.userEmail || 'User'
                    };
                    return await fetchNestedRepliesRecursively(replyWithParentInfo);
                  })
                );
                return { ...reply, replies: nestedRepliesWithDeepNesting };
              }
            }
          } catch (err) {
            // No nested replies found or error occurred
          }
          return { ...reply, replies: reply.replies || [] };
        };

        const repliesWithNested = await Promise.all(
          (comment.replies || []).map(async (reply: any) => await fetchNestedRepliesRecursively(reply))
        );

        setComments(prev =>
          prev.map(c => (c._id === commentId ? { ...c, replies: repliesWithNested } : c))
        );
        setExpandedReplies(prev => [...prev, commentId]);
      } finally {
        setLoadingReplies(prev => ({ ...prev, [commentId]: false }));
      }
      return;
    }
    
    // Set loading state
    setLoadingReplies(prev => ({ ...prev, [commentId]: true }));
    
    // Get current page for this comment
    const currentPage = replyPages[commentId] || 1;
    const pageToLoad = loadMore ? currentPage + 1 : 1;
    
    // Fetch replies from the backend
    try {
      const data = await api.get(`/api/ktebnus/books/${bookSlug}/comments/replies/${commentId}?page=${pageToLoad}&limit=50`);
      
      if (data) {
        if (data.success) {
          // Fetch nested replies for each reply recursively
          const fetchNestedRepliesRecursively = async (reply: any): Promise<any> => {
            try {
              const nestedData = await api.get(`/api/ktebnus/books/${bookSlug}/comments/replies/${reply._id}?limit=50`);
              if (nestedData) {
                if (nestedData.success && nestedData.data.length > 0) {
                  // Record total direct replies for this reply id
                  if (typeof nestedData.pagination?.total === 'number') {
                    setReplyTotals(prev => ({ ...prev, [reply._id]: nestedData.pagination.total }));
                    setReplyHasMore(prev => ({ ...prev, [reply._id]: nestedData.pagination.hasMore || false }));
                    setReplyPages(prev => ({ ...prev, [reply._id]: 1 }));
                  } else {
                    setReplyTotals(prev => ({ ...prev, [reply._id]: nestedData.data.length }));
                  }
                  // Recursively fetch nested replies for each nested reply
                  const nestedRepliesWithDeepNesting = await Promise.all(
                    nestedData.data.map(async (nestedReply: any) => {
                      // Add parentUserName to nested reply
                      const replyWithParentInfo = {
                        ...nestedReply,
                        parentUserName: reply.userName || reply.userEmail || 'User'
                      };
                      return await fetchNestedRepliesRecursively(replyWithParentInfo);
                    })
                  );
                  return { ...reply, replies: nestedRepliesWithDeepNesting };
                }
              }
            } catch (err) {
              // No nested replies found
            }
            return { ...reply, replies: [] };
          };

          const repliesWithNested = await Promise.all(
            data.data.map(async (reply: any) => {
              return await fetchNestedRepliesRecursively(reply);
            })
          );
          
          // Update the comment with the fetched replies
          setComments(prev => 
            prev.map(comment => 
              comment._id === commentId 
                ? { 
                    ...comment, 
                    replies: loadMore 
                      ? [...(comment.replies || []), ...repliesWithNested]
                      : repliesWithNested 
                  } 
                : comment
            )
          );
          
          // Update pagination state
          setReplyPages(prev => ({ ...prev, [commentId]: pageToLoad }));
          setReplyHasMore(prev => ({ ...prev, [commentId]: data.pagination?.hasMore || false }));
          if (typeof data.pagination?.total === 'number') {
            setReplyTotals(prev => ({ ...prev, [commentId]: data.pagination.total }));
          }
          
          // Show the replies if not loading more
          if (!loadMore) {
            setExpandedReplies(prev => [...prev, commentId]);
          }
        } else {
          setError('خەتا لە بارکردنی وەڵامەکان');
        }
      }
    } catch (error) {
      console.error('Error loading replies:', error);
      setError('خەتا لە بارکردنی وەڵامەکان');
    } finally {
      setLoadingReplies(prev => ({ ...prev, [commentId]: false }));
    }
  };

  // Load more replies for a specific comment
  const loadMoreReplies = (commentId: string) => {
    loadReplies(commentId, true);
  };

  // Flatten all replies (including nested) for a comment - memoized
  const flattenReplies = React.useCallback((parentId: string): BookCommentType[] => {
    const parentComment = comments.find(c => c._id === parentId);
    
    if (!parentComment || !parentComment.replies) {
      return [];
    }
    
    const result: BookCommentType[] = [];
    const traverse = (replies: BookCommentType[]) => {
      for (const reply of replies) {
        result.push(reply);
        if (reply.replies && reply.replies.length > 0) {
          traverse(reply.replies);
        }
      }
    };
    traverse(parentComment.replies);
    
    return result;
  }, [comments]);

  // Check if user can delete a comment
  const canDeleteComment = (comment: BookCommentType) => {
    if (!isAuthenticated || !currentUser) {
      return false;
    }

    const uid = (currentUser as any).firebaseUid || (currentUser as any).uid || (currentUser as any).userFirebaseUid;
    const mongoId = (currentUser as any).id || (currentUser as any)._id;

    // Backend sends comment.userId as firebaseUid; support both comparisons to be safe
    const isOwner = comment.userId === uid || comment.userId === mongoId;
    if (isOwner) return true;

    // Book owner can delete any comment; bookOwnerId may be owner mongoId or firebaseUid
    const isBookOwner = bookOwnerId === uid || bookOwnerId === mongoId;
    if (isBookOwner) return true;

    return false;
  };

  // Comment Item Component
  const CommentItem = React.memo<{ 
    comment: BookCommentType; 
    isReply?: boolean;
  }>(({ comment, isReply = false }) => {
    const isDeleting = deletingComments.includes(comment._id);
    
    return (
      <div className={`border-b border-gray-100 py-4 transition-all duration-400 ease-in-out ${isDeleting ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              {comment.userProfileImage ? (
                <img
                  src={comment.userProfileImage}
                  alt={comment.userName || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-gray-600">
                  {(comment.userName || 'U').substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm">{comment.userName || 'بەکارهێنەر'}</h4>
              </div>
              <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
            </div>
            
            {/* Show "Replying to @username" for replies */}
            {isReply && comment.parentUserName && (
              <p className="text-xs text-[var(--primary)] mt-1">
                وەڵامدانەوە بۆ @{comment.parentUserName}
              </p>
            )}
            
            <p className="text-sm mt-1">{comment.content}</p>
            
            <div className="flex items-center mt-2 gap-4">
              <button
                onClick={() => toggleReplyForm(comment._id)}
                className="text-xs text-[var(--primary)] hover:text-[var(--primary)] transition-colors"
              >
                وەڵامدانەوە
              </button>
              
              {/* Show replies button only for main comments, not for replies */}
              {!isReply && (
                <button
                  onClick={() => loadReplies(comment._id)}
                  className="text-xs text-[var(--primary)] hover:text-[var(--primary)] transition-colors flex items-center gap-1"
                >
                  {expandedReplies.includes(comment._id) ? (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      شاردنەوەی وەڵامەکان
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      {(() => {
                        const knownCount = flattenReplies(comment._id).length || (comment.replies?.length || 0);
                        return knownCount > 0 ? `بینینی ${knownCount} وەڵام` : 'بینینی وەڵامەکان';
                      })()}
                    </>
                  )}
                </button>
              )}
              
              {/* Delete button */}
              {canDeleteComment(comment) && (
                <button
                  onClick={() => handleDeleteClick(comment._id)}
                  className="text-xs text-red-600 hover:text-red-800 transition-colors"
                >
                  سڕینەوە
                </button>
              )}
            </div>
            
            {/* Simple reply form */}
            {replyingTo === comment._id && (
              <div className="mt-3 bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-[var(--primary)] mb-2">
                  وەڵامدانەوە بۆ {comment.userName}
                </p>
                <input
                  ref={replyInputRef}
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="وەڵامەکەت بنووسە..."
                  className="w-full border border-gray-200 rounded-lg p-3 focus:ring-[var(--primary)] focus:border-transparent text-sm"
                  disabled={submittingReply}
                  autoFocus
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={hideReplyForm}
                    className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    پاشگەزبوونەوە
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmitReply(comment._id)}
                    disabled={submittingReply}
                    className="bg-[var(--primary)] text-white px-3 py-1 text-xs rounded-lg hover:bg-[var(--primary-light)] disabled:opacity-50"
                  >
                    {submittingReply ? 'بارکردن...' : 'ناردن'}
                  </button>
                </div>
              </div>
            )}
            
            {/* Replies - all shown at the same level with "replying to" text */}
            {!isReply && expandedReplies.includes(comment._id) && (
              <div className="mt-2 pl-6 border-l-2 border-gray-100">
                {(() => {
                  const flattenedReplies = flattenReplies(comment._id);
                  const isLoading = loadingReplies[comment._id];
                  const hasMoreReplies = replyHasMore[comment._id];
                  return (
                    <>
                      {flattenedReplies.length > 0 ? (
                        flattenedReplies.map(reply => (
                          <CommentItem key={reply._id} comment={reply} isReply />
                        ))
                      ) : (
                        <div className="py-4 text-center">
                          <p className="text-sm text-gray-500">هیچ وەڵامێک نییە. یەکەم کەس بە بۆ نووسینی وەڵام!</p>
                        </div>
                      )}
                      {hasMoreReplies && (
                        <div className="py-3 text-center">
                          <button
                            onClick={() => loadMoreReplies(comment._id)}
                            disabled={isLoading}
                            className="bg-gray-100 text-[var(--primary)] px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-xs"
                          >
                            {isLoading ? (
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent"></div>
                                <span>بارکردن...</span>
                              </div>
                            ) : (() => {
                              const directLoaded = (comment.replies?.length || 0);
                              const totalDirect = replyTotals[comment._id] || 0;
                              const remaining = Math.max(0, totalDirect - directLoaded);
                              return remaining > 0 ? `وەڵامی زیاتر (${remaining} ماوە)` : 'وەڵامی زیاتر';
                            })()}
                          </button>
                        </div>
                      )}
                      {isLoading && flattenedReplies.length === 0 && (
                        <div className="py-4 text-center">
                          <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent"></div>
                          <p className="mt-2 text-xs text-gray-500">بارکردنی وەڵامەکان...</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className="w-full mt-8">
      <div className="border-b border-gray-200 pb-2">
        <h2 className="text-xl font-bold">کۆمێنتەکان ({overallKnownTotal})</h2>
      </div>
      
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {/* Comment Form */}
      <div className="py-4 border-b border-gray-200">
        {isAuthenticated ? (
          <form onSubmit={handleSubmitComment} className="w-full">
            <div className="flex items-start gap-3 w-full">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden relative border border-gray-200 bg-gray-100 flex items-center justify-center">
                  {(currentUser as any)?.profileImage ? (
                    <img
                      src={(currentUser as any).profileImage}
                      alt={(currentUser as any).name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-600">
                      {(((currentUser as any)?.name || 'U') as string).substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <textarea
                  ref={commentInputRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="کۆمێنتەکەت بنووسە..."
                  className="w-full border border-gray-200 rounded-lg p-4 focus:ring-[var(--primary)] focus:border-transparent text-sm bg-white transition-all min-h-[60px]"
                  style={{ direction: 'rtl', textAlign: 'right' }}
                  disabled={submitting}
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="bg-[var(--primary)] text-white px-5 py-2 rounded-lg hover:bg-[var(--primary-light)] transition-colors disabled:opacity-50 text-sm"
                  >
                    {submitting ? 'بارکردن...' : 'ناردنی کۆمێنت'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-gray-600 mb-2">بۆ نووسینی کۆمێنت، پێویستە بچیتە ژوورەوە</p>
            <a
              href="/signin"
              className="inline-block bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-light)] transition-colors text-sm"
            >
              چوونە ژوورەوە
            </a>
          </div>
        )}
      </div>
      
      {/* Comments List */}
      <div className="divide-y divide-gray-200">
        {loading && comments.length === 0 ? (
          <div className="py-8 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
            <p className="mt-3 text-sm text-gray-500">بارکردنی کۆمێنتەکان...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">هیچ کۆمێنتێک نییە. یەکەم کەس بە بۆ نووسینی کۆمێنت!</p>
          </div>
        ) : (
          <div>
            {comments.map((comment) => (
              <CommentItem key={comment._id} comment={comment} />
            ))}
            
            {hasMore && (
              <div className="py-4 text-center">
                <button
                  onClick={loadMoreComments}
                  disabled={loading}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
                >
                  {loading ? 'بارکردن...' : 'کۆمێنتی زیاتر'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4">سڕینەوەی کۆمێنت</h3>
            <p className="text-gray-600 mb-6">ئایا دڵنیایت لە سڕینەوەی ئەم کۆمێنتە؟</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDeleteComment}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={confirmDeleteComment}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                سڕینەوە
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
